-- =============================================================================
-- club — registre de consentement et autorisations parentales
-- -----------------------------------------------------------------------------
-- Deux régimes DISTINCTS et CUMULATIFS (brief, décision 6 ; US-05) :
--   * RGPD                        : consentement autonome possible dès 15 ans ;
--   * autorisation de pratique    : obligatoire jusqu'à 18 ans, MÊME pour un
--     sportive (parentale)          15-17 ans ayant consenti seul au RGPD.
--
-- Les tables `consent_documents` / `consents` sont les JUMELLES de celles de
-- l'app, pas leur réutilisation : deux responsables de traitement doivent pouvoir
-- exporter et purger leur registre indépendamment. RLS est un contrôle d'accès,
-- pas une séparation de responsabilité (ADR-002 §3).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Textes versionnés et immuables.
-- -----------------------------------------------------------------------------
create table club.consent_documents (
  code          text not null,
  version       text not null,
  locale        text not null default 'fr',
  title         text not null,
  body_md       text not null,
  checksum      text not null,
  published_at  timestamptz not null default now(),
  is_current    boolean not null default false,
  primary key (code, version, locale)
);
alter table club.consent_documents enable row level security;

-- Lecture par `anon` : le parent consulte le texte SANS COMPTE (US-05 AC4).
create policy "consent_documents_read" on club.consent_documents
  for select to anon, authenticated using (true);

create unique index consent_documents_current
  on club.consent_documents (code, locale) where is_current;
-- Aucune policy d'écriture : référentiel `service_role`.

-- -----------------------------------------------------------------------------
-- Registre de preuve. Append-only : un retrait crée une nouvelle ligne.
--
-- PAS de FK vers auth.users : ce registre SURVIT à la suppression du compte, sous
-- forme pseudonyme, comme preuve du consentement recueilli (art. 7.1 et 5.2 RGPD).
-- Même construction que l'app, appliquée au registre de l'association.
-- -----------------------------------------------------------------------------
create table club.consents (
  id                  uuid primary key default gen_random_uuid(),
  subject_profile_id  uuid not null,                 -- identifiant pseudonyme du sujet
  club_id             uuid not null references club.clubs(id) on delete restrict,
  document_code       text not null,
  document_version    text not null,
  locale              text not null default 'fr',
  granted             boolean not null,
  granted_by          club.consent_grantor not null, -- 'self' (>= 15 ans) | 'parent' (< 15 ans)
  granted_at          timestamptz not null default now(),
  revoked_at          timestamptz,
  -- Calculés côté serveur à partir de la requête HTTP : ces deux champs n'ont de
  -- valeur probante QUE si le client ne les fournit pas.
  ip_hash             text,
  user_agent          text,
  -- Renseigné quand la preuve provient du parcours parental (< 15 ans, US-05 AC2).
  parental_authorization_id uuid,
  subject_erased_at   timestamptz,
  created_at          timestamptz not null default now(),
  -- Un consentement ne peut pas référencer un texte qui n'a jamais été publié.
  constraint consents_document_fk
    foreign key (document_code, document_version, locale)
    references club.consent_documents (code, version, locale) on delete restrict
);
alter table club.consents enable row level security;

create policy "consents_select_own" on club.consents
  for select to authenticated using (subject_profile_id = (select auth.uid()));
-- AUCUNE policy d'écriture : l'insertion passe par les fonctions serveur, qui
-- résolvent elles-mêmes la version courante (`is_current`) et calculent la preuve.
-- Un sujet ne peut pas s'auto-délivrer sa propre preuve de consentement.

create trigger consents_immutable before update or delete on club.consents
  for each row execute function club.forbid_mutation();

create index consents_lookup on club.consents (subject_profile_id, document_code, granted_at desc);
create index consents_retention on club.consents (subject_erased_at) where subject_erased_at is not null;

-- -----------------------------------------------------------------------------
-- Autorisations parentales de pratique sportive.
-- Le hold de 48 h OCCUPE une place le temps que le parent réponde.
-- -----------------------------------------------------------------------------
create table club.parental_authorizations (
  id                uuid primary key default gen_random_uuid(),
  registration_id   uuid not null references club.registrations(id) on delete cascade,
  minor_profile_id  uuid not null references club.member_profiles(id) on delete cascade,
  parent_email      text not null,

  -- Jeton en clair, assumé (ADR-004 §4) : le dispatcher d'e-mail est asynchrone
  -- et doit pouvoir reconstruire l'URL. 244 bits d'aléa, usage unique, 48 h.
  token             text not null unique,

  -- Texte exact approuvé par le parent — une révision du texte ne réécrit pas le passé.
  document_code     text not null,
  document_version  text not null,
  locale            text not null default 'fr',

  status            club.parental_authorization_status not null default 'pending',
  requested_at      timestamptz not null default now(),
  hold_expires_at   timestamptz not null,
  decided_at        timestamptz,
  used_at           timestamptz,

  -- Preuve horodatée (US-05 AC8), calculée côté serveur.
  proof_ip_hash     text,
  proof_user_agent  text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint parental_authorizations_document_fk
    foreign key (document_code, document_version, locale)
    references club.consent_documents (code, version, locale) on delete restrict,
  constraint parental_authorizations_decided_coherent check (
    (status = 'pending') = (decided_at is null)
  )
);
alter table club.parental_authorizations enable row level security;
create trigger parental_authorizations_touch before update on club.parental_authorizations
  for each row execute function club.touch_updated_at();

-- Au plus une demande EN COURS par inscription. L'index est partiel : une
-- réévaluation après report d'événement (US-05 AC9) crée légitimement une
-- nouvelle demande une fois la précédente décidée ou expirée.
create unique index parental_authorizations_one_pending
  on club.parental_authorizations (registration_id) where status = 'pending';

-- Balayage `pg_cron` toutes les 15 min (US-05 AC7).
create index parental_authorizations_expiry
  on club.parental_authorizations (hold_expires_at) where status = 'pending';

create index parental_authorizations_by_registration
  on club.parental_authorizations (registration_id, requested_at desc);

-- AUCUNE policy : le parent n'a pas de compte et n'est donc ni `authenticated`
-- ni titulaire d'une ligne. L'accès se fait exclusivement par jeton, à travers
-- `club.get_parental_authorization()` et `club.decide_parental_authorization()`.
-- Le mineur suit l'avancement via le statut de SON inscription, qu'il peut lire.

alter table club.consents
  add constraint consents_parental_authorization_fk
  foreign key (parental_authorization_id)
  references club.parental_authorizations(id) on delete set null;

-- -----------------------------------------------------------------------------
-- Textes du P0.
--
-- ⚠ CONTENU PROVISOIRE — la formulation exacte de l'autorisation parentale de
-- pratique sportive et la durée de conservation sont en attente de validation
-- juridique (PRD §8). Un test de mise en production doit ÉCHOUER tant qu'un
-- document courant contient le marqueur ci-dessous.
-- -----------------------------------------------------------------------------
insert into club.consent_documents (code, version, locale, title, body_md, checksum, is_current) values
(
  'club_data_processing', '1.0.0', 'fr',
  'Traitement de mes données par l''association',
  E'[TEXTE PROVISOIRE — VALIDATION JURIDIQUE REQUISE]\n\n'
  'J''autorise Hybride Club à traiter mon nom, mon prénom, ma date de naissance et mon '
  'adresse e-mail dans le seul but de gérer mon inscription aux sorties du club.\n\n'
  'Ces données sont conservées 3 ans après ma dernière participation confirmée, puis '
  'supprimées. Elles ne sont **jamais** utilisées pour la prospection commerciale de '
  'l''application Hybride, qui relève d''un responsable de traitement distinct.',
  'PROVISOIRE', true
),
(
  'club_minor_data_processing', '1.0.0', 'fr',
  'Traitement des données de mon enfant par l''association',
  E'[TEXTE PROVISOIRE — VALIDATION JURIDIQUE REQUISE]\n\n'
  'En tant que représentant légal, j''autorise Hybride Club à traiter le nom, le prénom, '
  'la date de naissance et l''adresse e-mail de mon enfant dans le seul but de gérer son '
  'inscription aux sorties du club, ainsi que mon adresse e-mail pour recueillir la '
  'présente autorisation.\n\n'
  'Ces données sont conservées 3 ans après la dernière participation confirmée, puis '
  'supprimées. Elles ne sont **jamais** utilisées pour la prospection commerciale de '
  'l''application Hybride.',
  'PROVISOIRE', true
),
(
  'club_parental_sport_authorization', '1.0.0', 'fr',
  'Autorisation parentale de pratique sportive',
  E'[TEXTE PROVISOIRE — VALIDATION JURIDIQUE REQUISE]\n\n'
  'En tant que représentant légal, j''autorise mon enfant à participer à la sortie '
  'sportive indiquée ci-dessus, organisée par Hybride Club (association loi 1901).\n\n'
  'Cette autorisation vaut pour cette sortie uniquement.',
  'PROVISOIRE', true
);
