/**
 * Photos de la boutique — /club/[slug]/shop, à partir de l'ouverture.
 *
 * LISTE EXPLICITE, ET NON UNE LECTURE DE public/photos/. Le dossier pourrait
 * être parcouru, mais quatre choses s'y opposent, et les quatre se sont
 * présentées pendant la mise en place :
 *
 * 1. L'ORDRE serait celui du système de fichiers — alphabétique sur des noms
 *    d'appareil photo. Personne ne choisirait ce qui passe en premier.
 * 2. LES DESCRIPTIONS deviendraient génériques. Le site décrit ses photos, un
 *    lecteur d'écran n'a rien à faire de « photo 3 ».
 * 3. LES FICHIERS DÉPOSÉS AU PASSAGE seraient tous publiés — y compris les
 *    .heic, que le navigateur ne rend pas, et les prises qui cadrent mal une
 *    fois recadrées en carré. C'est cette liste qui permet d'en écarter.
 * 4. `public/` N'EST PAS GARANTI PRÉSENT dans le bundle serverless — le piège
 *    déjà documenté dans next.config.ts pour content/rituels.
 *
 * AJOUTER UNE PHOTO = UNE LIGNE, après l'avoir déposée en .jpg. L'ordre du
 * tableau est celui du carrousel — au premier rendu seulement, puisqu'il est
 * ensuite mélangé à chaque visite (voir ShopCarousel).
 *
 * LES PHOTOS DU STADE VIVENT DANS public/photos/, PAS DANS shop/ : elles
 * servent aussi la page du rituel piste, dont le format de référence est un nom
 * de fichier à plat (voir `photo` dans lib/rituals/content.ts). Les référencer
 * ici par leur chemin complet évite d'en garder deux copies.
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
export const SHOP_HERO_SRC = "/photos/shop/heroshop.jpg";

export const SHOP_PHOTOS: ShopPhoto[] = [
  {
    src: "/photos/shop/heroshop.jpg",
    alt: "Deux membres du club allongés dans l’herbe, l’un en tee-shirt noir au logo H, l’autre en tee-shirt crème floqué Hybride Club Toulon",
  },
  {
    src: "/photos/shop/duo-bord-de-mer.jpg",
    alt: "Deux membres du club au bord de mer : l’un de face, logo H sur le tee-shirt noir, l’autre de dos, inscription Hybride Club Toulon",
  },
  {
    src: "/photos/shop/tee-shirt-rochers.jpg",
    alt: "Un tee-shirt noir du club déployé à bout de bras sur les rochers, au coucher du soleil",
  },
  {
    src: "/photos/shop/dos-logo-mer.jpg",
    alt: "Un membre du club de dos face à la mer, grand floquage Hybride Club Toulon sur le tee-shirt noir",
  },
  {
    src: "/photos/shop/dos-casquette-rochers.jpg",
    alt: "Un membre du club de dos sur les rochers, ajustant sa casquette, tee-shirt noir floqué Hybride Club Toulon",
  },
  {
    src: "/photos/shop/duo-rochers.jpg",
    alt: "Deux membres du club sur les rochers au coucher du soleil, tee-shirts noirs floqués dans le dos",
  },
  {
    src: "/photos/shop/tee-creme-bord-de-mer.jpg",
    alt: "Une membre du club de dos face à la mer, en tee-shirt crème du club",
  },
  {
    src: "/photos/shop/tee-creme-dos.jpg",
    alt: "Une membre du club de dos sur les rochers, tee-shirt crème floqué Hybride Club Toulon",
  },
  {
    src: "/photos/shop/hot-girls-run-dos.jpg",
    alt: "Une membre du club de dos au bord de mer, tee-shirt noir floqué Hot Girls Run",
  },
  {
    src: "/photos/shop/hot-girls-run-rochers.jpg",
    alt: "Une membre du club de dos sur les rochers, tee-shirt noir floqué Hot Girls Run",
  },
  {
    src: "/photos/shop/dos-herbe.jpg",
    alt: "Un membre du club assis de dos dans l’herbe, tee-shirt noir floqué Hybride Club Toulon",
  },
  {
    src: "/photos/shop/dos-herbe-horizon.jpg",
    alt: "Un membre du club assis de dos dans l’herbe face à la mer, tee-shirt noir floqué Hybride Club Toulon",
  },
  {
    src: "/photos/shop/duo-accroupis-herbe.jpg",
    alt: "Deux membres du club de dos dans l’herbe face à la mer, tee-shirt noir floqué Hybride Club Toulon et tee-shirt beige au logo H",
  },
  {
    src: "/photos/shop/course-duo-bord-de-mer.jpg",
    alt: "Deux membres du club courant côte à côte au bord de mer au coucher du soleil, en tee-shirts noirs",
  },
  {
    src: "/photos/shop/portant-trois-tees.jpg",
    alt: "Trois tee-shirts du club sur un portant blanc, de nuit : crème et noir floqués Hot Girls Run, gris floqué Hybride Club Toulon",
  },
  {
    src: "/photos/shop/logo-h-empreinte-piste.jpg",
    alt: "Empreinte humide d’un tee-shirt du club sur le sol de la piste, le logo H resté en clair",
  },
  {
    src: "/photos/stade-duo-face.jpg",
    alt: "Deux membres du club sur la piste du stade, tee-shirt noir floqué Hybride Club Toulon et tee-shirt bleu au logo H",
  },
  {
    src: "/photos/stade-dos-collines.jpg",
    alt: "Deux membres du club de dos sur la piste, floquage Hybride dans le dos, collines à l’horizon",
  },
  {
    src: "/photos/stade-tee-lavande.jpg",
    alt: "Un tee-shirt lavande du club posé à plat sur la piste d’athlétisme",
  },
  {
    src: "/photos/stade-assises.jpg",
    alt: "Deux membres du club assises sur la piste, tee-shirt noir et tee-shirt crème floqué Hot Girls Run",
  },
  {
    src: "/photos/stade-etirements.jpg",
    alt: "Deux membres du club en étirements sur la piste, tee-shirt noir et tee-shirt crème floqué Hot Girls Run",
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
