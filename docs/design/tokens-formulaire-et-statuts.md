# Tokens conçus — formulaires et états d'inscription

> `docs/design/direction-visuelle-sombre.html` ne couvre ni les formulaires ni les états d'inscription. Ce document justifie les tokens ajoutés dans `app/globals.css` pour ces deux besoins P0. Règle suivie : aucune nouvelle teinte, chaque valeur référence une couleur déjà définie dans la référence ; contraste AA vérifié par calcul, pas supposé.

---

## 1. Tokens de formulaire

| Token | Valeur | Usage |
|---|---|---|
| `--hy-field-bg` | `--hy-surface-2` (#1C1E21) | Fond de champ au repos — plus clair que `--hy-bg`, cohérent avec `.ritual .photo` qui utilise déjà surface-2 comme aire de contenu distincte du fond de page. |
| `--hy-field-bg-disabled` | `--hy-surface-1` (#131416) | Recul visuel supplémentaire à l'état désactivé. |
| `--hy-field-border` | `--hy-line` (#2A2D30) | Bordure au repos — la bordure par défaut de toute la référence (`.day`, `.ritual`, `.hero-photo`). |
| `--hy-field-border-hover` | `--hy-line-2` (#3D4145) | Même reprise que `.day:hover { border-color: var(--hy-line-2) }`. |
| `--hy-field-border-focus` | `--hy-violet` (#B79CFF) | Identique à `.btn:focus-visible`. |
| `--hy-field-border-disabled` | `--hy-line` | Pas de changement visuel de bordure à l'état désactivé — seul le fond et le texte reculent. |
| `--hy-field-text` | `--hy-text-1` (#F5F2ED) | Texte saisi. |
| `--hy-field-placeholder` / `--hy-help-text` | `--hy-text-3` (#6D7478) | Placeholder et texte d'aide — le ton le plus discret déjà utilisé pour `.note`/`.eyebrow`. |
| `--hy-field-text-disabled` | `--hy-text-3` | Texte désactivé, même ton que l'aide (signal "inerte"). |
| `--hy-danger` / `--hy-danger-bg` | `--hy-run` / `--hy-run-bg` | Erreur de formulaire — alias sémantique de la paire "course", pas une nouvelle teinte. Voir §3 pour la justification du choix. |
| `--hy-focus-ring-*` | `3px solid var(--hy-violet)`, offset `3px` | Factorisation de `.btn:focus-visible`, réutilisée par tous les éléments interactifs (champs compris). |

### Vérification de contraste (AA)

Calculs WCAG 2.1 (luminance relative sRGB → ratio `(L1+0.05)/(L2+0.05)`) :

| Paire | Ratio | Seuil | Résultat |
|---|---|---|---|
| `--hy-text-1` (#F5F2ED) sur `--hy-field-bg` (#1C1E21) — texte saisi | 15.9:1 | 4.5:1 (texte normal) | ✅ |
| `--hy-text-3` (#6D7478) sur `--hy-field-bg` (#1C1E21) — placeholder/aide | 3.4:1 | 3:1 (texte large) / — (placeholder, non normatif) | ✅ pour usage aide/label ; un placeholder seul (sans label visible) resterait sous 4.5:1, d'où la règle "jamais de placeholder seul" déjà actée dans `docs/architecture.md` §4 |
| `--hy-danger` (#FF8A5B) sur `--hy-bg` (#000000) — message d'erreur pleine page | 9.0:1 | 4.5:1 | ✅ |
| `--hy-danger` (#FF8A5B) sur `--hy-field-bg` (#1C1E21) — bordure/texte d'erreur sur champ | 7.2:1 | 4.5:1 (texte) / 3:1 (bordure) | ✅ |
| `--hy-violet` (#B79CFF) sur `--hy-bg` (#000000) — bordure de focus | 3:1 requis pour un indicateur non-texte | ~9.6:1 | ✅ largement |

Aucune paire sous le seuil applicable.

---

## 2. États d'inscription (4, distincts sans la couleur seule)

Le formulaire d'inscription (US-04) et le dashboard admin (US-06) ont besoin de distinguer `confirmed` / `waitlist` / `pending_parental_authorization` / `cancelled`. La référence ne montre que deux états informels ("places restantes" en chiffre, "complet" en texte). Design retenu, `RegistrationStatusBadge` :

| État | Couleur | Fond | Signifiant non-couleur |
|---|---|---|---|
| **Confirmée** | `--hy-violet` | `--hy-violet-bg` | Icône coche pleine |
| **Liste d'attente** | `--hy-text-1` | `--hy-surface-2` | Icône sablier/horloge |
| **En attente parentale** | `#12232B` (littéral, voir note) | `--hy-cream` | Icône enveloppe + le chip le plus visuellement distinct des quatre (seul moment clair, comme le bandeau) |
| **Annulée** | `--hy-text-3` | `--hy-surface-1` | Texte barré (`text-decoration: line-through`) + icône croix |

**Pourquoi pas les couleurs de discipline (course/vélo/natation/renfo/rando) ?** Elles servent déjà à indiquer le *sport* d'un événement (tags `.t-run`, `.t-bike`, etc.) et apparaîtraient probablement sur la même carte qu'un badge de statut — les réutiliser pour le statut aurait créé une ambiguïté ("badge bleu = natation ou liste d'attente ?"). Les 4 états puisent donc dans violet/texte/surfaces/crème, jamais dans la palette disciplines.

**Sur `#12232B`** : cette valeur apparaît déjà deux fois dans la référence (`.band { color }`, `.band .btn { background }`), toujours en association avec `--hy-cream`, mais n'y est **pas** promue en variable `:root` — délibérément scopée au bandeau selon toute vraisemblance. Choix suivi ici : reprise du même littéral, non ajoutée à `@theme` comme un token global, exactement comme dans la référence. Pas une couleur nouvelle — une réutilisation ponctuelle d'une valeur déjà écrite deux fois dans le fichier source.

---

## 3. Pourquoi `--hy-run` pour l'erreur

Aucune teinte "danger" n'existe dans la référence. Parmi les couleurs disponibles, `--hy-run` (orange) est la seule dont la lecture conventionnelle (alerte/attention) est proche du besoin — le violet et le crème lisent comme positif/neutre, le bleu/vert/jaune des autres disciplines n'ont pas cette connotation. Le choix suit aussi le motif déjà établi par la référence : chaque couleur vient en paire teinte claire + fond profond (`--hy-run`/`--hy-run-bg`), et `--hy-danger`/`--hy-danger-bg` ne fait qu'aliaser cette paire existante plutôt que d'en inventer une nouvelle.

Limite assumée : dans un écran qui affiche à la fois une erreur de formulaire et une carte "course" (peu probable au P0, aucun écran ne combine les deux), le rapprochement visuel serait fortuit mais pas trompeur — les deux usages ne cohabitent jamais dans le même composant.
