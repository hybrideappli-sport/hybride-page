# US-06 — Dashboard admin club

> Fiche fonctionnalité SDD. Lecture seule pour tous les autres agents.
>
> Branche : `feature/US-06-dashboard-admin-club`
> Statut : ⏳ Specify

---

## 1. Contexte

Reprend l'esprit de l'ancienne US-03 ("Dashboard admin") du périmètre "site club autonome", avec deux changements structurants : le scoping par `club_id` et le rôle `club_admin` (`club.admin_roles`, décision 2 du brief) plutôt qu'une authentification admin isolée, et un périmètre volontairement réduit pour le P0 — l'édition d'un événement existant est retirée (créer/annuler seulement), pour tenir la date de rentrée. Marc reste le persona le plus critique pour le risque d'échec du projet : l'outil doit rester d'une simplicité extrême.

---

## 2. User story

> **En tant que** bénévole `club_admin` non-technique (Marc)
> **Je veux** créer une sortie et gérer les inscrits — y compris ceux en attente de validation parentale — depuis mon mobile
> **Afin de** organiser les sorties hebdomadaires sans dépendre d'un tableur

---

## 3. Critères d'acceptation (Given-When-Then)

### AC1 — Accès scopé par rôle et par club

```
GIVEN un compte possède le rôle club_admin pour le club de Toulon (US-03 AC6)
WHEN  il se connecte
THEN  il accède au dashboard admin, dont toutes les requêtes sont filtrées par club_id (Toulon uniquement visible au P0, mais le filtrage est réel, pas une page codée en dur)
AND   un compte sans ce rôle ne peut pas accéder au dashboard
```

### AC2 — Création d'un événement

```
GIVEN un admin authentifié sur le dashboard
WHEN  il remplit le formulaire de création d'événement (activité, date, heure, lieu de rendez-vous, niveau, capacité maximale) et le valide
THEN  l'événement est créé avec le club_id du club de l'admin et devient immédiatement visible dans l'agenda public (US-02)
```

### AC3 — Pas d'édition au P0

```
GIVEN un événement déjà créé
WHEN  un admin souhaite modifier un champ après création
THEN  aucune fonctionnalité d'édition n'est proposée au P0 (correction exceptionnelle via un accès direct à la base, hors périmètre applicatif)
```

### AC4 — Annulation d'un événement

```
GIVEN un admin authentifié consulte un événement à venir
WHEN  il déclenche l'annulation
THEN  l'événement n'apparaît plus comme disponible à l'inscription
AND   toutes les personnes inscrites (confirmed, waitlist, pending_parental_authorization) sont notifiées par e-mail de l'annulation
```

### AC5 — Consultation des inscrits avec trois états distincts

```
GIVEN un admin authentifié consulte un événement
WHEN  il ouvre la vue détaillée
THEN  il voit distinctement les listes confirmed, waitlist et pending_parental_authorization
AND   chaque ligne affiche a minima nom, prénom et email
```

### AC6 — Inscription manuelle par l'admin

```
GIVEN un admin authentifié consulte un événement
WHEN  il ajoute manuellement un participant
THEN  l'ajout respecte les mêmes règles que l'inscription publique : verrou de capacité (US-04 AC2/AC3) et régime mineur (US-04 AC4 / US-05)
```

### AC7 — Désinscription manuelle par l'admin

```
GIVEN un admin authentifié consulte la liste des inscrits confirmed d'un événement
WHEN  il retire un participant
THEN  la promotion automatique de la liste d'attente est déclenchée (US-04 AC6), identique à une annulation publique
```

### AC8 — Export CSV, sans stockage serveur

```
GIVEN un admin authentifié consulte un événement
WHEN  il déclenche l'export CSV
THEN  un fichier est généré à la demande et transmis en streaming direct, sans être conservé côté serveur après la requête
AND   l'export est journalisé dans club.export_log (qui, quand, quel événement)
AND   le fichier inclut nom, prénom, email et statut (confirmed / waitlist / pending_parental_authorization)
```

### AC9 — Utilisabilité mobile

```
GIVEN un admin authentifié se connecte depuis un smartphone
WHEN  il crée un événement ou consulte la liste des inscrits
THEN  l'ensemble du parcours est réalisable sans zoom ni défilement horizontal
```

---

## 4. Périmètre

### ✅ Inclus

- Accès scopé par rôle `club_admin` et par `club_id`.
- Création et annulation manuelle d'événements (pas de récurrence automatique, pas d'édition).
- Consultation des inscrits avec 3 états distincts (confirmed / waitlist / pending_parental_authorization).
- Inscription et désinscription manuelle par l'admin, mêmes règles que le public.
- Export CSV à la demande, journalisé, sans stockage serveur.
- Interface mobile.

### ❌ Exclu (hors scope de cette US)

- Édition d'un événement existant — P1.
- Multi-rôles fins au-delà de `club_admin`/`super_admin` — hors scope.
- Statistiques de fréquentation — P1.
- Gestion des badges de fidélité — P1.
- Rappels automatiques par e-mail avant l'événement (J-1) — P1.

---

## 5. Dépendances et contraintes

- **Tables BDD concernées** : `club.events`, `club.registrations`, `club.admin_roles`, `club.export_log`, partagées avec US-04 (même modèle de données).
- **Fonctions BDD** : `club.register_for_event(...)` (inscription/désinscription manuelle, mêmes garanties transactionnelles que côté public).
- **Endpoints existants utilisés** : ceux de US-04, avec un niveau d'accès admin.
- **Intégrations tierces** : prestataire d'e-mail transactionnel (notification d'annulation).
- **Dépend d'autres US** : US-03 (auth + rôles), US-04 (modèle d'événements/inscriptions).
- **Bloque d'autres US** : aucune.

---

## 6. Notes UX/UI (si applicable)

Priorité absolue : simplicité pour un utilisateur non-technique, en particulier la création répétée d'événements chaque semaine. Interface mobile-first, Marc consultant depuis son téléphone juste avant les sorties.

Maquettes : à produire par `designer` (document texte, canvas Pencil non retouché sauf instruction explicite).

---

## 7. Questions ouvertes

Aucune à ce stade.

---

## 8. Prochaine étape

→ Invoquer `designer` pour le zoning détaillé.

---

## Historique

- 2026-08-12 — Création. Remplace l'ancienne US-03 ("Dashboard admin") du périmètre "site club autonome" — scoping multi-tenant, rôle club_admin, édition retirée du P0, gestion des 3 états d'inscription (dont l'attente parentale).
