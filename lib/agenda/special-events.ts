/**
 * Fiches spéciales — des sorties qui ne prennent PAS la fiche habituelle de
 * leur activité (2026-11-03, demande du client pour le Social run x Terre de
 * Running du 2 décembre : « pas la fiche de d'habitude »).
 *
 * POURQUOI PAS UNE CATÉGORIE DU TABLEUR. Une nouvelle valeur dans la colonne
 * « Activité » demanderait une couleur, un filtre du planning et du code à
 * chaque événement exceptionnel — et la sortie cesserait d'être un social run
 * dans la grille. Ici la sortie reste ce qu'elle est dans le tableur ; seule sa
 * page change. Une fiche spéciale se rattache à une sortie par son ADRESSE
 * (`slug`, la date puis le titre du tableur, comme dans /club/toulon/sorties/…).
 *
 * ATTENTION : si le titre change dans le tableur, l'adresse change, la fiche
 * ne trouve plus sa sortie et la page redevient la fiche habituelle — rien ne
 * casse, mais tout le contenu ci-dessous disparaît de la page.
 *
 * LE TEXTE N'EST PAS RELU DEPUIS LE TABLEUR : il est écrit ici, à partir de ce
 * que le tableur et le client en disaient le jour de la rédaction. Si l'after,
 * la remise ou l'accès changent, c'est ICI qu'il faut les changer.
 *
 * CE QUI NE DOIT PAS ARRIVER ICI, comme pour les partenaires
 * (lib/club/partners.ts) : faire d'un avantage une raison d'adhérer.
 * L'argument de l'adhésion est l'assurance, et lui seul. « Réservée aux
 * adhérents » est une condition d'accès, énoncée comme un fait — aucun lien
 * vers /adherer sur ces fiches.
 */
export interface SpecialEvent {
  /** Adresse de la sortie dans /club/toulon/sorties/… */
  slug: string;
  /**
   * Titre affiché à la place de celui du tableur — ici et sur la carte du
   * planning. Facultatif. Le titre du tableur reste, lui, ce qui fait
   * l'adresse : le changer là-bas détacherait la fiche (voir plus haut).
   */
  title?: string;
  /** Surtitre, au-dessus du titre — ici et sur la carte du planning. */
  eyebrow: string;
  /** Partenaire co-organisateur (slug de lib/club/partners.ts) : « H × son logo ». */
  partnerSlug?: string;
  /**
   * Mise en avant en haut du planning, À LA PLACE de la carte « Prochaine
   * soirée ». Une fois la sortie commencée, la carte revient d'elle-même à la
   * prochaine soirée.
   */
  featured: boolean;
  /**
   * Lieu affiché à la place de celui du tableur, quand on en a une écriture
   * vérifiée. Facultatif.
   */
  place?: string;
  /** Une phrase sous le titre. Reprise en description pour les aperçus de lien. */
  lead: string;
  /** Pastilles d'information, courtes, sous l'en-tête. */
  badges: string[];
  /** Le déroulé, dans l'ordre. `time` facultatif : on n'écrit pas une heure qu'on ne connaît pas. */
  program: { time?: string; title: string; text: string }[];
  /** Encadré mis en valeur (un chiffre, un titre, une phrase). */
  highlight?: { figure: string; title: string; text: string };
}

export const SPECIAL_EVENTS: SpecialEvent[] = [
  {
    slug: "2026-12-02-social-run-x-terre-de-running",
    title: "Social run × Terre de Running",
    eyebrow: "Sortie avec Terre de Running",
    partnerSlug: "terre-de-running",
    featured: true,
    /* Adresse de la fiche Google Maps vérifiée le 2026-10-14 (lib/club/partners.ts).
       Le tableur écrit « terre de runing, 375 avenue saint-just, 83130 La garde ». */
    place: "Terre de Running La Garde, 375 avenue Saint-Just, 83130 La Garde",
    lead: "On court ensemble depuis la boutique Terre de Running de La Garde, puis on y reste pour l’after : pizza, et toute la boutique à −20 %.",
    /* Sources : tableur (« Tous niveau », after, pizza, −20 %) et client le
       2026-11-03 (réservée aux adhérents, places illimitées). */
    badges: ["Réservée aux adhérents", "Places illimitées", "Tous niveaux"],
    program: [
      {
        time: "19:00",
        title: "Social run",
        text: "Départ de la boutique de La Garde. Tous niveaux, une heure.",
      },
      {
        title: "After dans la boutique",
        text: "On reste à la boutique après la course, autour de pizzas.",
      },
    ],
    highlight: {
      figure: "−20 %",
      title: "Sur toute la boutique, pendant l’after",
      text: "Chaussures, vêtements, accessoires : le moment parfait pour tes achats de Noël — pour toi, ou pour gâter un coureur.",
    },
  },
];

export function findSpecialEvent(slug: string): SpecialEvent | null {
  return SPECIAL_EVENTS.find((special) => special.slug === slug) ?? null;
}
