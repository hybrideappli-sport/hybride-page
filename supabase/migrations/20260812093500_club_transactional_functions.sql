-- =============================================================================
-- club — fonctions transactionnelles
-- -----------------------------------------------------------------------------
-- ADR-003 : toute mutation de l'occupation d'un événement commence par
--   `select ... from club.events where id = ... for update`.
-- La ligne événement est le JETON DE SÉRIALISATION des cinq chemins d'écriture
-- (inscription, annulation membre, geste admin, décision parentale, expiration
-- automatique). Le comptage et l'insertion ont ainsi lieu dans le même
-- instantané, sous un verrou qu'aucun chemin ne peut contourner.
--
-- RÈGLE ABSOLUE : aucune I/O réseau dans ce fichier. Les e-mails sont ENFILÉS
-- (`club.email_log`), jamais envoyés — ADR-006.
--
-- Convention : les fonctions préfixées `_` sont internes, sans contrôle
-- d'autorisation, et ne sont exécutables que par `service_role` / `postgres`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Détection du contexte d'appel.
--
-- ⚠ `pg_has_role(current_user, 'service_role', 'member')` est INUTILISABLE ici :
-- dans une fonction `security definer`, `current_user` vaut le PROPRIÉTAIRE de la
-- fonction (`postgres`), lui-même membre de `service_role` sur Supabase — le test
-- serait vrai pour tout appelant, y compris `anon`. On lit donc la revendication
-- de rôle du JWT, seule information fidèle à l'appelant réel.
-- -----------------------------------------------------------------------------
create or replace function club.is_service_context()
returns boolean
language sql stable as $$
  select case
    -- Hors PostgREST (psql, pg_cron, tests d'intégration) : connexion directe,
    -- donc déjà authentifiée au niveau de la base.
    when nullif(current_setting('request.jwt.claims', true), '') is null then true
    else coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', ''
    ) = 'service_role'
  end;
$$;
revoke all on function club.is_service_context() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Primitives internes
-- -----------------------------------------------------------------------------
create or replace function club.member_email(p_profile_id uuid)
returns text
language sql stable security definer set search_path = club, pg_catalog as $$
  select u.email::text from auth.users u where u.id = p_profile_id;
$$;
revoke all on function club.member_email(uuid) from public, anon, authenticated;

create or replace function club.enqueue_email(
  p_email_type    club.email_type,
  p_related_type  club.email_related_type,
  p_related_id    uuid,
  p_recipient     text,
  p_club_id       uuid
) returns void
language plpgsql security definer set search_path = club, pg_catalog as $$
begin
  if p_recipient is null or length(btrim(p_recipient)) = 0 then
    raise exception 'club.enqueue_email: destinataire absent pour % / %', p_email_type, p_related_id
      using errcode = '22023';
  end if;

  -- `on conflict do nothing` + index unique (email_type, related_type, related_id)
  -- = idempotence garantie par la base, y compris pour les appels de `pg_cron`.
  insert into club.email_log (club_id, email_type, related_type, related_id, recipient)
  values (p_club_id, p_email_type, p_related_type, p_related_id, lower(btrim(p_recipient)))
  on conflict (email_type, related_type, related_id) do nothing;
end $$;
revoke all on function club.enqueue_email(club.email_type, club.email_related_type, uuid, text, uuid)
  from public, anon, authenticated;

-- Ouvre une demande d'autorisation parentale et enfile l'e-mail correspondant.
create or replace function club._request_parental_authorization(p_registration_id uuid)
returns uuid
language plpgsql security definer set search_path = club, pg_catalog as $$
declare
  v_reg     club.registrations%rowtype;
  v_club_id uuid;
  v_doc     club.consent_documents%rowtype;
  v_auth_id uuid;
begin
  select * into v_reg from club.registrations where id = p_registration_id;
  if not found then
    raise exception 'registration_not_found' using errcode = 'P0002';
  end if;
  if v_reg.parent_email is null then
    raise exception 'parent_email_missing' using errcode = '22023';
  end if;

  select e.club_id into v_club_id from club.events e where e.id = v_reg.event_id;

  select * into v_doc from club.consent_documents
   where code = 'club_parental_sport_authorization' and locale = 'fr' and is_current;
  if not found then
    -- Échec bruyant volontaire : sans texte courant, aucune preuve exploitable.
    raise exception 'consent_document_missing: club_parental_sport_authorization'
      using errcode = 'P0002';
  end if;

  insert into club.parental_authorizations (
    registration_id, minor_profile_id, parent_email, token,
    document_code, document_version, locale, hold_expires_at
  ) values (
    v_reg.id, v_reg.member_profile_id, v_reg.parent_email, club.generate_token(),
    v_doc.code, v_doc.version, v_doc.locale, now() + interval '48 hours'
  ) returning id into v_auth_id;

  perform club.enqueue_email(
    'parental_authorization_requested', 'parental_authorization',
    v_auth_id, v_reg.parent_email, v_club_id
  );

  return v_auth_id;
end $$;
revoke all on function club._request_parental_authorization(uuid) from public, anon, authenticated;

-- Promotion depuis la liste d'attente.
-- PRÉREQUIS : l'appelant détient déjà le verrou sur `club.events` (le `for update`
-- ci-dessous est alors un no-op réentrant — la fonction reste néanmoins sûre si
-- elle est appelée seule).
create or replace function club._promote_from_waitlist(p_event_id uuid)
returns integer
language plpgsql security definer set search_path = club, pg_catalog as $$
declare
  v_event    club.events%rowtype;
  v_occupied integer;
  v_reg      club.registrations%rowtype;
  v_promoted integer := 0;
begin
  select * into v_event from club.events where id = p_event_id for update;
  if not found or v_event.status <> 'published' then
    return 0;   -- un événement annulé ne promeut personne
  end if;

  -- Boucle et non pas unique : plusieurs places peuvent se libérer dans la même
  -- transaction (retrait admin multiple, expirations groupées).
  loop
    select count(*) into v_occupied
      from club.registrations
     where event_id = p_event_id
       and status in ('confirmed', 'pending_parental_authorization');

    exit when v_occupied >= v_event.capacity;

    select * into v_reg
      from club.registrations
     where event_id = p_event_id and status = 'waitlist'
     order by created_at asc      -- ordre DÉRIVÉ, aucune position stockée
     limit 1
     for update;

    exit when not found;

    if v_reg.is_minor_at_event then
      -- La promotion d'un mineur ne le confirme pas : elle ouvre un hold de 48 h,
      -- qui occupe la place pendant l'attente.
      update club.registrations
         set status = 'pending_parental_authorization'
       where id = v_reg.id;
      perform club._request_parental_authorization(v_reg.id);
    else
      update club.registrations
         set status = 'confirmed', confirmed_at = now()
       where id = v_reg.id;
      perform club.enqueue_email(
        'waitlist_promoted', 'registration', v_reg.id,
        club.member_email(v_reg.member_profile_id), v_event.club_id
      );
    end if;

    v_promoted := v_promoted + 1;
  end loop;

  return v_promoted;
end $$;
revoke all on function club._promote_from_waitlist(uuid) from public, anon, authenticated;

-- Annulation d'une inscription, sans contrôle d'autorisation (interne).
create or replace function club._cancel_registration(
  p_registration_id uuid,
  p_reason          club.cancellation_reason,
  p_promote         boolean default true
) returns jsonb
language plpgsql security definer set search_path = club, pg_catalog as $$
declare
  v_reg        club.registrations%rowtype;
  v_event      club.events%rowtype;
  v_was_occupying boolean;
  v_email      club.email_type;
begin
  select * into v_reg from club.registrations where id = p_registration_id;
  if not found then
    raise exception 'registration_not_found' using errcode = 'P0002';
  end if;
  if v_reg.status = 'cancelled' then
    return jsonb_build_object('registration_id', v_reg.id, 'status', 'cancelled', 'noop', true);
  end if;

  select * into v_event from club.events where id = v_reg.event_id for update;

  v_was_occupying := v_reg.status in ('confirmed', 'pending_parental_authorization');

  update club.registrations
     set status = 'cancelled',
         cancelled_at = now(),
         cancellation_reason = p_reason
   where id = v_reg.id;

  -- Une demande parentale encore ouverte devient sans objet.
  update club.parental_authorizations
     set status = 'expired', decided_at = now()
   where registration_id = v_reg.id and status = 'pending';

  v_email := case p_reason
    when 'member'           then 'registration_cancelled_by_member'
    when 'admin'            then 'registration_cancelled_by_admin'
    when 'parental_denied'  then 'registration_cancelled_parental_denied'
    when 'parental_expired' then 'registration_cancelled_parental_expired'
    when 'event_cancelled'  then 'event_cancelled'
  end;

  -- Le membre est notifié dans tous les cas SAUF s'il a annulé lui-même depuis
  -- son espace : l'écran lui a déjà confirmé le geste. (Le brief prévoit un
  -- e-mail d'annulation ; on l'enfile aussi, comme trace écrite.)
  perform club.enqueue_email(
    v_email, 'registration', v_reg.id,
    club.member_email(v_reg.member_profile_id), v_event.club_id
  );

  if p_promote and v_was_occupying then
    perform club._promote_from_waitlist(v_event.id);
  end if;

  return jsonb_build_object(
    'registration_id', v_reg.id,
    'status', 'cancelled',
    'freed_slot', v_was_occupying
  );
end $$;
revoke all on function club._cancel_registration(uuid, club.cancellation_reason, boolean)
  from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Inscription — US-04 AC2, AC3, AC4, AC7 ; US-06 AC6
-- -----------------------------------------------------------------------------
create or replace function club.register_for_event(
  p_event_id          uuid,
  p_member_profile_id uuid default null,
  p_parent_email      text default null
) returns jsonb
language plpgsql security definer set search_path = club, pg_catalog as $$
declare
  v_event      club.events%rowtype;
  v_club       club.clubs%rowtype;
  v_member     club.member_profiles%rowtype;
  v_caller     uuid := auth.uid();
  v_target     uuid := coalesce(p_member_profile_id, auth.uid());
  v_event_date date;
  v_is_minor   boolean;
  v_under_15   boolean;
  v_occupied   integer;
  v_status     club.registration_status;
  v_existing   club.registrations%rowtype;
  v_reg_id     uuid;
  v_auth_id    uuid;
  v_hold       timestamptz;
begin
  if v_target is null then
    raise exception 'member_profile_id_required' using errcode = '22023';
  end if;

  -- (1) VERROU — premier acte, sans exception. ADR-003.
  select * into v_event from club.events where id = p_event_id for update;
  if not found then
    raise exception 'event_not_found' using errcode = 'P0002';
  end if;

  -- (2) Autorisation : soi-même, un admin du club, ou un contexte serveur.
  if not (
    v_caller = v_target
    or club.is_club_admin(v_event.club_id)
    or club.is_service_context()
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_event.status <> 'published' then
    raise exception 'event_cancelled' using errcode = 'P0001';
  end if;
  if v_event.starts_at <= now() then
    raise exception 'event_past' using errcode = 'P0001';
  end if;

  select * into v_club from club.clubs where id = v_event.club_id;
  select * into v_member from club.member_profiles where id = v_target;
  if not found then
    raise exception 'member_profile_missing' using errcode = 'P0002';
  end if;

  -- (3) Inscription active déjà existante : réponse idempotente, pas une erreur.
  select * into v_existing
    from club.registrations
   where event_id = p_event_id and member_profile_id = v_target and status <> 'cancelled';
  if found then
    return jsonb_build_object(
      'registration_id', v_existing.id,
      'status', v_existing.status,
      'already_registered', true
    );
  end if;

  -- (4) Régimes d'âge — deux dates de référence différentes, volontairement.
  v_event_date := club.local_date(v_event.starts_at, v_club.timezone);
  v_is_minor   := club.age_years_on(v_member.birth_date, v_event_date) < 18;
  v_under_15   := club.age_years_on(v_member.birth_date, current_date) < 15;

  if v_is_minor and coalesce(btrim(p_parent_email), '') = '' then
    raise exception 'parent_email_required' using errcode = '22023';
  end if;

  -- (5) Comptage sous verrou. Le hold parental OCCUPE une place.
  select count(*) into v_occupied
    from club.registrations
   where event_id = p_event_id
     and status in ('confirmed', 'pending_parental_authorization');

  if v_occupied >= v_event.capacity then
    v_status := 'waitlist';               -- y compris pour un mineur : le flux
                                          -- parental s'ouvrira à la promotion.
  elsif v_is_minor then
    v_status := 'pending_parental_authorization';
  else
    v_status := 'confirmed';
  end if;

  insert into club.registrations (
    event_id, member_profile_id, status, is_minor_at_event,
    is_under_15_at_registration, parent_email, created_by, confirmed_at
  ) values (
    p_event_id, v_target, v_status, v_is_minor,
    v_under_15, lower(nullif(btrim(p_parent_email), '')), v_caller,
    case when v_status = 'confirmed' then now() end
  ) returning id into v_reg_id;

  -- (6) Outbox, dans la MÊME transaction (ADR-006).
  if v_status = 'confirmed' then
    perform club.enqueue_email('registration_confirmed', 'registration', v_reg_id,
                               club.member_email(v_target), v_event.club_id);
  elsif v_status = 'waitlist' then
    perform club.enqueue_email('waitlist_registered', 'registration', v_reg_id,
                               club.member_email(v_target), v_event.club_id);
  else
    v_auth_id := club._request_parental_authorization(v_reg_id);
    select hold_expires_at into v_hold from club.parental_authorizations where id = v_auth_id;
  end if;

  return jsonb_build_object(
    'registration_id', v_reg_id,
    'status', v_status,
    'is_minor_at_event', v_is_minor,
    'is_under_15_at_registration', v_under_15,
    'parental_authorization_id', v_auth_id,
    'hold_expires_at', v_hold,
    'places_left', greatest(v_event.capacity - v_occupied - 1, 0)
  );
end $$;
revoke all on function club.register_for_event(uuid, uuid, text) from public, anon;
grant execute on function club.register_for_event(uuid, uuid, text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Annulation — US-04 AC5 ; US-06 AC7
-- -----------------------------------------------------------------------------
create or replace function club.cancel_registration(p_registration_id uuid)
returns jsonb
language plpgsql security definer set search_path = club, pg_catalog as $$
declare
  v_reg    club.registrations%rowtype;
  v_event  club.events%rowtype;
  v_is_own boolean;
  v_reason club.cancellation_reason;
begin
  select * into v_reg from club.registrations where id = p_registration_id;
  if not found then
    raise exception 'registration_not_found' using errcode = 'P0002';
  end if;

  select * into v_event from club.events where id = v_reg.event_id for update;

  v_is_own := (v_reg.member_profile_id = auth.uid());

  if not (v_is_own or club.is_club_admin(v_event.club_id) or club.is_service_context()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_reason := case when v_is_own then 'member'::club.cancellation_reason
                   else 'admin'::club.cancellation_reason end;

  return club._cancel_registration(v_reg.id, v_reason, true);
end $$;
revoke all on function club.cancel_registration(uuid) from public, anon;
grant execute on function club.cancel_registration(uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Annulation d'un événement — US-06 AC4
-- -----------------------------------------------------------------------------
create or replace function club.cancel_event(p_event_id uuid)
returns jsonb
language plpgsql security definer set search_path = club, pg_catalog as $$
declare
  v_event    club.events%rowtype;
  v_reg      club.registrations%rowtype;
  v_notified integer := 0;
begin
  select * into v_event from club.events where id = p_event_id for update;
  if not found then
    raise exception 'event_not_found' using errcode = 'P0002';
  end if;

  if not (club.is_club_admin(v_event.club_id) or club.is_service_context()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_event.status = 'cancelled' then
    return jsonb_build_object('event_id', v_event.id, 'status', 'cancelled', 'noop', true);
  end if;

  update club.events
     set status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid()
   where id = v_event.id;

  -- Toutes les inscriptions actives sont annulées et notifiées, y compris la
  -- liste d'attente et les holds parentaux. `p_promote = false` : promouvoir
  -- quelqu'un sur un événement annulé n'aurait aucun sens.
  for v_reg in
    select * from club.registrations
     where event_id = v_event.id and status <> 'cancelled'
     order by created_at
  loop
    perform club._cancel_registration(v_reg.id, 'event_cancelled', false);
    v_notified := v_notified + 1;
  end loop;

  return jsonb_build_object('event_id', v_event.id, 'status', 'cancelled', 'notified', v_notified);
end $$;
revoke all on function club.cancel_event(uuid) from public, anon;
grant execute on function club.cancel_event(uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Validation parentale — US-05
-- Le parent n'a PAS de compte : le jeton est le facteur d'authentification.
-- -----------------------------------------------------------------------------
create or replace function club.get_parental_authorization(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = club, pg_catalog as $$
declare
  v_auth   club.parental_authorizations%rowtype;
  v_reg    club.registrations%rowtype;
  v_event  club.events%rowtype;
  v_club   club.clubs%rowtype;
  v_minor  club.member_profiles%rowtype;
  v_doc    club.consent_documents%rowtype;
  v_rgpd   club.consent_documents%rowtype;
begin
  select * into v_auth from club.parental_authorizations where token = p_token;
  if not found then
    return jsonb_build_object('found', false);
  end if;

  select * into v_reg   from club.registrations   where id = v_auth.registration_id;
  select * into v_event from club.events          where id = v_reg.event_id;
  select * into v_club  from club.clubs           where id = v_event.club_id;
  select * into v_minor from club.member_profiles where id = v_auth.minor_profile_id;
  select * into v_doc   from club.consent_documents
    where code = v_auth.document_code and version = v_auth.document_version and locale = v_auth.locale;

  -- Volet RGPD présenté EN PLUS pour les moins de 15 ans (US-05 AC2/AC3).
  if v_reg.is_under_15_at_registration then
    select * into v_rgpd from club.consent_documents
      where code = 'club_minor_data_processing' and locale = 'fr' and is_current;
  end if;

  return jsonb_build_object(
    'found', true,
    'status', v_auth.status,
    'expired', v_auth.status = 'pending' and v_auth.hold_expires_at <= now(),
    'hold_expires_at', v_auth.hold_expires_at,
    -- Divulgation minimale : prénom seul, jamais le nom ni l'e-mail de l'enfant.
    'child_first_name', v_minor.first_name,
    'requires_rgpd_consent', v_reg.is_under_15_at_registration,
    'event', jsonb_build_object(
      'id', v_event.id, 'title', v_event.title,
      'discipline_codes', (
        select coalesce(array_agg(ed.discipline_code order by d.sort_order), array[]::text[])
          from club.event_disciplines ed join club.disciplines d on d.code = ed.discipline_code
         where ed.event_id = v_event.id
      ),
      'discipline_labels', (
        select coalesce(array_agg(d.label order by d.sort_order), array[]::text[])
          from club.event_disciplines ed join club.disciplines d on d.code = ed.discipline_code
         where ed.event_id = v_event.id
      ),
      'starts_at', v_event.starts_at, 'location', v_event.location, 'status', v_event.status
    ),
    'club', jsonb_build_object('slug', v_club.slug, 'name', v_club.name),
    'sport_authorization_document', jsonb_build_object(
      'code', v_doc.code, 'version', v_doc.version, 'title', v_doc.title, 'body_md', v_doc.body_md
    ),
    'rgpd_document', case when v_rgpd.code is null then null else jsonb_build_object(
      'code', v_rgpd.code, 'version', v_rgpd.version, 'title', v_rgpd.title, 'body_md', v_rgpd.body_md
    ) end
  );
end $$;
revoke all on function club.get_parental_authorization(text) from public;
grant execute on function club.get_parental_authorization(text) to anon, authenticated, service_role;

create or replace function club.decide_parental_authorization(
  p_token      text,
  p_approve    boolean,
  p_ip_hash    text default null,
  p_user_agent text default null
) returns jsonb
language plpgsql security definer set search_path = club, pg_catalog as $$
declare
  v_auth     club.parental_authorizations%rowtype;
  v_reg      club.registrations%rowtype;
  v_event    club.events%rowtype;
  v_rgpd     club.consent_documents%rowtype;
  v_occupied integer;
  v_status   club.registration_status;
begin
  select * into v_auth from club.parental_authorizations where token = p_token for update;
  if not found then
    return jsonb_build_object('result', 'invalid_token');
  end if;

  if v_auth.status <> 'pending' then
    return jsonb_build_object('result', 'already_decided', 'status', v_auth.status);
  end if;

  select * into v_reg   from club.registrations where id = v_auth.registration_id;
  select * into v_event from club.events        where id = v_reg.event_id for update;

  -- Expiration constatée à la lecture : le balayage `pg_cron` peut n'être pas
  -- encore passé (fenêtre de 15 min). Même effet, même code.
  if v_auth.hold_expires_at <= now() then
    update club.parental_authorizations
       set status = 'expired', decided_at = now()
     where id = v_auth.id;
    perform club._cancel_registration(v_reg.id, 'parental_expired', true);
    return jsonb_build_object('result', 'expired');
  end if;

  if v_event.status <> 'published' then
    return jsonb_build_object('result', 'event_cancelled');
  end if;

  if p_approve then
    update club.parental_authorizations
       set status = 'confirmed', decided_at = now(), used_at = now(),
           proof_ip_hash = p_ip_hash, proof_user_agent = p_user_agent
     where id = v_auth.id;

    -- Moins de 15 ans : le même geste produit DEUX preuves distinctes —
    -- l'autorisation sportive ci-dessus et le consentement RGPD ci-dessous.
    if v_reg.is_under_15_at_registration then
      select * into v_rgpd from club.consent_documents
        where code = 'club_minor_data_processing' and locale = 'fr' and is_current;
      if not found then
        raise exception 'consent_document_missing: club_minor_data_processing'
          using errcode = 'P0002';
      end if;
      insert into club.consents (
        subject_profile_id, club_id, document_code, document_version, locale,
        granted, granted_by, ip_hash, user_agent, parental_authorization_id
      ) values (
        v_reg.member_profile_id, v_event.club_id, v_rgpd.code, v_rgpd.version, v_rgpd.locale,
        true, 'parent', p_ip_hash, p_user_agent, v_auth.id
      );
    end if;

    -- Recomptage sous verrou : la place peut avoir été prise entre-temps
    -- (capacité réduite, réévaluation après report). US-05 AC5.
    select count(*) into v_occupied
      from club.registrations
     where event_id = v_event.id
       and status in ('confirmed', 'pending_parental_authorization')
       and id <> v_reg.id;

    v_status := case when v_occupied < v_event.capacity then 'confirmed' else 'waitlist' end;

    update club.registrations
       set status = v_status,
           confirmed_at = case when v_status = 'confirmed' then now() else null end
     where id = v_reg.id;

    perform club.enqueue_email(
      'parental_authorization_confirmed', 'parental_authorization', v_auth.id,
      club.member_email(v_reg.member_profile_id), v_event.club_id
    );

    -- Bascule en liste d'attente : la place libérée revient au plus ancien.
    if v_status = 'waitlist' then
      perform club._promote_from_waitlist(v_event.id);
    end if;

    return jsonb_build_object('result', 'confirmed', 'registration_status', v_status);
  else
    update club.parental_authorizations
       set status = 'denied', decided_at = now(), used_at = now(),
           proof_ip_hash = p_ip_hash, proof_user_agent = p_user_agent
     where id = v_auth.id;

    -- Effet technique identique à l'expiration, message produit différent :
    -- la distinction est portée par `email_type` et par l'écran, pas par la donnée.
    perform club._cancel_registration(v_reg.id, 'parental_denied', true);

    return jsonb_build_object('result', 'denied');
  end if;
end $$;
revoke all on function club.decide_parental_authorization(text, boolean, text, text) from public;
grant execute on function club.decide_parental_authorization(text, boolean, text, text)
  to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Réévaluation de la minorité au changement de date — US-05 AC9
--
-- Implémentée en TRIGGER et non dans une action applicative : l'édition
-- d'événement est hors P0 (US-06 AC3) et les corrections passeront par Supabase
-- Studio. Le trigger garantit que même une correction manuelle reste conforme.
-- -----------------------------------------------------------------------------
create or replace function club.recompute_event_minor_flags(p_event_id uuid)
returns integer
language plpgsql security definer set search_path = club, pg_catalog as $$
declare
  v_event    club.events%rowtype;
  v_club     club.clubs%rowtype;
  v_date     date;
  v_reg      record;
  v_is_minor boolean;
  v_changed  integer := 0;
begin
  select * into v_event from club.events where id = p_event_id for update;
  select * into v_club  from club.clubs  where id = v_event.club_id;
  v_date := club.local_date(v_event.starts_at, v_club.timezone);

  for v_reg in
    select r.*, m.birth_date
      from club.registrations r
      join club.member_profiles m on m.id = r.member_profile_id
     where r.event_id = p_event_id and r.status <> 'cancelled'
  loop
    v_is_minor := club.age_years_on(v_reg.birth_date, v_date) < 18;
    continue when v_is_minor = v_reg.is_minor_at_event;

    if v_is_minor and v_reg.parent_email is null then
      -- Échec explicite plutôt qu'une violation de contrainte illisible : la
      -- nouvelle date rend obligatoire une autorisation parentale dont on n'a
      -- pas le destinataire.
      raise exception
        'parental_email_missing_for_registration %: la nouvelle date rend cet inscrit mineur',
        v_reg.id using errcode = '22023';
    end if;

    update club.registrations set is_minor_at_event = v_is_minor where id = v_reg.id;
    v_changed := v_changed + 1;

    -- Majeur → mineur ET place occupée : le régime parental redevient exigible.
    -- Mineur → majeur : aucune action, une autorisation obtenue reste valable.
    if v_is_minor and v_reg.status = 'confirmed' then
      update club.registrations
         set status = 'pending_parental_authorization', confirmed_at = null
       where id = v_reg.id;
      perform club._request_parental_authorization(v_reg.id);
    end if;
  end loop;

  return v_changed;
end $$;
revoke all on function club.recompute_event_minor_flags(uuid) from public, anon, authenticated;

create or replace function club.on_event_starts_at_changed() returns trigger
language plpgsql security definer set search_path = club, pg_catalog as $$
begin
  perform club.recompute_event_minor_flags(new.id);
  return null;
end $$;

create trigger events_recompute_minor_flags
  after update of starts_at on club.events
  for each row when (old.starts_at is distinct from new.starts_at)
  execute function club.on_event_starts_at_changed();

-- -----------------------------------------------------------------------------
-- Création d'un événement — US-06 AC2
--
-- Fonction plutôt que policy RLS (écart par rapport à ADR-004 §1, qui avait
-- retenu la policy `events_insert_admin` ci-dessous pour la création d'un
-- événement seul) : une sortie porte désormais AU MOINS une discipline via la
-- table de liaison `club.event_disciplines`, ce qui rend l'écriture multi-table
-- et non plus exprimable par un prédicat de ligne unique. La policy
-- `events_insert_admin` reste en place (défense en profondeur, inoffensive)
-- mais n'est plus le chemin d'écriture utilisé par l'application.
-- -----------------------------------------------------------------------------
create or replace function club.create_event(
  p_club_id          uuid,
  p_discipline_codes text[],
  p_starts_at        timestamptz,
  p_location         text,
  p_capacity         integer,
  p_title            text default null,
  p_ends_at          timestamptz default null,
  p_level            text default null
) returns uuid
language plpgsql security definer set search_path = club, pg_catalog as $$
declare
  v_event_id uuid;
  v_code     text;
begin
  if not club.is_club_admin(p_club_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_discipline_codes is null or array_length(p_discipline_codes, 1) is null then
    raise exception 'discipline_codes_required' using errcode = '22023';
  end if;

  insert into club.events (club_id, title, starts_at, ends_at, location, level, capacity, created_by, status)
  values (p_club_id, p_title, p_starts_at, p_ends_at, p_location, p_level, p_capacity, auth.uid(), 'published')
  returning id into v_event_id;

  foreach v_code in array p_discipline_codes loop
    insert into club.event_disciplines (event_id, discipline_code) values (v_event_id, v_code);
  end loop;

  return v_event_id;
end $$;
revoke all on function club.create_event(uuid, text[], timestamptz, text, integer, text, timestamptz, text)
  from public, anon;
grant execute on function club.create_event(uuid, text[], timestamptz, text, integer, text, timestamptz, text)
  to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Lectures — agenda public et vues admin
-- -----------------------------------------------------------------------------

-- Agenda (US-02 AC4) et détail (US-04 AC1). `security definer` pour agréger
-- l'occupation SANS exposer la liste des inscrits : seuls des compteurs sortent.
create or replace function club.list_upcoming_events(p_club_slug text)
returns table (
  id uuid, club_slug text, discipline_codes text[], discipline_labels text[], title text,
  starts_at timestamptz, ends_at timestamptz, location text, level text,
  capacity integer, occupied integer, places_left integer, waitlist_count integer
)
language sql stable security definer set search_path = club, pg_catalog as $$
  select
    e.id, c.slug,
    coalesce(d.codes, array[]::text[]), coalesce(d.labels, array[]::text[]), e.title,
    e.starts_at, e.ends_at, e.location, e.level, e.capacity,
    coalesce(o.occupied, 0)::int,
    greatest(e.capacity - coalesce(o.occupied, 0), 0)::int,
    coalesce(o.waiting, 0)::int
  from club.events e
  join club.clubs c on c.id = e.club_id
  left join lateral (
    select array_agg(ed.discipline_code order by disc.sort_order) as codes,
           array_agg(disc.label order by disc.sort_order) as labels
    from club.event_disciplines ed join club.disciplines disc on disc.code = ed.discipline_code
    where ed.event_id = e.id
  ) d on true
  left join lateral (
    select
      count(*) filter (where r.status in ('confirmed', 'pending_parental_authorization')) as occupied,
      count(*) filter (where r.status = 'waitlist') as waiting
    from club.registrations r where r.event_id = e.id
  ) o on true
  where c.slug = p_club_slug
    and c.is_published
    and e.status = 'published'
    and e.starts_at > now()
  order by e.starts_at asc;
$$;
revoke all on function club.list_upcoming_events(text) from public;
grant execute on function club.list_upcoming_events(text) to anon, authenticated, service_role;

create or replace function club.get_event_public(p_event_id uuid)
returns jsonb
language sql stable security definer set search_path = club, pg_catalog as $$
  select jsonb_build_object(
    'id', e.id, 'club_slug', c.slug, 'club_name', c.name,
    'discipline_codes', coalesce(d.codes, array[]::text[]),
    'discipline_labels', coalesce(d.labels, array[]::text[]),
    'title', e.title, 'starts_at', e.starts_at, 'ends_at', e.ends_at,
    'location', e.location, 'location_url', e.location_url, 'level', e.level,
    'capacity', e.capacity, 'status', e.status,
    'occupied', coalesce(o.occupied, 0),
    'places_left', greatest(e.capacity - coalesce(o.occupied, 0), 0),
    'waitlist_count', coalesce(o.waiting, 0)
  )
  from club.events e
  join club.clubs c on c.id = e.club_id
  left join lateral (
    select array_agg(ed.discipline_code order by disc.sort_order) as codes,
           array_agg(disc.label order by disc.sort_order) as labels
    from club.event_disciplines ed join club.disciplines disc on disc.code = ed.discipline_code
    where ed.event_id = e.id
  ) d on true
  left join lateral (
    select
      count(*) filter (where r.status in ('confirmed', 'pending_parental_authorization')) as occupied,
      count(*) filter (where r.status = 'waitlist') as waiting
    from club.registrations r where r.event_id = e.id
  ) o on true
  where e.id = p_event_id and c.is_published;
$$;
revoke all on function club.get_event_public(uuid) from public;
grant execute on function club.get_event_public(uuid) to anon, authenticated, service_role;

-- Liste des inscrits (écran F3) et source de l'export CSV (US-06 AC5, AC8).
-- Seul chemin d'accès à `auth.users.email` : la fonction vérifie elle-même le
-- rôle `club_admin` du club concerné.
create or replace function club.event_roster(p_event_id uuid)
returns table (
  registration_id uuid, first_name text, last_name text, email text,
  status club.registration_status, is_minor_at_event boolean,
  parental_status club.parental_authorization_status, hold_expires_at timestamptz,
  registered_at timestamptz
)
language plpgsql stable security definer set search_path = club, pg_catalog as $$
declare
  v_event club.events%rowtype;
begin
  select * into v_event from club.events where id = p_event_id;
  if not found then
    raise exception 'event_not_found' using errcode = 'P0002';
  end if;
  if not (club.is_club_admin(v_event.club_id) or club.is_service_context()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select r.id, m.first_name, m.last_name, u.email::text, r.status, r.is_minor_at_event,
           pa.status, pa.hold_expires_at, r.created_at
      from club.registrations r
      join club.member_profiles m on m.id = r.member_profile_id
      join auth.users u on u.id = r.member_profile_id
      left join lateral (
        select p.status, p.hold_expires_at
          from club.parental_authorizations p
         where p.registration_id = r.id
         order by p.requested_at desc limit 1
      ) pa on true
     where r.event_id = p_event_id and r.status <> 'cancelled'
     order by
       case r.status
         when 'confirmed' then 1
         when 'pending_parental_authorization' then 2
         when 'waitlist' then 3
         else 4
       end,
       r.created_at asc;
end $$;
revoke all on function club.event_roster(uuid) from public, anon;
grant execute on function club.event_roster(uuid) to authenticated, service_role;

-- Journalisation d'un export (US-06 AC8). Appelée par la route de streaming,
-- jamais par le client.
create or replace function club.log_export(p_event_id uuid, p_row_count integer)
returns uuid
language plpgsql security definer set search_path = club, pg_catalog as $$
declare
  v_event club.events%rowtype;
  v_id    uuid;
begin
  select * into v_event from club.events where id = p_event_id;
  if not found then
    raise exception 'event_not_found' using errcode = 'P0002';
  end if;
  if not (club.is_club_admin(v_event.club_id) or club.is_service_context()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into club.export_log (admin_profile_id, club_id, event_id, row_count)
  values (auth.uid(), v_event.club_id, v_event.id, coalesce(p_row_count, 0))
  returning id into v_id;

  return v_id;
end $$;
revoke all on function club.log_export(uuid, integer) from public, anon;
grant execute on function club.log_export(uuid, integer) to authenticated, service_role;
