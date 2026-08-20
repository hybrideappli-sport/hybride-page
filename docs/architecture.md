# Architecture — Site Hybride (vitrine app + points club)

> Document d'architecture principal. Écrit par `architect`, lecture seule pour les autres agents.
> Les **décisions** vivent dans `docs/adr/` : ce document les référence, il ne les rejoue pas.
> Le **DDL canonique** vit dans `supabase/migrations/` : ce document en donne la carte, pas le contenu.
>
> Version : 1.0 — 2026-08-12
> Sources : `00-brief-site-hybride.md`, `docs/PRD.md`, `docs/features/US-01..07`, `docs/zoning-pencil.md`
>
> **Amendement 2026-08-19** : bascule de saison, voir **ADR-010**. Tout ce qui touche comptes, inscription en ligne, autorisation parentale en ligne, dashboard admin et e-mails transactionnels (§5 à §9, ADR-003/005/006/009) décrit une architecture retirée du site — le code correspondant a été supprimé, pas seulement le schéma. §1 à §4 (vue d'ensemble, stack de base, sécurité RLS) restent globalement valides pour ce qui subsiste (vitrine, page club, agenda en tableur, shop).

---

## 1. Vue d'ensemble

Une application Next.js unique servant deux territoires sur un même domaine :

```
example.com/                      vitrine app (entité commerciale)  ── US-01
example.com/club/toulon           point club  (association 1901)    ── US-02
example.com/club/toulon/sorties/…  détail + inscription             ── US-04
example.com/autorisation-parentale/[token]  parent, sans compte     ── US-05
example.com/admin/…               dashboard club_admin             ── US-06
```

Une seule base : le projet Supabase **partagé avec l'app commerciale** (`hybrideclub`, eu-west-1). `auth.users` est commune ; les données du club vivent dans un schéma `club` distinct du schéma `public` de l'app.

```
┌──────────────── Vercel : projet « site » ───────────────┐
│  Next.js 16 App Router                                  │
│   Server Components ─ lecture (RLS / RPC)               │
│   Server Actions    ─ mutation (RPC, client utilisateur)│
│   Route Handlers    ─ export CSV, cron e-mail           │
└───────────┬──────────────────────────┬──────────────────┘
            │ supabase-js (@supabase/ssr)         │ Resend API
            ▼                                     ▼
┌──────────────── Supabase (projet PARTAGÉ) ──────────────┐
│  auth.users            ← commune app + club             │
│  public.*              ← app commerciale (non modifié)  │
│  club.*                ← ce site (ADR-002)              │
│     tables + fonctions verrouillées (ADR-003)           │
│     pg_cron : expiration des holds 48 h (ADR-005)       │
└─────────────────────────────────────────────────────────┘
```

Les cinq propriétés structurantes, chacune adossée à une ADR :

| Propriété | Décision |
|---|---|
| Deux repos, un projet cloud : migrations horodatées, un seul répertoire d'application | **ADR-001** |
| Schéma `club` séparé, registre de consentement dupliqué | **ADR-002** |
| Capacité et liste d'attente garanties par verrou transactionnel | **ADR-003** |
| Lecture par RLS, écriture par fonctions `security definer` | **ADR-004** |
| Expiration des holds par `pg_cron`, relais e-mail par Vercel Cron | **ADR-005** |
| E-mails Resend, outbox transactionnel idempotent | **ADR-006, ADR-009** |
| Application autonome hors monorepo, sessions distinctes par hôte | **ADR-007** |

---

## 2. Stack

| Couche | Choix | Version cible |
|---|---|---|
| Framework | Next.js **App Router** | 16.x |
| Rendu | React Server Components + Server Actions | React 19 |
| Langage | TypeScript, `strict: true` | 5.x |
| Style | Tailwind CSS + shadcn/ui | 4.x |
| Base / Auth | Supabase (`@supabase/supabase-js` + **`@supabase/ssr`**) | 2.x |
| Validation | Zod | 4.x |
| E-mail | Resend (API transactionnelle) — ADR-006, ADR-009 | — |
| Tests | Vitest (unitaire + intégration base), Playwright (E2E) | — |
| Hébergement | Vercel, projet distinct de celui de l'app | — |
| Paquets | pnpm | — |

**Ne pas introduire** : `@supabase/auth-helpers-nextjs` (déprécié, remplacé par `@supabase/ssr`) ; une bibliothèque d'état client (aucun besoin au P0) ; un ORM (les mutations passent par `rpc()`, les lectures par PostgREST) ; Stripe (aucune transaction sur le site, PRD §5).

**Pas de charte graphique définitive** (brief) : composants shadcn neutres, jetons de couleur à poser en P1. `#FB923C` du zoning est une convention de wireframe et ne doit pas apparaître en dur dans le code.

---

## 3. Structure du repo

```
hybride-page/
├─ app/
│  ├─ (marketing)/                     # entité commerciale — footer et légal dédiés
│  │  ├─ page.tsx                      # US-01 — A1
│  │  ├─ mentions-legales/page.tsx     # US-07
│  │  └─ politique-de-confidentialite/page.tsx
│  ├─ club/[slug]/                     # association — footer et légal dédiés
│  │  ├─ page.tsx                      # US-02 — B1 (présentation + infos + agenda)
│  │  ├─ sorties/[eventId]/page.tsx    # US-04 — D1
│  │  ├─ mentions-legales/page.tsx     # US-07
│  │  └─ politique-de-confidentialite/page.tsx
│  ├─ (auth)/
│  │  ├─ connexion/page.tsx            # US-03 — C2, unifiée public + admin
│  │  ├─ creation-compte/page.tsx      # C1
│  │  ├─ mot-de-passe-oublie/page.tsx  # C3
│  │  └─ reinitialiser-mot-de-passe/page.tsx
│  ├─ mes-inscriptions/page.tsx        # US-04 — D3
│  ├─ autorisation-parentale/[token]/page.tsx   # US-05 — E1, sans authentification
│  ├─ admin/
│  │  ├─ layout.tsx                    # garde de rôle
│  │  ├─ sorties/page.tsx              # US-06 — F1
│  │  ├─ sorties/nouvelle/page.tsx     # F2
│  │  └─ sorties/[eventId]/page.tsx    # F3
│  └─ api/
│     ├─ admin/events/[eventId]/export.csv/route.ts
│     └─ cron/dispatch-emails/route.ts
├─ components/{ui,marketing,club,admin}/
├─ lib/
│  ├─ supabase/{client,server,admin,middleware}.ts
│  ├─ actions/{auth,registrations,parental,admin-events}.ts
│  ├─ email/{provider-resend,templates,dispatch}.ts
│  ├─ validation/*.ts
│  └─ types/database.ts                # généré : --schema public --schema club
├─ supabase/
│  ├─ migrations/                      # répertoire d'AUTEUR (ADR-001 §2)
│  ├─ local-baseline/                  # dump généré du schéma public de l'app
│  ├─ seed.sql
│  └─ config.toml
├─ docs/{architecture.md,api-contracts.md,PRD.md,zoning-pencil.md,adr/,features/}
├─ scripts/check-migrations-mirror.sh  # ADR-001 §2
├─ tests/                              # Vitest
└─ e2e/                                # Playwright
```

**Séparation par groupe de routes.** `(marketing)` et `club/[slug]` ont des `layout.tsx` distincts : chacun impose le footer et les liens légaux de **son** responsable de traitement (US-07). La séparation juridique d'ADR-002 est ainsi portée par la structure des fichiers, pas par une condition dans un composant partagé.

**Multi-tenant réel dès le P0.** Aucune page Toulon en dur : `/club/[slug]` résout le club par son `slug`, et `club.clubs.is_published` gouverne l'exposition. Seule l'interface multi-clubs est en P1.

---

## 4. Conventions de code

Détail complet en ADR-007 §5. L'essentiel :

- **Identifiants en anglais, contenu et URLs en français.**
- Composants `PascalCase`, un par fichier ; autres fichiers `kebab-case`.
- `'use client'` le plus bas possible dans l'arbre : un formulaire, jamais une page.
- Une Server Action par geste métier, dans `lib/actions/`, entrée validée par Zod **en première instruction**, retour `ActionResult<T>` discriminé — jamais d'exception comme canal vers l'interface.
- **Aucune écriture directe sur `club.registrations`** : `rpc()` obligatoire (ADR-004).
- **`service_role` uniquement dans `lib/supabase/admin.ts`**, importable seulement côté serveur, trois chemins d'usage autorisés (contrats d'API §7).
- Accessibilité : labels explicites (jamais un placeholder seul), erreurs liées par `aria-describedby`, focus visible, cibles ≥ 44 px — exigences du zoning §Accessibilité.
- Conventional Commits, branches `feature/US-XX-slug`, PR vers `develop`.
- CI : `tsc --noEmit`, ESLint, Prettier, Vitest, Playwright.

---

## 5. Modèle de données

**DDL canonique : `supabase/migrations/`.** Ce tableau en est la carte de lecture.

| Migration | Contenu |
|---|---|
| `20260812093000_club_schema_bootstrap.sql` | schéma, privilèges par défaut, énumérations, utilitaires (`age_years_on`, `local_date`, `generate_token`, `forbid_mutation`) |
| `20260812093100_club_core_tables.sql` | `activities`, `clubs` (+ Toulon), `admin_roles`, `member_profiles`, `is_club_admin` / `is_super_admin` |
| `20260812093200_club_events_registrations.sql` | `events`, `registrations`, index unique partiel, policies |
| `20260812093300_club_parental_and_consents.sql` | `consent_documents`, `consents`, `parental_authorizations`, textes P0 |
| `20260812093400_club_outbox_and_audit.sql` | `email_log` (outbox idempotent), `export_log` |
| `20260812093500_club_transactional_functions.sql` | `register_for_event`, `cancel_registration`, `cancel_event`, `decide_parental_authorization`, promotion, recalcul de minorité, lectures publiques, `event_roster` |
| `20260812093600_club_scheduled_jobs.sql` | `pg_cron`, `expire_parental_holds` (15 min), `purge_expired_member_data` (écrite, **non planifiée**) |

### Les cinq points où le schéma porte une règle métier

1. **`registrations_active_unique`**, index unique **partiel** `where status <> 'cancelled'` : une seule inscription active par personne et par sortie, **et** réinscription possible après annulation (US-04 AC7). Une contrainte `UNIQUE` simple interdirait la seconde.
2. **`is_minor_at_event`** évalué à la date de l'**événement**, stocké, et **recalculé par trigger** si `starts_at` change (US-05 AC9) — y compris pour une correction faite en Supabase Studio, seule voie de modification au P0.
3. **`is_under_15_at_registration`** évalué à la date d'**inscription** : c'est le moment où le consentement est donné, donc où la capacité à consentir s'apprécie. Volontairement non recalculé.
4. **Le hold parental occupe une place.** L'occupation compte `confirmed` **et** `pending_parental_authorization` : c'est ce qui donne son sens aux 48 h.
5. **`email_log` a un index unique `(email_type, related_type, related_id)`** : l'idempotence est une contrainte de base, pas une précaution d'appelant (ADR-006 §4).

### Ce que ce repo n'écrit pas

`public.profiles.app_enrolled` — **livré côté app le 2026-08-12** (migrations `0015`-`0017`, ADR-001 §4). Le site n'écrit jamais directement `public.profiles` : `handle_new_user()` (trigger app sur `auth.users`) dérive `app_enrolled` depuis `raw_user_meta_data.origin`, passé par le site à son propre `signUp()`. Correction par rapport à la version initiale de ce document, qui décrivait une écriture directe par le site — impossible en pratique puisque le trigger crée la ligne avant tout appelant côté site.

---

## 6. Sécurité

| Surface | Contrôle |
|---|---|
| Lecture des tables `club` | RLS, une policy explicite par table, aucune exception |
| Écriture métier | fonctions `security definer` vérifiant `auth.uid()` (ADR-004) |
| `UPDATE` | jamais accordé par défaut ; une seule table, au niveau colonne |
| `EXECUTE` | retiré de `PUBLIC` par défaut ; audience déclarée fonction par fonction |
| Écran parental | jeton 244 bits, usage unique, 48 h, `noindex` + `no-store` |
| Export CSV | rôle vérifié en base, flux direct, aucun fichier conservé, journalisé |
| Preuves (IP, user-agent) | calculées côté serveur, jamais acceptées du client |
| `service_role` | trois chemins, un seul module |

**Piège documenté et évité, ici, dans ce repo** (`20260812093500`, en tête) : `pg_has_role(current_user, 'service_role', 'member')` est **inutilisable** dans une fonction `security definer` — `current_user` y vaut le propriétaire (`postgres`), membre de `service_role`, donc le test est vrai pour tout appelant, `anon` compris. On lit la revendication de rôle du JWT (`club.is_service_context()`).

Le même motif avait été initialement signalé ici comme probablement présent dans `public.erase_account()` côté app — **faux** : déjà corrigé côté app le 2026-08-09, avant le début de cette session. L'erreur venait d'une documentation (`hybrideappli/docs/db-schema.md`) périmée, pas du code réel. Voir ADR-008 : l'état de sécurité du repo app se référence par nom de migration, il n'est plus reproduit ici.

**Exception au même motif, propre à ce repo** : `club.expire_parental_holds()` et `club.purge_expired_member_data()` (`20260812093600`) s'exécutent via `pg_cron`, en connexion directe hors PostgREST — `request.jwt.claims` y est vide, un contrôle sur cette revendication échouerait à chaque exécution planifiée. Ces deux fonctions ne portent donc **aucune** garde interne, seulement le privilège `EXECUTE` restreint à `service_role, postgres`. Détail : ADR-005.

**Vecteur `pg_temp`** (recherche de relation non qualifiée par schéma) : côté app, audité et corrigé — état de sécurité référencé par nom de migration, voir ADR-008, non reproduit ici. Côté repo, audit fait sur les 18 fonctions `security definer` (grep, pas déduction) : aucune référence non qualifiée, toutes préfixées `club.` — vecteur sans prise ici.

---

## 7. E-mails

Sept e-mails au brief, deux émetteurs (ADR-006 §2) :

| # | E-mail | Émetteur |
|---|---|---|
| 1 | confirmation d'inscription (+ variante liste d'attente) | site, outbox |
| 2 | promotion depuis la liste d'attente | site, outbox |
| 3 | demande de validation parentale | site, outbox |
| 4 | confirmation de validation parentale | site, outbox |
| 5 | annulation (4 variantes : membre, admin, refus, expiration) | site, outbox |
| 6 | création de compte | **Supabase Auth** (SMTP Brevo) |
| 7 | mot de passe oublié | **Supabase Auth** (SMTP Brevo) |

Plus `event_cancelled` (US-06 AC4), absent du brief mais exigé par l'AC.

Chaîne : `enqueue` sous transaction → `after()` immédiat → cron de reprise toutes les 5 min → back-off, abandon à 5 tentatives. Sous-domaine d'expédition distinct par entité (`devops`).

---

## 8. Tests attendus (pour `tester`)

**Intégration base (Vitest sur Supabase local) — la couche qui compte le plus.**

1. Capacité : `N` inscriptions concurrentes sur une sortie à `N-1` places ⇒ exactement `N-1` `confirmed`, le reste en `waitlist`.
2. Promotion : annulation d'un `confirmed` ⇒ le plus ancien `waitlist` passe `confirmed`, un seul e-mail `waitlist_promoted` enfilé.
3. Réinscription après annulation acceptée ; double inscription active refusée.
4. Mineur : inscription ⇒ `pending_parental_authorization`, place occupée, autorisation créée, e-mail enfilé.
5. Décision parentale : `approve` ⇒ `confirmed` + (si < 15 ans) une ligne `club.consents` `granted_by = 'parent'` ; `deny` ⇒ `cancelled` + promotion.
6. Expiration : `hold_expires_at` dans le passé + `expire_parental_holds()` ⇒ `expired`, `cancelled`, promotion, e-mail `..._expired` (et non `..._denied`).
7. Jeton : invalide ⇒ `invalid_token` ; rejoué ⇒ `already_decided` sans second effet.
8. Report d'événement : `update starts_at` faisant basculer majeur → mineur ⇒ `pending_parental_authorization` + nouvelle autorisation ; mineur → majeur ⇒ aucun effet.
9. Idempotence : double appel de `enqueue_email` sur le même triplet ⇒ une ligne.
10. Privilèges : `insert` direct sur `registrations` par `authenticated` ⇒ refusé ; `update` de `member_profiles.birth_date` ⇒ `permission denied for column` ; `event_roster` par un admin d'un autre club ⇒ `forbidden` ; `expire_parental_holds` par `authenticated` ⇒ refusé.
11. **Inventaire** : aucune colonne hors liste blanche n'accorde `UPDATE` à `authenticated` dans le schéma `club` (c'est ce test qui empêche la régression d'ensemble).
12. Multi-tenant : un second club de test n'apparaît jamais dans l'agenda de Toulon.
13. **Contrôle de lancement** : aucun `club.consent_documents` avec `is_current` ne contient le marqueur `PROVISOIRE` (échoue tant que les textes juridiques ne sont pas validés).

**E2E (Playwright)** : Sofia (découverte → compte → inscription → confirmation) ; Léa (inscription → annulation → réinscription) ; mineur (inscription → e-mail parent → autorisation → statut mis à jour) ; Marc (connexion → création de sortie → liste des inscrits → export CSV) ; parcours mobile 375 px sans défilement horizontal.

**Unitaires** : schémas Zod, calcul d'âge aux bornes (anniversaire la veille / le jour de l'événement), gabarits d'e-mail, format CSV (BOM, séparateur `;`).

---

## 9. Environnement et déploiement

| Variable | Portée |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + serveur |
| `SUPABASE_SERVICE_ROLE_KEY` | serveur uniquement |
| `RESEND_API_KEY`, `RESEND_FROM` | serveur |
| `CRON_SECRET` | serveur |
| `PROOF_IP_SALT` | serveur — hachage des IP de preuve |
| `NEXT_PUBLIC_SITE_URL` | construction des URLs d'e-mail |

**Checklist `devops`** (détail attendu de l'agent suivant) :

1. Ajouter `club` aux **schémas exposés** de l'API Supabase — sinon `PGRST106` opaque sur tous les appels.
2. Activer `pg_cron` sur le projet **partagé** et vérifier le job `club-expire-parental-holds` ; superviser `cron.job_run_details`.
3. Configurer le SMTP Brevo de Supabase Auth (réglage **partagé avec l'app**) et les URLs de redirection Auth du nouveau domaine.
4. Créer le projet Vercel, le cron `/api/cron/dispatch-emails` (5 min), les variables ci-dessus.
5. Domaine : site sur l'apex, app sur `app.` (ADR-007 §3) — opération à planifier avant la rentrée.
6. Appliquer les migrations selon la procédure d'ADR-001 §2 (depuis le repo de l'app) — `app_enrolled` déjà livré côté app (`0015`-`0017`), plus une dépendance de séquencement pour les migrations club.
7. Alertes : e-mails `failed` après 5 tentatives, job `pg_cron` en échec.

---

## 10. Risques et dette assumée

| # | Risque | Portée | Atténuation |
|---|---|---|---|
| 1 | **Textes juridiques provisoires** en base (`PROVISOIRE`), autorisation parentale et durée de conservation non validées | bloquant lancement | test de contrôle n°13 ; dépendance externe suivie au PRD §8 |
| 2 | ~~`app_enrolled` non livré côté app~~ — livré le 2026-08-12 (migrations `0015`-`0017`) | résolu | le site passe `raw_user_meta_data = { origin: 'club' }` à `signUp()`, `handle_new_user()` (app) fait le reste ; ADR-001 §4 |
| 3 | Copie manuelle des migrations entre repos | moyen | immuabilité + `scripts/check-migrations-mirror.sh` ; dépôt `hybride-db` en P1 si le rythme augmente |
| 4 | Logique métier en PL/pgSQL, hors du typage TypeScript | moyen | tests d'intégration sur base réelle ; un seul fichier à auditer |
| 5 | Pas d'édition d'événement au P0 : corrections en Studio | moyen | trigger de recalcul de minorité (le cas dangereux est couvert) ; édition en P1 |
| 6 | Jeton parental stocké en clair | faible | 48 h, usage unique, portée d'une seule inscription ; ADR-004 §4 |
| 7 | Sérialisation des inscriptions par événement | faible | sans effet à l'échelle visée ; limite documentée |
| 8 | Basculement du domaine racine | moyen | à planifier tôt ; repli `club.` documenté (ADR-007 §3) |
| 9 | Absence de charte graphique | faible | shadcn neutre, rebranding P1 découplé de la date |

---

## 11. Ordre d'implémentation pour `developer`

| Lot | Contenu | Dépend de |
|---|---|---|
| **L0** | Scaffold Next.js, Tailwind/shadcn, clients Supabase (`@supabase/ssr`), middleware de session, CI | — |
| **L1** | Migrations `…093000` à `…093400` appliquées en local (`supabase db reset`), types générés, tests de privilèges (n°10, 11) | L0 |
| **L2** | US-03 — création de compte, connexion, mot de passe oublié, redirection par rôle | L1 (`app_enrolled` déjà livré côté app) |
| **L3** | Migrations `…093500`/`…093600`, tests d'intégration n°1 à 9 | L1 |
| **L4** | US-01 + US-02 + US-07 — vitrine, page club, agenda, 4 pages légales | L1 |
| **L5** | US-04 — détail, inscription, confirmation, mes inscriptions, annulation | L2, L3 |
| **L6** | US-05 — écran parental, décision, e-mails 3 et 4 | L5 |
| **L7** | Chaîne e-mail complète (Resend, gabarits, `after()`, cron de reprise) | L5 |
| **L8** | US-06 — dashboard admin, création/annulation, inscrits, export CSV | L5 |
| **L9** | E2E Playwright, accessibilité, SEO local (schema.org `SportsClub`), recette | L4→L8 |

L2 et L4 sont parallélisables ; L5 est le chemin critique. L7 peut démarrer dès L5 : les gabarits sont indépendants du dispatcher.

---

## 12. Questions ouvertes

Aucune ne bloque le démarrage de `developer`.

1. Formulation juridique de l'autorisation parentale et durée de conservation (3 ans) — dépendance externe, PRD §8.
2. E-mail d'entrée en liste d'attente et e-mail d'auto-annulation : ajoutés par cohérence, à confirmer côté produit (contrats d'API §8).
3. `is_under_15_at_registration` — divergence de formulation entre le brief et l'US-05 AC2, tranchée en faveur de la date d'inscription (§5.3).
4. Partage de session entre app et site — reporté en P1 (ADR-007 §4).
5. Limitation de débit sur l'écran parental — P1 (ADR-004 §4).

---

## Historique

- 2026-08-12 — Création par `architect`. Stack, structure, modèle de données, sécurité, tests, ordre d'implémentation. 7 ADR et 7 migrations proposées.
- 2026-08-17 — Prestataire d'e-mail transactionnel du club changé de Brevo à **Resend** (ADR-009). Le SMTP Brevo de Supabase Auth (§7, e-mails 6-7, partagé avec l'app) est inchangé.
