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
export interface Partner {
  /** Identifiant stable, sert de clé de rendu. */
  slug: string;
  name: string;
  /** Ce qu'est le lieu, en une phrase. */
  description: string;
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
];
