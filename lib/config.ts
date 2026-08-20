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
   * À confirmer contre les statuts / le récépissé de déclaration en préfecture avant mise en ligne
   * (PRD §8) — ne jamais déduire cette valeur de `city` : rien ne garantit que le siège social soit
   * dans la ville où le club est actif.
   */
  legalCity: "La Seyne-sur-Mer",
  tagline: "Course à pied, vélo, eau, montagne, collectif — sorties hebdomadaires ouvertes à tous.",
  /** Redirection OVH vers une boîte réelle pas encore créée côté association — PRD §8. */
  contactEmail: "contact@hybride-club.fr",
  helloAssoUrl: "https://www.helloasso.com/associations/hybride-club-toulon",
};

/**
 * URL de la boutique merch HelloAsso de l'association — PAS ENCORE CONNUE.
 * Ne jamais inventer une URL plausible : `.example` est le domaine réservé
 * (RFC 2606) pour ce genre de placeholder, garanti de ne jamais résoudre.
 * À renseigner avant l'ouverture de /club/toulon/shop en production.
 */
export const HELLOASSO_SHOP_URL = "https://TODO-boutique-helloasso-a-renseigner.example";
