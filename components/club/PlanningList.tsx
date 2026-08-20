"use client";

import Link from "next/link";
import { useState } from "react";

import { OutingRow } from "@/components/ui/OutingRow";
import { disciplineLabel, type Discipline } from "@/components/ui/Tag";
import { groupEventsByWeek } from "@/lib/agenda/planning";
import type { AgendaEvent } from "@/lib/agenda/source";
import { formatEventDay, formatEventMonth } from "@/lib/format";
import styles from "./PlanningList.module.css";

const ALL_DISCIPLINES = Object.keys(disciplineLabel) as Discipline[];

/**
 * Liste groupée par semaine, sur tous les écrans (US mobile, 2026-08-21) — pas
 * de grille de calendrier, voir lib/agenda/planning.ts pour le raisonnement et
 * le critère de réouverture.
 */
export function PlanningList({ events, clubSlug }: { events: AgendaEvent[]; clubSlug: string }) {
  const [selected, setSelected] = useState<Set<Discipline>>(new Set());

  function toggle(code: Discipline) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const filtered = selected.size === 0 ? events : events.filter((e) => e.disciplines.some((d) => selected.has(d.code)));
  const weeks = groupEventsByWeek(filtered);

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

      {weeks.length === 0 ? (
        <div className={styles.empty}>
          <p>Le programme de ce mois n&rsquo;est pas encore en ligne.</p>
          <p>
            En attendant, les rituels du lundi et du mercredi restent fixes.{" "}
            <Link href={`/club/${clubSlug}#le-club`}>Voir les rituels</Link>
          </p>
        </div>
      ) : (
        weeks.map((week) => (
          <div key={week.key} className={styles.week}>
            <p className={styles.weekLabel}>{week.label}</p>
            {week.events.map((event) => (
              <OutingRow
                key={event.id}
                day={formatEventDay(event.startsAtIso)}
                month={formatEventMonth(event.startsAtIso)}
                title={event.title ?? event.disciplines.map((d) => d.label).join(" + ")}
                subtitle={`${new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(event.startsAtIso))} · ${event.location}`}
                disciplines={event.disciplines}
                duration={event.duration}
                details={event.details ?? undefined}
                opensAtIso={event.opensAtIso}
                lumaUrl={event.lumaUrl}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
