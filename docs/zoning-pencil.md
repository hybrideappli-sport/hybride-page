# Zoning Pencil — Site Hybride (vitrine app + points club)

> Wireframes **bas-fidélité** (structure/UX uniquement). Document texte réécrit pour le périmètre restructuré (7 US P0, voir `00-brief-site-hybride.md` et `docs/PRD.md`).
>
> Version : 2.1 — 2026-08-12
> Statut : ✅ Canvas Pencil reconstruit — 13 écrans posés et vérifiés (structure + captures d'écran de contrôle)
>
> **Amendement 2026-08-19** : bascule de saison, voir **ADR-010**. Les écrans C1-C3 (compte), D1-D3 (inscription), E1 (autorisation parentale), F1-F3 (dashboard admin) décrivent des parcours retirés du site. A1, B1, G1 restent d'actualité. Document conservé tel quel comme trace du zoning bas-fidélité initial.

---

## Lien

- Outil : Pencil
- Fichier `.pen` : `/Users/este/.pencil/documents/e5b2bdc6-927e-4b37-b751-9b35be0e6963/pencil-new.pen` — reconstruit pour le périmètre v2.0 (7 US, 13 écrans). Les 8 composants réutilisables ont été conservés tels quels (toujours valables), les 11 écrans de l'ancien périmètre "site club autonome" ont été supprimés et remplacés.
- Format cible : mobile **375 × 812**, cohérent avec le zoning de l'app (`/Users/este/Hybride/hybrideappli/05-zoning-pencil.md`).
- Toujours pas de charte graphique définitive disponible côté app (`globals.css` = scaffold Next.js par défaut) — voir §Design tokens.

---

## Convention — 6 symboles

Inchangée par rapport à la version précédente, pour cohérence avec le zoning de l'app :

| # | Élément | Représentation |
|---|---|---|
| 1 | Visuels / photos | Rectangle gris + label « Image » |
| 2 | Bouton principal | Fond orange `#FB923C` (convention provisoire, pas une couleur de marque validée) |
| 3 | Bouton secondaire | Contour seul, sans fond |
| 4 | Champ de formulaire | Contour + label « Champ : … » |
| 5 | Composant réutilisable | Contour + label « Composant : … » |
| 6 | Fond / décor | Headers et bandeaux gris clair |

---

## Organisation du canvas (à reconstruire)

7 sections, une par US P0, empilées verticalement.

| Section | US | Écrans |
|---|---|---|
| Section 1 | US-01 — Vitrine app | A1 |
| Section 2 | US-02 — Point club Toulon | B1 |
| Section 3 | US-03 — Compte utilisateur | C1, C2, C3 |
| Section 4 | US-04 — Inscription à une sortie | D1, D2, D3 |
| Section 5 | US-05 — Validation parentale | E1 |
| Section 6 | US-06 — Dashboard admin club | F1, F2, F3 |
| Section 7 | US-07 — Pages légales | G1 (gabarit réutilisé × 4 contenus) |

**Total : 13 écrans** (contre 11 dans l'ancien zoning — la différence nette reflète +6 nouveaux écrans (auth ×3, validation parentale, mes inscriptions, légal) et −4 écrans fusionnés/reportés (ex-A2 en P1, ex-A3 fusionné dans B1, ex-C1 fusionné dans C2, ex-B1 fusionné dans B1 nouveau)).

---

## Section 1 — US-01 Vitrine app

### A1 — Accueil (`/`)

- Header gris clair : logo texte « Hybride »
- Rectangle gris + label « Image » (hero)
- Titre H1 + sous-titre UVP app (coach IA)
- Bouton principal : « Découvrir le club de Toulon » → B1
- Bouton **désactivé** : « Télécharger l'app — bientôt disponible »
- Footer gris clair : lien « Mentions légales » / « Politique de confidentialité » → G1 (variante entité commerciale)

---

## Section 2 — US-02 Point club Toulon

### B1 — Page club (`/club/toulon`)

Écran long à ancres plutôt que plusieurs pages séparées (fusion des anciens A1/A3/B1).

- Header gris clair : logo + retour vers A1
- Rectangle gris + label « Image » (hero club)
- Titre H1 « Hybride Club Toulon » + sous-titre disciplines (course à pied, vélo, eau, montagne, collectif)
- Bouton secondaire : « Adhérer au club » (lien externe HelloAsso)
- Bloc « Infos pratiques » : contact, où nous trouver — lignes libellé/valeur + « Composant : Image » (carte/plan statique)
- Bloc « Prochaines sorties » (agenda, filtré club_id) : « Composant : Carte événement » × N — activité, date, heure, badge places restantes/complet, → D1
- Footer gris clair : lien « Mentions légales » / « Politique de confidentialité » → G1 (variante association)

---

## Section 3 — US-03 Compte utilisateur

### C1 — Création de compte

- Header gris clair : « Créer un compte »
- Champ : Prénom
- Champ : Nom
- Champ : Date de naissance
- Champ : Email
- Champ : Mot de passe
- Bouton principal : « Créer mon compte » → retour au parcours en cours (ex. D1) ou C2 si créé hors contexte
- Lien texte secondaire : « J'ai déjà un compte » → C2

### C2 — Connexion

- Header gris clair : « Se connecter »
- Champ : Email
- Champ : Mot de passe
- Bouton principal : « Se connecter » → redirection contextuelle (parcours en cours, ou F1 si rôle club_admin)
- Lien texte secondaire : « Mot de passe oublié » → C3
- Lien texte secondaire : « Créer un compte » → C1
- Note : écran unique pour le public et les admins — la redirection dépend du rôle, pas de l'écran.

### C3 — Mot de passe oublié

- Header gris clair : « Mot de passe oublié »
- Champ : Email
- Bouton principal : « Envoyer le lien » → état de confirmation (« email envoyé »)

---

## Section 4 — US-04 Inscription à une sortie

### D1 — Détail d'un événement + formulaire d'inscription

- Header gris clair : retour + nom de l'activité
- Rectangle gris + label « Image »
- Bloc détail (lignes libellé/valeur) : date, heure, lieu de RDV, niveau requis, capacité, **places restantes**
- Bandeau d'état conditionnel : « X places restantes » / « Complet — inscription en liste d'attente »
- Section « S'inscrire » :
  - Si non connecté : bouton principal « Se connecter ou créer un compte pour t'inscrire » → C1/C2, retour automatique sur D1 après authentification
  - Si connecté : aucun champ à ressaisir (prénom/nom/date de naissance déjà portés par le compte), bouton principal « Je m'inscris » → D2
- Note état erreur : ré-inscription à une sortie déjà annulée acceptée (pas de message de blocage) ; inscription en doublon sur une inscription active bloquée avec message explicite

### D2 — Confirmation d'inscription

- Header gris clair
- Titre : « Inscription confirmée ! » / « Tu es en liste d'attente » / « En attente de l'autorisation d'un parent » (3 variantes selon le statut retourné)
- Bloc récapitulatif : activité, date, heure, lieu
- Bloc explicatif liste d'attente (variante) : position non affichée (pas de position stockée), message générique « tu seras confirmé automatiquement si une place se libère »
- Bloc explicatif attente parentale (variante) : « Un email a été envoyé à ton parent, tu as une réponse sous 48h »
- Bouton secondaire : « Voir mes inscriptions » → D3
- Bouton secondaire : « Voir les autres sorties » → B1

### D3 — Mes inscriptions (espace membre)

Remplace l'ancien écran "annulation via lien unique sans compte" de l'ancien périmètre — l'annulation vit désormais dans le compte.

- Header gris clair : « Mes inscriptions »
- Liste : « Composant : Ligne inscription » × N — activité, date, statut (confirmée / liste d'attente / en attente d'autorisation parentale), bouton secondaire « Annuler » (avec confirmation)
- État vide : « Aucune inscription pour le moment » + bouton secondaire vers B1

---

## Section 5 — US-05 Validation parentale

### E1 — Validation parentale (vue du parent, sans compte)

Écran atteint depuis le lien unique de l'email — aucune authentification.

- Header gris clair : « Autorisation parentale »
- Bloc récapitulatif : prénom de l'enfant, activité, date, heure, lieu
- Bloc explicatif conditionnel (<15 ans) : « Composant : Double consentement » — texte RGPD (traitement des données de l'enfant) + texte autorisation sportive, une seule validation couvre les deux
- Bloc explicatif conditionnel (15-17 ans) : texte autorisation sportive seul
- Bouton principal : « Autoriser » → écran de confirmation (« Autorisation enregistrée, merci »)
- Bouton secondaire : « Refuser » → écran de confirmation (« Refus enregistré, la place a été libérée »)
- État lien expiré/déjà traité (variante notée) : message explicite, plus d'action possible

---

## Section 6 — US-06 Dashboard admin club

### F1 — Liste des événements (admin)

- Header gris clair : « Mes sorties » (club de l'admin connecté) + déconnexion
- Bouton principal : « + Créer une sortie » → F2
- Liste : « Composant : Carte événement admin » × N — date, activité, lieu, compteur « X confirmés · Y en attente · Z en attente parentale », chevron → F3, action secondaire « Annuler » (avec confirmation + note « les inscrits seront notifiés »)
- État vide : « Aucune sortie à venir » + bouton principal vers F2

### F2 — Création d'un événement

Pas d'édition au P0 — écran de création uniquement.

- Header gris clair : « Nouvelle sortie »
- Champ : Activité (sélecteur)
- Champ : Date
- Champ : Heure
- Champ : Lieu de rendez-vous
- Champ : Niveau requis
- Champ : Capacité maximale
- Bouton principal : « Publier la sortie » → F1
- Note : pas de bouton "modifier" une fois publié — correction exceptionnelle hors périmètre applicatif au P0

### F3 — Inscrits et liste d'attente

- Header gris clair : retour + activité + date
- Bandeau récapitulatif : lieu, heure, « X confirmés · Y en attente · Z en attente parentale »
- Barre d'actions : bouton secondaire « Exporter CSV » (génération à la demande, pas de fichier stocké), bouton secondaire « + Ajouter un participant »
- Section « Confirmés » : « Composant : Ligne participant » × N — prénom nom, email, bouton secondaire « Retirer »
- Section « Liste d'attente » : « Composant : Ligne participant » × N — prénom nom, email (pas de numéro de position affiché, ordre chronologique implicite)
- Section « En attente d'autorisation parentale » (nouveau, 3e état) : « Composant : Ligne participant » × N — prénom nom, statut du hold (temps restant avant expiration)
- État vide : « Personne d'inscrit pour le moment »

---

## Section 7 — US-07 Pages légales

### G1 — Page légale (gabarit générique, réutilisé × 4)

- Header gris clair : titre de la page (« Mentions légales » / « Politique de confidentialité »)
- Bloc texte long (contenu à fournir, hors zoning)
- Footer gris clair
- 4 instances : mentions légales association, politique de confidentialité association (mentionne explicitement la non-réutilisation des données club pour la prospection app), mentions légales entité commerciale, politique de confidentialité entité commerciale.

---

## Connecteurs — parcours par persona

**Sofia (découverte → essai)** : `A1` → *« découvrir le club »* → `B1` → *« choisir une sortie »* → `D1` → *« se connecter/créer un compte »* → `C1`/`C2` → retour `D1` → *« s'inscrire »* → `D2`

**Léa (inscription rapide, déjà connectée)** : `B1` → *« sortie de jeudi »* → `D1` → *« s'inscrire »* → `D2` → *(plus tard)* `D3` → *« annuler »*

**Mineur** : `D1` → *« s'inscrire »* → `D2` (variante attente parentale) → *(parent, canal email)* `E1` → *« autoriser »* → mise à jour visible sur `D3`

**Marc (organisation hebdomadaire)** : `C2` (rôle club_admin) → `F1` → *« créer une sortie »* → `F2` → *« publier »* → retour `F1` → *« ouvrir une sortie »* → `F3` → *« exporter CSV »* / *« retirer un participant »*

**Lien inter-sections** : `F2` *« publier »* → l'événement devient visible sur `B1` (agenda public).

---

## États à couvrir par `developer`

Non zonés individuellement (bas-fidélité), mais à implémenter :

- **Inscription** : confirmed, waitlist, pending_parental_authorization, cancelled.
- **Autorisation parentale** : pending, confirmed, denied, expired — messages distincts pour denied vs expired.
- **Boutons** : default, hover, focus visible, active, disabled (CTA app « bientôt disponible », bouton d'inscription si non connecté), loading (soumission de formulaire).
- **Champs** : default, focus, rempli, erreur, disabled.
- **Listes** : chargement, vide, erreur de chargement.
- **Événement** : places disponibles, complet, annulé, passé.

## Accessibilité — exigences minimales

Inchangées par rapport à la version précédente : contraste WCAG AA (à revalider une fois la charte définitive posée), focus clavier visible, labels explicites (jamais de placeholder seul), erreurs liées au champ (`aria-describedby`, `aria-live`), navigation clavier complète, cibles tactiles ≥ 44×44 px, pas de défilement horizontal.

## Design tokens

**Toujours aucun token définitif** — voir brief : le style minimal actuel de l'app est repris tel quel pour le P0, le rebranding visuel est un chantier P1 explicite, découplé de la date de lancement. `#FB923C` reste une convention de wireframe, à ne pas reprendre en dur dans le code.

---

## Historique

- 2026-08-11 — Création par `designer` (version 1.0). Zoning bas-fidélité "site club autonome", 11 écrans, 3 sections.
- 2026-08-11 — Tentative de création du `.pen` sur un mauvais canvas (incident, annulé), puis création réussie sur le canvas dédié de l'utilisateur — toujours au périmètre "site club autonome".
- 2026-08-11 — Ajout d'un tableau sommaire P0/P1 suite à la restructuration du périmètre (v1.2), sans réécriture détaillée.
- 2026-08-12 — Réécriture complète (v2.0) pour les 7 US P0 du périmètre restructuré (vitrine app + point club Toulon multi-tenant + compte obligatoire + validation parentale + dashboard admin + pages légales).
- 2026-08-12 — Canvas Pencil reconstruit (v2.1) : les 11 écrans de l'ancien périmètre supprimés, les 8 composants réutilisables conservés, les 13 écrans du périmètre v2.0 posés et vérifiés (structure top-level relue, capture d'écran de contrôle sur F3).
- 2026-08-17 — Connecteurs des 4 parcours persona (Sofia, Léa, mineur, Marc) et du lien inter-sections F2→B1 posés sur le canvas, une couleur par persona + légende. Un premier essai a produit de gros blocs de couleur pleins (bug : remplissage appliqué à un sous-chemin SVG en coude, refermé implicitement) ; corrigé en séparant systématiquement le trait (contour seul) de la pointe de flèche (triangle rempli) en deux nœuds distincts. Vérification structurelle (zéro conflit de layout) et confirmation visuelle par l'utilisateur (le handler `get_screenshot` du MCP Pencil étant resté indisponible côté agent tout du long).
