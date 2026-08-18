# Brief — Site Hybride (vitrine app + points club)

**Statut** : Restructuration validée — décisions structurelles, modèle de données et points ouverts tous tranchés. Zoning Pencil et PRD/fiches SDD existants pas encore réécrits en détail — en attente avant d'invoquer `designer`/`architect`.
**Date du cadrage initial** : Août 2026
**Date de la restructuration** : 2026-08-11 — consolidé et clos le 2026-08-12

> Ce document remplace `00-brief-site-club.md` (obsolète, périmètre initial : un site autonome pour le seul club de Toulon). Renommé car le périmètre a changé : ce n'est plus le site d'un club, c'est **le site Hybride**, avec une vitrine de l'app et une section « points club » par ville.

---

## Objectif

Un seul site Next.js, un seul repo, un seul projet Vercel, **sur un domaine existant de l'app Hybride** (pas de nouveau domaine à réserver) :

- **`/`** — Vitrine de l'app Hybride (coach IA).
- **`/club/[slug]`** — Point club local (présentation, agenda, inscriptions aux sorties hebdomadaires). Toulon est le premier et, pour le MVP, le **seul** point club exposé publiquement (`/club/toulon`).

La séparation en deux projets distincts prévue dans le brief initial est **annulée**.

---

## Décisions structurelles

1. **Fusion des projets.** Un seul projet Next.js / repo / Vercel. Routing `/` (vitrine app) et `/club/[slug]` (points club). Domaine : réutilisation d'un domaine existant de l'app, pas de nouveau domaine.

2. **Multi-tenant dès la première migration.** `club_id` dans toutes les tables métier club, aucune page Toulon en dur. Rôles `super-admin` (plateforme) et `club-admin` (par club) — voir modèle de données. **Aucune interface multi-clubs dans le MVP**, seul `/club/toulon` est exposé.

3. **Compte partagé avec l'app Hybride.** Un seul projet Supabase, `auth.users` commune.
   `hybrideclub` (eu-west-1, `tcfibhdhxfexyojmiwge.supabase.co`) et `public.profiles` existent déjà côté app (migration `0002_identity_consents.sql`). Le site n'est pas le premier à *définir* `profiles`, il en est le premier consommateur côté club. Aucune colonne existante de `profiles` n'est modifiée, à l'exception de l'ajout additif `app_enrolled` (voir Modèle de données) — coordination directe possible : la même personne pilote les deux fronts depuis deux sessions.

4. **Séparation des données par schéma.** Schéma `club` pour toutes les données métier et de conformité club (clubs, events, registrations, waitlist, autorisations parentales, **et consentements club — table dédiée, pas de réutilisation de celles de l'app**). Les données app existantes restent dans `public` (déjà le cas), aucun schéma `app` symétrique à créer. Raison juridique : l'association loi 1901 et l'entité commerciale sont deux responsables de traitement distincts, chacun doit pouvoir exporter/purger son propre registre indépendamment. **Aucune donnée d'inscription club n'alimente la prospection de l'abonnement app sans consentement dédié et explicite.**

5. **Compte obligatoire avant inscription à une sortie.** Pas d'inscription invité. L'annulation vit dans l'espace membre (« mes inscriptions ») — le lien dans l'e-mail de confirmation redirige vers cette même action authentifiée (connexion si besoin) plutôt que de maintenir un mécanisme d'annulation par token séparé.

6. **Mineurs — deux régimes distincts, cumulatifs et non concurrents :**
   - **RGPD** : consentement autonome possible dès 15 ans (droit français).
   - **Autorisation parentale de pratique sportive** : requise jusqu'à 18 ans, indépendamment du régime RGPD — **reste obligatoire même pour un 15-17 ans qui a consenti seul au RGPD.**
   - **<15 ans** : le parent donne les deux (consentement RGPD au nom du mineur + autorisation sportive) en un seul geste — un seul e-mail/lien de validation, deux preuves distinctes en base (`club.consents` pour le RGPD, `club.parental_authorizations` pour le sportif).
   - Une inscription de mineur reste **en attente de validation parentale**, bloque une place **48h**, puis libère la place si aucune réponse. Preuve horodatée et conservée.
   - **Refus explicite (« denied ») vs silence (« expired »)** : même effet technique (place libérée, inscription annulée), message différent à l'inscrit — « denied » : factuel neutre (« ton parent n'a pas autorisé cette sortie ») ; « expired » : actionnable (« pas de réponse sous 48h, tu peux réessayer ou relancer ton parent »).
   - **Réévaluation si l'événement est reporté** : à chaque édition de date d'un événement, recalcul de `is_minor_at_event` sur les inscriptions non annulées. Bascule majeur→mineur : repasse en `pending_parental_authorization`, redéclenche le flux. Bascule mineur→majeur : aucune action (une autorisation déjà obtenue reste valable).

7. **Pages légales obligatoires**, **séparées par entité** : mentions légales + politique de confidentialité de l'association sur `/club/*`, mentions légales + politique de confidentialité de l'entité commerciale sur `/` et le reste du site vitrine app. Pas de page unique multi-entités — ça brouillerait la distinction que le reste de l'architecture maintient (décision 4).

---

## Modèle de données (proposition validée, migrations pas encore écrites)

Principe directeur : **additif uniquement, zéro colonne touchée sur les tables existantes de l'app**, sauf l'exception documentée ci-dessous.

### Schéma `club`

- **`club.clubs`** (id, slug unique, name, city, created_at) — une ligne `toulon` au lancement.
- **`club.admin_roles`** (id, profile_id → `auth.users(id)`, club_id → `club.clubs(id)` nullable, role `super_admin`/`club_admin`, check : `club_admin` exige `club_id`, `super_admin` l'interdit). Dans `club` plutôt que `public` pour garder `public` intact.
- **`club.member_profiles`** (id → `auth.users(id)`, first_name, last_name, birth_date, phone?, created_at/updated_at). Table séparée de `profiles` : le club a besoin de nom/prénom distincts et d'une date de naissance **propre**, collectée sous son propre consentement — jamais de lecture/écriture sur `athlete_profiles.birth_date` (gaté par le consentement santé de l'app, finalité différente).
- **`club.disciplines`** (code, label, sort_order, is_active) — liste fermée à 5 valeurs : course, vélo, eau, montagne, collectif. Distinct du FORMAT (trail, piste, longe-côte, bivouac, volley…), étiquette descriptive non colorée et non modélisée en base.
- **`club.events`** (id, club_id, title, starts_at, ends_at?, location, level, capacity, status, created_by, created_at/updated_at). Une ou plusieurs disciplines par événement — **`club.event_disciplines`** (event_id, discipline_code), table de liaison plutôt que colonne simple : un swim and run relève à la fois de "eau" et de "course à pied".
- **`club.registrations`** (id, event_id, member_profile_id, status `confirmed`/`waitlist`/`pending_parental_authorization`/`cancelled`, is_minor_at_event boolean recalculé à l'édition de l'événement, is_under_15_at_registration boolean (branche le parcours de consentement RGPD autonome vs parental), created_at, confirmed_at, cancelled_at). Pas de position de liste d'attente stockée : l'ordre est dérivé de `created_at`. Index unique **partiel** `(event_id, member_profile_id) WHERE status <> 'cancelled'` — permet une réinscription après annulation.
- **`club.parental_authorizations`** (id, registration_id, minor_profile_id, parent_email, token unique, requested_at, hold_expires_at = requested_at + 48h, confirmed_at, status `pending`/`confirmed`/`expired`/`denied`, proof_ip_hash, proof_user_agent) — preuve horodatée de l'autorisation parentale de pratique sportive. Pour les <15 ans, le même lien couvre aussi la validation RGPD parentale (voir `club.consents`).
- **`club.consent_documents`** + **`club.consents`** — registre de preuve RGPD club, structure jumelle de celle de l'app (`consent_documents`/`consents`) mais physiquement séparée : l'association doit pouvoir exporter/purger son registre indépendamment de l'entité commerciale. RLS est un contrôle d'accès, pas une séparation de responsable de traitement — d'où la duplication plutôt que la réutilisation. Conservation : **3 ans après la dernière participation confirmée**, purge automatique programmée (même mécanique `pg_cron` que le hold 48h), **à valider juridiquement avant lancement** — le registre de preuve de consentement lui-même suit sa propre politique de conservation, plus longue, déjà gérée par le design hérité de l'app.
- **`club.email_log`** (id, related_type, related_id, email_type, recipient, status `pending`/`sent`/`failed`, provider_message_id, attempts, last_error, created_at, sent_at) — idempotence des 7 e-mails transactionnels via contrainte unique `(email_type, related_type, related_id)` sur les envois qui ne doivent jamais se dupliquer (la promotion liste d'attente, en particulier). Un sweep (worker ou `pg_cron`) traite `pending`/`failed` avec retry.
- **`club.export_log`** (id, admin_profile_id, event_id, exported_at) — journal léger des exports CSV. Génération à la demande, streaming direct à l'admin authentifié, **aucun fichier conservé côté serveur** après la requête.

### Mécaniques transactionnelles retenues

- **Capacité** : fonction `club.register_for_event(...)` (`security definer`, `service_role` uniquement) — `SELECT ... FOR UPDATE` sur la ligne `club.events`, comptage des `confirmed` dans la même transaction, puis insertion `confirmed` ou `waitlist`. Un `UNIQUE`/`CHECK` seul ne peut pas garantir "au plus N confirmés" ; verrou + comptage transactionnel uniquement.
- **Promotion liste d'attente** : même fonction/verrou, sélection du plus ancien `waitlist` par `created_at`.
- **Expiration du hold 48h** : `pg_cron` (extension Supabase, tous plans — pas de dépendance au plan Pro de Vercel), fonction `club.expire_parental_holds()` toutes les 15 min. Bascule `expired` → `cancelled` sur la registration liée → déclenche la promotion.

### Correctif de fuite de finalité (app ↔ club)

Vérification faite dans le code de l'app (`apps/web/lib/jobs/`, `apps/web/lib/notifications/`) :
- `enqueueObjectiveChecks` est scopé à la table `objectives` (propre à l'app) — pas de fuite.
- **`enqueueWeeklyReviews` interroge `public.profiles` sans aucun filtre de rôle ni de statut** — tout compte créé pour une sortie club recevrait aujourd'hui la révision hebdomadaire applicative (notification + e-mail). **Fuite confirmée, déjà présente indépendamment du site club.**

**Livré côté app le 2026-08-12** (migrations `0015`, `0016`, `0017`, branche `feature/design-system-hybride`, commits `b1b88aa`/`54bb61c`/`948c513`) : `ALTER TABLE public.profiles ADD COLUMN app_enrolled boolean NOT NULL DEFAULT true` (backfill automatique à `true` pour les comptes existants), `enqueueWeeklyReviews` (et tout job similaire) filtre `.eq("app_enrolled", true)`, le flag repasse à `true` à la complétion de l'onboarding.

**Mécanisme d'écriture, corrigé le 2026-08-12** — la première version ci-dessus était fausse : `handle_new_user()`, trigger `AFTER INSERT ON auth.users`, crée la ligne `profiles` pour **toute** création de compte (app ou club, `auth.users` commune) — le site ne peut donc pas l'insérer lui-même, ni via `service_role` ni depuis le navigateur. Le site passe l'origine dans `raw_user_meta_data` au `signUp()` (`{ data: { origin: 'club' } }`, appel Auth standard, **aucun `service_role` requis** pour ce mécanisme) ; `handle_new_user()` en dérive `app_enrolled` dans la même transaction que la création de la ligne — pas de fenêtre entre création et correction.

Coordination : la même personne pilote le site et l'app depuis deux sessions — ce correctif et son intégration dans le code de l'app peuvent être proposés directement dès le moment venu, sans point de synchronisation humain supplémentaire à organiser.

### Coordination des migrations — révisé par `architect` (ADR-001)

**Le protocole "relister avant d'écrire, prochain numéro 0015" ci-dessus est abandonné — il ne supprime pas le risque, il le rend seulement moins probable.** Supabase identifie une migration par le préfixe numérique de son nom de fichier dans une table d'historique unique par projet cloud, sans notion de repo d'origine. Deux repos numérotant chacun leurs migrations en `0001`, `0002`… peuvent produire une collision : si l'app pousse son propre `0015` avant le site, la CLI considère la version comme déjà appliquée et **ignore silencieusement** le fichier du site — le schéma `club` n'existerait pas en production sans qu'aucune erreur ne le signale.

Décision retenue (`docs/adr/ADR-001-coordination-migrations-projet-supabase-partage.md`) :
- Migrations de ce repo nommées par **horodatage UTC** (`<YYYYMMDDHHMMSS>_slug.sql`), jamais par compteur — la collision devient impossible par construction, et l'ordre chronologique place toujours les migrations club après les migrations séquentielles existantes de l'app.
- Ce repo est le **répertoire d'auteur** (écriture, relecture, `supabase db reset` local) ; le repo de l'app reste le **répertoire d'application** (celui qui contient déjà l'historique complet et exécute `supabase db push --linked`) — une contrainte de la CLI Supabase que le protocole initial n'avait pas anticipée. Livraison d'une migration club = copie à l'octet près dans `hybrideappli/supabase/migrations/`, jamais modifiée ensuite des deux côtés.
- Aucun `project_id` de production ni script `db:push` dans ce repo — l'impossibilité technique de pousser depuis ici est rendue explicite plutôt que découverte à l'usage.

**Prérequis de mise en production, livré** : la colonne additive `public.profiles.app_enrolled` est écrite par le repo de l'app (voir ci-dessus) — le site n'a plus qu'à passer `raw_user_meta_data = { origin: 'club' }` à son propre appel `signUp()`, aucune écriture directe sur `profiles` de son côté.

---

## E-mails transactionnels (produit non fonctionnel sans eux)

1. Confirmation d'inscription
2. Promotion depuis la liste d'attente
3. Demande de validation parentale (couvre aussi le volet RGPD pour les <15 ans)
4. Confirmation de validation parentale
5. Annulation
6. Création de compte
7. Mot de passe oublié

Chaque envoi tracé dans `club.email_log` pour garantir l'idempotence, en particulier sur la promotion.

---

## Contrainte de date

Le site doit être en ligne **pour la rentrée (début septembre 2026)** — un événement partenaire est déjà annoncé.

### Lot P0 — en ligne pour la rentrée

**Écrans nouveaux** : `/` vitrine app minimale, Création de compte, Connexion (unifiée public + admin, redirection selon rôle), Mot de passe oublié, **Validation parentale côté parent** (écran critique, absent de l'ancien zoning — couvre RGPD + autorisation sportive pour les <15 ans), Mentions légales (association), Mentions légales (entité commerciale), Politique de confidentialité (association), Politique de confidentialité (entité commerciale).

**Écrans modifiés** (vs ancien zoning `docs/zoning-pencil.md`) : `/club/toulon` (ex-A1, fusionné avec l'ex-A3 infos pratiques, bloc app Hybride retiré → déplacé sur `/`), agenda (ex-B1, filtré `club_id`), détail + inscription (ex-B2, compte obligatoire, régime mineur à deux volets), confirmation (ex-B3, + état attente parentale), annulation (ex-B4, devient une action depuis l'espace membre, plus de token bypass-auth), C2-C4 (scoping `club_id`, C4 + état attente parentale). C1 fusionné dans la Connexion unifiée.

**Reporté en P1** : A2 (pages activité dédiées par sport) — contenu absorbé par l'agenda pour le P0.

**Hors écrans, mais P0** : dashboard admin minimal (créer/annuler un événement — **édition retirée du P0**), liste des inscrits, export CSV.

### Lot P1 — après la rentrée

- Vitrine app complète
- Carte et interface multi-clubs
- Badges de fidélité
- Espace membre enrichi
- Édition d'événement dans le dashboard admin (créer/annuler suffisent au P0)
- A2 — pages activité dédiées

**Le multi-tenant et le modèle `profiles`/rôles sont en P0 côté base de données**, même si l'interface multi-clubs est en P1 — pas de migration de schéma prévue plus tard.

---

## Avis de faisabilité — P0 pour début septembre

**Tendu mais faisable, et le risque de coordination est désormais plus faible qu'estimé initialement** (même personne des deux côtés app/club).

Le modèle de données est correct et volontairement solide (verrou transactionnel, `pg_cron`, schéma de consentement dupliqué, journal d'e-mail idempotent) — pas de simplification recommandée, ce sont des fondations coûteuses à refaire après coup.

Coupes retenues pour tenir la date :
- Édition d'événement retirée du P0 admin (créer + annuler seulement ; correction rare via Supabase Studio en attendant).
- A2 (pages activité dédiées) en P1.
- Pas de charte graphique propre avant lancement — style minimal actuel de l'app repris tel quel, rebranding visuel en chantier P1 explicite.
- Export CSV conservé en P0 (peu coûteux, forte valeur pour l'admin club) — pas une coupe.

Facteurs de risque restants, par ordre :
1. Formulation légale de l'autorisation parentale de pratique sportive et validation de la durée de conservation RGPD (3 ans, proposée mais pas encore validée juridiquement) — dépendances externes, pas du temps d'ingénierie.
2. Aucune charte graphique encore disponible côté app à reprendre.
3. Volume de travail réel : deux fronts (app + club) pilotés par la même personne — la coordination n'est plus un risque de communication, mais reste un risque de disponibilité/temps.

---

## Historique

- Août 2026 — Cadrage préliminaire initial sous le nom `00-brief-site-club.md` (site club autonome, projet séparé de l'app).
- 2026-08-11 — Restructuration : fusion en un seul site Hybride multi-tenant, compte obligatoire, régime mineur à deux volets, découpage P0/P1 pour un lancement rentrée. Document renommé.
- 2026-08-11 — Découverte que `public.profiles` et le projet Supabase `hybrideclub` existent déjà côté app ; proposition de schéma additive transmise.
- 2026-08-11/12 — Arbitrages utilisateur sur le modèle de données (consentements séparés, verrouillage transactionnel de la capacité, liste d'attente dérivée de `created_at`, expiration via `pg_cron`, minorité à la date de l'événement, réinscription via index unique partiel, journal d'e-mail idempotent, protocole de coordination des migrations) ; fuite de finalité confirmée dans `enqueueWeeklyReviews` et correctif additif proposé.
- 2026-08-12 — Les 9 questions ouvertes restantes tranchées (interaction RGPD/autorisation sportive, réévaluation à l'édition d'événement, denied vs expired, fusion annulation/compte, durée de conservation, domaine, mentions légales séparées, sécurisation des exports CSV, coordination des migrations) et intégrées ci-dessus. Brief consolidé et clos sur le fond.
- 2026-08-12 — `docs/PRD.md`, les 7 fiches `docs/features/US-*.md` et `docs/zoning-pencil.md` réécrits en détail (canvas Pencil reconstruit, 13 écrans). `architect` invoqué : `docs/architecture.md`, `docs/api-contracts.md`, 7 ADR et migrations `club` proposées.
- 2026-08-12 — Correction du protocole de migration (ADR-001) : numérotation séquentielle abandonnée au profit de migrations horodatées + procédure de copie vers le repo de l'app (répertoire d'application). Faille `erase_account()` signalée par `architect` : vérifiée, déjà corrigée côté app le 2026-08-09 (fausse alerte due à une documentation périmée). `app_enrolled` livré côté app (migrations `0015`-`0017`) ; audit `search_path`/`pg_temp` étendu aux 7 fonctions `security definer` du repo app, 2 vecteurs réels corrigés (`has_active_consent`, `is_staff`). Mécanisme d'écriture d'`app_enrolled` corrigé (dérivé par `handle_new_user()` via `raw_user_meta_data`, pas inséré par le site).
- 2026-08-12 — Trois corrections côté site avant `developer` : `club.events` gagne `ends_at` (nullable) à la place d'une `duration_minutes` plafonnée à 24h, pour couvrir les événements multi-jours (bivouac de rentrée) — migrations pas encore appliquées, correction directe du DDL. ADR-005 documente l'exception explicite du garde JWT pour les fonctions `pg_cron` (`expire_parental_holds`, `purge_expired_member_data` — `request.jwt.claims` est vide hors PostgREST). ADR-008 créé : l'état de sécurité du repo app se référence par nom de migration, jamais recopié en prose durable — audit `pg_temp` étendu aux 18 fonctions `security definer` de ce repo, toutes qualifiées `club.*`, vecteur sans prise.
