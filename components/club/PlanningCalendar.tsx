"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { disciplineLabel, type Discipline } from "@/components/ui/Tag";
import { buildMonthGrid, getTodayParisKey, WEEKDAY_LABELS, type CalendarCell } from "@/lib/agenda/planning";
import type { AgendaEvent } from "@/lib/agenda/source";
import { formatEventDateLong } from "@/lib/format";
import { EventSheet } from "./EventSheet";
import styles from "./PlanningCalendar.module.css";

const ALL_DISCIPLINES = Object.keys(disciplineLabel) as Discipline[];

/**
 * Grille mensuelle 7 colonnes (US grille, 2026-08-25), remplaçant la liste
 * groupée par semaine — voir lib/agenda/planning.ts pour le critère de
 * réouverture qui a mené à ce changement.
 *
 * Une case ne porte QUE le numéro du jour et un point par sortie : c'est ce qui
 * la laisse tenir dans 1/7e de 375px sans déborder. Tout le texte (titre, lieu,
 * horaire, inscription) est dans la fiche, ouverte au clic — voir EventSheet.
 */
export function PlanningCalendar({ events, monthKey, clubSlug }: { events: AgendaEvent[]; monthKey: string; clubSlug: string }) {
  const [selected, setSelected] = useState<Set<Discipline>>(new Set());
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

  function toggle(code: Discipline) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const filtered = selected.size === 0 ? events : events.filter((e) => e.disciplines.some((d) => selected.has(d.code)));
  const weeks = buildMonthGrid(monthKey, filtered);

  return (
    <div>
      <div className={styles.filters} role="group" aria-label="Filtrer par discipline">
        {ALL_DISCIPLINES.map((code) => (
          <button
            key={code}
            type="button"
            className={`${styles.chip} ${selected.has(code) ? styles.chipActive : ""}`}
            aria-pressed={selected.has(code)}
            onClick={() => toggle(code)}
          >
            {disciplineLabel[code]}
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

        {weeks.map((week, i) => (
          <div key={i} className={styles.week}>
            {week.map((cell) => (
              <Cell key={cell.key} cell={cell} isToday={cell.key === todayKey} onOpen={() => setOpenDay(cell.events)} />
            ))}
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>
            {events.length === 0
              ? "Le programme de ce mois n’est pas encore en ligne."
              : "Aucune sortie de cette discipline ce mois-ci."}
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

function Cell({ cell, isToday, onOpen }: { cell: CalendarCell; isToday: boolean; onOpen: () => void }) {
  const classes = [styles.cell, cell.inMonth ? "" : styles.cellOut, isToday ? styles.cellToday : ""].filter(Boolean).join(" ");

  const dots = (
    <span className={styles.dots} aria-hidden="true">
      {cell.events.map((event) => (
        <span key={event.id} className={`${styles.dot} ${styles[event.disciplines[0].code]}`} />
      ))}
    </span>
  );

  if (cell.events.length === 0) {
    return (
      <div className={classes}>
        <span className={styles.dayNumber}>{cell.dayNumber}</span>
      </div>
    );
  }

  // Le libellé accessible porte ce que la case ne peut pas afficher (pas de texte
  // dans une case de 1/7e d'écran) : la date en toutes lettres et le nombre de sorties.
  const label = `${formatEventDateLong(cell.events[0].startsAtIso)} — ${cell.events.length} sortie${cell.events.length > 1 ? "s" : ""}`;

  return (
    <button type="button" className={`${classes} ${styles.cellHasEvents}`} onClick={onOpen} aria-label={label}>
      <span className={styles.dayNumber}>{cell.dayNumber}</span>
      {dots}
    </button>
  );
}
