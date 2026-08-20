# Éditer les pages rituels — guide sans code

Ce dossier contient le texte des pages "La piste du lundi" et "Le Run chill du mercredi" (`/club/toulon/rituels/...`). Tu peux modifier ces fichiers directement sur github.com, dans le navigateur — pas besoin d'installer quoi que ce soit.

## Modifier un texte

1. Va sur la page du fichier concerné, par exemple :
   `github.com/hybrideappli-sport/hybride-page/blob/main/content/rituels/piste-du-lundi.md`
2. Clique sur l'icône crayon (en haut à droite du fichier) pour l'éditer.
3. Modifie le texte, puis descends en bas de page et clique sur **"Commit changes..."** (avec un message court du type "mise à jour texte piste du lundi").

Chaque fichier a deux parties :

- **En haut, entre les deux lignes `---`** : des informations courtes, une par ligne (jour, horaire, niveau, point de rendez-vous...). Ne touche pas au nom avant les deux-points (`title:`, `day:`, etc.), seulement à ce qui suit.
- **En dessous** : le texte libre de la page. Chaque paragraphe est séparé du suivant par une ligne vide — y compris un sous-titre : il doit toujours être suivi d'une ligne vide avant le texte qui vient après, sinon les deux se collent sur la page. Pour ajouter un sous-titre, écris-le en commençant par `## ` (par exemple `## L'ambiance`).

## Ajouter une photo

C'est en deux étapes, parce que GitHub sépare les fichiers de texte des fichiers d'image.

**Étape 1 — envoyer la photo :**

1. Va dans le dossier des photos du site (pas de sous-dossier par rituel — tout est au même endroit, comme les autres photos du site) :
   `github.com/hybrideappli-sport/hybride-page/tree/main/public/photos`
2. Clique sur **"Add file" → "Upload files"**.
3. Glisse ta photo dans la fenêtre (idéalement déjà compressée, quelques centaines de Ko à 1-2 Mo — pas un export brut d'appareil photo, ça ralentirait le site).
4. Donne-lui un nom qui commence par le nom du rituel, pour que ça reste lisible dans un dossier commun à tout le site : `piste-hero.jpg`, `piste-1.jpg`, `piste-2.jpg`... ou `run-chill-hero.jpg`, `run-chill-1.jpg`, etc.
5. Commit.

**Étape 2 — l'ajouter à la page :**

Retourne éditer le fichier `.md` du rituel (voir ci-dessus), et ajoute une ligne comme celle-ci, sur son propre paragraphe (ligne vide avant et après) :

```
![Description courte de la photo](nom-du-fichier.jpg)
```

Le texte entre crochets est ce qu'un lecteur d'écran lira à la place de l'image — décris ce qu'on voit, pas "photo 3". Le nom entre parenthèses doit être exactement celui du fichier envoyé à l'étape 1.

## La photo d'en-tête et la vignette de liste

Le champ `photo:` en haut du fichier (dans les `---`) sert à deux endroits : la miniature affichée sur `/club/toulon` et la photo en haut de la page du rituel. Mets-y le nom du fichier envoyé dans le dossier de photos, par exemple `photo: piste-hero.jpg`. `photoAlt:` est sa description pour un lecteur d'écran.

## Ajouter un lien dans un texte

Dans un paragraphe, écris `[texte du lien](adresse)` — par exemple `[le planning](/club/toulon/planning)`. Ça devient un lien cliquable sur la page, avec "texte du lien" affiché et souligné.

## Le champ `capacity:`

Optionnel — un plafond de places, s'il y en a un (par exemple `capacity: 15 personnes maximum`). Laisse-le vide s'il n'y a pas de limite fixe.

## Si un fichier ne s'affiche plus après une modification

Le format est volontairement simple mais strict sur un point : les champs `title`, `discipline`, `day`, `time`, `level` et `meetingPoint` (en haut du fichier) doivent tous avoir une valeur, sinon la page ne s'affiche pas. Si ça arrive, compare avec l'autre fichier `.md` du dossier pour repérer ce qui manque, ou demande de l'aide.
