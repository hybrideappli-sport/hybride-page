import type { AgendaEvent } from "@/lib/agenda/source";

/**
 * Regroupement par mois/semaine pour /club/[slug]/planning (US mobile,
 * 2026-08-21). Pas de "server-only" ici, contrairement à lib/agenda/source.ts :
 * ce fichier ne fait que du calcul de date pur (aucun fetch, aucun secret) —
 * groupEventsByWeek est appelé côté client par PlanningList.tsx (filtre par
 * discipline en state client), les autres fonctions côté serveur uniquement.
 *
 * Grille de calendrier volontairement pas construite : au volume actuel
 * (2-3 sorties/semaine), une grille mensuelle serait très majoritairement
 * vide — coût de code pour un affichage qui n'aiderait personne. Critère de
 * réouverture : le jour où le volume de sorties publiées justifie une vue
 * densité (plusieurs sorties par jour, pas seulement par semaine),
 * reconsidérer une grille sur grand écran.
 */

const TIMEZONE = "Europe/Paris";

function getParisDateParts(iso: string): { year: number; month: number; day: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

/** "YYYY-MM" — clé de mois, calculée en fuseau Paris (pas UTC : un événement à 23h peut changer de jour/mois selon le fuseau). */
export function getMonthKey(iso: string): string {
  const { year, month } = getParisDateParts(iso);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function getCurrentMonthKey(): string {
  return getMonthKey(new Date().toISOString());
}

/** Décale une clé de mois de `delta` mois (peut être négatif) — arithmétique de calendrier pure, pas de fuseau à considérer ici. */
export function shiftMonthKey(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function getMonthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1));
  const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function eventsInMonth(events: AgendaEvent[], monthKey: string): AgendaEvent[] {
  return events.filter((event) => getMonthKey(event.startsAtIso) === monthKey);
}

/** "YYYY-MM-DD" du lundi de la semaine (fuseau Paris) contenant cet instant. */
function getMondayKey(iso: string): string {
  const { year, month, day } = getParisDateParts(iso);
  const asUtc = new Date(Date.UTC(year, month - 1, day));
  const weekday = asUtc.getUTCDay(); // 0 = dimanche .. 6 = samedi
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  asUtc.setUTCDate(asUtc.getUTCDate() + diffToMonday);
  return asUtc.toISOString().slice(0, 10);
}

function formatWeekLabel(mondayKey: string): string {
  const [y, m, d] = mondayKey.split("-").map(Number);
  const monday = new Date(Date.UTC(y, m - 1, d));
  const sunday = new Date(Date.UTC(y, m - 1, d + 6));
  const dayFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: "UTC" });
  const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" });
  if (monday.getUTCMonth() === sunday.getUTCMonth()) {
    return `Semaine du ${dayFmt.format(monday)} au ${dayFmt.format(sunday)} ${monthFmt.format(sunday)}`;
  }
  return `Semaine du ${dayFmt.format(monday)} ${monthFmt.format(monday)} au ${dayFmt.format(sunday)} ${monthFmt.format(sunday)}`;
}

export interface WeekGroup {
  key: string;
  label: string;
  events: AgendaEvent[];
}

export function groupEventsByWeek(events: AgendaEvent[]): WeekGroup[] {
  const groups = new Map<string, AgendaEvent[]>();
  for (const event of events) {
    const key = getMondayKey(event.startsAtIso);
    const bucket = groups.get(key);
    if (bucket) bucket.push(event);
    else groups.set(key, [event]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, weekEvents]) => ({ key, label: formatWeekLabel(key), events: weekEvents }));
}
