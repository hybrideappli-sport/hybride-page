import type { AgendaEvent } from "@/lib/agenda/source";

/**
 * Calcul de dates pour /club/[slug]/planning. Pas de "server-only" ici,
 * contrairement à lib/agenda/source.ts : ce fichier ne fait que du calcul de
 * date pur (aucun fetch, aucun secret) — buildMonthGrid est appelé côté client
 * par PlanningCalendar.tsx (filtre par discipline + sélection en state).
 *
 * Grille de calendrier construite le 2026-08-25 : le critère de réouverture
 * noté ici en 2026-08-21 (« le jour où le volume justifie une vue densité »)
 * est atteint — deux rituels hebdomadaires plus les sorties programmées font
 * une douzaine d'événements par mois, la grille n'est plus majoritairement
 * vide.
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

/**
 * L'échéance est-elle déjà passée selon l'horloge de CELUI QUI APPELLE ?
 *
 * Appelée au rendu serveur, elle donne la valeur de départ du compte à rebours
 * du planning (PlanningCountdown.tsx). Comme `getCurrentMonthKey()` juste
 * au-dessus, elle lit l'horloge : le rendu n'est donc pas idempotent, et c'est
 * assumé — la page planning est rendue à la requête. Aucune décision finale ne
 * repose dessus : le client recalcule au montage et corrige.
 *
 * Une échéance illisible renvoie `true` : mieux vaut un planning ouvert qu'un
 * planning bloqué par une faute de frappe dans la configuration.
 */
export function deadlineHasPassed(iso: string): boolean {
  const targetMs = new Date(iso).getTime();
  if (Number.isNaN(targetMs)) return true;
  return new Date().getTime() >= targetMs;
}

/**
 * Mois sur lequel ouvrir la page quand le visiteur n'en demande aucun.
 *
 * Le mois courant, sauf s'il ne contient aucune sortie : on avance alors sur le
 * premier mois qui en contient. Sans cela, ouvrir le planning les tout derniers
 * jours d'un mois donne une grille vide alors que le suivant est rempli — cas
 * réel du 30 août 2026, où les 17 sorties sont en septembre. Un mois vide reste
 * possible et n'est pas une erreur (aucune sortie nulle part) : on retombe
 * simplement sur le mois courant.
 *
 * On ne revient jamais en arrière : le planning montre ce qui vient, pas des
 * archives.
 */
export function getDefaultMonthKey(events: AgendaEvent[]): string {
  const currentKey = getCurrentMonthKey();
  const upcoming = events.map((e) => getMonthKey(e.startsAtIso)).filter((key) => key >= currentKey);
  if (upcoming.length === 0) return currentKey;
  return upcoming.reduce((a, b) => (a < b ? a : b));
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

/** "YYYY-MM-DD" du jour (fuseau Paris) de cet instant — clé de regroupement des cases de la grille. */
export function getParisDayKey(iso: string): string {
  const { year, month, day } = getParisDateParts(iso);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" d'aujourd'hui en fuseau Paris. À n'appeler que côté client : figé par le cache au rendu serveur. */
export function getTodayParisKey(): string {
  return getParisDayKey(new Date().toISOString());
}

export interface CalendarCell {
  /** "YYYY-MM-DD" */
  key: string;
  dayNumber: number;
  /** false pour les jours de complément (fin du mois précédent, début du suivant) qui remplissent la première et la dernière semaine. */
  inMonth: boolean;
  events: AgendaEvent[];
}

/** Lundi → dimanche, comme un calendrier papier français (et comme la norme ISO 8601). */
export const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"] as const;

/** Abrégés affichés dans la carte de chaque sortie sur mobile, où la colonne ne porte plus le jour. */
export const WEEKDAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

export interface CalendarWeek {
  key: string;
  /** "Semaine du 7 au 13 septembre" — n'apparaît que sur mobile, où la grille devient une liste. */
  label: string;
  cells: CalendarCell[];
  /** Une semaine sans aucune sortie est masquée sur mobile : rien à y lire. */
  hasEvents: boolean;
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

/**
 * Grille du mois : des semaines de 7 cases, complétées avant le 1er et après le
 * dernier jour pour que chaque ligne soit pleine. Arithmétique en UTC sur des
 * dates déjà ramenées au fuseau Paris (getParisDayKey), jamais sur des instants
 * bruts : c'est ce qui évite qu'un événement de 23h bascule d'un jour.
 *
 * Chaque semaine porte aussi son libellé et un drapeau hasEvents : le même
 * balisage sert de grille 7 colonnes sur grand écran et de liste de cartes
 * groupée par semaine sur mobile (voir PlanningCalendar.module.css) — une seule
 * structure de données, pas deux rendus à tenir synchronisés.
 */
export function buildMonthGrid(monthKey: string, events: AgendaEvent[]): CalendarWeek[] {
  const eventsByDay = new Map<string, AgendaEvent[]>();
  for (const event of events) {
    const key = getParisDayKey(event.startsAtIso);
    const bucket = eventsByDay.get(key);
    if (bucket) bucket.push(event);
    else eventsByDay.set(key, [event]);
  }

  const [year, month] = monthKey.split("-").map(Number);
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const weekday = firstOfMonth.getUTCDay(); // 0 = dimanche .. 6 = samedi
  const daysBefore = weekday === 0 ? 6 : weekday - 1; // lundi en tête de semaine

  const cursor = new Date(firstOfMonth);
  cursor.setUTCDate(cursor.getUTCDate() - daysBefore);

  const weeks: CalendarWeek[] = [];
  // Boucle sur les semaines entières tant que la précédente n'a pas dépassé le mois :
  // 4, 5 ou 6 lignes selon le calendrier, jamais une ligne vide de complément.
  do {
    const mondayKey = cursor.toISOString().slice(0, 10);
    const cells: CalendarCell[] = [];
    for (let i = 0; i < 7; i++) {
      const key = cursor.toISOString().slice(0, 10);
      cells.push({
        key,
        dayNumber: cursor.getUTCDate(),
        inMonth: cursor.getUTCMonth() === month - 1 && cursor.getUTCFullYear() === year,
        events: eventsByDay.get(key) ?? [],
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push({
      key: mondayKey,
      label: formatWeekLabel(mondayKey),
      cells,
      hasEvents: cells.some((c) => c.events.length > 0),
    });
  } while (cursor.getUTCMonth() === month - 1 && cursor.getUTCFullYear() === year);

  return weeks;
}
