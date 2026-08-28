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
 * URL de la boutique merch HelloAsso de l'association — PAS ENCORE CONNUE.
 * Ne jamais inventer une URL plausible : `.example` est le domaine réservé
 * (RFC 2606) pour ce genre de placeholder, garanti de ne jamais résoudre.
 * À renseigner avant l'ouverture de /club/toulon/shop en production.
 */
export const HELLOASSO_SHOP_URL = "https://TODO-boutique-helloasso-a-renseigner.example";
