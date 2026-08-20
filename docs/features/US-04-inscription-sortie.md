# US-04 — Inscription à une sortie

> Fiche fonctionnalité SDD. Lecture seule pour tous les autres agents.
>
> Branche : `feature/US-04-inscription-sortie`
> Statut : ⏳ Specify — **remplacé par Luma le 2026-08-19, voir ADR-010**. Le verrou de capacité, la liste d'attente et le formulaire maison décrits ici ne sont plus le chemin d'inscription réel ; le code correspondant a été retiré (pas seulement le schéma, dormant). Cette fiche reste comme trace de la conception initiale, réactivable si la voie maison reprend (critères de réouverture, ADR-010).

---

## 1. Contexte

Cœur du produit. Reprend l'esprit de l'ancienne US-02 ("Événements et inscription publique") du périmètre "site club autonome", mais avec des changements structurants issus de la restructuration : compte obligatoire (US-03), capacité garantie par verrou transactionnel plutôt que par vérification applicative, liste d'attente dérivée de `created_at` plutôt que stockée, annulation depuis l'espace membre plutôt que par lien e-mail seul, et bascule vers un statut spécifique `pending_parental_authorization` pour les mineurs (déclenche US-05).

---

## 2. User story

> **En tant que** personne connectée (Léa, Sofia)
> **Je veux** m'inscrire à une sortie en quelques secondes et pouvoir annuler facilement depuis mon compte
> **Afin de** sécuriser ma participation sans effort administratif

---

## 3. Critères d'acceptation (Given-When-Then)

### AC1 — Détail d'un événement

```
GIVEN une personne connectée clique sur une sortie de l'agenda (US-02)
WHEN  la page de détail se charge
THEN  elle voit l'activité, la date, l'heure, le lieu de rendez-vous, le niveau requis, la capacité totale et le nombre de places restantes
```

### AC2 — Inscription réussie, place disponible

```
GIVEN une sortie avec au moins une place disponible
WHEN  une personne connectée confirme son inscription
THEN  la fonction club.register_for_event verrouille la ligne club.events (SELECT ... FOR UPDATE), compte les inscriptions confirmed dans la même transaction, et insère la nouvelle inscription en statut confirmed
AND   un e-mail de confirmation est envoyé et journalisé dans club.email_log
```

### AC3 — Bascule automatique en liste d'attente, sans condition de course

```
GIVEN une sortie ayant atteint sa capacité maximale
WHEN  une personne connectée confirme son inscription
THEN  son inscription est enregistrée en statut waitlist
AND   deux inscriptions simultanées visant la dernière place ne peuvent pas aboutir toutes les deux en confirmed (garanti par le verrou transactionnel de AC2, pas par une vérification côté application)
```

### AC4 — Inscription d'un mineur

```
GIVEN une personne dont la date de naissance indique qu'elle sera mineure à la date de l'événement (is_minor_at_event, calculé sur la date de l'événement et non celle de l'inscription)
WHEN  elle confirme son inscription
THEN  l'inscription est enregistrée en statut pending_parental_authorization (pas confirmed ni waitlist)
AND   le flux de validation parentale est déclenché (US-05)
```

### AC5 — Annulation depuis l'espace membre

```
GIVEN une personne connectée consulte "mes inscriptions"
WHEN  elle annule une inscription confirmed ou waitlist
THEN  le statut passe à cancelled
AND   si l'inscription annulée était confirmed, la promotion automatique (AC6) est déclenchée
```

### AC6 — Promotion automatique de la liste d'attente

```
GIVEN une sortie complète avec au moins une inscription waitlist
WHEN  une inscription confirmed est annulée, ou un hold parental expire (US-05)
THEN  l'inscription waitlist la plus ancienne (par created_at, aucune position stockée) passe automatiquement à confirmed
AND   un e-mail de promotion est envoyé et journalisé (idempotent, ne part jamais deux fois pour la même promotion)
```

### AC7 — Réinscription possible après annulation

```
GIVEN une personne a annulé une inscription à une sortie donnée
WHEN  elle s'inscrit à nouveau à la même sortie
THEN  l'inscription est acceptée (index unique partiel sur (event_id, member_profile_id) WHERE status <> 'cancelled', qui n'inclut pas les lignes cancelled)
```

### AC8 — Formulaire rapide, sans ressaisie

```
GIVEN une personne connectée dont le compte porte déjà prénom, nom et date de naissance
WHEN  elle s'inscrit à une sortie
THEN  aucune ressaisie de ces informations n'est demandée
```

---

## 4. Périmètre

### ✅ Inclus

- Page de détail d'un événement avec état de capacité en temps réel.
- Inscription/désinscription via `club.register_for_event` (verrou transactionnel).
- Statuts `confirmed` / `waitlist` / `pending_parental_authorization` / `cancelled`.
- Promotion automatique de la liste d'attente, ordonnée par `created_at`.
- Réinscription après annulation (index unique partiel).
- E-mails de confirmation et de promotion, journalisés pour idempotence.

### ❌ Exclu (hors scope de cette US)

- Le flux de validation parentale lui-même (US-05) — cette US ne fait que déclencher le statut `pending_parental_authorization`.
- Rappels automatiques par e-mail avant l'événement (P1).
- Historique de participation visible par l'utilisateur, badges de fidélité (P1).
- Inscription/désinscription manuelle par un admin (US-06).

---

## 5. Dépendances et contraintes

- **Tables BDD concernées** : `club.events`, `club.registrations` (statuts, `is_minor_at_event`, `is_under_15_at_registration`), `club.member_profiles`, `club.email_log`.
- **Fonctions BDD** : `club.register_for_event(...)` (`security definer`, `service_role`), verrou `SELECT ... FOR UPDATE` sur `club.events`.
- **Endpoints existants utilisés** : aucun.
- **Intégrations tierces** : prestataire d'e-mail transactionnel.
- **Dépend d'autres US** : US-03 (compte obligatoire), US-02 (point d'entrée agenda).
- **Bloque d'autres US** : déclenche US-05 pour les mineurs ; US-06 lit le même modèle d'événements/inscriptions.

---

## 6. Notes UX/UI (si applicable)

Écran le plus critique pour Léa : objectif d'un parcours complet (hors création de compte) en moins de 45 secondes. Le statut "liste d'attente" doit être communiqué de façon claire et rassurante, pas perçu comme un refus.

Maquettes : à produire par `designer` (document texte, canvas Pencil non retouché sauf instruction explicite).

---

## 7. Questions ouvertes

Aucune à ce stade — mécanique validée dans `00-brief-site-hybride.md`.

---

## 8. Prochaine étape

→ Invoquer `designer` pour le zoning détaillé.

---

## Historique

- 2026-08-12 — Création. Remplace l'ancienne US-02 ("Événements et inscription publique") du périmètre "site club autonome" — compte désormais obligatoire, capacité et liste d'attente désormais garanties par la base plutôt que par l'application.
