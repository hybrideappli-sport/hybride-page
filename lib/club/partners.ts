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
  { id: "restauration", label: "Restauration" },
  { id: "sport", label: "Sport" },
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
  /** L'avantage adhérent, énoncé comme un fait. Voir l'avertissement ci-dessus. */
  benefit: string;
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
   * Page externe du partenaire (fiche Google, site). `null` tant qu'elle n'est
   * pas connue : le lien n'est simplement pas rendu, comme pour les liens
   * Strava et Instagram de la page. Ne JAMAIS y écrire une URL devinée — même
   * règle que HELLOASSO_SHOP_URL dans lib/config.ts.
   */
  url: string | null;
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
    /*
     * Lien de partage Google fourni par le client le 2026-09-10, vérifié :
     * il mène bien à la fiche « Little Bistrok Mourillon » (identifiant Google
     * /g/11x6l7jsx4). C'est un raccourci opaque — il ne porte aucun paramètre
     * en propre, mais la redirection qu'il déclenche aboutit à une URL Google
     * chargée de paramètres de suivi (`rlz`, `sxsrf`, `utm_source`) créés au
     * moment où le lien a été copié. Rien ne fuite depuis ce site — le lien
     * part en `rel="noopener noreferrer"` — mais si un lien plus propre est
     * souhaité un jour, c'est ici qu'il se remplace.
     */
    url: "https://share.google/59f39qXDEB7lAnN6F",
  },
  {
    slug: "la-lagune",
    name: "La Lagune",
    category: "restauration",
    description: "Restaurant à Six-Fours.",
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
    url: null,
  },
  {
    slug: "terre-de-running",
    name: "Terre de Running",
    category: "sport",
    description: null,
    benefit: "10 % de réduction pour les adhérents, sur présentation de la carte d’adhérent HelloAsso.",
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
    url: null,
  },
];
