# US-07 — Pages légales

> Fiche fonctionnalité SDD. Lecture seule pour tous les autres agents.
>
> Branche : `feature/US-07-pages-legales`
> Statut : ⏳ Specify

---

## 1. Contexte

L'association (loi 1901) et l'entité commerciale sont deux responsables de traitement distincts (décision 4 du brief). Cette séparation doit être visible et lisible pour l'utilisateur, pas seulement technique : deux jeux de pages légales, l'un pour l'association (accessible depuis `/club/*`), l'autre pour l'entité commerciale (accessible depuis `/` et le reste du site vitrine). Une page unique multi-entités a été explicitement écartée (décision 7) car elle brouillerait la distinction que le reste de l'architecture maintient.

---

## 2. User story

> **En tant que** visiteur du site
> **Je veux** trouver facilement les mentions légales et la politique de confidentialité de l'entité qui traite mes données selon la page où je me trouve
> **Afin de** savoir qui est responsable du traitement de mes données

---

## 3. Critères d'acceptation (Given-When-Then)

### AC1 — Pages légales de l'association sur les routes club

```
GIVEN un visiteur consulte /club/toulon ou une page liée (US-02, US-04, US-05)
WHEN  il clique sur le lien légal du footer
THEN  il accède aux mentions légales et à la politique de confidentialité de l'association
```

### AC2 — Pages légales de l'entité commerciale sur la vitrine app

```
GIVEN un visiteur consulte / ou une page de la vitrine app (US-01)
WHEN  il clique sur le lien légal du footer
THEN  il accède aux mentions légales et à la politique de confidentialité de l'entité commerciale
```

### AC3 — Politique de confidentialité de l'association documente la séparation

```
GIVEN un visiteur consulte la politique de confidentialité de l'association
WHEN  il cherche l'information sur le partage de ses données
THEN  le texte indique explicitement qu'aucune donnée d'inscription club n'est utilisée pour la prospection de l'abonnement app sans consentement dédié et explicite
```

### AC4 — Accès sans authentification

```
GIVEN un visiteur non connecté
WHEN  il accède à n'importe laquelle des 4 pages légales
THEN  la page s'affiche sans nécessiter de compte ni de connexion
```

---

## 4. Périmètre

### ✅ Inclus

- 4 pages statiques : mentions légales (association), politique de confidentialité (association), mentions légales (entité commerciale), politique de confidentialité (entité commerciale).
- Liens contextuels selon la route (`/club/*` vs `/` et le reste du site vitrine).

### ❌ Exclu (hors scope de cette US)

- Gestionnaire de contenu/CMS pour ces pages (contenu en dur au P0).
- CGU étendues ou FAQ juridique.

---

## 5. Dépendances et contraintes

- **Tables BDD concernées** : aucune (contenu statique).
- **Endpoints existants utilisés** : aucun.
- **Intégrations tierces** : aucune.
- **Dépend d'autres US** : aucune.
- **Bloque d'autres US** : référencée par US-01 et US-02 (liens footer).

---

## 6. Notes UX/UI (si applicable)

Contenu textuel simple, pas de dimension UI particulière au-delà du gabarit de page générique du site.

Maquettes : à produire par `designer` si un gabarit dédié est jugé nécessaire, sinon réutilisation du gabarit de page générique.

---

## 7. Questions ouvertes

- [ ] Contenu exact des 4 pages — rédaction et validation juridique, dépendance externe non tranchée par cette fiche.
- [ ] Durée de conservation de 3 ans proposée pour les données d'inscription club — à valider juridiquement avant lancement, impacte le texte de la politique de confidentialité de l'association.

---

## 8. Prochaine étape

→ Invoquer `designer` si un gabarit dédié est nécessaire, sinon directement `architect`.

---

## Historique

- 2026-08-12 — Création. Nouvelle US, absente du périmètre "site club autonome" (les pages légales n'y étaient pas explicitement spécifiées).
