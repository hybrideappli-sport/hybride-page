-- =============================================================================
-- club — clubs, activités, rôles d'administration, profils membres
-- -----------------------------------------------------------------------------
-- Multi-tenant dès la première migration (décision structurelle 2 du brief) :
-- `club_id` porté par toutes les tables métier, aucune page Toulon en dur.
-- Seule l'INTERFACE multi-clubs est reportée en P1.
--
-- Décisions : ADR-002, ADR-004.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Référentiel des disciplines.
-- Liste fermée à 5 valeurs (course, vélo, eau, montagne, collectif) — colorée,
-- filtrable. Distincte du FORMAT (étiquette secondaire descriptive : trail,
-- piste, longe-côte, bivouac, volley…), non coloré, non filtrable et non
-- modélisé en base au P0 (contenu éditorial libre, pas une donnée structurée).
-- Table plutôt qu'énumération : ajouter une discipline ne doit pas exiger un
-- ALTER TYPE (non transactionnel avant PG12, et invisible depuis l'interface
-- admin). Un événement porte UNE OU PLUSIEURS disciplines (club.event_disciplines,
-- migration 20260812093200) : un swim and run relève à la fois de "eau" et de
-- "course", table de liaison plutôt que colonne simple.
-- -----------------------------------------------------------------------------
create table club.disciplines (
  code        text primary key,
  label       text        not null,
  sort_order  integer     not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);
alter table club.disciplines enable row level security;
create policy "disciplines_read" on club.disciplines
  for select to anon, authenticated using (true);

insert into club.disciplines (code, label, sort_order) values
  ('course',     'Course à pied', 10),
  ('velo',       'Vélo',          20),
  ('eau',        'Eau',           30),
  ('montagne',   'Montagne',      40),
  ('collectif',  'Collectif',     50);

-- -----------------------------------------------------------------------------
-- Points club. Une ligne au lancement : Toulon.
-- -----------------------------------------------------------------------------
create table club.clubs (
  id              uuid primary key default gen_random_uuid(),
  slug            text        not null unique,
  name            text        not null,
  city            text        not null,
  timezone        text        not null default 'Europe/Paris',
  -- Contenu de la page publique (US-02). En base et non en dur : le multi-tenant
  -- est une propriété du modèle, pas une intention.
  tagline         text,
  description_md  text,
  contact_email   text,
  instagram_url   text,
  hello_asso_url  text,                    -- lien sortant, aucune intégration (PRD §5)
  meeting_point   text,
  map_image_url   text,
  -- `is_published` gouverne l'exposition publique : le P0 n'expose que Toulon
  -- par la donnée, pas par une condition codée en dur.
  is_published    boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint clubs_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
alter table club.clubs enable row level security;
create trigger clubs_touch before update on club.clubs
  for each row execute function club.touch_updated_at();

create policy "clubs_read_published" on club.clubs
  for select to anon, authenticated using (is_published);
-- Aucune policy d'écriture : référentiel `service_role` (création d'un club = acte
-- d'exploitation, pas de produit, au P0).

insert into club.clubs (slug, name, city, tagline, is_published, hello_asso_url)
values (
  'toulon',
  'Hybride Club Toulon',
  'Toulon',
  'Course à pied, vélo, eau, montagne, collectif — sorties hebdomadaires ouvertes à tous.',
  true,
  null   -- à renseigner avant lancement (lien HelloAsso réel)
);

-- -----------------------------------------------------------------------------
-- Rôles d'administration.
-- Dans `club` et non dans `public` : `public.profiles.role` appartient à l'app
-- et n'est pas modifié (ADR-002).
-- -----------------------------------------------------------------------------
create table club.admin_roles (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid            not null references auth.users(id) on delete cascade,
  club_id     uuid            references club.clubs(id) on delete cascade,
  role        club.admin_role not null,
  created_at  timestamptz     not null default now(),
  -- Un `club_admin` est toujours rattaché à un club ; un `super_admin` ne l'est jamais.
  constraint admin_roles_scope check (
    (role = 'club_admin'  and club_id is not null) or
    (role = 'super_admin' and club_id is null)
  )
);
alter table club.admin_roles enable row level security;

-- `unique (profile_id, club_id)` ne suffirait pas : NULL n'entre pas en collision
-- avec NULL dans un index unique classique.
create unique index admin_roles_club_admin_unique
  on club.admin_roles (profile_id, club_id) where role = 'club_admin';
create unique index admin_roles_super_admin_unique
  on club.admin_roles (profile_id) where role = 'super_admin';
create index admin_roles_by_club on club.admin_roles (club_id) where role = 'club_admin';

create policy "admin_roles_select_own" on club.admin_roles
  for select to authenticated using (profile_id = (select auth.uid()));
-- Aucune policy d'écriture : l'attribution d'un rôle est un acte `service_role`.

-- -----------------------------------------------------------------------------
-- Fonctions de rôle.
-- `security definer` obligatoire : une policy sur `club.admin_roles` qui
-- interrogerait `club.admin_roles` provoquerait une récursion infinie.
-- -----------------------------------------------------------------------------
create or replace function club.is_super_admin()
returns boolean
language sql stable security definer set search_path = club, pg_catalog as $$
  select exists (
    select 1 from club.admin_roles r
    where r.profile_id = (select auth.uid()) and r.role = 'super_admin'
  );
$$;
revoke all on function club.is_super_admin() from public, anon;
grant execute on function club.is_super_admin() to authenticated, service_role;

create or replace function club.is_club_admin(p_club_id uuid)
returns boolean
language sql stable security definer set search_path = club, pg_catalog as $$
  select exists (
    select 1 from club.admin_roles r
    where r.profile_id = (select auth.uid())
      and (
        r.role = 'super_admin'
        or (r.role = 'club_admin' and r.club_id = p_club_id)
      )
  );
$$;
revoke all on function club.is_club_admin(uuid) from public, anon;
grant execute on function club.is_club_admin(uuid) to authenticated, service_role;

comment on function club.is_club_admin(uuid) is
  'Vrai si l''appelant administre ce club (ou est super_admin). Le scoping par club_id
   est réel dès le P0, même si une seule instance est exposée — US-06 AC1.';

-- `club.event_club_id`, même famille que les deux fonctions ci-dessus (résout un rôle sans
-- provoquer de récursion RLS), est définie plus loin (20260812093200_club_events_registrations.sql)
-- : elle porte sur `club.events`, qui n'existe pas encore à ce stade de la migration.

-- -----------------------------------------------------------------------------
-- Profils membres du club.
-- Table distincte de `public.profiles` ET de `public.athlete_profiles` :
-- la date de naissance de l'app est collectée sous consentement SANTÉ, pour une
-- finalité de planification d'entraînement. La lire ici serait un détournement
-- de finalité (ADR-002 §2). Elle est donc recollectée sous le consentement club.
-- -----------------------------------------------------------------------------
create table club.member_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text        not null,
  last_name   text        not null,
  birth_date  date        not null,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint member_profiles_birth_date_sane check (
    birth_date > date '1900-01-01' and birth_date < current_date
  ),
  constraint member_profiles_names_not_blank check (
    length(btrim(first_name)) > 0 and length(btrim(last_name)) > 0
  )
);
alter table club.member_profiles enable row level security;
create trigger member_profiles_touch before update on club.member_profiles
  for each row execute function club.touch_updated_at();

create policy "member_profiles_select_own" on club.member_profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "member_profiles_insert_own" on club.member_profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "member_profiles_update_own" on club.member_profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ADR-004 §2 : `birth_date` est HORS du GRANT. Elle détermine le régime légal de
-- toutes les inscriptions en cours (minorité à la date de l'événement, autonomie
-- RGPD à 15 ans). Sa correction est un acte serveur qui doit recalculer les
-- inscriptions actives — pas une écriture libre depuis un formulaire.
grant update (first_name, last_name, phone) on club.member_profiles to authenticated;

-- La lecture d'un profil membre par un club_admin passe par `club.event_roster()`
-- (fonction `security definer` qui vérifie le rôle) et non par une policy :
-- l'admin n'a besoin de voir un membre que dans le contexte d'une de ses sorties.
