import { buildIcs, toLocalStamp } from "@/lib/calendar/ics";
import { CLUB, SHOP_OPENING_TO } from "@/lib/config";
import { SITE_URL } from "@/lib/seo";

/**
 * Fichier .ics servi par /club/[slug]/shop/ouverture.ics — un rappel UNIQUE,
 * sans récurrence, cinq minutes avant l'ouverture de la boutique.
 *
 * La mécanique iCalendar vit dans lib/calendar/ics.ts, partagée avec le rappel
 * hebdomadaire des inscriptions.
 */

/** Nom proposé au téléchargement, aligné sur le dernier segment de l'URL. */
export const SHOP_OPENING_ICS_FILENAME = "ouverture.ics";

const SHOP_URL = `${SITE_URL}/club/${CLUB.slug}/shop`;

/**
 * IDENTIFIANT DISTINCT de celui du rappel hebdomadaire (reminder-ics.ts).
 *
 * Ce n'est pas une précaution de style : l'UID est ce qui décide, à l'import,
 * si un fichier met à jour un évènement déjà présent ou en crée un nouveau.
 * Deux fichiers qui partageraient le même identifiant se remplaceraient l'un
 * l'autre — quelqu'un qui a posé le rappel du dimanche puis celui de la
 * boutique perdrait le premier. Ne jamais réutiliser un UID d'un fichier à
 * l'autre, ni modifier celui-ci une fois en ligne.
 */
const UID = `ouverture-boutique-${CLUB.slug}@hybride-club.fr`;

/** Voir `dtstamp` dans lib/calendar/ics.ts : constante, pour un build reproductible. */
const DTSTAMP = "20260910T000000Z";

/**
 * Cinq minutes d'avance sur l'ouverture — même parti que le rappel des
 * inscriptions : l'évènement est placé AVANT l'échéance plutôt que doté d'une
 * alerte antérieure, parce que Google Agenda ignore souvent les VALARM à
 * l'import et applique ses propres rappels par défaut.
 */
const LEAD_MINUTES = 5;

/**
 * Les deux instants sont DÉRIVÉS de SHOP_OPENING_TO, jamais réécrits à la main.
 *
 * C'est la leçon d'un défaut constaté le 2026-09-10 : la phrase « 15 septembre
 * à 18h » avait été écrite en dur à côté de la constante, et un test avec une
 * échéance décalée a montré l'affichage continuer d'annoncer l'ancienne date
 * pendant que le compteur visait la nouvelle. Une date, une source.
 *
 * `new Date(iso)` ne lit pas l'horloge : la fonction reste déterministe, et la
 * route qui l'appelle reste prérendable.
 */
function openingStamps(): { start: string; end: string } {
  const opening = new Date(SHOP_OPENING_TO);
  const reminder = new Date(opening.getTime() - LEAD_MINUTES * 60_000);
  return { start: toLocalStamp(reminder), end: toLocalStamp(opening) };
}

const SUMMARY = "Ouverture de la boutique Hybride";

export function buildShopOpeningIcs(): string {
  const { start, end } = openingStamps();
  return buildIcs({
    prodId: "-//Hybride Club Toulon//Ouverture boutique//FR",
    uid: UID,
    dtstamp: DTSTAMP,
    start,
    end,
    // Pas de `rrule` : évènement unique. La boutique n'ouvre qu'une fois.
    summary: SUMMARY,
    description: `Le premier drop du club.\n\n${SHOP_URL}`,
    url: SHOP_URL,
  });
}
