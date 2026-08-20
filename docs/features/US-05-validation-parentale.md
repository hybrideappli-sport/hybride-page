# US-05 — Validation parentale

> Fiche fonctionnalité SDD. Lecture seule pour tous les autres agents.
>
> Branche : `feature/US-05-validation-parentale`
> Statut : ⏳ Specify — **remplacé par une procédure papier le 2026-08-19, voir ADR-010 §4 et `docs/procedure-autorisation-parentale-papier.md`**. Luma ne gère pas l'autorisation parentale ; le flux jeton/48h décrit ici n'est plus le chemin réel, le code correspondant a été retiré. Rigueur réduite assumée pour le régime papier — cette fiche reste comme trace de la conception initiale.

---

## 1. Contexte

US la plus sensible légalement du produit. Deux régimes distincts et cumulatifs s'appliquent aux mineurs (décision 6 du brief) : le consentement RGPD, dont le seuil d'autonomie est 15 ans en droit français, et l'autorisation parentale de pratique sportive, obligatoire jusqu'à 18 ans indépendamment du RGPD. Une inscription mineure (US-04 AC4) bloque une place pendant 48h, le temps que le parent réponde, puis la libère automatiquement si aucune réponse n'arrive. Le parent n'a besoin d'aucun compte : tout se passe via un lien unique reçu par e-mail.

---

## 2. User story

> **En tant que** parent d'un mineur inscrit à une sortie
> **Je veux** recevoir un e-mail clair et pouvoir autoriser ou refuser en un clic, sans créer de compte
> **Afin de** protéger mon enfant tout en le laissant participer si je suis d'accord

---

## 3. Critères d'acceptation (Given-When-Then)

### AC1 — Déclenchement de la demande

```
GIVEN une inscription passe en statut pending_parental_authorization (US-04 AC4)
WHEN  l'inscription est créée
THEN  une ligne club.parental_authorizations est créée (token unique, requested_at, hold_expires_at = requested_at + 48h, status = pending)
AND   un e-mail de demande de validation parentale est envoyé à l'adresse du parent renseignée à l'inscription
```

### AC2 — Mineur de moins de 15 ans : double consentement en un seul geste

```
GIVEN un inscrit a moins de 15 ans à la date de l'événement (is_under_15_at_registration)
WHEN  le parent ouvre le lien reçu
THEN  l'écran présente à la fois le consentement RGPD (au nom du mineur) et l'autorisation de pratique sportive, dans un seul parcours
AND   une validation du parent produit deux preuves distinctes : une ligne club.consents (RGPD) et la mise à jour de club.parental_authorizations (sportif)
```

### AC3 — Mineur de 15 à 17 ans : autorisation sportive seule

```
GIVEN un inscrit a entre 15 et 17 ans à la date de l'événement
WHEN  le parent ouvre le lien reçu
THEN  seul le volet autorisation de pratique sportive lui est présenté (le RGPD a été consenti par le mineur lui-même à l'inscription)
```

### AC4 — Écran de validation clair

```
GIVEN un parent ouvre le lien de validation
WHEN  la page se charge
THEN  il voit clairement ce qu'il autorise : l'activité, la date, le lieu, l'identité de l'enfant inscrit
AND   deux actions sont proposées : Autoriser / Refuser
AND   aucune création de compte n'est requise
```

### AC5 — Autorisation confirmée

```
GIVEN un parent choisit Autoriser avant l'expiration du hold
WHEN  il valide
THEN  club.parental_authorizations passe à confirmed (confirmed_at horodaté)
AND   l'inscription liée passe à confirmed ou waitlist selon la capacité disponible au moment de la validation (même règle que US-04 AC2/AC3)
AND   un e-mail de confirmation est envoyé au mineur
```

### AC6 — Refus explicite

```
GIVEN un parent choisit Refuser avant l'expiration du hold
WHEN  il valide son refus
THEN  club.parental_authorizations passe à denied
AND   l'inscription liée passe à cancelled, la place est libérée
AND   la promotion automatique de la liste d'attente est déclenchée si applicable (US-04 AC6)
AND   le mineur reçoit un message factuel neutre ("ton parent n'a pas autorisé cette sortie")
```

### AC7 — Expiration sans réponse

```
GIVEN aucune réponse n'est apportée avant hold_expires_at
WHEN  la vérification planifiée pg_cron (toutes les 15 minutes) détecte l'expiration
THEN  club.parental_authorizations passe à expired
AND   l'inscription liée passe à cancelled, la place est libérée, promotion automatique déclenchée si applicable
AND   le mineur reçoit un message actionnable différent du refus ("pas de réponse sous 48h, tu peux réessayer ou relancer ton parent")
```

### AC8 — Preuve horodatée conservée

```
GIVEN une autorisation est confirmée, refusée ou expirée
WHEN  la décision (ou l'absence de décision) est enregistrée
THEN  le token, l'IP hash, le user agent et la date de décision sont conservés comme preuve
```

### AC9 — Réévaluation si l'événement est reporté

```
GIVEN une inscription déjà confirmée après validation parentale
WHEN  un admin modifie la date de l'événement (US-06) et que le recalcul de is_minor_at_event fait basculer l'inscrit de majeur à mineur
THEN  l'inscription repasse en pending_parental_authorization et un nouveau flux de validation est déclenché
AND   à l'inverse (mineur devenant majeur suite au report), aucune action n'est déclenchée, l'autorisation déjà obtenue reste valable
```

---

## 4. Périmètre

### ✅ Inclus

- Déclenchement automatique à l'inscription d'un mineur.
- Écran de validation côté parent (autoriser/refuser), sans compte.
- Double volet RGPD + sportif pour les moins de 15 ans, volet sportif seul pour les 15-17 ans.
- Hold 48h avec expiration automatique planifiée (`pg_cron`).
- Distinction de traitement denied/expired côté message au mineur, effet identique côté données.
- Réévaluation à l'édition de la date d'un événement.
- Preuve horodatée conservée pour les deux régimes.

### ❌ Exclu (hors scope de cette US)

- Relance automatique avant l'expiration des 48h (non demandée, candidate P1 si utile).
- Gestion groupée de plusieurs enfants d'un même parent en un seul geste (chaque inscription a son propre flux).

---

## 5. Dépendances et contraintes

- **Tables BDD concernées** : `club.parental_authorizations`, `club.consents`, `club.consent_documents`, `club.registrations`, `club.email_log`.
- **Fonctions/jobs BDD** : `club.expire_parental_holds()`, planifiée via `pg_cron` toutes les 15 minutes.
- **Endpoints existants utilisés** : aucun.
- **Intégrations tierces** : prestataire d'e-mail transactionnel (demande et confirmation de validation parentale).
- **Dépend d'autres US** : US-04 (déclenchée par une inscription mineure).
- **Bloque d'autres US** : alimente les statuts affichés dans US-06 (dashboard admin).

---

## 6. Notes UX/UI (si applicable)

Le parent n'ouvrira peut-être pas l'e-mail immédiatement — la clarté du message d'expiration et l'absence de friction (pas de compte à créer) sont critiques. Ton neutre et factuel, jamais culpabilisant, sur les deux issues (refus et expiration).

Maquettes : à produire par `designer` (document texte, canvas Pencil non retouché sauf instruction explicite).

---

## 7. Questions ouvertes

- [ ] Validation juridique de la formulation exacte de l'autorisation parentale de pratique sportive — dépendance externe, pas une question produit.

---

## 8. Prochaine étape

→ Invoquer `designer` pour le zoning détaillé.

---

## Historique

- 2026-08-12 — Création. Nouvelle US, absente du périmètre "site club autonome" (qui ne prévoyait qu'une case à cocher de consentement parental, sans régime légal à deux volets ni workflow horodaté).
