# Déploiement — Site Hybride (mise en production)

> Détaille et remplace la checklist de `docs/architecture.md` §9. Écrit par `devops`.
> Lire d'abord `docs/architecture.md` §9, puis ADR-001, ADR-005, ADR-007, ADR-009 (`docs/adr/`).
>
> **Périmètre de cet agent.** Aucune action réelle sur un service tiers (Vercel, Supabase Studio,
> DNS) n'a été exécutée pour produire ce document — seuls des fichiers de configuration versionnés
> dans *ce* repo ont été créés (`vercel.json`, `.github/workflows/ci.yml`,
> `scripts/check-migrations-mirror.sh`). Toute étape marquée **Qui : utilisateur** exige un accès à
> un dashboard ou des identifiants que cet agent n'a pas et ne doit pas avoir. **Aucun fichier du
> repo `hybrideappli` n'a été modifié** — conformément à ADR-001, ce repo n'a de toute façon aucun
> moyen technique de pousser vers le projet Supabase partagé (pas de `project_id` de prod commité,
> pas de script `db:push`).
>
> Version : 1.0 — 2026-08-17

---

## 0. Vue d'ensemble — ordre d'exécution

Les étapes sont numérotées dans l'ordre où elles doivent être *lancées*. Certaines se recouvrent
(ex. la CI tourne en continu dès qu'elle est committée). Le tableau ci-dessous est la carte ; le
détail de chaque étape suit en §1 à §8.

| # | Étape | Qui | Bloque |
|---|---|---|---|
| 1 | Committer CI (`.github/workflows/ci.yml`), branch protections | devops (fichier) + utilisateur (GitHub UI) | Rien en aval, mais à faire tôt |
| 2 | Créer le projet Vercel, connecter le repo | **utilisateur** | 3, 6, 8 |
| 3 | Configurer les variables d'environnement Vercel (Preview + Production) | **utilisateur** | 6 |
| 4 | Activer `pg_cron` sur le projet Supabase **partagé** (dashboard) | **utilisateur** | 5 |
| 5 | Copier et pousser les 7 migrations club vers `hybrideappli`, puis vers le projet cloud (ADR-001 §2) | **utilisateur**, depuis le repo `hybrideappli` | 6, 7 |
| 6 | Ajouter `club` aux schémas exposés PostgREST (dashboard) | **utilisateur** | Rien, mais sans elle tout appel club échoue en `PGRST106` — à faire **avant ou immédiatement après** l'étape 5, jamais après un déploiement de code qui appelle l'API |
| 7 | Vérifier `cron.job_run_details` (le job `club-expire-parental-holds` tourne) | **utilisateur** | Rien, vérification post-5 |
| 8 | Vérifier le SMTP Brevo de Supabase Auth + URLs de redirection Auth | **utilisateur** | 9 (bascule de domaine) |
| 9 | Premier déploiement (branche `main` → Production) | Vercel (déclenché par push/merge) | 10 |
| 10 | Bascule de domaine (ADR-007 §3) | **utilisateur**, ordre détaillé en §7 | Rien — dernière étape, planifiée avant la rentrée |
| 11 | Alertes minimales | **utilisateur** (configuration dashboard) + devops (documentation) | — |

**Dépendances dures à retenir** :
- 5 dépend de 4 (le `create extension if not exists pg_cron` de la migration `…093600` échoue si `pg_cron` n'a pas d'abord été activé via le dashboard — voir §4).
- 6 doit être fait avant que du code en production n'appelle l'API club, sous peine de `PGRST106` en prod alors que tout fonctionne en local (le `club` de `supabase/config.toml` local ne régit que la stack locale).
- 10 (domaine) ne doit être entamée qu'une fois 2, 3, 8 et 9 validés — jamais avant.

---

## 1. CI (GitHub Actions)

**Fait par cet agent** : `.github/workflows/ci.yml`, trois jobs sur chaque PR vers `develop`/`main`
et chaque push sur ces branches :

- `lint` — `pnpm lint` (ESLint)
- `typecheck` — `pnpm typecheck` (`tsc --noEmit`)
- `build` — `pnpm build` (`next build`), avec des variables `NEXT_PUBLIC_*` factices (aucun appel
  réseau pendant `next build` : les Server Components qui lisent Supabase ne s'exécutent qu'à la
  requête, pas à la compilation)

**Écart assumé par rapport à `docs/architecture.md` §4 et §11** (« CI : `tsc --noEmit`, ESLint,
Prettier, Vitest, Playwright ») : **aucun job `test` n'a été ajouté.** Vérification faite avant
d'écrire ce document : il n'existe dans ce repo ni répertoire `tests/` ni `e2e/`, ni dépendance
`vitest`/`playwright` dans `package.json`, ni script `pnpm test`. La checklist d'architecture
suppose une suite qui n'est pas commitée, malgré le brief de tâche qui indique le code « vérifié en
local ». **Point à lever avec `tester`/`developer`** avant le lancement — sans cette suite, le test
de contrôle n°13 de `docs/architecture.md` §8 (aucun texte juridique marqué `PROVISOIRE`) ne peut
pas s'exécuter automatiquement non plus, alors que c'est explicitement listé comme bloquant au
lancement (§10, risque n°1). Le job `test` est laissé en commentaire dans `ci.yml`, prêt à
décommenter dès que la suite existe.

**Qui : utilisateur** — sur GitHub (`Settings → Branches`), activer la protection de `main` et
`develop` : `require status checks to pass` (`lint`, `typecheck`, `build`), `require PR before
merge`. Cet agent n'a pas d'accès `gh` distant confirmé pour ce repo dans cette session ; à faire
manuellement ou via `gh api` par l'utilisateur.

**Vérification** : ouvrir une PR de test (ou pousser un commit trivial) et observer les trois
checks passer dans l'onglet Actions.

---

## 2. Projet Vercel

**Qui : utilisateur**, dashboard Vercel.

1. Créer un nouveau projet, **distinct de celui de l'app** (ADR-007 §2 : « Hébergement : Vercel,
   projet distinct de celui de l'app »), même compte/équipe.
2. Connecter le repo GitHub `hybride-page` (import direct, pas d'upload).
3. Framework preset : Next.js (auto-détecté). Build command / output : par défaut (`next build`).
4. Production branch : `main`. Preview deployments : activés par défaut sur toutes les branches et
   PR (`develop`, `feature/*`) — rien à changer, c'est le comportement Vercel standard.
5. `pnpm` comme gestionnaire de paquets (cohérent avec `pnpm-lock.yaml` déjà présent à la racine) :
   Vercel le détecte automatiquement via le lockfile.

**Vérification** : un premier déploiement (probablement en échec, faute de variables d'environnement
— normal à ce stade) apparaît dans l'onglet Deployments.

### Cron Vercel — point d'attention plan tarifaire

**Fait par cet agent** : `vercel.json` déclare le cron du relais e-mail :

```json
{
  "crons": [{ "path": "/api/cron/dispatch-emails", "schedule": "*/5 * * * *" }]
}
```

**À vérifier par l'utilisateur avant de compter dessus** : sur le plan **Hobby**, Vercel limite les
Cron Jobs à **une exécution par jour**, pas toutes les 5 minutes. ADR-005 §2 exige un relais toutes
les 5 minutes (filet de reprise des e-mails en échec ou enfilés par `pg_cron`, ADR-006). Si le
projet reste sur Hobby, ce cron ne tiendra pas la fréquence prévue — un plan **Pro** (au moins pour
ce projet Vercel) est un prérequis implicite d'ADR-005, non chiffré explicitement dans les ADR
existantes. À trancher par l'utilisateur : c'est une dépense récurrente, pas une simple case à
cocher.

**Vérification post-déploiement** : `Vercel → Project → Cron Jobs` affiche le job et son historique
d'exécution ; chaque exécution doit renvoyer `200` avec un corps `{ processed, sent, failed,
pending }` (voir `app/api/cron/dispatch-emails/route.ts`).

---

## 3. Variables d'environnement Vercel

**Qui : utilisateur**, `Project → Settings → Environment Variables`, à saisir séparément pour
**Preview** et **Production** (jamais la même clé `service_role`/Resend pour les deux si vous
disposez d'un projet Supabase de test séparé — au P0 ce repo pointe vers l'unique projet
`hybrideclub` partagé pour les deux environnements Vercel, donc en pratique les valeurs Preview et
Production seront **identiques** ; à ne pas oublier si un projet Supabase de non-prod est introduit
plus tard).

Liste à jour — **corrige `docs/architecture.md` §9**, qui liste les bonnes variables (déjà migrées
vers Resend, contrairement à ce que la tâche laissait supposer) mais sans indiquer la portée
client/serveur ni l'origine. Vérifiée par grep sur `process.env.*` dans `app/` et `lib/` (§ci-dessus) :
aucune variable non documentée, aucune variable documentée mais inutilisée.

| Variable | Portée | Environnements | Source / notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client **et** serveur (préfixe `NEXT_PUBLIC_`) | Preview + Production | Dashboard Supabase du projet `hybrideclub` → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client **et** serveur | Preview + Production | idem, clé `anon` / `publishable` |
| `SUPABASE_SERVICE_ROLE_KEY` | **serveur uniquement** | Preview + Production | idem, clé `service_role` — **secret**, ne jamais exposer côté Preview public si le projet a des visiteurs externes non maîtrisés (ce n'est pas le cas ici, previews protégées par défaut par Vercel) |
| `RESEND_API_KEY` | serveur | Preview + Production | Dashboard Resend, clé API du domaine d'expédition club (ADR-009) |
| `RESEND_FROM` | serveur | Preview + Production | ex. `"Hybride Club Toulon <sorties@hybride-club.fr>"` — nom **et** adresse dans la même valeur (ADR-009 §4), domaine vérifié dans Resend |
| `CRON_SECRET` | serveur | Preview + Production | générée par vous (`openssl rand -hex 32`) ; Vercel l'injecte automatiquement dans l'en-tête `Authorization: Bearer …` de ses propres Cron Jobs dès que la variable s'appelle `CRON_SECRET` — rien à faire côté `vercel.json` pour ça |
| `PROOF_IP_SALT` | serveur | Preview + Production | générée par vous (`openssl rand -hex 32`), sel de hachage des IP de preuve — à ne **jamais** faire tourner sans migration de compatibilité si des preuves existantes doivent rester vérifiables (au P0, base vide, aucun risque) |
| `NEXT_PUBLIC_SITE_URL` | client **et** serveur | Preview + Production | Preview : laisser Vercel fournir `VERCEL_URL` n'est **pas** suffisant ici car cette variable sert à construire des liens dans les e-mails (Resend) — renseigner l'URL de preview réelle ou, plus simple, la valeur de production partout tant que les e-mails de preview ne sont pas un besoin ; en Production : `https://<domaine racine>` une fois la bascule faite (§7), `https://club.<domaine>` en repli |

**Variables absentes, à ne PAS ajouter** : `BREVO_API_KEY`, `BREVO_SENDER_CLUB` — c'était la
checklist d'ADR-006 §1 avant ADR-009 (2026-08-17). Le repo a déjà migré (`.env.local.example`,
`lib/email/provider-resend.ts` existent, aucune trace de Brevo dans le code du club). Rien à faire
ici, c'est un point où le brief de la tâche était en avance d'information sur l'état réel du repo :
la checklist `docs/architecture.md` §9 elle-même liste déjà `RESEND_*`, elle n'était donc pas
obsolète sur ce point précis — seul le tableau de portée client/serveur manquait, ajouté ci-dessus.

**Vérification** : redéployer (ou déclencher un nouveau build) après avoir saisi les variables ;
`next build` échouera bruyamment si une variable `NEXT_PUBLIC_*` manque dans un contexte qui
l'utilise au build (peu probable ici, tout est lu au runtime), et les Server Actions échoueront à
la première requête si `SUPABASE_SERVICE_ROLE_KEY`/`RESEND_API_KEY` manquent — à tester en
Preview avant de promouvoir en Production.

---

## 4. Activer `pg_cron` sur le projet Supabase partagé

**Qui : utilisateur**, dashboard Supabase du projet `hybrideclub` (eu-west-1) — **pas** en SQL
direct pour la première activation.

`pg_cron` exige `shared_preload_libraries`, ce que seul le dashboard peut positionner (un simple
`create extension pg_cron;` en SQL Editor échoue tant que l'extension n'a pas été activée via
`Database → Extensions`, avec redémarrage de l'instance). C'est une **dépendance dure et
sous-documentée** : la migration `20260812093600_club_scheduled_jobs.sql` contient elle-même
`create extension if not exists pg_cron;` (idempotent, pensé pour `supabase db reset` local où
l'extension est disponible nativement) — **si cette migration est poussée en premier sur le cloud
sans avoir activé l'extension via le dashboard, `supabase db push` échoue** sur cette ligne, et la
migration `…093600` reste non appliquée alors que les six précédentes le sont déjà (partiel,
rattrapable, mais à éviter : ADR-001 §2 exige des migrations rétro-compatibles y compris en cas de
livraison non atomique, pas un échec en plein milieu du lot).

**Ordre impératif** :
1. Dashboard Supabase → `Database` → `Extensions` → activer `pg_cron` (et `pg_net` si un besoin
   futur l'exige — non nécessaire au P0, ADR-005 l'écarte explicitement pour le club).
2. **Prévenir côté app** que l'infrastructure partagée change (ADR-001, ADR-005 §1 : « à annoncer
   côté app comme tout changement d'infrastructure commune ») — l'extension activée est visible
   par les deux repos, mais seul le club planifie un job dessus au P0.
3. Seulement ensuite : appliquer les migrations (§5).

**Vérification** : `select * from pg_extension where extname = 'pg_cron';` renvoie une ligne, via
le SQL Editor du dashboard, **avant** de lancer `db push`.

---

## 5. Migrations club — procédure ADR-001 §2 appliquée à ce lancement

**Qui : utilisateur**, depuis le repo `hybrideappli` (ce repo `hybride-page` n'a — volontairement,
ADR-001 §2 — ni `project_id` de prod dans `supabase/config.toml`, ni script `db:push` : il ne peut
techniquement pas exécuter cette étape).

### 5.0 État constaté au moment d'écrire ce document

`scripts/check-migrations-mirror.sh` (créé par cet agent, §9 ci-dessous) exécuté en lecture seule
confirme qu'**aucune des 7 migrations club n'a encore de copie dans
`hybrideappli/supabase/migrations/`** — cohérent avec l'énoncé de la tâche (« rien n'est configuré
côté production »). Les 7 fichiers, dans leur ordre chronologique (= ordre d'application, ADR-001
§1) :

```
20260812093000_club_schema_bootstrap.sql
20260812093100_club_core_tables.sql
20260812093200_club_events_registrations.sql
20260812093300_club_parental_and_consents.sql
20260812093400_club_outbox_and_audit.sql
20260812093500_club_transactional_functions.sql
20260812093600_club_scheduled_jobs.sql
```

Constat complémentaire (lecture seule de `hybrideappli/supabase/migrations/`, aucune écriture) :
l'app a continué sa numérotation séquentielle jusqu'à `0027_placement_refresh_guard_jwt_role.sql`
depuis `0017` (recommandation d'ADR-001 §1 de passer à l'horodatage non suivie côté app — sans
conséquence pour **ce** lancement : `"0027" < "20260812093000"` en comparaison lexicographique,
l'ordre global reste correct). À signaler à l'utilisateur pour la session `hybrideappli`, sans
action de ma part sur ce repo.

### 5.1 Procédure, dans l'ordre

1. `supabase migration list --linked` depuis `hybrideappli/` — observer l'historique **réel**
   distant juste avant de copier (fenêtre de course décrite en ADR-001 §Contexte : ne pas se fier à
   une vérification faite plus tôt dans la journée).
2. Copier les 7 fichiers **à l'octet près, sans renommage**, de
   `hybride-page/supabase/migrations/` vers `hybrideappli/supabase/migrations/`. `cp` simple,
   aucune édition — l'immuabilité (ADR-001 §2) est ce qui rend la duplication sans danger.
3. `./scripts/check-migrations-mirror.sh` (depuis `hybride-page/`) doit désormais afficher
   `7 conformes, 0 à livrer, 0 divergentes` — confirmation locale avant de toucher au cloud.
4. Depuis `hybrideappli/` : `supabase db push --linked --dry-run`. Vérifier que **seules** les 7
   migrations club apparaissent en attente (pas de migration app oubliée, pas de doublon).
5. `supabase db push --linked` (sans `--dry-run`).
6. Commiter les 7 fichiers copiés dans `hybrideappli`, en référençant la PR d'origine côté
   `hybride-page` — **à faire dans la session `hybrideappli`**, hors du périmètre de cet agent.

### 5.2 Risques si l'ordre n'est pas respecté

- **pg_cron non activé avant le push** (§4) : la migration `…093600` échoue, `…093000` à `…093500`
  passent — état intermédiaire récupérable (relancer `db push` après activation), mais à éviter :
  le job `club-expire-parental-holds` doit exister dès que les tables qu'il manipule existent, pas
  après un délai non maîtrisé.
- **Schémas exposés non mis à jour avant qu'un client n'appelle l'API** (§6) : indépendant de
  l'ordre des migrations elles-mêmes (c'est un réglage API, pas du DDL), mais si le déploiement
  Vercel de production part **avant** ce réglage, toute requête club en prod échoue en `PGRST106`
  dès la première visite — expérience utilisateur cassée dès le lancement, pas une dégradation
  silencieuse.
- **Vis-à-vis d'`app_enrolled`** (`public.profiles`, migrations app `0015`-`0017`, déjà livrées
  selon `docs/architecture.md` §5) : ces migrations sont **déjà appliquées côté app**, donc déjà
  dans l'historique distant — `supabase migration list --linked` (étape 5.1.1) doit les montrer
  comme appliquées. Le risque documenté par ADR-001 §Contexte (collision de version entre deux
  fichiers `0015` distincts) ne peut **plus** se matérialiser pour ce triplet précisément parce que
  ces trois migrations sont déjà dans l'historique et que ce repo n'en écrit aucune concurrente —
  mais il resterait réel pour toute **future** migration club numérotée par erreur en séquentiel
  plutôt qu'en horodatage (rappel de convention, ADR-001 §1, jamais un compteur). Le risque concret
  et actuel n'est donc pas une collision de version, mais un **ordre d'application inversé** : si
  les 7 migrations club étaient poussées **avant** `0015`-`0017` (déjà exclu, elles sont déjà
  appliquées) ou si une future migration club référençait `public.profiles.app_enrolled` sans
  vérifier sa présence, elle échouerait sur une colonne absente. Aucune migration club actuelle ne
  touche `public.*` (vérifié : `grep -l "public\." supabase/migrations/*.sql` ne renvoie que des
  références qualifiées à `auth.users`, jamais à `public.profiles`), donc ce risque précis est nul
  pour ce lot — à revérifier à chaque nouvelle migration club future.

### 5.3 Vérification finale

- `supabase migration list --linked` (depuis `hybrideappli/`) montre les 7 versions club marquées
  appliquées, à la suite de `0001`…`0027`.
- Dans le SQL Editor du dashboard Supabase : `select * from club.clubs;` renvoie la ligne Toulon
  (seed applicatif de `…093100`), `select cron.schedule … from cron.job;` (ou `table cron.job;`)
  montre `club-expire-parental-holds` avec `schedule = '*/15 * * * *'`.

---

## 6. Schémas exposés PostgREST — `club`

**Qui : utilisateur**, dashboard Supabase → `Project Settings` → `API` → `Exposed schemas` (ou
`Data API`, selon la version du dashboard) → ajouter `club` à la liste (typiquement `public,
graphql_public` par défaut → `public, graphql_public, club`).

C'est la contrepartie **cloud** de `schemas = ["public", "graphql_public", "club"]` déjà présent
dans `supabase/config.toml` (local uniquement — ce fichier ne régit pas le projet cloud). Sans ce
réglage, **tout** appel PostgREST ou `rpc()` vers `club.*` échoue avec `PGRST106`, une erreur
opaque qui ne mentionne pas le schéma manquant en clair — piège déjà anticipé dans
`docs/architecture.md` §9 point 1 et dans le commentaire du `config.toml` lui-même.

**Ordre par rapport à §5** : peut se faire indifféremment avant ou juste après le push des
migrations (le schéma `club` n'a pas besoin d'exister pour cocher la case), mais doit être fait
**avant tout déploiement Vercel de production accessible publiquement** — sinon la première visite
en prod échoue.

**Vérification** : `curl -s "$SUPABASE_URL/rest/v1/clubs?select=slug" -H "apikey: $ANON_KEY"`
(schéma `club` implicite via le paramétrage global de l'API, pas via un en-tête `Accept-Profile`
puisque `club` n'est pas le schéma par défaut — utiliser `Accept-Profile: club` si la table n'est
pas trouvée dans `public`) renvoie `[{"slug":"toulon"}]` et non une erreur `PGRST106`/`PGRST205`.

---

## 7. Auth : SMTP Brevo (partagé) et URLs de redirection

**Qui : utilisateur**, dashboard Supabase → `Authentication` → `Settings` (SMTP) et `URL
Configuration`.

- Le SMTP Brevo de Supabase Auth (e-mails 6 et 7 de `docs/architecture.md` §7 : création de compte,
  mot de passe oublié) est un réglage **partagé** avec l'app — probablement déjà configuré côté
  app. **Ne pas le reconfigurer à l'aveugle** : vérifier d'abord qu'il est déjà opérationnel
  (dashboard → `Authentication → Emails`, tester un envoi), sinon coordonner avec la session
  `hybrideappli` avant de toucher à un réglage qui affecterait aussi ses utilisateurs.
- `Authentication → URL Configuration → Redirect URLs` : ajouter les URLs du site (`https://<apex
  ou club.<domaine>>/**`) **en plus** des URLs existantes de l'app — ne jamais remplacer la liste,
  seulement l'étendre. Nécessaire pour que les liens de confirmation d'e-mail et de
  réinitialisation de mot de passe émis pour un compte créé depuis le parcours club renvoient vers
  le bon domaine.
- Cette étape doit être refaite (ajout, pas remplacement) **à chaque bascule de domaine** (§8) :
  toute URL de redirection retirée trop tôt casse les liens déjà envoyés et non encore cliqués.

**Vérification** : créer un compte de test depuis le site en Preview, cliquer le lien reçu, vérifier
qu'il redirige vers l'URL Preview attendue sans erreur `otp_expired`/`redirect_url not allowed`.

---

## 8. Bascule de domaine (ADR-007 §3)

Cible finale :

```
example.com            → site (ce repo)        /  et  /club/toulon
www.example.com         → redirection 308 vers l'apex
app.example.com         → app Hybride (repo hybrideappli)
```

**Qui : utilisateur** — décision de calendrier + opérations DNS/Vercel. Ordre pensé pour minimiser
le risque de downtime et de rupture des redirections Auth (`docs/architecture.md` §10 risque n°8,
ADR-007 §3 et §Conséquences) :

1. **Avant tout changement DNS** : déployer le site en production sur son domaine Vercel par défaut
   (`*.vercel.app`) ou sur le domaine de repli `club.<domaine>` (ADR-007 §3, solution documentée si
   le basculement de l'apex s'avère risqué à la date) — valider l'intégralité du parcours (§5, §6,
   §7 déjà faits) sur cette URL stable, **sans toucher au domaine qui sert actuellement l'app**.
2. Si l'apex sert aujourd'hui l'app (à confirmer par l'utilisateur — hors visibilité de cet agent) :
   d'abord **déplacer l'app** vers `app.<domaine>` côté projet Vercel de l'app, et vérifier qu'elle
   répond correctement sur ce nouveau sous-domaine, **avant** de libérer l'apex. Ne jamais avoir un
   instant où l'apex ne pointe vers rien.
3. Ajouter `app.<domaine>` aux URLs de redirection Auth (§7) **avant** de couper l'ancien accès —
   tout lien de confirmation/mot de passe oublié déjà envoyé aux utilisateurs de l'app avec
   l'ancienne URL doit continuer à fonctionner pendant la fenêtre de transition.
4. Attacher l'apex (et `www.` en redirection 308) au projet Vercel du **site**. Propagation DNS :
   prévoir une fenêtre de plusieurs heures avant de considérer la bascule terminée, ne pas
   décommissionner l'ancienne configuration immédiatement.
5. Mettre à jour `NEXT_PUBLIC_SITE_URL` (Production) sur le projet Vercel du site avec l'apex
   définitif, redéployer — cette variable alimente les liens construits dans les e-mails Resend
   (ADR-006/009) : un lien d'autorisation parentale envoyé avec l'ancienne URL resterait valide
   (le token ne dépend pas du domaine) mais afficherait une URL trompeuse tant que la variable n'est
   pas à jour.
6. Ajouter l'apex final aux URLs de redirection Auth (§7, en plus de l'existant), retirer les
   entrées obsolètes seulement après confirmation qu'aucun e-mail en vol ne les référence plus
   (délai de sécurité : au moins la durée de vie du plus long lien émis — mot de passe oublié
   inclus, généralement 24 h côté Supabase Auth par défaut).
7. **Décision de calendrier explicite à trancher par l'utilisateur avant la rentrée** (contrainte
   ferme du PRD) : date de la bascule DNS finale, avec repli documenté (`club.<domaine>`) si un
   empêchement survient à J-1. Ne pas improviser cette date la veille du lancement.

**Vérification à chaque sous-étape** : `curl -I https://<domaine testé>` renvoie les en-têtes
Vercel attendus (`x-vercel-id`) et le bon statut ; parcours Sofia/Léa/mineur (E2E décrits en
`docs/architecture.md` §8) rejoués manuellement sur le domaine final avant de considérer la bascule
close.

---

## 9. Migrations — outillage local livré avec ce document

**Fait par cet agent** : `scripts/check-migrations-mirror.sh`, exécutable, compare par somme de
contrôle (`shasum -a 256`) les migrations club de ce repo à leurs copies dans
`hybrideappli/supabase/migrations/`. Usage :

```bash
./scripts/check-migrations-mirror.sh [chemin-optionnel-vers-hybrideappli]
```

Sortie actuelle (vérifiée en écrivant ce document, lecture seule) : `7 à livrer` — confirme qu'aucune
migration club n'est encore côté app, cohérent avec l'état de départ décrit dans la tâche. C'est un
outil de poste de travail (ADR-001 §2), pas une CI : l'autre repo n'est pas accessible depuis un
runner GitHub Actions.

---

## 10. Alertes minimales

Aucune des deux alertes ci-dessous n'a d'implémentation applicative dans ce repo à ce jour (pas de
webhook Slack, pas de fonction de supervision) ; ADR-005 §Conséquences le signale déjà comme
« à mettre en place ». Recommandation dimensionnée pour un lancement à court terme, sans sur-ingénierie :

### 10.1 E-mails `failed` après 5 tentatives (`club.email_log`)

- **Minimum viable** (aucun développement) : requête SQL sauvegardée dans le dashboard Supabase
  (`SQL Editor → Saved queries`), à consulter manuellement chaque semaine :
  ```sql
  select id, email_type, related_type, related_id, attempts, last_error, created_at
    from club.email_log
   where status = 'failed'
   order by created_at desc;
  ```
- **Cible, si le temps le permet avant la rentrée** : Supabase propose des *Database Webhooks* — un
  webhook sur `update` de `club.email_log` filtré `status = 'failed'` peut appeler une route (à
  écrire côté `developer`, hors périmètre de cet agent) qui notifie par e-mail/Slack. Alternative
  sans code : brancher un outil de monitoring externe (ex. un cron tiers) sur une requête
  PostgREST filtrée `status=eq.failed` et une alerte de seuil. Non implémenté ici — décision produit
  à prendre sur le canal de notification (e-mail ? Slack ?) avant de coder quoi que ce soit.

### 10.2 Échec du job `pg_cron`

- **Minimum viable** : requête sauvegardée, même logique :
  ```sql
  select jobid, status, return_message, start_time
    from cron.job_run_details
   where jobname = 'club-expire-parental-holds'
     and status <> 'succeeded'
   order by start_time desc
   limit 20;
  ```
  À consulter en même temps que §10.1, hebdomadaire au minimum, quotidien recommandé la première
  semaine post-lancement (fenêtre où une régression de migration ou de privilège se révèle).
- Un job qui échoue silencieusement **bloque des places sur une sortie** sans qu'aucun utilisateur
  ne remonte l'erreur (le symptôme est une liste d'attente qui ne se vide pas) — c'est le risque le
  plus coûteux en silence de toute l'infra club, à surveiller en priorité sur les deux premières
  semaines.

**Non fait délibérément** : automatiser ces deux alertes en code applicatif n'est pas dans le
périmètre « configuration sans risque sur service tiers » de cette session — cela demande un choix
de canal de notification (produit) et un nouvel endpoint/webhook (développeur), tous deux hors
mandat `devops` pour cette passe.

---

## Historique

- 2026-08-17 — Création par `devops`. Détaille `docs/architecture.md` §9. Ajoute `vercel.json`,
  `.github/workflows/ci.yml`, `scripts/check-migrations-mirror.sh`. Aucune action réelle sur
  Vercel/Supabase/DNS ; aucune modification du repo `hybrideappli`.
