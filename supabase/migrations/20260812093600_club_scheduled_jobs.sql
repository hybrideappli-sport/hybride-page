-- =============================================================================
-- club — traitements planifiés (pg_cron)
-- -----------------------------------------------------------------------------
-- ADR-005 : un traitement dont le corps est intégralement SQL est planifié par
-- `pg_cron`. Le relais e-mail, qui exige une I/O sortante, est planifié par
-- Vercel Cron (`POST /api/cron/dispatch-emails`).
--
-- ⚠ L'activation de l'extension et la planification portent sur le projet
-- Supabase PARTAGÉ avec l'app : à annoncer côté app (ADR-001).
-- =============================================================================

-- Sur Supabase, `pg_cron` est de préférence activé depuis le dashboard
-- (Database → Extensions). L'instruction ci-dessous est idempotente et permet
-- au `supabase db reset` local de reproduire l'environnement.
create extension if not exists pg_cron;

grant usage on schema cron to postgres;

-- -----------------------------------------------------------------------------
-- Expiration des holds parentaux — US-05 AC7
--
-- Emprunte exactement les mêmes fonctions verrouillées que les chemins
-- interactifs : l'expiration automatique et le refus manuel produisent le même
-- effet parce qu'ils exécutent le même code (ADR-003).
-- -----------------------------------------------------------------------------
create or replace function club.expire_parental_holds()
returns integer
language plpgsql security definer set search_path = club, pg_catalog as $$
declare
  v_auth    record;
  v_expired integer := 0;
begin
  for v_auth in
    select id, registration_id
      from club.parental_authorizations
     where status = 'pending' and hold_expires_at <= now()
     order by hold_expires_at asc
     for update skip locked          -- un lot déjà traité par une autre exécution
  loop                               -- n'est pas retraité ni attendu
    update club.parental_authorizations
       set status = 'expired', decided_at = now()
     where id = v_auth.id;

    -- Annule l'inscription, enfile l'e-mail « pas de réponse sous 48h » (message
    -- ACTIONNABLE, distinct du refus explicite) et promeut la liste d'attente.
    perform club._cancel_registration(v_auth.registration_id, 'parental_expired', true);

    v_expired := v_expired + 1;
  end loop;

  return v_expired;
end $$;
revoke all on function club.expire_parental_holds() from public, anon, authenticated;
grant execute on function club.expire_parental_holds() to service_role, postgres;

select cron.schedule(
  'club-expire-parental-holds',
  '*/15 * * * *',
  $$select club.expire_parental_holds()$$
);

-- -----------------------------------------------------------------------------
-- Purge de conservation — ÉCRITE MAIS NON PLANIFIÉE
--
-- Règle proposée : 3 ans après la dernière participation confirmée (brief),
-- EN ATTENTE DE VALIDATION JURIDIQUE (PRD §8). Le registre de preuve de
-- consentement suit sa propre politique et n'est PAS purgé ici.
--
-- Écrire la fonction sans l'activer est délibéré : la conservation illimitée par
-- défaut est le mode de défaillance normal des projets qui remettent la purge à
-- plus tard. Il ne reste qu'une ligne à décommenter — ADR-005 §3.
-- -----------------------------------------------------------------------------
create or replace function club.purge_expired_member_data(p_retention interval default interval '3 years')
returns integer
language plpgsql security definer set search_path = club, pg_catalog as $$
declare
  v_profile record;
  v_purged  integer := 0;
begin
  for v_profile in
    select m.id
      from club.member_profiles m
     where not exists (
       select 1
         from club.registrations r
         join club.events e on e.id = r.event_id
        where r.member_profile_id = m.id
          and (e.starts_at > now() - p_retention or r.status <> 'cancelled' and e.starts_at > now())
     )
  loop
    -- Les inscriptions partent en cascade ; `club.consents` survit sous forme
    -- pseudonyme (aucune FK vers le profil), comme preuve du consentement recueilli.
    update club.consents
       set ip_hash = null, user_agent = null, subject_erased_at = now()
     where subject_profile_id = v_profile.id and subject_erased_at is null;

    delete from club.member_profiles where id = v_profile.id;
    v_purged := v_purged + 1;
  end loop;

  return v_purged;
end $$;
revoke all on function club.purge_expired_member_data(interval) from public, anon, authenticated;
grant execute on function club.purge_expired_member_data(interval) to service_role, postgres;

-- À DÉCOMMENTER APRÈS VALIDATION JURIDIQUE DE LA DURÉE DE CONSERVATION :
-- select cron.schedule(
--   'club-purge-expired-member-data',
--   '30 3 * * *',
--   $$select club.purge_expired_member_data()$$
-- );
