-- =============================================================================
-- club — événements et inscriptions
-- -----------------------------------------------------------------------------
-- Cœur du produit (US-04). Deux invariants que le DDL seul ne peut pas exprimer,
-- et qui sont donc portés par des fonctions verrouillées (ADR-003, migration
-- 20260812093500) :
--   1. au plus `capacity` places occupées (confirmed + pending_parental_authorization) ;
--   2. l'ordre de la liste d'attente est dérivé de `created_at`, jamais stocké.
--
-- Ce que le DDL exprime bien, et qui est ici :
--   - l'unicité d'une inscription ACTIVE par personne et par événement (index partiel) ;
--   - la réinscription après annulation (le même index, parce qu'il est partiel).
-- =============================================================================

-- `ends_at` (nullable) plutôt qu'une `duration_minutes` plafonnée à 24h (1440 min, version
-- initiale de cette migration) : un événement multi-jours (ex. bivouac de rentrée sur 2 jours)
-- ne rentre pas dans ce plafond. Décision de modélisation : UN événement = UN créneau
-- inscriptible, avec `ends_at` optionnel pour en exprimer la fin quand elle dépasse
-- significativement `starts_at`. Un programme à vagues/étapes distinctes où chacune se
-- réserve séparément (ex. "2x25", deux départs) se modélise avec PLUSIEURS lignes
-- `club.events` — le modèle le supporte déjà sans changement, pas de notion de "session"
-- introduite : ça aurait ajouté une table et une UI de gestion pour un besoin d'événements
-- exceptionnels, hors du P0 (US-06 ne couvre que la création simple, pas la récurrence).
-- Migrations non appliquées à ce stade — correction directe du DDL, pas de migration corrective.
create table club.events (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid              not null references club.clubs(id) on delete cascade,
  title           text,
  starts_at       timestamptz       not null,
  ends_at         timestamptz,
  location        text              not null,
  location_url    text,
  level           text,
  capacity        integer           not null,
  status          club.event_status not null default 'published',
  created_by      uuid              references auth.users(id) on delete set null,
  cancelled_at    timestamptz,
  cancelled_by    uuid              references auth.users(id) on delete set null,
  created_at      timestamptz       not null default now(),
  updated_at      timestamptz       not null default now(),
  constraint events_capacity_positive check (capacity >= 1),
  constraint events_ends_after_starts check (ends_at is null or ends_at > starts_at),
  constraint events_cancelled_coherent check (
    (status = 'cancelled' and cancelled_at is not null) or
    (status = 'published' and cancelled_at is null)
  )
);
alter table club.events enable row level security;
create trigger events_touch before update on club.events
  for each row execute function club.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Disciplines d'un événement — table de liaison, pas colonne simple.
-- Un swim and run relève à la fois de "eau" et de "course à pied" : il doit
-- apparaître dans les deux filtres. Au moins une discipline par événement
-- (contrainte applicative, pas de check SQL portable sur "au moins une ligne
-- liée" — imposé par `club.register_for_event`/`create_event`, hors DDL).
-- Lecture ouverte comme `club.disciplines` : la seule protection utile est sur
-- `club.events` lui-même (un event_id non lisible n'est pas énumérable ici).
-- -----------------------------------------------------------------------------
create table club.event_disciplines (
  event_id        uuid not null references club.events(id) on delete cascade,
  discipline_code text not null references club.disciplines(code),
  primary key (event_id, discipline_code)
);
alter table club.event_disciplines enable row level security;
create policy "event_disciplines_read" on club.event_disciplines
  for select to anon, authenticated using (true);
create index event_disciplines_by_discipline on club.event_disciplines (discipline_code, event_id);

-- `security definer`, même famille que `is_club_admin`/`is_super_admin`
-- (20260812093100_club_core_tables.sql) : la policy `registrations_select_admin` plus bas
-- doit résoudre le `club_id` d'un événement pour vérifier le rôle admin, mais une sous-requête
-- EXISTS brute sur `club.events` y serait soumise à la RLS d'`events` — qui contient elle-même
-- une policy (`events_read_own_registration`) interrogeant `club.registrations`. Sans ce
-- contournement, évaluer l'une réévalue l'autre : "infinite recursion detected in policy for
-- relation events" (trouvé en exécution, pas en relecture).
create or replace function club.event_club_id(p_event_id uuid)
returns uuid
language sql stable security definer set search_path = club, pg_catalog as $$
  select club_id from club.events where id = p_event_id;
$$;
revoke all on function club.event_club_id(uuid) from public, anon;
grant execute on function club.event_club_id(uuid) to authenticated, service_role;

-- Agenda public : filtré par club, trié par date (US-02 AC4).
create index events_public_agenda
  on club.events (club_id, starts_at) where status = 'published';
create index events_by_club on club.events (club_id, starts_at desc);

-- Lecture publique des sorties publiées d'un club publié (US-02, US-04 AC1).
create policy "events_read_published" on club.events
  for select to anon, authenticated
  using (
    status = 'published'
    and exists (select 1 from club.clubs c where c.id = events.club_id and c.is_published)
  );

-- Un club_admin voit toutes les sorties de son club, y compris annulées (US-06 AC1).
create policy "events_read_admin" on club.events
  for select to authenticated using (club.is_club_admin(club_id));

-- Création : conservée en défense en profondeur, mais plus le chemin d'écriture
-- réel — `club.create_event()` (20260812093500) gère désormais l'insertion
-- multi-table événement + disciplines. `created_by` reste contraint à l'appelant.
create policy "events_insert_admin" on club.events
  for insert to authenticated
  with check (
    club.is_club_admin(club_id)
    and created_by = (select auth.uid())
    and status = 'published'
    and cancelled_at is null
  );

-- Aucune policy UPDATE, aucun GRANT UPDATE :
--   - l'ANNULATION doit annuler en cascade les inscriptions et enfiler les e-mails
--     dans la même transaction ⇒ `club.cancel_event()` ;
--   - l'ÉDITION est hors P0 (US-06 AC3). Une correction de `starts_at` faite en
--     Studio reste sûre : un trigger recalcule la minorité des inscriptions
--     actives (US-05 AC9, migration 20260812093500).
-- Aucune policy DELETE : un événement passé est une donnée d'historique.

-- -----------------------------------------------------------------------------
-- Inscriptions
-- -----------------------------------------------------------------------------
create table club.registrations (
  id                          uuid primary key default gen_random_uuid(),
  event_id                    uuid not null references club.events(id) on delete cascade,
  member_profile_id           uuid not null references club.member_profiles(id) on delete cascade,
  status                      club.registration_status not null,

  -- Minorité évaluée à la DATE DE L'ÉVÉNEMENT, stockée sur la ligne, recalculée
  -- si la date de l'événement change (brief, décision 6 ; US-05 AC9).
  is_minor_at_event           boolean not null,

  -- Autonomie de consentement RGPD évaluée à la DATE D'INSCRIPTION : c'est le
  -- moment où le consentement est donné, donc celui où la capacité à consentir
  -- s'apprécie. Volontairement NON recalculée à l'édition de l'événement.
  is_under_15_at_registration boolean not null,

  -- Adresse du représentant légal, saisie à l'inscription d'un mineur.
  -- N'appartient à aucun compte : aucune autre source possible.
  parent_email                text,

  created_by                  uuid references auth.users(id) on delete set null,
  cancellation_reason         club.cancellation_reason,
  created_at                  timestamptz not null default now(),
  confirmed_at                timestamptz,
  cancelled_at                timestamptz,
  updated_at                  timestamptz not null default now(),

  constraint registrations_parent_email_required check (
    not is_minor_at_event or status = 'cancelled' or parent_email is not null
  ),
  constraint registrations_cancelled_coherent check (
    (status = 'cancelled') = (cancelled_at is not null)
  ),
  constraint registrations_cancellation_reason_coherent check (
    (status = 'cancelled') = (cancellation_reason is not null)
  )
);
alter table club.registrations enable row level security;
create trigger registrations_touch before update on club.registrations
  for each row execute function club.touch_updated_at();

-- Index unique PARTIEL (US-04 AC7) : une seule inscription active par personne et
-- par sortie, mais les lignes `cancelled` sortent de l'index — donc une personne
-- ayant annulé peut se réinscrire, ce qu'une contrainte UNIQUE simple interdirait.
create unique index registrations_active_unique
  on club.registrations (event_id, member_profile_id) where status <> 'cancelled';

-- Promotion depuis la liste d'attente : plus ancienne d'abord (US-04 AC6).
-- Aucune colonne `position` : une position stockée devrait être réécrite à chaque
-- annulation, ce qui recrée la classe de bugs que le verrou d'ADR-003 supprime.
create index registrations_waitlist_order
  on club.registrations (event_id, created_at) where status = 'waitlist';

-- Comptage de l'occupation sous verrou.
create index registrations_occupancy
  on club.registrations (event_id) where status in ('confirmed', 'pending_parental_authorization');

-- « Mes inscriptions » (écran D3).
create index registrations_by_member
  on club.registrations (member_profile_id, created_at desc);

create policy "registrations_select_own" on club.registrations
  for select to authenticated using (member_profile_id = (select auth.uid()));

-- `club.event_club_id` (security definer, 20260812093100) plutôt qu'une sous-requête brute
-- sur `club.events` : cette dernière serait soumise à la RLS d'`events`, qui contient
-- elle-même une policy interrogeant `club.registrations` (`events_read_own_registration`
-- ci-dessous) — cycle RLS sans ce contournement. Trouvé en exécution (erreur Postgres
-- "infinite recursion detected in policy"), pas en relecture.
create policy "registrations_select_admin" on club.registrations
  for select to authenticated
  using (club.is_club_admin(club.event_club_id(registrations.event_id)));

-- AUCUNE policy INSERT / UPDATE / DELETE, et aucun GRANT UPDATE.
-- L'écriture passe EXCLUSIVEMENT par les fonctions verrouillées d'ADR-003 :
-- c'est ce qui rend la garantie de capacité inviolable plutôt que conventionnelle.

-- -----------------------------------------------------------------------------
-- Complément à `events_read_published` : une personne inscrite doit continuer à
-- voir la sortie depuis « mes inscriptions » (écran D3) même après annulation de
-- l'événement, sans quoi sa ligne s'afficherait vide au moment précis où elle a
-- besoin de l'information. Déclarée ici et non plus haut : la policy référence
-- `club.registrations`, créée ci-dessus.
--
-- `security definer` (`club.has_own_registration`) plutôt qu'une sous-requête brute sur
-- `club.registrations` : cette dernière serait soumise à la RLS de `registrations`, qui
-- contient elle-même une policy interrogeant `club.events` (`registrations_select_admin`,
-- via `club.event_club_id`) — cycle RLS sans ce contournement. Même bug que celui documenté
-- sur `registrations_select_admin`, trouvé en exécution.
-- -----------------------------------------------------------------------------
create or replace function club.has_own_registration(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = club, pg_catalog as $$
  select exists (
    select 1 from club.registrations r
    where r.event_id = p_event_id and r.member_profile_id = (select auth.uid())
  );
$$;
revoke all on function club.has_own_registration(uuid) from public, anon;
grant execute on function club.has_own_registration(uuid) to authenticated, service_role;

create policy "events_read_own_registration" on club.events
  for select to authenticated
  using (club.has_own_registration(events.id));
