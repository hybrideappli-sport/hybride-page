/**
 * Constantes de configuration qui ne vivent pas en base — contenu figé au P0,
 * pas une donnée multi-tenant (contrairement à `club.clubs.hello_asso_url`,
 * le lien d'adhésion, réel et déjà en base).
 */

/**
 * URL de la boutique merch HelloAsso de l'association — PAS ENCORE CONNUE.
 * Ne jamais inventer une URL plausible : `.example` est le domaine réservé
 * (RFC 2606) pour ce genre de placeholder, garanti de ne jamais résoudre.
 * À renseigner avant l'ouverture de /club/toulon/shop en production.
 */
export const HELLOASSO_SHOP_URL = "https://TODO-boutique-helloasso-a-renseigner.example";
