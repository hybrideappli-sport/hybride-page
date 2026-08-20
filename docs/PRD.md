# PRD — Site Hybride (vitrine app + points club)

> Product Requirements Document. Rédigé à partir de `00-brief-site-hybride.md`, consolidé après restructuration du périmètre (fusion vitrine app + points club, multi-tenant, compte partagé).
>
> Version : 2.0 — 2026-08-12 (remplace la version 1.0, périmètre "site club autonome")
> Statut : ✅ Décisions structurelles et modèle de données validés — prêt pour `designer` puis `architect`
>
> **Amendement 2026-08-19** : bascule de saison, voir **ADR-010**. US-03 (compte), US-04 (inscription en ligne), US-05 (autorisation parentale en ligne) et US-06 (dashboard admin) décrivent la conception initiale, retirée du site — pas le fonctionnement réel actuel (Luma, HelloAsso, tableur public, papier).

---

## 1. Vision

Le site Hybride est à la fois la vitrine de l'app Hybride (coach IA) et le point d'entrée des clubs locaux partenaires — Toulon en premier — permettant à quiconque de découvrir l'app, et à toute personne, adhérente ou non, y compris mineure, de s'inscrire en quelques dizaines de secondes à une sortie hebdomadaire d'un club, avec un compte unique partagé entre le site et l'app.

**Pourquoi ce produit, pourquoi maintenant ?**

Le Hybride Club Toulon (association loi 1901) gère aujourd'hui ses inscriptions aux sorties hebdomadaires via des canaux informels, sans limite de places fiable ni vue centralisée pour les bénévoles. Un événement partenaire est déjà annoncé pour la rentrée de septembre 2026, ce qui impose une date de lancement ferme. Plutôt que de construire un site club isolé, le choix a été fait de fusionner ce chantier avec la vitrine de l'app Hybride : un seul site, un seul compte, une architecture multi-tenant prête à accueillir d'autres clubs sans migration future — tout en maintenant une séparation stricte entre les données de l'association (club) et celles de l'entité commerciale (app), pour des raisons de responsabilité de traitement RGPD.

---

## 2. Problème résolu

**Pour qui ?**

- **Léa** — adhérente régulière d'un club, veut s'inscrire vite à une sortie depuis son mobile.
- **Marc** — bénévole `club-admin` non-technique, crée les sorties et gère les inscrits.
- **Sofia** — curieuse non-adhérente, découvre le club ou l'app via le site, veut essayer sans engagement.
- **Le parent d'un mineur** — ne crée pas de compte, reçoit un e-mail et doit pouvoir autoriser ou refuser la participation de son enfant en quelques clics, avec un texte clair sur ce qu'il autorise.

**Quel problème concret ?**

- Pas de vitrine unifiée pour l'app Hybride et ses points club locaux.
- Pas de moyen fiable de limiter les places à une sortie, ni de gérer une liste d'attente.
- Les mineurs ne peuvent aujourd'hui s'inscrire nulle part avec une base légale solide (RGPD *et* autorisation parentale de pratique sportive sont deux régimes distincts, souvent confondus).
- Deux entités légalement distinctes (association loi 1901 / société commerciale) doivent partager une infrastructure technique (authentification, hébergement) sans que les données de l'une n'alimentent les finalités de l'autre sans consentement dédié.

**Comment il est résolu aujourd'hui (sans nous) ?**

Canaux informels (réseaux sociaux, tableur) pour les inscriptions du club de Toulon. L'app Hybride n'a pas de vitrine web séparée du produit lui-même.

**Pourquoi notre solution est meilleure ?**

Un compte unique, partagé entre le site et l'app, sur une architecture multi-tenant dès la première migration (prête pour d'autres clubs sans refonte), avec une séparation stricte et documentée des responsabilités de traitement de données entre association et entité commerciale.

---

## 3. Personas

### Persona 1 — Léa

- **Rôle** : Adhérente régulière du club de Toulon, 32 ans.
- **Contexte** : S'inscrit aux sorties depuis son mobile, généralement le soir.
- **Problème principal** : Veut sécuriser sa place à une sortie sans processus compliqué, avec un compte qu'elle n'a besoin de créer qu'une fois.
- **Motivation** : Participer régulièrement aux sorties du club sans effort administratif.
- **Frein** : N'a pas envie qu'un compte obligatoire alourdisse le parcours — le compte doit être rapide à créer et réutilisable pour toutes les sorties futures.

### Persona 2 — Marc

- **Rôle** : Bénévole `club-admin` du club de Toulon, non-technique.
- **Contexte** : Crée les sorties de la semaine et consulte la liste des inscrits sur mobile.
- **Problème principal** : A besoin d'un outil fiable pour créer un événement et voir/gérer qui est inscrit, sans complexité — y compris distinguer les inscriptions en attente d'autorisation parentale.
- **Motivation** : Passer le moins de temps possible en administration.
- **Frein** : Tout outil perçu comme complexe sera abandonné au profit du tableur actuel.

### Persona 3 — Sofia

- **Rôle** : Curieuse non-adhérente, nouvelle arrivante à Toulon.
- **Contexte** : Arrive sur le site via une recherche Google ou Instagram.
- **Problème principal** : Veut comprendre rapidement ce que propose le club (et éventuellement l'app), et pouvoir essayer une sortie sans engagement.
- **Motivation** : Découvrir une communauté sportive locale.
- **Frein** : Abandonnera si la création de compte semble lourde ou si le parcours est confus.

### Persona 4 — Le parent d'un mineur

- **Rôle** : Représentant légal d'un inscrit mineur, ne crée pas de compte sur le site.
- **Contexte** : Reçoit un e-mail suite à l'inscription de son enfant à une sortie, doit répondre en 48h.
- **Problème principal** : Comprendre rapidement et clairement ce qu'il autorise (RGPD si <15 ans, autorisation de pratique sportive dans tous les cas jusqu'à 18 ans), sans ambiguïté ni engagement de sa part au-delà de cette autorisation ponctuelle.
- **Motivation** : Protéger son enfant tout en le laissant participer.
- **Frein** : N'ouvrira peut-être pas l'e-mail à temps — d'où la fenêtre de 48h et la clarté du message d'expiration.

---

## 4. Fonctionnalités — Lot P0 (rentrée septembre 2026)

| # | Fonctionnalité | Persona(s) ciblé(s) | Priorité |
|---|---|---|---|
| US-01 | Vitrine app (`/`, minimale) | Sofia | P0 |
| US-02 | Point club Toulon (`/club/toulon`, infos + agenda) | Sofia, Léa, Marc | P0 |
| US-03 | Compte utilisateur (création, connexion, mot de passe oublié) | Léa, Sofia, Marc | P0 |
| US-04 | Inscription à une sortie (détail, capacité, liste d'attente, annulation) | Léa, Sofia | P0 |
| US-05 | Validation parentale (mineurs, régime RGPD + autorisation sportive) | Le parent | P0 |
| US-06 | Dashboard admin club (créer/annuler un événement, inscrits, export CSV) | Marc | P0 |
| US-07 | Pages légales (mentions légales et politique de confidentialité, association + entité commerciale) | Tous | P0 |

**Hors MVP (P1)** :

- Vitrine app complète (au-delà de la section minimale de `/`).
- Carte et interface multi-clubs (le multi-tenant est en base dès le P0, l'interface ne l'est pas).
- Badges de fidélité (assiduité + ancienneté).
- Espace membre enrichi (historique, profil).
- Édition d'un événement dans le dashboard admin (le P0 ne couvre que créer/annuler).
- Page activité dédiée par sport (contenu absorbé par l'agenda de `/club/toulon` au P0).
- Rappels automatiques par e-mail avant l'événement (J-1).
- Statistiques de fréquentation.

---

## 5. Modèle économique

Aucune transaction financière sur le site :

- Les sorties hebdomadaires des clubs sont gratuites.
- La cotisation associative reste gérée hors site via HelloAsso (lien externe sortant, aucune intégration technique).
- L'abonnement à l'app Hybride reste géré par l'app elle-même (Stripe) — le site n'en est qu'une vitrine, sans capture de paiement.

Pas de pricing applicable à ce document.

---

## 6. Contraintes

- **Techniques** :
  - Un seul projet Next.js / repo / Vercel, domaine réutilisé de l'app (pas de nouveau domaine).
  - Un seul projet Supabase partagé (`hybrideclub`, eu-west-1), `auth.users` commune avec l'app.
  - `public.profiles` existant côté app n'est pas modifié, à l'exception de l'ajout additif `app_enrolled` (voir Modèle de données du brief) pour corriger une fuite de finalité identifiée (`enqueueWeeklyReviews`).
  - Nouveau schéma `club` dédié aux données métier et de conformité club — additif, aucune migration requise sur les tables existantes de l'app.
  - Capacité des événements garantie par verrou transactionnel (`SELECT ... FOR UPDATE` + comptage), pas par une vérification applicative seule.
  - Expiration du hold parental à 48h via `pg_cron` (pas de dépendance à un cron Vercel ni au plan Pro).
  - Réinscription après annulation permise via un index unique partiel, pas une contrainte unique simple.
  - Journal d'envoi d'e-mail (`club.email_log`) pour garantir l'idempotence des 7 e-mails transactionnels.
- **Légales** :
  - Deux responsables de traitement distincts (association / entité commerciale) — schémas de données séparés, registres de consentement séparés (`club.consents`/`club.consent_documents` dupliqués, pas de réutilisation de ceux de l'app), pages légales séparées par entité.
  - Régime mineur à deux volets cumulatifs : consentement RGPD autonome possible dès 15 ans, autorisation parentale de pratique sportive obligatoire jusqu'à 18 ans dans tous les cas.
  - Conservation des données d'inscription club : 3 ans après la dernière participation confirmée (purge automatique programmée) — **proposition à valider juridiquement avant lancement**, pas une clôture définitive.
  - Aucune donnée d'inscription club n'alimente la prospection de l'abonnement app sans consentement dédié et explicite.
- **Budget / délais** : lancement pour la rentrée (début septembre 2026) — un événement partenaire est déjà annoncé, contrainte de date ferme et non négociable pour le lot P0.
- **Dépendances externes** :
  - HelloAsso : lien sortant simple pour l'adhésion associative, aucune intégration technique.
  - Prestataire d'e-mail transactionnel à déterminer par `architect` (7 templates, journalisés pour idempotence).
  - Validation juridique de la formulation exacte de l'autorisation parentale de pratique sportive et de la durée de conservation RGPD — dépendance externe, pas de temps d'ingénierie pur.

---

## 7. Métriques de succès

- **Activation** : temps médian de complétion du parcours d'inscription (création de compte incluse si premier passage) inférieur à 90 secondes.
- **Adoption** : part des inscriptions aux sorties du club de Toulon passant par le site plutôt que par les canaux informels, à 3 mois — cible indicative supérieure à 70 %.
- **Efficacité opérationnelle** : temps hebdomadaire passé par les bénévoles club-admin à administrer les inscriptions.
- **Recrutement** : nombre de premières inscriptions de non-adhérents par mois.
- **Fiabilité du régime mineur** : part des demandes de validation parentale résolues (confirmées ou refusées) dans la fenêtre de 48h, plutôt qu'expirées faute de réponse.

---

## 8. Questions ouvertes

Les questions structurantes du cadrage sont tranchées (voir `00-brief-site-hybride.md`, sections Décisions structurelles et Modèle de données). Reste en attente, comme dépendance externe et non comme décision produit :

- [ ] Validation juridique de la formulation exacte de l'autorisation parentale de pratique sportive.
- [ ] Validation juridique de la durée de conservation de 3 ans proposée pour les données d'inscription club.

**Dépendances ouvertes de la saison courante (ADR-010, 2026-08-19)** — distinctes des deux ci-dessus, qui concernent le flux en ligne dormant :

- [ ] Mentions légales du club (`app/club/[slug]/mentions-legales`) : numéro RNA, nom du représentant légal et commune du siège social tel que déclaré en préfecture (`lib/config.ts` → `CLUB.legalCity`) — à sourcer dans les statuts et le récépissé de déclaration. **Ne pas déduire `legalCity` de "Toulon"**, qui désigne la ville d'activité du club, pas nécessairement la commune de domiciliation légale.
- [ ] `contact@hybride-club.fr` (adresse de contact légal affichée sur les pages mentions légales et confidentialité du club) : la redirection OVH vers une boîte réelle n'est pas encore créée côté association. Une adresse de contact légal qui ne reçoit rien est un problème à résoudre avant toute communication publique de l'URL du site — pas seulement une tâche différable.
- [ ] `/mentions-legales` racine (entité commerciale éditrice de l'app, distincte du club) : page publique, tous les champs sont encore des placeholders entre crochets (`[Raison sociale]`, `[SIRET à compléter]`, etc. — voir `app/mentions-legales/page.tsx`). Hors périmètre de la bascule ADR-010, mais bloquant pour cette même raison : **à remplir avant toute communication de l'URL du site**, comme le point ci-dessus.

---

## 9. Prochaine étape

→ Invoquer `designer` pour le zoning détaillé des 7 US P0 (document texte, canvas Pencil non retouché sans instruction explicite), puis `architect` pour la stack, le plan de migrations (schéma `club`, `pg_cron`, fonctions transactionnelles) et les conventions de code.
