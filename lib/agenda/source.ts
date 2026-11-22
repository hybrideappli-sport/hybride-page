import "server-only";

import { activityLabel, type Activity } from "@/components/ui/Tag";

/**
 * ADR-010 §2 : le tableur est la source d'autorité de l'agenda, pas Supabase
 * (schéma `club` dormant). Publié par Fichier → Partager → Publier sur le web
 * → CSV — pas l'API Sheets (aucune clé, aucun quota).
 */
const SHEET_PUBLISHED_BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSS9gpqBxIPQmW9QG7R9S6EKctNvuTB-1KXqTJ25g4q2XEbmSDPiGeBM-jQvyqM82Wxtz5zN_oh5G10";

/**
 * TOUS LES ONGLETS, PAS SEULEMENT LE PREMIER (2026-11-03). Le client tient un
 * onglet par mois (« Octobre », « Novembre »…). L'export `pub?output=csv` ne
 * renvoie que le PREMIER onglet : tout ce qui n'était saisi que dans
 * « Novembre » — séances piste des 9, 16, 23 et 30, trail du 14, danse fit du
 * 12, soirée du 28 — manquait au planning, sans erreur nulle part.
 *
 * La liste des onglets est lue sur la page publiée (`pubhtml`), qui les nomme
 * avec leur `gid` : ajouter un onglet « Décembre » ne demande donc rien ici.
 * Si cette page devient illisible, on retombe sur le premier onglet seul — le
 * comportement d'avant, pas une page vide.
 */
const SHEET_PUBHTML_URL = `${SHEET_PUBLISHED_BASE}/pubhtml`;
const sheetCsvUrl = (gid: string) => `${SHEET_PUBLISHED_BASE}/pub?gid=${gid}&single=true&output=csv`;

/** Revalidation Next.js — pas de cron, aucune dépendance à un plan Vercel payant (ADR-010). */
const REVALIDATE_SECONDS = 300;

export interface AgendaEvent {
  /**
   * Identifiant ET adresse de la page de la sortie : « 2026-09-02-run-chill-mourillon »,
   * servi sur /club/[slug]/sorties/[eventSlug].
   *
   * La date d'abord, parce que c'est l'attribut le plus stable d'une sortie et que
   * l'URL se lit telle quelle. Construit depuis `Titre`, jamais depuis `Nom court` :
   * sinon toutes les adresses changeraient le jour où cette colonne se remplit.
   *
   * CES ADRESSES CIRCULENT DANS DES CONVERSATIONS bien après la sortie. Elles ne
   * survivent que tant que la ligne reste dans le tableur AVEC le statut « publiée » :
   * supprimer la ligne ou changer son statut casse le lien aussi sûrement l'un que
   * l'autre (décision du 2026-09-04 : on ne touche plus aux lignes passées).
   */
  slug: string;
  title: string | null;
  /**
   * Nom affiché dans une case du calendrier, où la colonne fait une cinquantaine
   * de pixels sur un téléphone. Colonne « Nom court » du tableur, facultative :
   * absente ou vide, on retombe sur `title`. Viser 12 caractères — au-delà, le
   * nom est coupé dans la case (jamais dans la fiche, qui garde `title` entier).
   */
  shortTitle: string | null;
  /** Une seule activité par sortie depuis le 2026-08-28 — voir ACTIVITY_BY_SHEET_VALUE. */
  activity: Activity;
  activityLabelText: string;
  format: string | null;
  /** ISO, instant réel (converti depuis le texte brut Europe/Paris de la feuille). */
  startsAtIso: string;
  duration: string;
  details: string | null;
  /**
   * null quand la colonne « Lieu » est vide — la sortie est publiée quand même
   * (2026-09-30). Jamais remplacé par un texte ici : chaque endroit qui l'affiche
   * choisit son repli (LOCATION_PENDING sur la fiche, point de rendez-vous du
   * rituel sinon), et l'adresse de la page ne doit pas en dépendre.
   */
  location: string | null;
  level: string | null;
  /**
   * null = aucune ouverture différée : la sortie est ouverte. Les colonnes
   * "Date ouverture"/"Heure ouverture" ont été retirées du tableur le
   * 2026-08-26 (trop longues à saisir) ; le champ reste optionnel plutôt que
   * supprimé, pour que le décompte refonctionne si une date réapparaît un jour
   * sans nouvelle modification du code.
   */
  opensAtIso: string | null;
  lumaUrl: string | null;
}

/** Texte affiché à la place d'un lieu pas encore saisi dans le tableur. */
export const LOCATION_PENDING = "Lieu bientôt annoncé";

/**
 * Colonne unique « Activité » à liste déroulante, depuis le 2026-08-28 — elle
 * remplace les cinq colonnes de cases à cocher (Course/Vélo/Eau/Montagne/
 * Collectif).
 *
 * Trois raisons, la première décisive : la saisie se fait depuis un téléphone,
 * où une cellule à choisir bat huit colonnes à balayer horizontalement ; la
 * liste va s'agrandir, et une entrée de plus dans un menu déroulant ne
 * restructure pas le tableur ; et une validation de données rend la cellule
 * impossible à laisser invalide, alors qu'une ligne sans aucune case cochée
 * était jusqu'ici silencieusement ignorée.
 *
 * Clés tolérantes : on compare en minuscules sans accents, pour qu'une saisie
 * « Social Run » ou « velo » passe quand même.
 */
const ACTIVITY_BY_SHEET_VALUE: Record<string, Activity> = {
  piste: "piste",
  "social run": "social-run",
  "run chill": "social-run",
  trail: "trail",
  velo: "velo",
  "sunset bike": "velo",
  route: "velo",
  nage: "nage",
  "nage en eau libre": "nage",
  "eau libre": "nage",
  bivouac: "bivouac",
  rando: "bivouac",
  randonnee: "bivouac",
  "rando bivouac": "bivouac",
  soiree: "soirees",
  soirees: "soirees",
  "soiree hybride": "soirees",
  "soiree d hybride": "soirees",
  communautaire: "communautaire",
  "evenement communautaire": "communautaire",
  volley: "communautaire",
  "danse fit": "communautaire",
};

/** Minuscules, sans accents, espaces normalisés — pour comparer une saisie humaine à une clé. */
function normalizeActivity(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Apostrophes droites et typographiques ramenées à un espace : « Soirée
    // d'hybride » et « Soirée d’hybride » tombent alors sur la même clé.
    .replace(/['\u2019]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * CSV conforme RFC 4180 : champs entre guillemets, virgules, guillemets
 * échappés `""`, ET retours à la ligne à l'intérieur d'un champ.
 *
 * Ce dernier point a coûté une sortie. La version précédente découpait le texte
 * par `\n` AVANT de traiter les guillemets, en assumant que nos colonnes ne
 * contiennent que du texte court sur une ligne. Le 2026-09-07, la cellule
 * « Détails » de la sortie vélo du 13 septembre a été saisie sur plusieurs
 * lignes : la ligne du tableur s'est retrouvée coupée en morceaux, toutes les
 * colonnes situées APRÈS « Détails » sont arrivées vides (« Lieu », « Activité »),
 * et parseRow a écarté la sortie sur son contrôle d'activité manquante. Elle a
 * disparu du planning et sa page est tombée en 404 — sans erreur, juste un
 * avertissement dans les logs, et avec cinq minutes de cache pour retarder le
 * symptôme. Le tableur est saisi depuis un téléphone : une cellule sur plusieurs
 * lignes est une saisie normale, pas une anomalie à corriger à la main.
 *
 * On parcourt donc le texte caractère par caractère : hors guillemets, `\n`
 * termine la ligne ; à l'intérieur, il fait partie de la valeur.
 *
 * Effet de bord bienvenu : le numéro de ligne des avertissements de parseSheet
 * redevient exact. Il compte les lignes du TABLEUR, ce qu'une cellule
 * multiligne faisait auparavant diverger des lignes du fichier.
 */
function parseCsv(text: string): string[][] {
  // Fins de ligne normalisées en amont (CRLF et CR isolé), y compris dans les
  // champs : une valeur multiligne ne doit pas trimballer les `\r` de l'export.
  const normalized = text.replace(/\r\n?/g, "\n");

  const rows: string[][] = [];
  let cells: string[] = [];
  let cur = "";
  let inQuotes = false;

  const endLine = () => {
    cells.push(cur);
    cur = "";
    // Ligne vide (le `\n` final du fichier, notamment) : ignorée, comme avant.
    if (!(cells.length === 1 && cells[0] === "")) rows.push(cells);
    cells = [];
  };

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        // `\n` compris : c'est ce qui distingue cette version de la précédente.
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(cur);
      cur = "";
    } else if (ch === "\n") {
      endLine();
    } else {
      cur += ch;
    }
  }
  // Dernière ligne quand le fichier ne finit pas par un saut de ligne.
  if (cur !== "" || cells.length > 0) endLine();

  return rows;
}

/** Décalage (ms) d'un fuseau par rapport à UTC, à un instant donné — via Intl, jamais de table DST manuelle. */
function timeZoneOffsetMs(utcMs: number, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(utcMs))
      .map((p) => [p.type, p.value]),
  );
  const hour = parts.hour === "24" ? "0" : parts.hour;
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +hour, +parts.minute, +parts.second);
  return asUtc - utcMs;
}

/**
 * "2026-09-06" + "19:00", lus comme heure de Paris (texte brut — ADR-010 §3,
 * jamais un type Date Sheets), vers un ISO UTC réel. Sans dépendance de
 * fuseau horaire : la marge d'erreur au voisinage immédiat d'un changement
 * d'heure (une nuit par semestre, à 2-3h du matin) est négligeable pour des
 * horaires de sortie/ouverture en journée ou en soirée.
 */
/**
 * Heure saisie à la main, donc écrite de six façons différentes dans le
 * tableur réel : « 19:00 », « 08:00 », « 8:45 », « 11H », « 19H », « 9H »
 * (relevé le 2026-08-29). Un format strict HH:MM rejetait silencieusement six
 * lignes sur dix-sept.
 *
 * Tolérance sur la FORME, jamais sur le fond : heure à un ou deux chiffres,
 * séparateur « : », « h » ou « H », minutes optionnelles (absentes = 00).
 * Une valeur hors plage (25:00, 19:70) reste rejetée — c'est une vraie faute
 * de saisie, pas une variante d'écriture.
 */
function parseWallClockTime(raw: string): { hh: string; mi: string } | null {
  const m = /^(\d{1,2})\s*(?:[:hH]\s*(\d{1,2})?)?$/.exec(raw.trim());
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = m[2] === undefined ? 0 : Number(m[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hh: String(hours).padStart(2, "0"), mi: String(minutes).padStart(2, "0") };
}

function parisWallClockToIso(dateStr: string | undefined, timeStr: string | undefined): string | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr?.trim() ?? "");
  const t = parseWallClockTime(timeStr ?? "");
  if (!d || !t) return null;
  const [, y, mo, day] = d;
  const { hh, mi } = t;
  const guessUtc = Date.UTC(+y, +mo - 1, +day, +hh, +mi);
  const offset = timeZoneOffsetMs(guessUtc, "Europe/Paris");
  return new Date(guessUtc - offset).toISOString();
}

/** Texte libre → segment d'URL : minuscules, sans accent, sans ponctuation. */
function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseRow(row: Record<string, string>, rowNumber: number, warn: (msg: string) => void): AgendaEvent | null {
  // Statut sur liste blanche ("publiée" seul) — pas de liste noire : une valeur vide (lignes non
  // remplies du gabarit Sheets), "brouillon" ou une faute de frappe dessus sont exclues pareil,
  // sans avertissement (état normal, pas une erreur de saisie).
  // Casse et forme Unicode ignorées (2026-11-22) : « Publiée » saisi avec une majuscule a fait
  // disparaître la sortie du 2 décembre et mis sa fiche en 404. Une majuscule n'est pas un brouillon.
  if (row["Statut"]?.trim().normalize("NFC").toLowerCase() !== "publiée") return null;

  const rawActivity = row["Activité"]?.trim() ?? "";
  const activity = ACTIVITY_BY_SHEET_VALUE[normalizeActivity(rawActivity)];
  if (!activity) {
    // Distinguer les deux cas : une cellule vide est une ligne mal remplie, une
    // valeur inconnue est une activité nouvelle qu'on a oublié de câbler ici.
    warn(
      rawActivity
        ? `ligne ${rowNumber} : activité inconnue ("${rawActivity}"), ignorée — à ajouter dans ACTIVITY_BY_SHEET_VALUE et dans la palette`
        : `ligne ${rowNumber} : activité manquante, ignorée`,
    );
    return null;
  }

  // Lieu vide : la sortie est publiée quand même (2026-09-30). La soirée du 31
  // octobre, annoncée avant que son lieu soit fixé, a disparu du planning et sa
  // page est tombée en 404 sur ce seul motif — le même mécanisme silencieux que
  // la sortie vélo du 13 septembre (voir parseCsv). Un lieu à venir est un état
  // normal d'une sortie annoncée tôt, pas une ligne mal remplie. L'avertissement
  // reste, pour qu'on sache qu'une fiche affiche le repli.
  const location = row["Lieu"]?.trim() || null;
  if (!location) warn(`ligne ${rowNumber} : lieu manquant, sortie publiée avec « ${LOCATION_PENDING} »`);

  const duration = row["Durée"]?.trim();
  if (!duration) {
    warn(`ligne ${rowNumber} : durée manquante, ignorée`);
    return null;
  }

  const startsAtIso = parisWallClockToIso(row["Date"], row["Heure"]);
  if (!startsAtIso) {
    warn(`ligne ${rowNumber} : date/heure de sortie invalide ("${row["Date"]}" "${row["Heure"]}"), ignorée`);
    return null;
  }

  // Ouverture absente = cas NORMAL depuis le retrait des colonnes (2026-08-26),
  // pas une anomalie : aucun avertissement, et la ligne n'est plus rejetée. On
  // n'avertit que si une date est saisie mais illisible — là, c'est une vraie
  // faute de frappe à corriger.
  const rawOpenDate = row["Date ouverture"]?.trim() ?? "";
  const rawOpenTime = row["Heure ouverture"]?.trim() ?? "";
  let opensAtIso: string | null = null;
  if (rawOpenDate || rawOpenTime) {
    opensAtIso = parisWallClockToIso(rawOpenDate, rawOpenTime);
    if (!opensAtIso) {
      warn(`ligne ${rowNumber} : date/heure d'ouverture illisible ("${rawOpenDate}" "${rawOpenTime}"), sortie traitée comme ouverte`);
    }
  }

  const title = row["Titre"]?.trim() || null;

  return {
    // `row["Date"]` est déjà le jour en heure de Paris (c'est ce que parisWallClockToIso
    // interprète), donc pas de reconversion de fuseau à faire ici.
    slug: `${row["Date"]?.trim()}-${slugify(title ?? location ?? activityLabel[activity])}`,
    title,
    shortTitle: row["Nom court"]?.trim() || null,
    activity,
    activityLabelText: activityLabel[activity],
    format: row["Format"]?.trim() || null,
    startsAtIso,
    duration,
    details: row["Détails"]?.trim() || null,
    location,
    level: row["Niveau"]?.trim() || null,
    opensAtIso,
    lumaUrl: row["URL Luma"]?.trim() || null,
  };
}

/**
 * Une sortie et la ligne du tableur d'où elle vient. L'origine ne sert qu'aux
 * avertissements de `finalizeEvents` : elle reste côté serveur, hors de
 * `AgendaEvent`, qui part tel quel dans la page.
 */
interface SourcedEvent {
  event: AgendaEvent;
  tab: string;
  rowNumber: number;
}

/** Un onglet → ses sorties, sans le suffixe de doublon (posé par `finalizeEvents`). */
function parseSheet(csvText: string, tab: string): SourcedEvent[] {
  const rows = parseCsv(csvText);
  if (rows.length === 0) return [];
  const [header, ...dataRows] = rows;

  const events: SourcedEvent[] = [];
  dataRows.forEach((cells, i) => {
    const row: Record<string, string> = {};
    header.forEach((col, colIndex) => {
      row[col] = cells[colIndex] ?? "";
    });
    const rowNumber = i + 2; // +2 : ligne 1 = en-tête, index 0-based
    const parsed = parseRow(row, rowNumber, (msg) => console.warn(`[agenda] onglet ${tab}, ${msg}`));
    if (parsed) events.push({ event: parsed, tab, rowNumber });
  });
  return events;
}

/** Colonne du tableur de chaque champ comparé entre deux exemplaires d'une même sortie. */
const COLUMN_BY_FIELD: [keyof AgendaEvent, string][] = [
  ["title", "Titre"],
  ["shortTitle", "Nom court"],
  ["format", "Format"],
  ["duration", "Durée"],
  ["details", "Détails"],
  ["location", "Lieu"],
  ["level", "Niveau"],
  ["opensAtIso", "Ouverture"],
  ["lumaUrl", "URL Luma"],
];

const where = ({ tab, rowNumber }: SourcedEvent) => `${tab} ligne ${rowNumber}`;

const parisDateTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

/**
 * Fusion des onglets, puis adresses et ordre.
 *
 * UNE SORTIE RECOPIÉE DANS DEUX ONGLETS N'APPARAÎT QU'UNE FOIS. Cas réel du
 * 2026-11-03 : les social runs de novembre figurent dans « Octobre » ET dans
 * « Novembre ». Sans fusion, le suffixe de doublon ci-dessous les aurait
 * affichées deux fois, la seconde à une adresse « -2 ». Même jour, même heure,
 * même titre, même activité = la même sortie ; c'est l'onglet le plus à droite
 * — en pratique le plus récent — qui l'emporte si les détails diffèrent.
 *
 * MAIS JAMAIS EN SILENCE (2026-11-22). Le social run du 25 novembre était
 * publié dans « Octobre », « Novembre » et « Décembre », avec deux liens Luma
 * différents : le site a servi celui de « Décembre », recopié par erreur depuis
 * le run du 18, sans rien signaler — la même panne muette que les lignes
 * écartées faute de lieu en septembre (voir parseRow). Chaque fusion en conflit
 * est donc annoncée dans les logs : lignes concernées, ligne retenue, et
 * colonnes qui divergent. Les copies identiques — une vingtaine, recopiées
 * d'onglet en onglet — se taisent : à chaque relecture du tableur, elles
 * noyaient les vrais conflits.
 */
function finalizeEvents(sourced: SourcedEvent[]): AgendaEvent[] {
  const byIdentity = new Map<string, SourcedEvent[]>();
  for (const s of sourced) {
    const key = `${s.event.startsAtIso}|${s.event.activity}|${s.event.slug}`;
    const group = byIdentity.get(key);
    if (group) group.push(s);
    else byIdentity.set(key, [s]);
  }

  const kept: SourcedEvent[] = [];
  for (const group of byIdentity.values()) {
    const winner = group[group.length - 1];
    kept.push(winner);
    const diverging = COLUMN_BY_FIELD.filter(([field]) => group.some((s) => s.event[field] !== winner.event[field])).map(
      ([, column]) => column,
    );
    if (diverging.length === 0) continue;
    console.warn(
      `[agenda] sortie « ${winner.event.slug} » du ${parisDateTime(winner.event.startsAtIso)} publiée ${group.length} fois ` +
        `(${group.map(where).join(", ")}) : retenue ${where(winner)}, colonnes qui diffèrent : ${diverging.join(", ")}`,
    );
  }

  // Deux sorties du même jour au même titre donneraient la même adresse et la
  // seconde serait inatteignable. Suffixe « -2 », « -3 » dans l'ordre du tableur.
  // Cas rare et volontairement traité sans horaire dans l'adresse : l'heure d'une
  // sortie bouge (le run chill est passé de 19h à 19h30 en cours de mois), le
  // lien partagé, lui, ne doit pas bouger. Signalé aussi : les deux sont gardées,
  // mais la seconde n'est pas à l'adresse qu'on attendrait.
  const firstBySlug = new Map<string, SourcedEvent>();
  const seen = new Map<string, number>();
  for (const s of kept) {
    const baseSlug = s.event.slug;
    const count = (seen.get(baseSlug) ?? 0) + 1;
    seen.set(baseSlug, count);
    if (count === 1) {
      firstBySlug.set(baseSlug, s);
      continue;
    }
    s.event.slug = `${baseSlug}-${count}`;
    const first = firstBySlug.get(baseSlug)!;
    console.warn(
      `[agenda] adresse « ${baseSlug} » produite par deux sorties différentes du ${parisDateTime(first.event.startsAtIso).slice(0, 10)} ` +
        `(${where(first)}, ${where(s)}) : les deux sont gardées, ${where(s)} servie à « ${s.event.slug} »`,
    );
  }

  const events = kept.map((s) => s.event);
  events.sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso));
  return events;
}

/**
 * Repli explicite (ADR-010 §2) : conservé en mémoire du process, pas seulement
 * délégué au cache `fetch` de Next.js. Limite assumée — non résolue par choix,
 * pas par oubli : sur une instance serverless qui redémarre à froid juste au
 * moment d'une panne du tableur, ce repli est vide (rien à substituer), et
 * l'agenda affiche alors son état "aucune sortie" plutôt qu'une page cassée.
 * Une vraie continuité inter-instance demanderait un cache externe (Vercel KV
 * ou équivalent) — hors périmètre "tout reste gratuit" de cette saison.
 */
let lastKnownGood: AgendaEvent[] = [];

/**
 * Onglets publiés, dans l'ordre du tableur : `{name: "Novembre", pageUrl:
 * "…gid=911212406"}` dans le script de la page `pubhtml`. Repli sur le premier
 * onglet (gid 0) si la page ne se lit pas ou n'en nomme aucun.
 */
async function getPublishedTabs(): Promise<{ name: string; gid: string }[]> {
  const fallback = [{ name: "premier onglet", gid: "0" }];
  try {
    const response = await fetch(SHEET_PUBHTML_URL, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const tabs: { name: string; gid: string }[] = [];
    for (const m of html.matchAll(/name:\s*"((?:[^"\\]|\\.)*)",\s*pageUrl:\s*"[^"]*?gid=(\d+)/g)) {
      if (!tabs.some((t) => t.gid === m[2])) tabs.push({ name: m[1], gid: m[2] });
    }
    return tabs.length > 0 ? tabs : fallback;
  } catch (err) {
    console.warn("[agenda] liste des onglets illisible, lecture du premier onglet seul", err);
    return fallback;
  }
}

export async function getAgendaEvents(): Promise<AgendaEvent[]> {
  try {
    const tabs = await getPublishedTabs();
    const perTab = await Promise.all(
      tabs.map(async (tab) => {
        const response = await fetch(sheetCsvUrl(tab.gid), { next: { revalidate: REVALIDATE_SECONDS } });
        if (!response.ok) throw new Error(`onglet ${tab.name} : HTTP ${response.status}`);
        return parseSheet(await response.text(), tab.name);
      }),
    );
    const events = finalizeEvents(perTab.flat());
    if (events.length > 0) lastKnownGood = events;
    return events;
  } catch (err) {
    console.error("[agenda] lecture du tableur échouée, repli sur la dernière version connue", err);
    return lastKnownGood;
  }
}
