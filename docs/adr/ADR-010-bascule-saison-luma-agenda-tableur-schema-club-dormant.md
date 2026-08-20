# ADR-010 — Bascule de saison : inscriptions Luma, agenda en tableur public, schéma `club` dormant

- **Statut** : Accepté
- **Date** : 2026-08-19
- **Décideur** : Esteban (produit), analysé en session par `claude`
- **Portée** : Projet — architecture d'exploitation, pour la saison en cours
- **Dépend de** / **Amende** : ADR-002 (renforcée, pas remise en cause), ADR-003, ADR-005, ADR-006, ADR-009 (les quatre passent en dormance — voir §Amendements)
- **Feature déclenchante** : aucune US nouvelle — retrait temporaire de US-04 (inscription), US-05 (autorisation parentale en ligne), US-06 (dashboard admin) de l'usage réel, sans les supprimer du code

---

## Contexte

Le coût réel de la voie « maison » ne s'est révélé qu'à l'usage, pas au design : le projet Supabase gratuit se met en veille après une semaine d'inactivité, et Vercel Hobby limite les cron jobs à une exécution quotidienne (incident traité en session le 2026-08-18, ADR-006 amendement du même jour). Faire tourner l'inscription maison de façon fiable exige donc Supabase Pro (~25$/mois) **et** Vercel Pro (~20$/mois), soit ~45$/mois — pour une trentaine d'adhérents et deux sorties par semaine, cette dépense récurrente ne se justifie pas cette saison.

Le problème n'est pas que le coût, c'est la fiabilité : un site qui répond le samedi et affiche une erreur le lundi (le temps que le projet se réveille) est pire que l'absence de site. Le club a par ailleurs déjà utilisé Luma à ses débuts — outil validé côté usage, la question traitée ici est uniquement architecturale.

## Décision

### 1. Répartition des outils cette saison

- **Luma** : inscription aux sorties — capacité plafonnée, liste d'attente, rappels. C'est exactement ce que `club.registrations` + le verrou d'ADR-003 reproduisaient ; à l'échelle actuelle, utiliser l'outil plutôt que le réimplémenter.
- **HelloAsso** : cotisation et boutique merch — inchangé, c'est là qu'il y a un flux financier réel.
- **Le site** : vitrine, présentation du club, agenda en lecture, liens sortants vers Luma et HelloAsso. Aucune inscription, aucun paiement, aucun compte requis pour participer à une sortie.

### 2. Origine de l'agenda : tableur public, pas Supabase

Deux sources de contenu, séparées parce qu'elles ne changent pas au même rythme :

- **Disciplines et formats** (5 valeurs fermées, colorées, filtrables — course/vélo/eau/montagne/collectif) : un fichier typé dans le repo, comme aujourd'hui (`components/ui/Tag.tsx`). Change rarement, bénéficie du typage TypeScript.
- **Calendrier des sorties** (titre, disciplines, date, heure, lieu, date d'ouverture des inscriptions, URL Luma) : un **tableur Google publié sur le web** (export CSV public, pas l'API Sheets — donc pas de clé, pas de quota, gratuit sans ambiguïté), lu **côté serveur** avec le cache de données Next.js (`revalidate`), sans aucun cron Vercel. Change chaque mois par lots, et se corrige à la dernière minute depuis un téléphone — c'est le cas d'usage réel qui a fait pencher la balance vers le tableur plutôt qu'un fichier de données versionné.

**Sens du flux, précisé en session** : le site est écrit **en premier** (titre, disciplines, date, ouverture), l'événement Luma est créé **ensuite**, l'URL est collée après coup. Il n'y a donc pas de synchronisation depuis Luma vers le site (un flux iCal envisagé un temps a été écarté, faute d'objet) : le tableur est la source d'autorité, Luma n'est qu'un champ qui se remplit plus tard.

**Repli explicite** en cas d'échec de lecture du tableur : la dernière version connue en cache est servie, jamais une page cassée. Même logique que celle déjà retenue pour un flux Luma qui aurait pu être indisponible.

### 3. Ouverture différée des inscriptions

Chaque sortie porte deux dates : `starts_at` (la sortie) et `opens_at` (l'ouverture des inscriptions).

- **Avant `opens_at`** : la carte affiche un compte à rebours, **calculé côté client** — une page mise en cache ne doit jamais figer un décompte. Pattern hydratation-safe : état neutre tant que le composant n'est pas monté (même logique que `PhotoSlot.tsx`, qui initialise déjà son état d'animation en fonction d'une condition non déterministe au rendu serveur), calcul réel après montage, tick à la minute (pas besoin de la seconde près).
- **Après `opens_at`, URL Luma toujours vide** : cas réel à distinguer du précédent — pas un lien mort, pas un silence qui ressemble à un bug, mais un état neutre dédié (« Inscriptions bientôt disponibles »), jamais un décompte à zéro ou négatif. C'est un signal opérationnel pour l'exploitant (Luma pas encore créé à temps), pas quelque chose que le code peut résoudre au-delà d'éviter que ça ait l'air cassé.
- **Avant `opens_at`, URL vide** : non pertinent, le bouton ne s'affiche de toute façon pas encore.

### 4. Autorisation parentale : papier, hors ligne, cette saison

Luma ne gère pas l'autorisation parentale. Décision : collecte **papier, hors ligne**, pour les sorties routées vers Luma.

Ce n'est pas une réutilisation de `club.parental_authorizations` — cette table est bâtie autour du flux en ligne (jeton unique, `hold_expires_at`, verrou de place) et ne convient pas à un processus papier. C'est une **nouvelle surface de conformité**, non conçue à ce jour : qui collecte le formulaire, où il est conservé, qui peut y accéder, combien de temps. Rien n'est écrit sur ce point — à documenter séparément avant la première sortie concernée, pas après.

Rigueur assumée : le régime papier est **moins protecteur** que le flux en ligne construit (jeton, hold 48h, double consentement RGPD pour les moins de 15 ans) — à énoncer comme un choix de saison, pas comme un équivalent neutre.

### 5. Confidentialité du tableur — il est réellement public

« Publié sur le web » signifie une URL CSV accessible à quiconque la devine ou la trouve — pas seulement lisible par le code du site. Règle, pour ce tableur et toute colonne qui y serait ajoutée plus tard : **aucune donnée personnelle, aucune note interne, aucun numéro d'encadrant.** Seul du contenu déjà destiné à être public (titre, disciplines, date, lieu, ouverture, URL Luma) y a sa place. Une colonne « notes internes » ou « contact encadrant » ajoutée par commodité six mois plus tard romprait cette règle silencieusement — à vérifier à chaque ajout de colonne, pas seulement au moment de la création du tableur.

### 6. Ce qui remplace le compteur « places restantes »

Sans données de capacité (Luma les porte, pas le site), le compteur mono `18/25` disparaît des cartes et lignes d'agenda — élément structurant de la référence visuelle et du composant `OutingRow` actuel.

**Décision : la durée (« 1h30 ») comme champ universel, distance/dénivelé en enrichissement optionnel.** Pas l'inverse. Distance et dénivelé sont naturels pour course à pied, vélo, montagne — mais l'eau s'y prête moins bien et le collectif (volley) n'a ni l'un ni l'autre. Faire de distance/dénivelé LE remplacement recréerait, sur l'élément le plus visible de chaque carte, exactement le trou qu'on a corrigé en donnant au collectif une place de discipline à part entière plutôt qu'un oubli. La durée, elle, a toujours une valeur, quelle que soit la discipline. Affichage : durée seule par défaut (« 1h30 »), enrichie quand pertinent (« 1h30 · 62 km · 850 m D+ ») — même traitement typographique mono que l'ancien compteur, le même langage visuel, une donnée différente.

### 7. Les comptes côté adhérent — correction du cadrage

La demande initiale parlait de « deux comptes à expliquer ». En creusant les conséquences de cette bascule : il n'y en a pas deux à expliquer sur le site, il y en a **zéro qui reste utile côté site**. Un compte hybride-page ne servait qu'à s'inscrire à une sortie (US-04) ou à administrer le club (US-06) — les deux passent ailleurs. Les deux comptes réels sont externes : **Luma** (inscription) et **HelloAsso** (cotisation, achat). La page club ne devrait donc pas inviter à « créer un compte » — elle doit orienter directement vers Luma pour s'inscrire et vers HelloAsso pour adhérer/acheter, sans étape de compte intermédiaire. Les pages de compte du site (`/creation-compte`, `/connexion`, etc.) ne sont pas supprimées — elles suivent le même traitement que le schéma `club` : dormantes, prêtes, simplement plus mises en avant dans la navigation ni le contenu.

### 8. Schéma `club` dormant, migrations non poussées

Sous ce modèle, aucune des 7 migrations `club` ne sert plus rien cette saison : comptes (§7), capacité verrouillée (Luma), autorisation parentale en ligne (§4), outbox e-mail (rien n'est jamais enfilé sans inscription maison) — chacune perd son objet, pas sa validité.

Décision : les 7 migrations restent **dans le repo, non poussées** vers le projet Supabase partagé. Aucune dégradation à attendre en les laissant ainsi — elles sont figées, immuables, aussi faciles à appliquer dans six mois qu'aujourd'hui (vérifié en session : `supabase db reset` local passe sans erreur sur l'état actuel). Les pousser maintenant coûterait exactement le prix que cette bascule cherche à éviter, pour aucun bénéfice.

Le dashboard admin (`/admin/*`) ne perd rien qu'il n'avait pas déjà : les migrations n'ayant jamais été appliquées en production, ces routes n'ont jamais fonctionné qu'en local. Rien à démanteler.

### 9. Renoncement, cette saison, au multi-tenant côté inscriptions

Le modèle `club_id` porté par toutes les tables (décision structurelle du brief, dès la première migration) reste valable en base — mais Luma n'en a aucune conscience. Un futur second point club aura son propre calendrier Luma, entièrement découplé du `club_id` du site. Ce n'est pas une régression du modèle de données, qui reste multi-tenant par construction : c'est un renoncement propre à la couche Luma, à reproduire par point club si le club essaime, pas une propriété qui se généralise automatiquement.

## Conséquences

**Positives**

- Coût d'exploitation ramené à zéro cette saison, sans renoncer à l'outil (Luma déjà validé côté usage).
- Le risque de « site cassé le lundi » disparaît : plus de projet Supabase à réveiller, plus de cron Vercel dont la cadence dépend d'un plan payant.
- Le tableau de correction depuis un téléphone (le cas d'usage réel nommé en session) devient trivial — aucun déploiement, aucun risque de casser le build en éditant l'agenda.
- Le travail déjà fait n'est pas perdu : migrations, verrou de capacité, outbox e-mail, dashboard admin restent en l'état, immuables, réactivables sans réécriture le jour où le volume le justifie.
- ADR-002 (séparation des responsables de traitement) sort **renforcée**, pas affaiblie : Luma et HelloAsso sont chacun un destinataire externe distinct, à documenter séparément — la logique qui a présidé à la séparation club/app s'applique identiquement ici.

**Négatives / à surveiller**

- Perte du registre de preuve RGPD que le site construisait lui-même (`club.consents`) — la base légale du traitement, pour les inscriptions Luma, dépend désormais des conditions de Luma, pas d'un document que l'association contrôle et peut produire elle-même en cas de litige.
- Régime d'autorisation parentale moins rigoureux (papier, §4) que celui construit et testé.
- Perte de visibilité opérationnelle : qui vient, historique de fréquentation, liste d'attente — tout ça vit désormais chez Luma, exportable seulement dans la mesure où leur offre (gratuite) le permet.
- La passerelle club → app (compte partagé, `app_enrolled`) ne s'active plus si personne ne crée de compte club cette saison (§7) — perte déjà identifiée par le décideur avant cette analyse.
- Le multi-tenant ne s'étend pas à Luma (§9) — à recréer par point club.

## Amendements aux ADR existantes

Aucune des ADR suivantes n'est invalidée — leur raisonnement reste correct pour ce qu'elles adressaient. Elles passent en **dormance** : non exercées cette saison, réactivables sans révision si la voie maison reprend.

- **ADR-003 (verrou de capacité)** — dormant : Luma gère sa propre capacité, le problème que le verrou résolvait ne se pose plus côté site tant qu'aucune inscription maison n'a lieu.
- **ADR-005 (`pg_cron`)** — dormant : les deux jobs (`expire_parental_holds`, purge) n'ont rien à traiter sans inscriptions/comptes maison.
- **ADR-006 (outbox e-mails)** — dormant dans son ensemble, au-delà du seul point de cadence Vercel Hobby déjà noté le 2026-08-18 : rien n'est jamais enfilé dans `club.email_log` sans inscription maison.
- **ADR-009 (Resend)** — dormant par la même logique : aucun e-mail à envoyer.
- **ADR-002 (schéma séparé, registre dupliqué)** — non amendée, renforcée (voir Conséquences positives).

Note datée à ajouter dans chacune des trois premières, pointant ici — fait dans le même geste que cette ADR (voir les fichiers eux-mêmes).

## Critères de réouverture du sujet

Revenir sur cette décision quand l'une de ces conditions apparaît, pas avant :

1. Le volume dépasse ce que Luma gratuit et une gestion manuelle permettent confortablement (plafonds du plan gratuit Luma à vérifier à l'échelle réelle avant de les heurter — non chiffrés avec certitude dans cette ADR).
2. La passerelle club → app redevient une priorité produit (acquisition vers l'app commerciale).
3. Le volume de mineurs inscrits rend le suivi papier intenable ou risqué.
4. Le contrôle du registre de preuve RGPD (indépendance vis-à-vis de Luma) devient un besoin exprimé, pas théorique.
5. Un second point club ouvre et l'absence de coordination multi-club sur Luma devient un problème opérationnel réel, pas hypothétique.
6. ~45$/mois cesse d'être une dépense qui ne se justifie pas au regard des autres priorités du club.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| Rester sur Supabase Pro + Vercel Pro dès maintenant | ~45$/mois pour ~30 adhérents et 2 sorties/semaine ne se justifie pas cette saison (décision produit, pas technique). |
| Synchronisation iCal Luma → site | Suppose que Luma est créé avant le site alors que le flux réel est l'inverse (site écrit en premier, URL Luma ajoutée après) — plus d'objet une fois le sens du flux clarifié. |
| Fichier de données typé (repo) pour le calendrier des sorties | Type-safe et versionné, mais l'édition depuis un téléphone est le cas d'usage réel nommé, et une faute de syntaxe poussée par ce chemin risquait de casser le build entier — voir aussi le point CI/déploiement traité séparément en session. |
| Réutiliser `club.parental_authorizations` pour le papier | Conçue pour un jeton et un délai de 48h en ligne ; ne représente rien de ce qu'un processus papier a besoin de tracer. |
