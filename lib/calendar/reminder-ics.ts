import { CLUB } from "@/lib/config";
import { SITE_URL } from "@/lib/seo";

/**
 * Fichier .ics servi par /club/[slug]/planning/rappel-inscriptions.ics —
 * un rappel hebdomadaire posé dans l'agenda du visiteur, le dimanche à 17h55,
 * cinq minutes avant l'ouverture des inscriptions annoncée dans l'en-tête du
 * planning (app/club/[slug]/planning/page.tsx).
 *
 * Tout est calculé À PARTIR DE CONSTANTES : aucune lecture d'horloge, aucune
 * donnée de requête. C'est ce qui permet à la route d'être prérendue au build
 * et servie comme un fichier statique — rien n'est collecté, rien ne s'exécute
 * à la demande.
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

/**
 * Horodatage de création de la série. Constante et non `new Date()` : deux
 * builds successifs doivent produire un fichier identique à l'octet près, sinon
 * le prérendu n'est plus déterministe et l'agenda du visiteur verrait une
 * « modification » à chaque redéploiement.
 */
const DTSTAMP = "20260909T000000Z";

/**
 * Identifiant stable de la série récurrente. Ne JAMAIS le modifier : le changer
 * fait apparaître un second rappel chez tous ceux qui retéléchargent, au lieu
 * de mettre à jour le premier.
 */
const UID = `rappel-inscriptions-${CLUB.slug}@hybride-club.fr`;

const SUMMARY = "Inscriptions Hybride";
const DESCRIPTION = `Les inscriptions aux sorties de la semaine ouvrent à 18h.\n\n${REMINDER_URL}`;

/**
 * Définition de fuseau embarquée, obligatoire en pratique et pas seulement en
 * théorie : un TZID sans VTIMEZONE correspondant est rejeté ou réinterprété par
 * Google Agenda à l'import. L'alternative — écrire l'heure en UTC — serait pire :
 * le rappel dériverait à 18h55 en heure d'hiver.
 *
 * Règles de l'Union européenne (dernier dimanche de mars et d'octobre). Si
 * l'UE abandonne le changement d'heure, c'est ce bloc qu'il faudra reprendre.
 */
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Paris",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

/**
 * Échappement des valeurs de type TEXT (RFC 5545 §3.3.11) : antislash,
 * point-virgule, virgule et sauts de ligne. Les deux-points n'en font pas
 * partie — c'est ce qui permet de laisser une URL lisible dans DESCRIPTION.
 */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Pliage des lignes (RFC 5545 §3.1) : 75 OCTETS, pas 75 caractères. La
 * distinction compte ici — « à 18h » et les accents des libellés français
 * pèsent deux octets chacun, et couper au milieu d'une séquence UTF-8
 * produirait un fichier illisible. On itère donc sur les points de code et on
 * mesure leur encodage.
 *
 * Les lignes de continuation commencent par une espace, qui compte dans la
 * limite : d'où les 74 octets utiles à partir de la deuxième.
 */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  let limit = 75;

  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
      limit = 74;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);

  return parts.join("\r\n ");
}

export function buildReminderIcs(): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hybride Club Toulon//Rappel inscriptions//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...VTIMEZONE,
    "BEGIN:VEVENT",
    `UID:${UID}`,
    `DTSTAMP:${DTSTAMP}`,
    "SEQUENCE:0",
    `DTSTART;TZID=Europe/Paris:${FIRST_OCCURRENCE_DATE}T${START_TIME}`,
    `DTEND;TZID=Europe/Paris:${FIRST_OCCURRENCE_DATE}T${END_TIME}`,
    "RRULE:FREQ=WEEKLY;BYDAY=SU",
    `SUMMARY:${escapeText(SUMMARY)}`,
    `DESCRIPTION:${escapeText(DESCRIPTION)}`,
    // URL est de type URI et non TEXT : pas d'échappement, sinon les agendas
    // qui en font un lien cliquable reçoivent des antislashes.
    `URL:${REMINDER_URL}`,
    // Le rappel ne doit pas faire apparaître son porteur comme occupé.
    "TRANSP:TRANSPARENT",
    // Notification à l'heure de début. Apple et Thunderbird la respectent ;
    // Google Agenda applique ses rappels par défaut à l'import et l'ignore
    // souvent — d'où le choix de 17h55 plutôt que 18h00 avec une alerte
    // antérieure : l'heure de l'événement porte déjà l'avance de cinq minutes.
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:PT0S",
    `DESCRIPTION:${escapeText(SUMMARY)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // CRLF partout, y compris après la dernière ligne (RFC 5545 §3.1) : les
  // parseurs stricts refusent un fichier terminé sans fin de ligne.
  return lines.map(fold).join("\r\n") + "\r\n";
}
