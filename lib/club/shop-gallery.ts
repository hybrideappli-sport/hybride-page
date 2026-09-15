/**
 * Photos de la boutique — /club/[slug]/shop, à partir de l'ouverture.
 *
 * LISTE EXPLICITE, ET NON UNE LECTURE DE public/photos/shop/. Le dossier
 * pourrait être parcouru au build, mais quatre choses s'y opposent, et les
 * quatre se sont présentées le jour même de l'écriture de ce fichier :
 *
 * 1. L'ORDRE serait celui du système de fichiers — alphabétique sur des noms
 *    d'appareil photo. Personne ne choisirait ce qui passe en premier.
 * 2. LES DESCRIPTIONS deviendraient génériques. Le site décrit ses photos (voir
 *    les alt du hub), un lecteur d'écran n'a rien à faire de « photo 3 ».
 * 3. LES FICHIERS .heic DÉPOSÉS AU PASSAGE seraient ramassés et serviraient des
 *    cadres vides : aucun navigateur ne les rend de façon fiable. Trois
 *    traînaient dans le dossier ce jour-là.
 * 4. `public/` N'EST PAS GARANTI PRÉSENT dans le bundle serverless — c'est le
 *    piège déjà documenté dans next.config.ts pour content/rituels : « marche
 *    en local car tout le repo est sur disque, casse silencieusement sur Vercel
 *    sinon ».
 *
 * AJOUTER UNE PHOTO = UNE LIGNE ci-dessous, après l'avoir déposée dans
 * public/photos/shop/ en .jpg (jamais en .heic). L'ordre du tableau est celui
 * du carrousel.
 */
export interface ShopPhoto {
  src: string;
  /** Décrite pour qui ne la voit pas. Ce qu'on y porte compte plus que le décor. */
  alt: string;
}

/**
 * Photo d'ouverture, en grand au-dessus du carrousel. Se change en désignant
 * une autre entrée — c'est une ligne de configuration, pas un choix figé dans
 * le composant. Elle est exclue du carrousel automatiquement (voir
 * `galleryPhotos`), il n'y a donc rien à retirer ailleurs.
 */
export const SHOP_HERO_SRC = "/photos/shop/duo-bord-de-mer.jpg";

export const SHOP_PHOTOS: ShopPhoto[] = [
  {
    src: "/photos/shop/duo-bord-de-mer.jpg",
    alt: "Deux membres du club au bord de mer : l’un de face, logo H sur le tee-shirt noir, l’autre de dos, inscription Hybride Club Toulon",
  },
  {
    src: "/photos/shop/tee-shirt-rochers.jpg",
    alt: "Un tee-shirt noir du club déployé à bout de bras sur les rochers, au coucher du soleil",
  },
  {
    src: "/photos/shop/dos-casquette-rochers.jpg",
    alt: "Un membre du club de dos sur les rochers, ajustant sa casquette, tee-shirt noir floqué Hybride Club Toulon",
  },
  {
    src: "/photos/shop/tee-creme-bord-de-mer.jpg",
    alt: "Une membre du club de dos face à la mer, en tee-shirt crème du club",
  },
  {
    src: "/photos/shop/dos-herbe.jpg",
    alt: "Un membre du club assis de dos dans l’herbe, tee-shirt noir floqué Hybride Club Toulon",
  },
  {
    src: "/photos/shop/marches-escalier.jpg",
    alt: "Deux membres du club montant un escalier, en tee-shirt noir et en tee-shirt crème",
  },
  {
    src: "/photos/shop/allonges-herbe.jpg",
    alt: "Deux membres du club allongés dans l’herbe, en tee-shirt noir et en tee-shirt crème",
  },
  {
    src: "/photos/shop/portant-hot-girls-run.jpg",
    alt: "Un tee-shirt crème sur un portant au bord de mer, à côté d’un membre du club en tee-shirt noir",
  },
];

/** La photo d'ouverture, retrouvée par son `src`. */
export function heroPhoto(): ShopPhoto {
  return SHOP_PHOTOS.find((p) => p.src === SHOP_HERO_SRC) ?? SHOP_PHOTOS[0];
}

/** Toutes les autres, dans l'ordre du tableau — jamais la photo d'ouverture en double. */
export function galleryPhotos(): ShopPhoto[] {
  const hero = heroPhoto();
  return SHOP_PHOTOS.filter((p) => p.src !== hero.src);
}
