"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { activityLabel, type Activity } from "@/components/ui/Tag";
import { buildMonthGrid, getTodayParisKey, WEEKDAY_LABELS, WEEKDAY_SHORT, type CalendarCell } from "@/lib/agenda/planning";
import type { AgendaEvent } from "@/lib/agenda/source";
import { formatEventDateLong, formatEventTime } from "@/lib/format";
import { EventSheet } from "./EventSheet";
import styles from "./PlanningCalendar.module.css";

const ALL_ACTIVITIES = Object.keys(activityLabel) as Activity[];

/** `social-run` porte un tiret, illégal comme nom de classe de module CSS — d'où cette table. */
const ACTIVITY_CLASS: Record<Activity, string> = {
  piste: "piste",
  "social-run": "socialRun",
  trail: "trail",
  velo: "velo",
  nage: "nage",
  bivouac: "bivouac",
  soirees: "soirees",
  communautaire: "communautaire",
};

/**
 * Un seul balisage, deux mises en page (2026-08-26) :
 *
 * - Grand écran : grille 7 colonnes, chaque case porte le nom de la sortie et
 *   son heure. Les cases font ~150px dans le conteneur de 1120px commun à
 *   toutes les pages club — assez pour du texte, contrairement au plafond de
 *   720px précédent (~100px/case) qui imposait des points de couleur muets.
 * - Mobile : la même grille devient une liste groupée par semaine, chaque
 *   sortie occupant une carte pleine largeur. Sept colonnes sur 375px font
 *   53px, où aucun nom ne tient ; et une grille verticale de 31 lignes ferait
 *   défiler ~19 jours vides pour ~12 sorties. Les jours sans sortie et les
 *   semaines sans sortie sont donc masqués en CSS, pas retirés du DOM.
 *
 * Cette bascule est purement CSS (PlanningCalendar.module.css) : pas de mesure
 * de viewport en JavaScript, donc pas d'écart entre le rendu serveur et
 * l'hydratation.
 */
export function PlanningCalendar({ events, monthKey, clubSlug }: { events: AgendaEvent[]; monthKey: string; clubSlug: string }) {
  const [selected, setSelected] = useState<Set<Activity>>(new Set());
  const [openDay, setOpenDay] = useState<AgendaEvent[] | null>(null);

  // Jour courant calculé après le montage seulement : au rendu serveur, une page
  // mise en cache figerait "aujourd'hui" sur la date de génération (même raison
  // que RegistrationCta).
  const [todayKey, setTodayKey] = useState<string | null>(null);
  useEffect(() => {
    // setTimeout(…, 0) plutôt qu'un appel synchrone : même contournement que
    // RegistrationCta.tsx — la mise à jour vient d'une minuterie (système externe)
    // et non d'un rendu en cascade (react-hooks/set-state-in-effect).
    const timeout = setTimeout(() => setTodayKey(getTodayParisKey()), 0);
    return () => clearTimeout(timeout);
  }, []);

  function toggle(code: Activity) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const filtered = selected.size === 0 ? events : events.filter((e) => selected.has(e.activity));
  const weeks = buildMonthGrid(monthKey, filtered);

  return (
    <div>
      <div className={styles.filters} role="group" aria-label="Filtrer par activité">
        {ALL_ACTIVITIES.map((code) => (
          <button
            key={code}
            type="button"
            className={`${styles.chip} ${selected.has(code) ? styles.chipActive : ""}`}
            aria-pressed={selected.has(code)}
            onClick={() => toggle(code)}
          >
            {activityLabel[code]}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.weekdays} aria-hidden="true">
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={i} className={styles.weekday}>
              {label}
            </div>
          ))}
        </div>

        {weeks.map((week) => (
          <div key={week.key} className={`${styles.week} ${week.hasEvents ? "" : styles.weekEmpty}`}>
            <p className={styles.weekLabel}>{week.label}</p>
            {week.cells.map((cell, i) => (
              <Cell key={cell.key} cell={cell} weekdayIndex={i} isToday={cell.key === todayKey} onOpen={() => setOpenDay(cell.events)} />
            ))}
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>
            {events.length === 0 ? "Le programme de ce mois n’est pas encore en ligne." : "Aucune sortie de cette activité ce mois-ci."}
          </p>
          <p>
            En attendant, les rituels du lundi et du mercredi restent fixes.{" "}
            <Link href={`/club/${clubSlug}#le-club`}>Voir les rituels</Link>
          </p>
        </div>
      ) : null}

      <EventSheet events={openDay} onClose={() => setOpenDay(null)} />
    </div>
  );
}

function Cell({
  cell,
  weekdayIndex,
  isToday,
  onOpen,
}: {
  cell: CalendarCell;
  weekdayIndex: number;
  isToday: boolean;
  onOpen: () => void;
}) {
  const classes = [styles.cell, cell.inMonth ? "" : styles.cellOut, isToday ? styles.cellToday : ""].filter(Boolean).join(" ");

  if (cell.events.length === 0) {
    return (
      <div className={`${classes} ${styles.cellEmpty}`}>
        <span className={styles.dayNumber}>{cell.dayNumber}</span>
      </div>
    );
  }

  const label = `${formatEventDateLong(cell.events[0].startsAtIso)} — ${cell.events
    .map((e) => e.title ?? e.activityLabelText)
    .join(", ")}`;

  return (
    <button type="button" className={`${classes} ${styles.cellHasEvents}`} onClick={onOpen} aria-label={label}>
      <span className={styles.dayNumber}>
        {/* L'abrégé du jour n'a de sens que sur mobile : en grille, c'est l'en-tête de colonne qui le porte. */}
        <span className={styles.weekdayShort}>{WEEKDAY_SHORT[weekdayIndex]} </span>
        {cell.dayNumber}
      </span>

      <span className={styles.events}>
        {cell.events.map((event) => (
          <span key={event.id} className={`${styles.event} ${styles[ACTIVITY_CLASS[event.activity]]}`}>
            <span className={styles.eventTime}>{formatEventTime(event.startsAtIso)}</span>
            <span className={styles.eventName}>{event.title ?? event.activityLabelText}</span>
          </span>
        ))}
      </span>
    </button>
  );
}
