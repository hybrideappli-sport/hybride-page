/**
 * Constantes de configuration qui ne vivent pas en base — contenu figé pour
 * cette saison (ADR-010, 2026-08-19 : schéma `club` dormant, Supabase retiré
 * du site). Seul point club exposé au P0 : Toulon, pas de sélecteur multi-club.
 */

export const CLUB = {
  slug: "toulon",
  name: "Hybride Club Toulon",
  /** Ville où le club est actif — distincte de la commune de domiciliation légale de l'association (mentions légales). */
  city: "Toulon",
  /**
   * Commune de domiciliation légale de l'association (siège social) — pour les mentions légales et
   * la politique de confidentialité uniquement, jamais pour l'affichage marketing (`city` ci-dessus).
   * Confirmée par l'utilisateur le 2026-08-20 (PRD §8) : identique à `city` cette fois-ci, mais reste
   * un champ distinct — rien ne garantit qu'un futur siège social reste dans la ville d'activité.
   */
  legalCity: "Toulon",
  /**
   * Informations légales réelles, relevées le 2026-08-28 sur les statuts, le
   * récépissé préfectoral et la liste des dirigeants — plus aucun placeholder.
   *
   * Le récépissé précise que l'insertion au Journal officiel des associations
   * est FACULTATIVE et que c'est lui qui fait foi. Le site n'affirme donc
   * aucune publication au JOAFE : la mention a été retirée partout le
   * 2026-08-28, et ne devra revenir que si une publication a réellement eu
   * lieu.
   */
  legalAddress: "12 place Pierre Puget, 83000 Toulon",
  rnaNumber: "W832023479",
  declaration: "préfecture du Var, le 8 juin 2026",
  /** Seule personne physique nommée sur le site — obligation légale (responsable de publication). */
  publicationDirector: "Ambre Perret, présidente de l'association",
  /** Redirection OVH vers une boîte réelle pas encore créée côté association — PRD §8. */
  contactEmail: "contact@hybride-club.fr",
  helloAssoUrl: "https://www.helloasso.com/associations/hybride-club-toulon",
  stravaUrl: "https://www.strava.com/clubs/2132843",
  instagramUrl: "https://www.instagram.com/hybrideclubtoulon/",
};

/**
 * Les pages légales de l'ENTITÉ COMMERCIALE (/mentions-legales,
 * /politique-de-confidentialite à la racine) sont-elles servies ?
 *
 * `false` = elles renvoient un vrai 404. Retirer les liens et poser un
 * `noindex` ne suffisait pas : la page restait affichable en tapant son URL,
 * avec tous ses champs entre crochets (constaté en production le 2026-08-29).
 * Un moteur ne l'indexe plus, mais un humain la voit encore.
 *
 * Les fichiers restent en place : repasser à `true` au lancement de l'app
 * suffit à les remettre en ligne. Penser alors à retirer aussi le bloc
 * `metadata` noindex de chaque page, et à remettre les deux liens dans le pied
 * de page de app/(marketing)/page.tsx.
 *
 * Ne concerne PAS les pages légales du club (/club/toulon/...), qui portent
 * des informations réelles et restent publiques et indexables.
 */
export const COMMERCIAL_LEGAL_PAGES_PUBLISHED = false;

/**
 * Compte à rebours affiché À LA PLACE de la grille du planning, jusqu'à
 * l'instant indiqué — puis la grille apparaît d'elle-même, sans redéploiement.
 *
 * DISPOSITIF TEMPORAIRE (posé le 2026-08-29 pour l'ouverture du programme de
 * septembre). Passé l'échéance il n'a plus aucun effet : le vider est un
 * nettoyage, pas une réparation. Chaîne vide = grille normale.
 *
 * FORMAT : ISO 8601 avec DÉCALAGE HORAIRE EXPLICITE, jamais un `Z` ni une date
 * nue. `+02:00` = heure d'été de Paris (mars → octobre) ; une échéance en
 * hiver s'écrirait `+01:00`. Écrire l'heure locale sans décalage la ferait
 * interpréter en UTC par le navigateur, soit deux heures d'écart en été.
 */
export const PLANNING_COUNTDOWN_TO = "2026-08-30T10:00:00+02:00";

/** Phrase affichée au-dessus du décompte. Volontairement courte : le décompte porte déjà l'information. */
export const PLANNING_COUNTDOWN_TEXT = "Le programme de septembre arrive.";

/**
 * Message d'attente FIGÉ affiché À LA PLACE de la grille — et prioritaire sur
 * le compte à rebours ci-dessus.
 *
 * Chaîne vide = pas de message. C'est le filet : si l'échéance du décompte
 * arrive avant que le planning ne soit prêt, écrire une phrase ici reprend la
 * main immédiatement, sans toucher au reste.
 *
 * Pensé pour être rempli/vidé depuis un téléphone, via l'éditeur web de GitHub
 * — même geste que pour le contenu des rituels. Vercel redéploie tout seul au
 * commit, il n'y a rien d'autre à piloter.
 */
export const PLANNING_NOTICE = "";

/**
 * URL de la boutique merch HelloAsso de l'association — PAS ENCORE CONNUE.
 * Ne jamais inventer une URL plausible : `.example` est le domaine réservé
 * (RFC 2606) pour ce genre de placeholder, garanti de ne jamais résoudre.
 * À renseigner avant l'ouverture de /club/toulon/shop en production.
 */
export const HELLOASSO_SHOP_URL = "https://TODO-boutique-helloasso-a-renseigner.example";
