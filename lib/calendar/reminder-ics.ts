import { buildIcs } from "@/lib/calendar/ics";
import { CLUB } from "@/lib/config";
import { SITE_URL } from "@/lib/seo";

/**
 * Fichier .ics servi par /club/[slug]/planning/rappel-inscriptions.ics —
 * un rappel hebdomadaire posé dans l'agenda du visiteur, le dimanche à 17h55,
 * cinq minutes avant l'ouverture des inscriptions annoncée dans l'en-tête du
 * planning (app/club/[slug]/planning/page.tsx).
 *
 * La mécanique iCalendar (pliage, échappement, VTIMEZONE, VALARM) vit dans
 * lib/calendar/ics.ts, partagée avec le rappel d'ouverture de la boutique.
 */

/** Nom proposé au téléchargement. Aligné sur le dernier segment de l'URL pour
    que les deux chemins de nommage (Content-Disposition côté Safari/Firefox,
    nom d'URL côté Chrome) donnent le même fichier. */
export const REMINDER_ICS_FILENAME = "rappel-inscriptions.ics";

const REMINDER_URL = `${SITE_URL}/club/${CLUB.slug}/planning`;

/**
 * Première occurrence : dimanche 6 septembre 2026, ouverture de la saison.
 *
 * Date d'ancrage FIXE, jamais « le prochain dimanche ». Deux raisons :
 * la route resterait dynamique si elle lisait l'horloge, et surtout l'UID
 * ci-dessous désigne alors une série stable — un visiteur qui retélécharge le
 * fichier six mois plus tard met à jour le même événement dans son agenda au
 * lieu d'en créer un second. Les occurrences déjà passées à la date du
 * téléchargement sont sans conséquence : l'agenda les affiche dans l'historique
 * et ne notifie que les suivantes.
 */
const FIRST_OCCURRENCE_DATE = "20260906";
const START_TIME = "175500";
/** Fin à l'heure pile d'ouverture : l'événement se termine quand les inscriptions commencent. */
const END_TIME = "180000";

/** Voir `dtstamp` dans lib/calendar/ics.ts : constante, pour un build reproductible. */
const DTSTAMP = "20260909T000000Z";

/**
 * Identifiant stable de la série récurrente. Ne JAMAIS le modifier : le changer
 * fait apparaître un second rappel chez tous ceux qui retéléchargent, au lieu
 * de mettre à jour le premier. Distinct de celui du rappel d'ouverture de la
 * boutique (shop-opening-ics.ts) — deux fichiers, deux identifiants, sinon le
 * second écrase le premier.
 */
const UID = `rappel-inscriptions-${CLUB.slug}@hybride-club.fr`;

const SUMMARY = "Inscriptions Hybride";

export function buildReminderIcs(): string {
  return buildIcs({
    prodId: "-//Hybride Club Toulon//Rappel inscriptions//FR",
    uid: UID,
    dtstamp: DTSTAMP,
    start: `${FIRST_OCCURRENCE_DATE}T${START_TIME}`,
    end: `${FIRST_OCCURRENCE_DATE}T${END_TIME}`,
    rrule: "FREQ=WEEKLY;BYDAY=SU",
    summary: SUMMARY,
    description: `Les inscriptions aux sorties de la semaine ouvrent à 18h.\n\n${REMINDER_URL}`,
    url: REMINDER_URL,
  });
}
