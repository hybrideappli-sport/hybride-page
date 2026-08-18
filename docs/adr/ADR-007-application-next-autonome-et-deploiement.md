# ADR-007 — Application Next.js autonome, hors du monorepo de l'app, et modèle de session

- **Statut** : Accepté
- **Date** : 2026-08-12
- **Décideur** : `architect`
- **Portée** : Projet — structure / déploiement
- **Dépend de** : ADR-001, ADR-002
- **Feature déclenchante** : toutes (structure du repo)

---

## Contexte

L'app Hybride est un monorepo pnpm + Turborepo (`apps/web`, `packages/domain`, `rules-engine`, `coach-llm`, `db`), déployé sur Vercel. Le site pourrait y être ajouté comme un second `apps/site` : il partagerait les types Supabase générés, la configuration Tailwind, les composants d'interface et l'authentification.

Le brief a tranché autrement (« un seul projet Next.js, un seul repo, un seul projet Vercel » — désignant *ce* site, distinct du repo de l'app), et le repo existe déjà. Cette ADR formalise ce choix, en explicite le coût, et tranche les deux questions qu'il laisse ouvertes : le domaine et le partage de session.

## Décision

### 1. Application Next.js unique, sans workspace

```
hybride-page/
├─ app/                      # App Router — routes publiques, club, membre, admin, api
├─ components/               # ui/ (shadcn), club/, admin/, marketing/
├─ lib/
│  ├─ supabase/              # client navigateur, client serveur, client admin, middleware
│  ├─ actions/               # Server Actions (une par geste métier)
│  ├─ email/                 # provider Resend, gabarits, dispatcher
│  ├─ validation/            # schémas Zod — source unique des contrats d'entrée
│  └─ types/database.ts      # types générés (schémas public + club)
├─ supabase/
│  ├─ migrations/            # répertoire d'AUTEUR (ADR-001)
│  ├─ local-baseline/        # dump généré du schéma public de l'app, local uniquement
│  ├─ seed.sql               # données de développement
│  └─ config.toml
├─ docs/                     # PRD, architecture, contrats d'API, adr/
├─ tests/                    # Vitest — unitaires et intégration base
└─ e2e/                      # Playwright
```

Pas de `packages/`, pas de Turborepo : le site n'a rien à isoler. L'ADR-003 du repo de l'app justifiait le monorepo par la nécessité de rendre l'impureté du moteur à règles **impossible**, pas seulement déconseillée. Ce site n'a pas de moteur ; y importer l'outillage reviendrait à payer une garantie sans avoir la propriété à garantir.

**Le partage de code avec l'app est explicitement écarté au P0.** Les types Supabase sont générés séparément (`supabase gen types --schema public --schema club`) ; les composants d'interface sont réécrits. La duplication porte sur un scaffold Tailwind minimal, sans charte graphique — c'est-à-dire sur presque rien. Un `packages/ui` partagé imposerait en revanche un couplage de version entre deux produits livrés à des rythmes différents, à trois semaines d'un lancement daté.

### 2. Stack

| Couche | Choix | Note |
|---|---|---|
| Framework | **Next.js 16, App Router**, React 19, TypeScript strict | rendu serveur par défaut ; `after()` pour l'envoi d'e-mail post-réponse |
| Style | **Tailwind CSS + shadcn/ui** | pas de charte définitive (brief) : composants neutres, jetons à poser en P1 |
| Données | **Supabase** — `@supabase/supabase-js` + **`@supabase/ssr`** | `auth-helpers-nextjs` est déprécié et ne doit pas être introduit |
| Validation | **Zod** | schémas partagés entre Server Actions et formulaires |
| E-mail | **Resend** (ADR-006, ADR-009) | comptes/mot de passe restent sur Brevo, SMTP Supabase Auth partagé avec l'app |
| Tests | **Vitest** (unitaires + intégration sur Supabase local) + **Playwright** (E2E) | |
| Hébergement | **Vercel**, projet distinct de celui de l'app | même compte/équipe |

Aucune bibliothèque de gestion d'état côté client : les lectures sont faites en Server Components, les mutations par Server Actions suivies de `revalidatePath`. Le seul état client réel du P0 est celui des formulaires.

**Pas de client Supabase dans un composant client pour les données du club.** Toutes les lectures `club.*` passent par les Server Components ou par des fonctions RPC ; cela garde l'agenda cacheable et évite d'exposer la structure du schéma dans le bundle.

### 3. Domaine : le site prend le domaine racine

Le site est la vitrine : c'est lui qui doit répondre sur le domaine principal, avec l'app sur un sous-domaine applicatif.

```
example.com            → site (ce repo)        /  et  /club/toulon
www.example.com        → redirection 308 vers l'apex
app.example.com        → app Hybride (repo hybrideappli)
```

Si le domaine racine sert aujourd'hui l'app, le basculement est une opération `devops` à planifier avant le lancement (redirections des URLs existantes, mise à jour des liens de redirection Supabase Auth, des URLs de retour Stripe et des liens sortants). **Aucun nouveau domaine n'est réservé**, conformément au brief. Si le basculement s'avère risqué à la date, la solution de repli est `club.example.com` pour le site — dégradée du point de vue SEO et de la cohérence de marque, donc à décider tôt, pas la veille.

### 4. Sessions distinctes par hôte au P0

Supabase Auth pose ses cookies sur l'hôte courant. Site et app partagent les **identifiants** (`auth.users` commune) mais pas la **session** : une personne connectée sur l'app devra se connecter sur le site.

Le partage est techniquement accessible (`cookieOptions.domain = '.example.com'` des deux côtés), mais il exige une configuration identique et coordonnée sur les deux produits, et il fait d'une déconnexion, d'une rotation de clé ou d'un changement de nom de cookie un incident à deux têtes. Le bénéfice est faible au P0 : les parcours ne se croisent pas (personne n'arrive sur le site depuis l'app, l'app n'étant pas encore téléchargeable — US-01 AC3).

**Décision : sessions distinctes au P0**, partage porté en P1 avec l'ouverture réelle de l'app. À énoncer dans l'interface (« utilise tes identifiants Hybride ») pour que la reconnexion ne soit pas vécue comme une anomalie.

### 5. Conventions de code

- **Identifiants en anglais, contenu en français.** Les segments d'URL sont en français pour le référencement et la lisibilité (`/club/toulon`, `/mes-inscriptions`, `/autorisation-parentale/[token]`) ; les noms de fichiers, de composants, de fonctions et de colonnes sont en anglais.
- **Composants** en `PascalCase`, un composant par fichier ; **fichiers non-composants** en `kebab-case`.
- **Server Actions** dans `lib/actions/<domaine>.ts`, `'use server'` en tête de fichier, une action par geste métier, entrée validée par Zod **en première instruction**, retour discriminé `{ ok: true, data } | { ok: false, error }` — jamais d'exception comme canal de contrôle vers l'interface.
- **`'use client'` le plus bas possible** dans l'arbre : un formulaire, pas une page.
- **Aucune clé `service_role` hors de `lib/supabase/admin.ts`**, importable uniquement depuis du code serveur, avec un garde d'exécution.
- **Aucune requête `.from('registrations')` en écriture** : les mutations passent par `rpc()` (ADR-004).
- Commits **Conventional Commits**, branches `feature/US-XX-slug`, PR vers `develop`.
- ESLint + Prettier + `tsc --noEmit` en CI ; `pnpm` comme gestionnaire de paquets, par cohérence avec l'app.

## Conséquences

**Positives**

- Le site se lit et se déploie en une commande, sans connaissance du monorepo de l'app — atout réel pour un projet à échéance courte, piloté par une seule personne sur deux fronts.
- Aucune régression possible sur l'app depuis ce repo : les deux ne partagent que la base et le domaine racine.
- Le cycle de livraison du site n'est pas soumis à la CI du monorepo.
- La structure reste ouverte à une fusion ultérieure : une application Next.js sans workspace se déplace dans `apps/site` sans réécriture.

**Négatives / à surveiller**

- Duplication de la configuration (Tailwind, ESLint, génération de types, client Supabase). Faible en volume, réelle en entretien.
- Deux jeux de types Supabase générés à partir de la même base : une divergence est possible si l'un des deux n'est pas régénéré après une migration. À intégrer à la procédure d'ADR-001 §2.
- La reconnexion entre app et site sera perçue comme une friction dès l'ouverture de l'app (P1).
- Le basculement du domaine racine est une opération à risque, à planifier avant la rentrée et non pendant.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| `apps/site` dans le monorepo de l'app | Contredit la décision du brief et le repo existant. Ferait de la CI du monorepo un point de passage du site, et d'un `packages/ui` partagé un couplage de version entre deux produits aux rythmes différents. |
| Site statique (Astro, Next `output: export`) + Supabase côté client | La vitrine est statique, mais l'inscription, la validation parentale et l'admin exigent du code serveur (secrets, `service_role`, streaming CSV, `after()`). Deux technologies pour un seul produit. |
| Sessions partagées entre app et site dès le P0 | Coordination de configuration sur deux repos pour un parcours croisé qui n'existe pas encore (l'app n'est pas téléchargeable). Coût immédiat, bénéfice différé. |
| Nouveau domaine dédié au club | Explicitement écarté par le brief, et diluerait la marque unique que la fusion des deux projets vise à construire. |
