import "server-only";

import { disciplineLabel, type Discipline } from "@/components/ui/Tag";

/**
 * ADR-010 §2 : le tableur est la source d'autorité de l'agenda, pas Supabase
 * (schéma `club` dormant). Publié par Fichier → Partager → Publier sur le web
 * → CSV — pas l'API Sheets (aucune clé, aucun quota).
 */
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSS9gpqBxIPQmW9QG7R9S6EKctNvuTB-1KXqTJ25g4q2XEbmSDPiGeBM-jQvyqM82Wxtz5zN_oh5G10/pub?output=csv";

/** Revalidation Next.js — pas de cron, aucune dépendance à un plan Vercel payant (ADR-010). */
const REVALIDATE_SECONDS = 300;

export interface AgendaEvent {
  id: string;
  title: string | null;
  disciplines: { code: Discipline; label: string }[];
  format: string | null;
  /** ISO, instant réel (converti depuis le texte brut Europe/Paris de la feuille). */
  startsAtIso: string;
  duration: string;
  details: string | null;
  location: string;
  level: string | null;
  opensAtIso: string;
  lumaUrl: string | null;
}

const DISCIPLINE_COLUMNS: { header: string; code: Discipline }[] = [
  { header: "Course", code: "course" },
  { header: "Vélo", code: "velo" },
  { header: "Eau", code: "eau" },
  { header: "Montagne", code: "montagne" },
  { header: "Collectif", code: "collectif" },
];

/**
 * CSV minimal (RFC 4180 : champs entre guillemets, virgules et guillemets
 * échappés `""` à l'intérieur) — suffisant pour un export Google Sheets propre.
 * Ne gère pas un retour à la ligne à l'intérieur d'un champ : absent de nos
 * colonnes (tout est du texte court sur une ligne), non nécessaire ici.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split(/\r\n|\n/)) {
    if (line.length === 0) continue;
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    rows.push(cells);
  }
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
function parisWallClockToIso(dateStr: string | undefined, timeStr: string | undefined): string | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr?.trim() ?? "");
  const t = /^(\d{2}):(\d{2})$/.exec(timeStr?.trim() ?? "");
  if (!d || !t) return null;
  const [, y, mo, day] = d;
  const [, hh, mi] = t;
  const guessUtc = Date.UTC(+y, +mo - 1, +day, +hh, +mi);
  const offset = timeZoneOffsetMs(guessUtc, "Europe/Paris");
  return new Date(guessUtc - offset).toISOString();
}

function parseRow(row: Record<string, string>, rowNumber: number, warn: (msg: string) => void): AgendaEvent | null {
  // Statut sur liste blanche ("publiée" seul) — pas de liste noire : une valeur vide (lignes non
  // remplies du gabarit Sheets), "brouillon" ou une faute de frappe dessus sont exclues pareil,
  // sans avertissement (état normal, pas une erreur de saisie).
  if (row["Statut"]?.trim() !== "publiée") return null;

  const disciplines = DISCIPLINE_COLUMNS.filter((d) => row[d.header]?.trim().toUpperCase() === "TRUE").map((d) => ({
    code: d.code,
    label: disciplineLabel[d.code],
  }));
  if (disciplines.length === 0) {
    warn(`ligne ${rowNumber} : aucune discipline cochée, ignorée`);
    return null;
  }

  const location = row["Lieu"]?.trim();
  if (!location) {
    warn(`ligne ${rowNumber} : lieu manquant, ignorée`);
    return null;
  }

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

  const opensAtIso = parisWallClockToIso(row["Date ouverture"], row["Heure ouverture"]);
  if (!opensAtIso) {
    warn(`ligne ${rowNumber} : date/heure d'ouverture invalide ("${row["Date ouverture"]}" "${row["Heure ouverture"]}"), ignorée`);
    return null;
  }

  const title = row["Titre"]?.trim() || null;

  return {
    id: `${row["Date"]}-${row["Heure"]}-${(title ?? location).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title,
    disciplines,
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

function parseSheet(csvText: string): AgendaEvent[] {
  const rows = parseCsv(csvText);
  if (rows.length === 0) return [];
  const [header, ...dataRows] = rows;

  const events: AgendaEvent[] = [];
  dataRows.forEach((cells, i) => {
    const row: Record<string, string> = {};
    header.forEach((col, colIndex) => {
      row[col] = cells[colIndex] ?? "";
    });
    const parsed = parseRow(row, i + 2, (msg) => console.warn(`[agenda] ${msg}`)); // +2 : ligne 1 = en-tête, index 0-based
    if (parsed) events.push(parsed);
  });

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

export async function getAgendaEvents(): Promise<AgendaEvent[]> {
  try {
    const response = await fetch(SHEET_CSV_URL, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const events = parseSheet(await response.text());
    if (events.length > 0) lastKnownGood = events;
    return events;
  } catch (err) {
    console.error("[agenda] lecture du tableur échouée, repli sur la dernière version connue", err);
    return lastKnownGood;
  }
}
