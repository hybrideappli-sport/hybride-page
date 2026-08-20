# US-03 — Compte utilisateur

> Fiche fonctionnalité SDD. Lecture seule pour tous les autres agents.
>
> Branche : `feature/US-03-compte-utilisateur`
> Statut : ⏳ Specify — **retiré du site le 2026-08-19, voir ADR-010**. Plus aucun compte sur le site : l'inscription passe par Luma, l'adhésion et les achats par HelloAsso. Pages, middleware et actions serveur supprimés (pas seulement dormants, contrairement au schéma `club`) — cette fiche reste comme trace de la conception initiale.

---

## 1. Contexte

Le compte est désormais obligatoire avant toute inscription à une sortie (décision 5 du brief) — l'ancien mécanisme d'inscription invitée avec lien d'annulation par e-mail est abandonné. Le compte est partagé avec l'app Hybride via `auth.users` commune (décision 3) : une personne qui a déjà un compte app peut se connecter directement sur le site club, et inversement. Cette US porte la création de compte, la connexion (unifiée public + admin, redirection selon rôle) et la récupération de mot de passe.

---

## 2. User story

> **En tant que** visiteur souhaitant m'inscrire à une sortie ou administrer un club
> **Je veux** créer un compte ou me connecter avec mes identifiants Hybride existants
> **Afin de** accéder au parcours d'inscription ou au dashboard admin selon mon rôle

---

## 3. Critères d'acceptation (Given-When-Then)

### AC1 — Création de compte

```
GIVEN un visiteur sans compte souhaite s'inscrire à une sortie
WHEN  il crée un compte (email, mot de passe, prénom, nom, date de naissance) via signUp() avec raw_user_meta_data = { origin: 'club' }
THEN  une ligne auth.users est créée
AND   une ligne public.profiles est créée automatiquement par le trigger handle_new_user() de l'app, avec app_enrolled = false dérivé de raw_user_meta_data.origin (le site n'écrit jamais directement dans public.profiles)
AND   une ligne club.member_profiles est créée (prénom, nom, date de naissance)
```

### AC2 — Connexion avec un compte existant, y compris un compte app

```
GIVEN une personne possède déjà un compte Hybride (créé via l'app ou via le club)
WHEN  elle se connecte sur le site avec ses identifiants
THEN  elle accède à son espace sans avoir à recréer de compte
```

### AC3 — Mot de passe oublié

```
GIVEN une personne ne se souvient plus de son mot de passe
WHEN  elle déclenche "mot de passe oublié" avec son email
THEN  elle reçoit un e-mail de réinitialisation (voir liste des e-mails transactionnels du brief)
```

### AC4 — Retour au parcours en cours après connexion/création

```
GIVEN un visiteur a été redirigé vers la connexion/création de compte depuis une page de détail de sortie
WHEN  il termine la connexion ou la création de compte
THEN  il est ramené automatiquement sur le formulaire d'inscription de cette sortie, sans perdre le contexte
```

### AC5 — Pas de fuite vers les automatismes de l'app

```
GIVEN un compte est créé depuis le parcours club (signUp() avec raw_user_meta_data = { origin: 'club' })
WHEN  le trigger handle_new_user() de l'app crée la ligne public.profiles
THEN  app_enrolled vaut false, dérivé de raw_user_meta_data.origin dans la même transaction que la création de la ligne
AND   les jobs applicatifs de l'app (ex. enqueueWeeklyReviews) filtrant sur app_enrolled = true excluent ce compte
```

### AC6 — Connexion unifiée avec redirection par rôle

```
GIVEN un compte possède un rôle club_admin (club.admin_roles) pour un club donné
WHEN  ce compte se connecte
THEN  il est redirigé vers le dashboard admin de ce club (US-06)
AND   un compte sans rôle admin est redirigé vers le parcours en cours ou son espace membre
```

---

## 4. Périmètre

### ✅ Inclus

- Écrans création de compte, connexion, mot de passe oublié.
- Insertion `club.member_profiles` (prénom, nom, date de naissance) à la création depuis le parcours club.
- Appel `signUp()` avec `raw_user_meta_data = { origin: 'club' }` — c'est l'unique geste du site côté `app_enrolled` ; la colonne elle-même et sa dérivation sont livrées côté app (migrations `0015`-`0017`, voir brief).
- Redirection contextuelle après authentification (retour au parcours en cours, ou vers le dashboard admin selon rôle).

### ❌ Exclu (hors scope de cette US)

- Connexion via fournisseurs tiers (Google, etc.).
- Gestion complète du profil au-delà des champs nécessaires à l'inscription (espace membre enrichi — P1).
- Toute écriture directe sur `public.profiles` — le site ne fait jamais d'INSERT/UPDATE sur cette table, `handle_new_user()` (app) s'en charge entièrement.

---

## 5. Dépendances et contraintes

- **Tables BDD concernées** : `auth.users` (Supabase Auth, écrit via `signUp()` avec `raw_user_meta_data`), `public.profiles` (lecture seule côté site — jamais d'écriture directe, `app_enrolled` livré et dérivé côté app), `club.member_profiles`, `club.admin_roles` (lecture, pour la redirection).
- **Endpoints existants utilisés** : Supabase Auth (signup/login/reset password).
- **Intégrations tierces** : prestataire d'e-mail transactionnel (création de compte, mot de passe oublié).
- **Dépend d'autres US** : aucune.
- **Bloque d'autres US** : US-04 (inscription nécessite un compte), US-06 (accès admin nécessite un rôle).

---

## 6. Notes UX/UI (si applicable)

Le parcours doit rester le plus court possible pour Léa (pas de rupture depuis le formulaire d'inscription). Mobile-first.

Maquettes : à produire par `designer` (document texte, canvas Pencil non retouché sauf instruction explicite).

---

## 7. Questions ouvertes

Aucune — `app_enrolled` livré côté app le 2026-08-12 (migrations `0015`-`0017`), le site n'a plus qu'à passer `raw_user_meta_data = { origin: 'club' }` à son propre `signUp()`.

---

## 8. Prochaine étape

→ Invoquer `designer` pour le zoning détaillé.

---

## Historique

- 2026-08-12 — Création. Nouvelle US, absente du périmètre "site club autonome" (qui reposait sur une inscription invitée sans compte).
- 2026-08-12 — AC1/AC5 et dépendances corrigées : `app_enrolled` n'est pas inséré par le site (aucune écriture directe sur `public.profiles`) mais dérivé côté app par `handle_new_user()` depuis `raw_user_meta_data.origin`, passé par le site au `signUp()`. Livré côté app (migrations `0015`-`0017`).
