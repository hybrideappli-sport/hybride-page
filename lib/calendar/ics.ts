/**
 * Mécanique iCalendar commune aux fichiers .ics du site — le rappel
 * hebdomadaire des inscriptions (reminder-ics.ts) et le rappel d'ouverture de
 * la boutique (shop-opening-ics.ts).
 *
 * Tout est calculé À PARTIR DE CONSTANTES : aucune lecture d'horloge, aucune
 * donnée de requête. C'est ce qui permet aux routes qui l'utilisent d'être
 * prérendues au build et servies comme des fichiers statiques — rien n'est
 * collecté, rien ne s'exécute à la demande.
 */

export const TZID = "Europe/Paris";

/**
 * Définition de fuseau embarquée, obligatoire en pratique et pas seulement en
 * théorie : un TZID sans VTIMEZONE correspondant est rejeté ou réinterprété par
 * Google Agenda à l'import. L'alternative — écrire l'heure en UTC — serait pire :
 * un rappel de 17h55 dériverait à 18h55 en heure d'hiver.
 *
 * Règles de l'Union européenne (dernier dimanche de mars et d'octobre). Si
 * l'UE abandonne le changement d'heure, c'est ce bloc qu'il faudra reprendre.
 */
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${TZID}`,
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

/**
 * Un instant absolu rendu en composantes LOCALES de Paris, au format
 * `YYYYMMDDTHHMMSS` attendu par `DTSTART;TZID=…`.
 *
 * Déterministe : la fonction ne lit pas l'horloge, elle ne fait que reformater
 * l'instant qu'on lui donne. Elle peut donc être appelée au build sans rendre
 * la route dynamique.
 *
 * `hourCycle: "h23"` et non `hour12: false` : sur certaines implémentations, le
 * second rend minuit « 24 » au lieu de « 00 », ce qui produirait une heure
 * invalide dans le fichier.
 */
export function toLocalStamp(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZID,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}${get("month")}${get("day")}T${get("hour")}${get("minute")}${get("second")}`;
}

export interface IcsEvent {
  /** Identifiant de la série. DOIT être distinct d'un fichier à l'autre — voir buildIcs. */
  uid: string;
  /** Nom du produit, affiché par certains agendas dans les propriétés du calendrier. */
  prodId: string;
  /**
   * Horodatage de création. Constante et jamais `new Date()` : deux builds
   * successifs doivent produire un fichier identique à l'octet près, sinon le
   * prérendu n'est plus déterministe et l'agenda du visiteur verrait une
   * « modification » à chaque redéploiement.
   */
  dtstamp: string;
  /** Début et fin en composantes locales de Paris (voir toLocalStamp). */
  start: string;
  end: string;
  summary: string;
  description: string;
  url: string;
  /** Règle de répétition, sans le préfixe `RRULE:`. Omise pour un évènement unique. */
  rrule?: string;
}

/**
 * Construit un fichier .ics à un seul VEVENT.
 *
 * ATTENTION À `uid` : c'est lui qui décide si un téléchargement met à jour un
 * évènement existant dans l'agenda du visiteur ou en crée un second. Deux
 * fichiers différents DOIVENT porter deux identifiants différents, sans quoi
 * poser le second efface le premier chez ceux qui avaient déjà le premier.
 */
export function buildIcs(event: IcsEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${event.prodId}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...VTIMEZONE,
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${event.dtstamp}`,
    "SEQUENCE:0",
    `DTSTART;TZID=${TZID}:${event.start}`,
    `DTEND;TZID=${TZID}:${event.end}`,
    ...(event.rrule ? [`RRULE:${event.rrule}`] : []),
    `SUMMARY:${escapeText(event.summary)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    // URL est de type URI et non TEXT : pas d'échappement, sinon les agendas
    // qui en font un lien cliquable reçoivent des antislashes.
    `URL:${event.url}`,
    // Le rappel ne doit pas faire apparaître son porteur comme occupé.
    "TRANSP:TRANSPARENT",
    // Notification à l'heure de début. Apple et Thunderbird la respectent ;
    // Google Agenda applique ses rappels par défaut à l'import et l'ignore
    // souvent — d'où le choix de placer l'évènement cinq minutes avant
    // l'échéance réelle plutôt que de compter sur une alerte antérieure.
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:PT0S",
    `DESCRIPTION:${escapeText(event.summary)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // CRLF partout, y compris après la dernière ligne (RFC 5545 §3.1) : les
  // parseurs stricts refusent un fichier terminé sans fin de ligne.
  return lines.map(fold).join("\r\n") + "\r\n";
}
