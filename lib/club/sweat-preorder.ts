/**
 * Précommande du sweat à capuche Hybride, édition limitée (2026-11-24).
 *
 * SOURCE UNIQUE des prix, des échéances et du texte produit. Bannière, encart
 * du planning, section de l'accueil, carte du shop et fiche produit lisent
 * tous ici — aucun prix n'est écrit dans un composant.
 *
 * Module PUR : aucune dépendance à React, importable par un composant serveur
 * comme par un composant client. Le hook qui suit l'horloge du visiteur vit
 * dans lib/club/use-sweat-offer.ts, pour la même raison que lib/countdown.ts
 * et lib/use-countdown.ts sont séparés.
 */

export type SweatPreorderPhase = "early" | "standard" | "closed";

/**
 * Bascules, ISO 8601 avec DÉCALAGE EXPLICITE comme toutes les échéances du site
 * (voir SHOP_OPENING_TO dans lib/config.ts). Décembre est en heure d'hiver :
 * `+01:00`.
 *
 * Bornes EXCLUSIVES, posées à minuit le lendemain : « jusqu'au 8 décembre
 * inclus » veut dire que le 8 à 23h59 on paie encore 36 €. Une borne à
 * 23:59:59 laisserait une seconde sans palier.
 */
export const SWEAT_EARLY_UNTIL = "2026-12-09T00:00:00+01:00";
export const SWEAT_PREORDER_UNTIL = "2026-12-16T00:00:00+01:00";

const EARLY_PRICE = 36;
const STANDARD_PRICE = 38; // 39 € initialement, ramené à 38 € par le client le 2026-11-24.

export interface SweatPreorderOffer {
  phase: SweatPreorderPhase;
  /** Prix courant en euros, `null` une fois la précommande fermée. */
  price: number | null;
  /** « 36 € » — prêt à afficher. */
  priceLabel: string | null;
  /** Nom court de l'offre du moment : « Prix de lancement », « Dernière semaine »… */
  offerLabel: string;
  /**
   * Ce que le palier annonce, en une phrase, affichée SOUS la pastille de prix.
   *
   * UN SEUL PRIX COURANT PAR PAGE (2026-11-24) : la pastille porte le prix du
   * moment, cette phrase ne le répète jamais. Au palier de lancement elle
   * annonce le suivant (« puis 38 € à partir du 9 décembre ») — c'est la seule
   * autre somme affichée, et elle dit autre chose : la hausse.
   */
  offerDetail: string;
  /** Fin du palier courant (ISO), cible du compte à rebours. `null` une fois fermée. */
  endsAtIso: string | null;
  /** Devant le décompte du palier — sans montant, la pastille et `offerDetail` les portent déjà. */
  countdownLead: string | null;
}

/**
 * Le décompte de la BANNIÈRE vise la fin de la précommande, pas la fin du
 * palier (demande du client, 2026-11-24) : il ne change pas de cible le
 * 9 décembre, il continue de descendre. Cible = SWEAT_PREORDER_UNTIL, minuit
 * le 16 — soit la fin de la minute 23h59 du 15, l'instant exact de la clôture.
 */
export const SWEAT_BANNER_COUNTDOWN_LEAD = "Fin des précommandes dans";

const euros = (n: number) => `${n} €`;

/** Le palier pour un instant donné. Une échéance illisible ne peut pas arriver ici : ce sont des constantes. */
export function getSweatPreorderPhase(now: Date = new Date()): SweatPreorderPhase {
  const t = now.getTime();
  if (t < new Date(SWEAT_EARLY_UNTIL).getTime()) return "early";
  if (t < new Date(SWEAT_PREORDER_UNTIL).getTime()) return "standard";
  return "closed";
}

export function offerForPhase(phase: SweatPreorderPhase): SweatPreorderOffer {
  switch (phase) {
    case "early":
      return {
        phase,
        price: EARLY_PRICE,
        priceLabel: euros(EARLY_PRICE),
        offerLabel: "Prix de lancement",
        offerDetail: `puis ${euros(STANDARD_PRICE)} à partir du 9 décembre`,
        endsAtIso: SWEAT_EARLY_UNTIL,
        countdownLead: "Fin du prix de lancement dans",
      };
    case "standard":
      return {
        phase,
        price: STANDARD_PRICE,
        priceLabel: euros(STANDARD_PRICE),
        offerLabel: "Dernière semaine",
        offerDetail: "Précommande ouverte jusqu’au 15 décembre inclus.",
        endsAtIso: SWEAT_PREORDER_UNTIL,
        countdownLead: "Fin des précommandes dans",
      };
    case "closed":
      return {
        phase,
        price: null,
        priceLabel: null,
        offerLabel: "Précommande terminée",
        offerDetail: "Les commandes sont closes. Livraison fin décembre / début janvier.",
        endsAtIso: null,
        countdownLead: null,
      };
  }
}

/** Prix courant, libellé de l'offre et état, à l'instant `now`. */
export function getSweatPreorderOffer(now: Date = new Date()): SweatPreorderOffer {
  return offerForPhase(getSweatPreorderPhase(now));
}

/* --------------------------------------------------------------------------
 * Contenu produit
 * ----------------------------------------------------------------------- */

export const SWEAT_NAME = "Sweat à capuche Hybride";

/**
 * Faits du produit, tels que fournis par le client. Les coordonnées sont celles
 * imprimées sur le sweat réel (vérifié sur photo le 2026-11-24) : 43.107, 5.952.
 * La maquette recto-verso du dossier d'origine affiche « 5.552 », une erreur
 * (au large de Bandol) — écartée définitivement par le client le 2026-11-24 :
 * ne jamais publier un visuel qui porte cette valeur.
 */
export const SWEAT_FACTS = [
  { label: "Matière", value: "100 % coton, 280 g/m²" },
  { label: "Couleur", value: "Noir" },
  { label: "Devant", value: "Logo H côté cœur" },
  { label: "Dos", value: "Relief de Toulon imprimé en violet, « HYBRIDE · CLUB · TOULON », 43.107, 5.952" },
  { label: "Coupes", value: "Unisexe et femme" },
  { label: "Tailles", value: "XS à XXL, au choix sur HelloAsso" },
  { label: "Livraison", value: "Fin décembre / début janvier" },
] as const;

/**
 * Arguments de vente, valables à tous les paliers. La hausse de prix n'y est
 * pas : elle dépend de la date, et c'est `offerDetail` qui la porte.
 */
export const SWEAT_SELLING_POINTS = [
  "Édition limitée : précommande uniquement, aucun réassort.",
  "Le relief de Toulon au dos — une pièce locale, dessinée pour le club.",
  "Livraison fin décembre / début janvier.",
] as const;

export interface SweatPhoto {
  src: string;
  /** Décrite pour qui ne la voit pas : ce qu'on voit du sweat d'abord. */
  alt: string;
  width: number;
  height: number;
}

/**
 * Photos du sweat réel, redimensionnées à 1800 px de haut depuis
 * public/photos/SWEAT/ (originaux non publiés).
 *
 * LA PREMIÈRE EST LA PHOTO PRINCIPALE PARTOUT — première vue du carrousel de la
 * fiche, carte du shop, encart du planning, première photo de l'accueil.
 * Choix du client (2026-11-24) : le duo à la rambarde (IMG_0085), qui montre
 * les deux faces à la fois, logo H devant et relief au dos. C'est aussi la
 * source de l'aperçu de partage de la fiche (public/og/sweat-edition-limitee.jpg).
 */
export const SWEAT_PHOTOS: SweatPhoto[] = [
  {
    src: "/photos/shop/sweat/duo-rambarde.jpg",
    alt: "Deux membres en sweat au bord de l'eau : l'une de face avec le logo H, l'autre de dos avec le relief de Toulon",
    width: 1199,
    height: 1800,
  },
  {
    src: "/photos/shop/sweat/dos-relief-bord-de-mer.jpg",
    alt: "De dos face à la rade, capuche relevée : le relief de Toulon imprimé en violet sous « Hybride Club Toulon »",
    width: 1199,
    height: 1800,
  },
  {
    src: "/photos/shop/sweat/face-logo-galets.jpg",
    alt: "Sur une plage de galets, le sweat noir porté de face, le logo H blanc côté cœur",
    width: 1200,
    height: 1800,
  },
  {
    src: "/photos/shop/sweat/duo-escalier.jpg",
    alt: "Sur un escalier face à la mer, une membre sourit en sweat, le logo H visible, à côté d'un membre de dos capuche relevée",
    width: 1199,
    height: 1800,
  },
];

/** Adresse de la fiche, à coller dans les stories et sur WhatsApp. */
export const sweatProductPath = (clubSlug: string) => `/club/${clubSlug}/shop/sweat-edition-limitee`;

/* --------------------------------------------------------------------------
 * Bannière : fermeture mémorisée 24 h
 * ----------------------------------------------------------------------- */

export const SWEAT_BANNER_ID = "sweat-preorder-banner";

/** Clé localStorage : horodatage (ms) de la fermeture. */
export const SWEAT_BANNER_DISMISSED_KEY = "hybride:sweat-banniere-fermee";

export const SWEAT_BANNER_SNOOZE_MS = 24 * 60 * 60 * 1000;

/**
 * Lu au parcours du HTML, AVANT l'affichage : une bannière refermée hier ne doit
 * pas apparaître une fraction de seconde puis disparaître à l'hydratation. Le
 * script ajoute une règle dans <head> plutôt que de toucher à la bannière —
 * React ne compare pas ce qu'on y injecte, il n'y a donc aucun désaccord
 * d'hydratation possible. Le composant relit ensuite la même clé au montage.
 */
export const SWEAT_BANNER_EARLY_HIDE_SCRIPT = `try{var t=+localStorage.getItem(${JSON.stringify(SWEAT_BANNER_DISMISSED_KEY)});if(t&&Date.now()-t<${SWEAT_BANNER_SNOOZE_MS}){var s=document.createElement("style");s.textContent="#${SWEAT_BANNER_ID}{display:none}";document.head.appendChild(s)}}catch(e){}`;
