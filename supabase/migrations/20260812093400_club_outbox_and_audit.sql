-- =============================================================================
-- club — outbox e-mail et journal des exports
-- -----------------------------------------------------------------------------
-- `club.email_log` n'est pas un journal a posteriori : c'est un OUTBOX
-- TRANSACTIONNEL (ADR-006). La ligne est écrite DANS la transaction qui produit
-- le fait métier, sous le verrou d'ADR-003 ; l'envoi HTTP a lieu après commit.
--   - transaction annulée  ⇒ pas de ligne ⇒ pas d'e-mail pour un fait inexistant ;
--   - envoi échoué         ⇒ ligne `pending` ⇒ reprise par le cron ;
--   - I/O réseau           ⇒ jamais sous verrou.
-- =============================================================================

create table club.email_log (
  id                  uuid primary key default gen_random_uuid(),
  club_id             uuid references club.clubs(id) on delete set null,
  email_type          club.email_type not null,
  related_type        club.email_related_type not null,
  related_id          uuid not null,
  recipient           text not null,
  status              club.email_status not null default 'pending',
  provider_message_id text,
  attempts            integer not null default 0,
  last_error          text,
  next_attempt_at     timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  sent_at             timestamptz,
  updated_at          timestamptz not null default now(),
  -- Aucune donnée personnelle au-delà de `recipient` : le contenu est RECONSTRUIT
  -- au moment de l'envoi depuis les lignes liées (ADR-006 §5). Ce champ n'accueille
  -- que des variantes non dérivables, jamais un corps de message.
  payload             jsonb not null default '{}'::jsonb,
  constraint email_log_attempts_bounded check (attempts >= 0 and attempts <= 10)
);
alter table club.email_log enable row level security;
create trigger email_log_touch before update on club.email_log
  for each row execute function club.touch_updated_at();

-- IDEMPOTENCE — la garantie centrale, portée par la base et non par la prudence
-- de l'appelant (le balayage `pg_cron` n'appelle aucun TypeScript).
-- Le choix du rattachement est ce qui rend la contrainte juste :
--   * `registration`           : une inscription n'est promue qu'une fois
--                               (`cancelled` est terminal, une réinscription
--                               crée une NOUVELLE ligne) ;
--   * `parental_authorization` : une réévaluation après report d'événement
--                               (US-05 AC9) crée une NOUVELLE autorisation,
--                               donc un second envoi légitime.
create unique index email_log_idempotency
  on club.email_log (email_type, related_type, related_id);

-- File de reprise du dispatcher.
create index email_log_pending
  on club.email_log (next_attempt_at) where status in ('pending', 'failed');

-- AUCUNE policy : table d'exploitation, `service_role` uniquement.

-- -----------------------------------------------------------------------------
-- Journal des exports CSV (US-06 AC8).
-- L'export est généré à la demande et transmis en flux : AUCUN fichier n'est
-- conservé côté serveur. Ce journal trace qui a exporté quoi et quand.
-- -----------------------------------------------------------------------------
create table club.export_log (
  id                uuid primary key default gen_random_uuid(),
  admin_profile_id  uuid not null references auth.users(id) on delete cascade,
  club_id           uuid not null references club.clubs(id) on delete cascade,
  event_id          uuid references club.events(id) on delete set null,
  row_count         integer not null default 0,
  exported_at       timestamptz not null default now()
);
alter table club.export_log enable row level security;

create index export_log_by_club on club.export_log (club_id, exported_at desc);

-- Un club_admin peut relire ses propres exports ; l'écriture est `service_role`
-- (la route d'export journalise elle-même, le client ne le fait jamais).
create policy "export_log_select_admin" on club.export_log
  for select to authenticated using (club.is_club_admin(club_id));
