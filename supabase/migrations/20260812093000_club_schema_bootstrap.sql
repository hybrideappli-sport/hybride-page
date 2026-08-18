-- =============================================================================
-- club — bootstrap du schéma : privilèges par défaut, énumérations, utilitaires
-- -----------------------------------------------------------------------------
-- Projet Supabase PARTAGÉ avec l'app commerciale (repo hybrideappli).
-- Cette migration est ADDITIVE : elle ne touche aucun objet du schéma `public`.
--
-- Nommage horodaté (et non séquentiel) : ADR-001 — deux repos alimentent le même
-- projet cloud, une version en double serait silencieusement ignorée par la CLI.
--
-- Décisions : ADR-002 (séparation des schémas), ADR-004 (modèle de privilèges).
-- =============================================================================

create schema if not exists club;

comment on schema club is
  'Données métier et de conformité des points club (association loi 1901).
   Responsable de traitement distinct de celui du schéma public (app commerciale) — ADR-002.
   À exposer dans les schémas de l''API Supabase : [api].schemas = ["public","graphql_public","club"].';

grant usage on schema club to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Privilèges par défaut — ADR-004 §2, hérité d'ADR-012 du repo de l'app.
--
-- SELECT / INSERT / DELETE sont intégralement exprimables par une policy RLS
--   ⇒ accordés par défaut à `authenticated`, RLS fait office de barrière.
-- UPDATE ne l'est PAS : une policy RLS contrôle QUELLES LIGNES, jamais QUELLES COLONNES.
--   ⇒ jamais accordé par défaut. Accordé table par table, au niveau colonne.
--   ⇒ un oubli échoue bruyamment (`permission denied`) au lieu de sur-autoriser en silence.
-- -----------------------------------------------------------------------------
alter default privileges in schema club
  grant select, insert, delete on tables to authenticated;
alter default privileges in schema club
  grant select on tables to anon;
alter default privileges in schema club
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema club
  grant usage, select on sequences to authenticated, anon, service_role;

-- Postgres accorde EXECUTE à PUBLIC sur toute fonction créée. Sans ce retrait,
-- toute fonction `security definer` future serait appelable par `authenticated`
-- dès sa création — exactement au moment où elle fait le plus de dégâts.
alter default privileges in schema club revoke execute on functions from public;
alter default privileges in schema club grant execute on functions to service_role;

-- -----------------------------------------------------------------------------
-- Énumérations
-- -----------------------------------------------------------------------------
create type club.admin_role as enum ('super_admin', 'club_admin');

create type club.event_status as enum ('published', 'cancelled');

-- `pending_parental_authorization` OCCUPE une place (hold 48 h) — décision 6 du brief.
-- `cancelled` est un état terminal : une réinscription crée une nouvelle ligne.
create type club.registration_status as enum (
  'confirmed',
  'waitlist',
  'pending_parental_authorization',
  'cancelled'
);

create type club.cancellation_reason as enum (
  'member',             -- annulation depuis l'espace membre (US-04 AC5)
  'admin',              -- retrait par un club_admin (US-06 AC7)
  'parental_denied',    -- refus explicite du parent (US-05 AC6)
  'parental_expired',   -- absence de réponse sous 48 h (US-05 AC7)
  'event_cancelled'     -- annulation de la sortie (US-06 AC4)
);

-- `denied` et `expired` ont le même effet technique, un message produit différent.
create type club.parental_authorization_status as enum (
  'pending', 'confirmed', 'denied', 'expired'
);

create type club.consent_grantor as enum ('self', 'parent');

-- Les e-mails 6 (création de compte) et 7 (mot de passe oublié) du brief sont émis
-- par Supabase Auth et ne figurent pas ici — ADR-006 §2.
create type club.email_type as enum (
  'registration_confirmed',                  -- brief 1, variante « place obtenue »
  'waitlist_registered',                     -- brief 1, variante « liste d'attente »
  'waitlist_promoted',                       -- brief 2
  'parental_authorization_requested',        -- brief 3
  'parental_authorization_confirmed',        -- brief 4
  'registration_cancelled_by_member',        -- brief 5
  'registration_cancelled_by_admin',         -- brief 5
  'registration_cancelled_parental_denied',  -- brief 5, message factuel neutre
  'registration_cancelled_parental_expired', -- brief 5, message actionnable
  'event_cancelled'                          -- US-06 AC4
);

create type club.email_related_type as enum ('registration', 'parental_authorization');

create type club.email_status as enum ('pending', 'sent', 'failed');

-- -----------------------------------------------------------------------------
-- Utilitaires — volontairement locaux au schéma `club`.
-- Réutiliser `public.touch_updated_at()` / `public.forbid_mutation()` créerait une
-- dépendance de ce site à du code possédé par l'app (ADR-002).
-- -----------------------------------------------------------------------------
create or replace function club.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Immuabilité des tables append-only (registre de preuve de consentement).
-- Aucune dérogation : le club ne dispose pas encore d'un parcours d'effacement
-- automatisé équivalent à `public.erase_account()` (P1).
create or replace function club.forbid_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'club.% est append-only (enregistrement immuable)', tg_table_name
    using errcode = '42501';
end $$;

-- Âge révolu à une date donnée. `age(timestamp, timestamp)` est immutable.
create or replace function club.age_years_on(p_birth_date date, p_on date)
returns integer
language sql immutable as $$
  select extract(year from age(p_on::timestamp, p_birth_date::timestamp))::int;
$$;

comment on function club.age_years_on(date, date) is
  'Âge révolu. Sert deux règles distinctes : minorité à la DATE DE L''ÉVÉNEMENT (< 18),
   et autonomie de consentement RGPD à la DATE D''INSCRIPTION (< 15) — brief, décision 6.';

-- Date locale d'un événement, dans le fuseau du club (multi-tenant dès le P0).
create or replace function club.local_date(p_at timestamptz, p_timezone text)
returns date
language sql stable as $$
  select (p_at at time zone coalesce(p_timezone, 'Europe/Paris'))::date;
$$;

-- Jeton d'autorisation parentale : 244 bits d'aléa, sans dépendre du schéma
-- d'installation de pgcrypto (variable entre projets Supabase). `gen_random_uuid()`
-- est en pg_catalog depuis PG13 et s'appuie sur la source d'aléa forte du système.
create or replace function club.generate_token()
returns text
language sql volatile as $$
  select replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
$$;
revoke all on function club.generate_token() from public, anon, authenticated;
