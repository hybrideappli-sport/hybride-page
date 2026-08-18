# US-02 — Point club Toulon

> Fiche fonctionnalité SDD. Lecture seule pour tous les autres agents.
>
> Branche : `feature/US-02-point-club-toulon`
> Statut : ⏳ Specify

---

## 1. Contexte

`/club/toulon` fusionne ce qui, dans l'ancien périmètre "site club autonome", était réparti sur trois écrans (accueil club, infos pratiques, liste des sorties). Le club de Toulon est le premier point club et, pour le P0, le seul exposé publiquement — mais la base est multi-tenant dès cette US (`club_id`, pas de page en dur), conformément à la décision 2 du brief.

---

## 2. User story

> **En tant que** visiteuse, adhérente ou bénévole (Sofia, Léa, Marc)
> **Je veux** voir la présentation du club de Toulon, ses infos pratiques et les prochaines sorties sur une seule page
> **Afin de** décider d'y participer et trouver rapidement l'information pratique

---

## 3. Critères d'acceptation (Given-When-Then)

### AC1 — Présentation du club et de ses activités

```
GIVEN un visiteur accède à /club/toulon
WHEN  la page se charge
THEN  il voit une présentation du club et les disciplines proposées (course à pied, vélo, eau, montagne, collectif)
```

### AC2 — Infos pratiques et contact

```
GIVEN un visiteur souhaite les modalités pratiques du club
WHEN  il consulte la section infos pratiques de la page
THEN  il trouve les informations de contact (email et/ou réseaux sociaux)
AND   aucune de ces informations ne nécessite de créer un compte pour être consultée
```

### AC3 — Lien externe vers HelloAsso

```
GIVEN un visiteur souhaite adhérer au club
WHEN  il clique sur le lien "Adhérer"
THEN  il est redirigé vers la page HelloAsso du club dans un nouvel onglet
AND   aucun paiement n'est traité sur le site
```

### AC4 — Agenda des sorties à venir, scopé par club

```
GIVEN un visiteur consulte l'agenda de /club/toulon
WHEN  la page se charge
THEN  il voit les sorties à venir du club de Toulon uniquement (filtrées par club_id), triées par date croissante
AND   chaque sortie affiche au minimum l'activité, la date, l'heure et le nombre de places restantes
```

### AC5 — Accès au détail d'une sortie

```
GIVEN un visiteur clique sur une sortie de l'agenda
WHEN  la navigation s'effectue
THEN  il atteint la page de détail et d'inscription de cette sortie (US-04)
```

### AC6 — SEO local

```
GIVEN un moteur de recherche indexe /club/toulon
WHEN  il analyse le code de la page
THEN  la page expose un title et une meta description mentionnant le club et Toulon
AND   la page expose des données structurées SportsClub (schema.org) valides
```

### AC7 — Consultation mobile

```
GIVEN un visiteur consulte /club/toulon depuis un smartphone
WHEN  il navigue sur la page
THEN  le contenu est lisible et les actions accessibles sans défilement horizontal ni élément coupé
```

---

## 4. Périmètre

### ✅ Inclus

- Page unique `/club/[slug]` (seule l'instance `toulon` exposée au P0) : présentation, activités, infos pratiques, lien HelloAsso, agenda des sorties.
- Filtrage `club_id` systématique de l'agenda, même à un seul club exposé.
- SEO local de base.

### ❌ Exclu (hors scope de cette US)

- Pages activité dédiées par sport (P1).
- Interface de sélection/carte multi-clubs (P1).
- Bloc de présentation de l'app Hybride (déplacé sur `/`, US-01).
- Formulaire d'inscription (traité dans US-04).

---

## 5. Dépendances et contraintes

- **Tables BDD concernées** : `club.clubs` (lecture, résolution du `slug`), `club.events` (lecture, agenda filtré `club_id`).
- **Endpoints existants utilisés** : aucun.
- **Intégrations tierces** : lien externe sortant HelloAsso.
- **Dépend d'autres US** : US-07 (lien légal association).
- **Bloque d'autres US** : fournit le point d'entrée de navigation vers US-04.

---

## 6. Notes UX/UI (si applicable)

Design réutilisant les tokens/composants de l'app (inexistants à ce stade — style minimal au P0, voir brief). Mobile-first, cohérent avec les personas Léa et Marc qui consultent principalement depuis leur téléphone.

Maquettes : à produire par `designer` (document texte, canvas Pencil non retouché sauf instruction explicite).

---

## 7. Questions ouvertes

Aucune à ce stade.

---

## 8. Prochaine étape

→ Invoquer `designer` pour le zoning détaillé.

---

## Historique

- 2026-08-12 — Création. Fusionne les anciennes US-01 (bloc accueil/infos, hors app) et US-02 §agenda du périmètre "site club autonome".
