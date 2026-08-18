# Fichiers de référence visuelle — ce qu'ils font foi, ce qu'ils ne font pas foi

Ce dossier contient des fichiers `.html` statiques (`direction-visuelle-sombre.html`, `direction-visuelle-accueil.html`) produits comme aperçus visuels, à ouvrir dans un navigateur pour juger d'un rendu — jamais exécutés, jamais servis par l'application.

**Règle, valable pour tous les fichiers de ce dossier, présents et à venir :**

- **Font foi pour le VISUEL** : tokens de couleur, typographies, espacements, rayons, mise en page, comportements d'interaction décrits (survol, dégradés). Un token présent ici (`--hy-course`, `--hy-radius-card`, etc.) est une valeur validée, à porter telle quelle dans `app/globals.css`.
- **Ne font PAS foi pour le CONTENU** : tout texte qui ressemble à une donnée réelle — horaires, lieux, noms de séances, listes de catégories/disciplines, prix — peut être du remplissage inventé pour que la maquette ait l'air remplie, sans avoir été vérifié ni décidé comme donnée produit.

**Pourquoi cette règle existe** : la liste de disciplines de la première référence (`direction-visuelle-sombre.html`) montrait 5 valeurs, dont "rando", qui ont été prises pour du contenu de remplissage et écartées au profit d'une liste à 4 valeurs dans le schéma (`club.activities`, migration `20260812093100`). C'était l'inverse de la réalité : la liste à 5 valeurs (course, vélo, eau, montagne, collectif) était la bonne, corrigée le 2026-08-17 (`club.disciplines`, voir `components/ui/Tag.tsx`). Un aller-retour évitable si la règle ci-dessus avait été appliquée dès le départ.

**En pratique** : si un fichier de ce dossier contredit ce qui est déjà décidé dans le brief, le PRD, les fiches `docs/features/US-*.md` ou le schéma — c'est le fichier `.html` qui a tort sur le contenu, jamais l'inverse. En cas de doute sur ce qui est "visuel" et ce qui est "contenu", demander plutôt que trancher seul.
