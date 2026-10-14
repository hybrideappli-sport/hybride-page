/**
 * Partenaires du club — contenu figé, comme le reste du site (ADR-010 : schéma
 * `club` dormant, Supabase retiré). Un tableau et pas des blocs écrits en dur
 * dans la page : d'autres partenaires suivront, et les ajouter doit rester une
 * entrée de données, pas une modification de composant.
 *
 * CE QUI NE DOIT PAS ARRIVER ICI : une formulation qui fait de l'avantage une
 * raison d'adhérer. L'argument de l'adhésion est l'assurance, et lui seul
 * (/club/toulon/adherer). `benefit` énonce un fait — ce à quoi un adhérent a
 * droit — jamais une incitation. Pas de « profite de », pas de « rien que pour
 * toi », et aucun lien vers l'adhésion dans cette section.
 */
/**
 * Catégories de partenaires. LISTE FERMÉE, sur le modèle de `ShopSeries`
 * (lib/club/shop-gallery.ts) : une faute de frappe créerait sinon, sans bruit,
 * une catégorie d'un seul partenaire. Une nouvelle catégorie = une valeur ici
 * ET une entrée dans `PARTNER_CATEGORIES` — le compilateur refuse l'un sans
 * l'autre (voir `satisfies` plus bas).
 */
export type PartnerCategory = "restauration" | "sport";

/**
 * Ordre d'affichage et libellés des catégories sur /club/[slug]/partenaires.
 * Une catégorie sans partenaire n'est pas rendue : on peut la déclarer avant
 * d'avoir signé avec qui que ce soit.
 */
export const PARTNER_CATEGORIES = [
  /* Sport en premier (2026-10-14) : c'est un club de sport. */
  { id: "sport", label: "Sport" },
  { id: "restauration", label: "Restauration" },
] as const satisfies readonly { id: PartnerCategory; label: string }[];

/* Garde d'exhaustivité : échoue à la compilation si une valeur de
   `PartnerCategory` manque dans `PARTNER_CATEGORIES` — ses partenaires ne
   seraient sinon jamais affichés, sans erreur. */
type MissingCategory = Exclude<PartnerCategory, (typeof PARTNER_CATEGORIES)[number]["id"]>;
const allCategoriesListed: [MissingCategory] extends [never] ? true : never = true;
void allCategoriesListed;

export interface Partner {
  /** Identifiant stable, sert de clé de rendu. */
  slug: string;
  name: string;
  /** Obligatoire — voir `PartnerCategory`. */
  category: PartnerCategory;
  /**
   * Ce qu'est le lieu, en une phrase. `null` tant que le client ne l'a pas
   * fournie : la ligne n'est alors pas rendue. Ne JAMAIS la rédiger à partir
   * de ce qu'on croit savoir du partenaire.
   */
  description: string | null;
  /**
   * L'avantage adhérent, énoncé comme un fait. Voir l'avertissement ci-dessus.
   * `null` tant que l'avantage n'est pas confirmé par le client : la ligne
   * n'est alors pas rendue. Ne JAMAIS le rédiger à sa place.
   */
  benefit: string | null;
  logo: {
    src: string;
    /** Dimensions réelles du fichier — next/image en a besoin pour réserver la place. */
    width: number;
    height: number;
    /**
     * Fond posé derrière le logo.
     *
     * `none` = le logo est posé directement sur le noir du site. C'est le cas
     * des logos qui portent déjà leur propre fond, comme celui de Little
     * Bistrok — les encadrer reviendrait à emballer un emballage.
     *
     * `light` existe pour le jour où un partenaire fournira un logo sombre ou
     * noir sur transparent, qui disparaîtrait réellement sur notre fond. Le
     * choix se fait alors partenaire par partenaire, sans toucher au composant.
     */
    background: "none" | "light";
  };
  /**
   * Adresses du partenaire, chacune avec sa fiche externe. Un tableau et non
   * une URL unique (2026-10-14) : Terre de Running a deux magasins, et un
   * partenaire à plusieurs adresses reste UNE carte — un seul avantage, un
   * seul logo. Deux entrées distinctes répéteraient l'un et l'autre, et le
   * bloc compact de /club/[slug] afficherait deux fois le même logo.
   *
   * Tableau vide tant qu'aucune fiche n'est connue : aucun lien n'est rendu.
   * Ne JAMAIS y écrire une URL devinée — même règle que HELLOASSO_SHOP_URL
   * dans lib/config.ts.
   *
   * FORMAT DES URL : celui, documenté et stable, de Google Maps —
   * `/maps/search/?api=1&query=<nom>&query_place_id=<Place ID>` (voir
   * `mapsUrl`). Jamais un raccourci `share.google` tel que fourni : un
   * raccourci peut cesser de fonctionner, et sa redirection aboutit à une
   * recherche Google chargée de paramètres de suivi.
   */
  locations: PartnerLocation[];
}

export interface PartnerLocation {
  /** Ville ou quartier, affiché dans le lien quand il y en a plusieurs (« Fiche La Garde ↗ »). */
  label: string;
  url: string;
}

/**
 * URL Google Maps d'une fiche, au format documenté par Google (Maps URLs).
 * `query` sert de repli si le Place ID venait à ne plus être reconnu : on y met
 * le nom du lieu, pas une adresse, pour retomber sur la même fiche.
 *
 * Les Place ID ci-dessous ont été obtenus le 2026-10-14 depuis la fiche Maps
 * de chaque lieu, atteinte par le raccourci fourni par le client (identifiant
 * `/g/…` identique), puis vérifiés en ouvrant l'URL avec une requête vague
 * (`query=Toulon`) : seul le Place ID pouvait alors désigner la bonne fiche.
 */
function mapsUrl(query: string, placeId: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&query_place_id=${placeId}`;
}

export const PARTNERS: Partner[] = [
  {
    slug: "little-bistrok",
    name: "Little Bistrok",
    category: "restauration",
    description: "Bar à tapas, vins, cocktails et bières, au cœur du Mourillon.",
    /* Espace INSÉCABLE avant le symbole € (U+00A0) : à 375px la ligne se
       coupait entre « 6,50 » et « € », ce qui ne se fait pas en français.
       Ne pas la remplacer par une espace ordinaire en réécrivant la phrase. */
    benefit: "Pintes de bière et mocktails à 6,50 € pour les adhérents, sur présentation de la carte d’adhérent HelloAsso.",
    logo: {
      src: "/partenaires/little-bistrok.png",
      width: 1195,
      height: 1855,
      background: "none",
    },
    /* 84 rue Muiron, Toulon — /g/11x6l7jsx4. Remplace le raccourci
       share.google/59f39qXDEB7lAnN6F fourni le 2026-09-10. */
    locations: [{ label: "Mourillon", url: mapsUrl("Little Bistrok Mourillon", "ChIJAxcyQ_4byRIRbPO7syBywFo") }],
  },
  {
    slug: "la-lagune",
    name: "La Lagune",
    category: "restauration",
    description: "Une pause ensoleillée, une ambiance détendue, un vrai goût de la Méditerranée.",
    /* Espaces INSÉCABLES entre « 10 » et « % » (U+00A0) : même règle que le
       « 6,50 € » de Little Bistrok. */
    benefit: "10 % de réduction sur l’addition pour les adhérents, sur présentation de la carte d’adhérent HelloAsso.",
    logo: {
      /*
       * Recadré le 2026-10-14 depuis le JPG fourni (1179×1156, dont 60 % de
       * marge) au plus près du logo, coins arrondis découpés dans le fichier
       * — même rayon apparent (10px à 72px de haut) que le fond `light`.
       * Le fichier porte son propre fond blanc cassé : `none`, comme Little
       * Bistrok. L'original n'est pas publié.
       */
      src: "/partenaires/la-lagune.png",
      width: 482,
      height: 240,
      background: "none",
    },
    locations: [
      /* Presqu'île du Gaou, Six-Fours-les-Plages — /g/11c44d5rn6
         (share.google/A7ckcBCb0Bidcq5S7). Une seule adresse : le lien
         s'affiche « Voir la fiche », le libellé ne sert qu'à partir de deux. */
      { label: "Six-Fours", url: mapsUrl("La Lagune Restaurant - Bar", "ChIJl9DwKnUByRIRL1CDXnFhDC8") },
    ],
  },
  {
    slug: "terre-de-running",
    name: "Terre de Running",
    category: "sport",
    /* Espace INSÉCABLE avant le deux-points (U+00A0), même règle que le « % ». */
    description: "Toute la panoplie du coureur : chaussures, vêtements, accessoires.",
    benefit: "10 % sur les achats en magasin pour les adhérents, sur présentation de la carte d’adhérent HelloAsso.",
    logo: {
      /*
       * Noir sur fond transparent : il disparaît sur le noir du site. Fond
       * `light` en attendant une version blanche du logo — le jour où elle
       * arrive, remplacer le fichier et repasser à `none`.
       */
      src: "/partenaires/terre-de-running.png",
      width: 1045,
      height: 434,
      background: "light",
    },
    locations: [
      /* 7 bis rue Berthelot, Toulon — /g/1v_qr4jp (share.google/M8ITm4NpKlr3K4iPT). */
      { label: "Toulon", url: mapsUrl("Terre de Running Toulon", "ChIJGaX39A4byRIRmPugM830TFA") },
      /* 375 avenue Saint-Just, La Garde — /g/11hf27m4fs (share.google/mF0PQf7DJtYUjJYvS). */
      { label: "La Garde", url: mapsUrl("Terre de Running La Garde", "ChIJtUzm47cZyRIRYJVAxAPj1FI") },
    ],
  },
  {
    slug: "g-apero",
    /* « G.APERO », graphie de leur communication (confirmée le 2026-10-14). */
    name: "G.APERO",
    category: "restauration",
    description: "Planches gourmandes, produits frais et régionaux. Un lieu pour se retrouver autour d’un verre après la sortie.",
    /* Conditions confirmées le 2026-10-14 : les mêmes que La Lagune.
       Espace INSÉCABLE entre « 10 » et « % » (U+00A0). */
    benefit: "10 % de réduction sur l’addition pour les adhérents, sur présentation de la carte d’adhérent HelloAsso.",
    logo: {
      /*
       * Blanc sur un carré noir pur (#000000, identique au fond du site) : le
       * carré se fond dans la page, seuls le G et « APERO » ressortent —
       * `none`. Réduit de 1440 à 400px de large le 2026-10-14 ; l'original
       * n'est pas publié. Si le fond du site change un jour, ce carré
       * réapparaîtra.
       */
      src: "/partenaires/g-apero.jpg",
      width: 400,
      height: 398,
      background: "none",
    },
    locations: [
      /* 279 Littoral Frédéric Mistral, Toulon — /g/11z309v2kq (share.google/TkfO5DHK17210XO9l). */
      { label: "Toulon", url: mapsUrl("G.APERO Toulon", "ChIJOa0TIewbyRIRrIWURwto__I") },
    ],
  },
];
