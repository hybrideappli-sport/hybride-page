# ADR-002 — Schéma `club` séparé de `public`, registre de consentement dupliqué

- **Statut** : Accepté
- **Date** : 2026-08-12
- **Décideur** : `architect`
- **Portée** : Projet — schéma / conformité
- **Dépend de** : ADR-001
- **Formalise** : décision structurelle 4 du brief (validée par l'utilisateur, non réouverte ici)

---

## Contexte

Deux entités juridiques distinctes partagent une même base :

- l'**association loi 1901** (Hybride Club Toulon), responsable du traitement des inscriptions aux sorties ;
- l'**entité commerciale** (app Hybride), responsable du traitement des données d'entraînement et de santé.

Elles partagent l'infrastructure d'authentification (`auth.users`, décision 3 du brief) mais **pas** les finalités de traitement. Le RGPD ne raisonne pas en termes de contrôle d'accès : deux responsables de traitement distincts doivent pouvoir répondre séparément à une demande d'accès, d'export ou d'effacement, et démontrer séparément la base légale de leurs traitements.

Un cas concret : une personne inscrite à une sortie du club, qui n'a jamais utilisé l'app, demande l'effacement de ses données à l'association. L'association doit pouvoir purger son registre sans toucher au registre de l'entité commerciale — et sans avoir à démontrer qu'une policy RLS l'en empêchait.

## Décision

### 1. Un schéma `club`, additif, distinct de `public`

Toutes les données métier et de conformité du club vivent dans le schéma `club`. Aucun objet existant du schéma `public` n'est modifié par ce repo (ADR-001 §4). Il n'existe **pas** de schéma `app` symétrique : les données de l'app sont déjà dans `public`, les déplacer serait une migration coûteuse sans bénéfice.

Le schéma est la frontière de responsabilité, et il est lisible :

- `select * from club.*` = périmètre de l'association ;
- un export ou une purge s'expriment par une liste de tables d'un seul schéma, pas par une liste de conditions ;
- un `grant`/`revoke` au niveau schéma reste possible si une séparation d'accès plus dure devient nécessaire.

`club` est exposé à PostgREST au même titre que `public` (paramètre « Exposed schemas » de l'API, `[api] schemas` en local), et les clients l'adressent explicitement : `supabase.schema('club')`.

### 2. `club.member_profiles` ne réutilise pas `public.athlete_profiles`

Le club a besoin d'un prénom, d'un nom et d'une **date de naissance**. L'app possède déjà une date de naissance dans `athlete_profiles`, mais elle est collectée sous le **consentement au traitement de données de santé** (art. 9 RGPD, ADR-010 de l'app), pour une finalité de planification d'entraînement.

La lire pour décider si un inscrit est mineur serait un **détournement de finalité** : la donnée aurait été obtenue sous une base légale qui ne couvre pas cet usage, et par un responsable de traitement qui n'est pas celui qui l'exploite. `club.member_profiles.birth_date` est donc collectée de nouveau, sous le consentement du club, et le code du site ne lit **jamais** `public.athlete_profiles`.

Le coût — une saisie redondante pour une personne qui a déjà un compte app — est assumé : c'est la contrepartie directe de la séparation des responsables de traitement.

### 3. `club.consent_documents` / `club.consents` sont des jumelles, pas des réutilisations

La structure reprend celle de l'app (document versionné + registre de preuve append-only, FK composite `(code, version, locale)`, écriture réservée au serveur, trigger d'immuabilité). Les **objets** sont distincts.

Justification, une seule ligne, et elle est décisive : **RLS est un contrôle d'accès, pas une séparation de responsable de traitement.** Un registre unique filtré par policy resterait un registre unique — même table, même politique de conservation, même périmètre d'un export, même surface d'une erreur de policy. Un auditeur qui demande « montrez-moi le registre de consentement de l'association » doit recevoir le contenu d'une table, pas le résultat d'une requête filtrée.

Trois documents sont prévus au P0 :

| Code | Objet | Signataire |
|---|---|---|
| `club_data_processing` | traitement des données d'inscription par l'association | l'inscrit (≥ 15 ans) |
| `club_minor_data_processing` | idem, au nom du mineur | le représentant légal (< 15 ans) |
| `club_parental_sport_authorization` | autorisation de pratique sportive | le représentant légal (< 18 ans) |

Le troisième n'est pas un consentement RGPD : c'est un document contractuel dont on veut néanmoins la preuve versionnée. Il est stocké dans `club.consent_documents` et référencé par `club.parental_authorizations` via la même FK composite — ainsi une autorisation prouve *quel texte exact* le parent a approuvé, et une révision du texte ne réécrit pas le passé.

### 4. Aucune donnée club n'alimente une finalité de l'app

Trois mesures cumulatives, une par niveau :

- **base** : `app_enrolled = false` sur les comptes créés depuis le parcours club, et filtrage obligatoire des jobs applicatifs (ADR-001 §4) ;
- **code** : ce repo n'écrit dans `public` que la ligne `profiles` strictement nécessaire à l'authentification, et ne lit aucune table de l'app ;
- **texte** : la politique de confidentialité de l'association l'énonce explicitement (US-07 AC3), et les pages légales sont séparées par entité (US-07).

L'inverse — un compte d'origine app qui s'inscrit à une sortie — passe par la création d'un `club.member_profiles` et le recueil du consentement club : la finalité club n'est jamais présumée depuis l'app non plus.

## Conséquences

**Positives**

- Export et purge du registre de l'association s'expriment par un périmètre de schéma, vérifiable à l'œil.
- Le site ne peut pas causer de régression sur les tables de l'app : il n'a aucun objet en commun avec elles hors `auth.users`.
- La duplication du registre de consentement rend chaque politique de conservation indépendante (3 ans côté club pour les données d'inscription, sous réserve de la validation juridique en cours ; conservation propre au registre de preuve).
- Le multi-tenant (`club_id` partout) est porté par le même schéma : accueillir un second club ne demandera aucune migration structurelle.

**Négatives / à surveiller**

- Prénom, nom et date de naissance sont saisis deux fois pour une personne présente des deux côtés. Non réconciliable sans consentement dédié — c'est le comportement voulu, mais il sera perçu comme un défaut par l'utilisateur et doit être expliqué dans l'interface.
- Deux jeux de textes de consentement à maintenir et à faire valider juridiquement.
- Le schéma `club` doit être ajouté aux schémas exposés de l'API Supabase : un oubli produit un `PGRST106` opaque. À intégrer à la checklist `devops`.
- `auth.users` reste le point de couplage : sa suppression en cascade détruit `club.member_profiles`. Les `club.consents` en sont volontairement découplées (pas de FK), pour survivre à l'effacement du compte comme preuve pseudonyme — même construction que l'app.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| Tables club dans `public` avec un préfixe `club_` | Le préfixe est une convention, pas une frontière : rien ne distingue un export « du club » d'un export « de l'app » autrement que par une liste de noms à tenir à jour. |
| Registre de consentement unique, discriminé par une colonne `entity` et une policy RLS | Confond contrôle d'accès et responsabilité de traitement. Une purge côté association devient un `delete ... where entity = 'club'` sur une table dont l'autre entité est co-responsable. |
| Réutiliser `public.athlete_profiles.birth_date` | Détournement de finalité : donnée de santé collectée par un autre responsable, sous un autre consentement. |
| Schéma `app` symétrique, par souci d'esthétique | Migration lourde des 34 tables de l'app pour un gain nul : `public` est déjà, de fait, le schéma de l'app. |
