# US-01 — Vitrine app

> Fiche fonctionnalité SDD. Lecture seule pour tous les autres agents.
>
> Branche : `feature/US-01-vitrine-app`
> Statut : ⏳ Specify

---

## 1. Contexte

Le site Hybride fusionne désormais la vitrine de l'app et les points club (`00-brief-site-hybride.md`, décision 1). `/` est le point d'entrée global du site : il présente l'app et redirige vers le point club exposé (`/club/toulon` au P0, seul club visible malgré une base multi-tenant). Cette US remplace l'ancien bloc "app Hybride" qui vivait auparavant sur la page d'accueil du club — il est désormais central et autonome.

---

## 2. User story

> **En tant que** visiteuse découvrant le site (Sofia)
> **Je veux** comprendre en quelques secondes ce qu'est Hybride et accéder au club de Toulon
> **Afin de** décider si je veux essayer l'app et/ou une sortie du club

---

## 3. Critères d'acceptation (Given-When-Then)

### AC1 — Présentation de l'app

```
GIVEN un visiteur arrive sur /
WHEN  la page se charge
THEN  il voit une présentation courte de l'app Hybride (coach IA) et son intérêt
```

### AC2 — Point d'entrée vers le club de Toulon

```
GIVEN un visiteur consulte /
WHEN  il cherche à découvrir un point club
THEN  un lien/CTA clair l'amène vers /club/toulon
AND   aucune interface de sélection multi-clubs n'est proposée (hors P0)
```

### AC3 — CTA de téléchargement désactivé

```
GIVEN un visiteur consulte /
WHEN  il atteint le bloc de téléchargement de l'app
THEN  le bouton est à l'état désactivé et affiche "bientôt disponible"
```

### AC4 — Accès aux pages légales de l'entité commerciale

```
GIVEN un visiteur consulte /
WHEN  il clique sur les liens légaux du footer
THEN  il accède aux mentions légales et à la politique de confidentialité de l'entité commerciale (US-07)
```

### AC5 — Consultation mobile

```
GIVEN un visiteur consulte / depuis un smartphone
WHEN  il navigue sur la page
THEN  le contenu est lisible et les actions accessibles sans défilement horizontal ni élément coupé
```

---

## 4. Périmètre

### ✅ Inclus

- Page d'accueil unique `/` : hero, pitch app courte, CTA désactivé "bientôt disponible", lien vers `/club/toulon`.
- Liens légaux (entité commerciale) en footer.

### ❌ Exclu (hors scope de cette US)

- Présentation complète des fonctionnalités de l'app (P1).
- Carte / interface multi-clubs (P1).
- Téléchargement réel de l'app (attend sa disponibilité).

---

## 5. Dépendances et contraintes

- **Tables BDD concernées** : aucune (contenu statique).
- **Endpoints existants utilisés** : aucun.
- **Intégrations tierces** : aucune.
- **Dépend d'autres US** : US-07 (liens légaux).
- **Bloque d'autres US** : aucune, mais fournit le point d'entrée de navigation vers US-02.

---

## 6. Notes UX/UI (si applicable)

Pas de charte graphique propre disponible côté app à ce stade (voir brief) — style minimal repris tel quel pour le P0, rebranding visuel en P1.

Maquettes : à produire par `designer` (document texte, canvas Pencil non retouché sauf instruction explicite).

---

## 7. Questions ouvertes

Aucune à ce stade — voir `00-brief-site-hybride.md` pour les dépendances externes transverses (validation juridique des pages légales référencées).

---

## 8. Prochaine étape

→ Invoquer `designer` pour le zoning détaillé.

---

## Historique

- 2026-08-12 — Création. Remplace le bloc "app Hybride" auparavant intégré à l'ancienne US-01/US-03 du périmètre "site club autonome".
