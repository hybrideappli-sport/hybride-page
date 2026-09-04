"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { activityLabel, type Activity } from "@/components/ui/Tag";
import { buildMonthGrid, getTodayParisKey, WEEKDAY_LABELS, type CalendarCell } from "@/lib/agenda/planning";
import type { AgendaEvent } from "@/lib/agenda/source";
import { formatEventDateLong, formatEventTime } from "@/lib/format";
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
 * Grille 7 colonnes à toutes les largeurs : sur grand écran les cases font
 * ~150px dans le conteneur de 1120px commun aux pages club, sur téléphone ~47px
 * après récupération des marges et des gouttières (le détail de l'arithmétique
 * est dans PlanningCalendar.module.css). Seule la densité change, jamais la
 * structure — donc aucune mesure de viewport en JavaScript, et aucun écart entre
 * le rendu serveur et l'hydratation.
 *
 * Chaque SORTIE est un lien vers sa page (2026-09-04), et non plus la case
 * entière ouvrant une fenêtre modale. Trois raisons : une case peut porter deux
 * sorties, qui ne peuvent pas mener à la même adresse ; un lien s'ouvre dans un
 * onglet, se copie et se partage ; et il n'y a plus qu'un seul chemin vers le
 * contenu d'une sortie, donc un seul à maintenir.
 */
export function PlanningCalendar({ events, monthKey, clubSlug }: { events: AgendaEvent[]; monthKey: string; clubSlug: string }) {
  const [selected, setSelected] = useState<Set<Activity>>(new Set());

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

        <div className={styles.sheet}>
          {weeks.map((week) => (
            <div key={week.key} className={styles.week}>
              {week.cells.map((cell) => (
                <Cell key={cell.key} cell={cell} isToday={cell.key === todayKey} clubSlug={clubSlug} />
              ))}
            </div>
          ))}
        </div>
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
    </div>
  );
}

function Cell({ cell, isToday, clubSlug }: { cell: CalendarCell; isToday: boolean; clubSlug: string }) {
  // Une case ne peut porter qu'une couleur. Avec une seule sortie — le cas de
  // toutes les journées de septembre — l'aplat est porté par la CASE, numéro du
  // jour compris, comme sur l'agenda Canva. Avec deux sorties d'activités
  // différentes, aucune couleur unique ne serait honnête : la case reste neutre
  // et chaque sortie devient une bande colorée.
  const single = cell.events.length === 1 ? cell.events[0] : null;

  const classes = [
    styles.cell,
    cell.inMonth ? "" : styles.cellOut,
    isToday ? styles.cellToday : "",
    single ? `${styles.cellFilled} ${styles[ACTIVITY_CLASS[single.activity]]}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <span className={styles.dayNumber}>{cell.dayNumber}</span>

      {cell.events.length > 0 ? (
        <span className={styles.events}>
          {cell.events.map((event) => (
            <Link
              key={event.slug}
              href={`/club/${clubSlug}/sorties/${event.slug}`}
              className={`${styles.event} ${single ? "" : `${styles.eventBand} ${styles[ACTIVITY_CLASS[event.activity]]}`}`}
              /* Le nom affiché est volontairement court et peut être tronqué dans une
                 case de ~48px : l'intitulé complet et la date passent par aria-label,
                 pour qu'un lecteur d'écran annonce le lien en entier. */
              aria-label={`${event.title ?? event.activityLabelText} — ${formatEventDateLong(event.startsAtIso)}`}
            >
              <span className={styles.eventTime}>{formatEventTime(event.startsAtIso)}</span>
              {/* Nom court en priorité : dans une case de ~48px, « Soirée d'hybride au
                  mini-golf » ne rentre pas. Le titre complet est sur la page de la sortie. */}
              <span className={styles.eventName}>{event.shortTitle ?? event.title ?? event.activityLabelText}</span>
            </Link>
          ))}
        </span>
      ) : null}
    </div>
  );
}
