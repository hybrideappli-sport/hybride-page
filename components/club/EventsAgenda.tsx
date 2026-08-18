"use client";

import { useState } from "react";

import { OutingRow } from "@/components/ui/OutingRow";
import { disciplineLabel, type Discipline } from "@/components/ui/Tag";
import { formatEventDay, formatEventMonth } from "@/lib/format";
import type { UpcomingEvent } from "@/lib/queries/club";
import styles from "./EventsAgenda.module.css";

const ALL_DISCIPLINES = Object.keys(disciplineLabel) as Discipline[];

/**
 * US-02 AC4 / US-04 AC1. Un événement porte une ou plusieurs disciplines
 * (club.event_disciplines) : le filtre agit sur la LISTE d'événements (chaque
 * événement au plus une fois), jamais en itérant discipline par discipline —
 * c'est ce qui évite qu'un swim and run apparaisse deux fois quand "Eau" et
 * "Course à pied" sont cochés ensemble.
 */
export function EventsAgenda({ events, clubSlug }: { events: UpcomingEvent[]; clubSlug: string }) {
  const [selected, setSelected] = useState<Set<Discipline>>(new Set());

  function toggle(code: Discipline) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const filtered = selected.size === 0 ? events : events.filter((e) => e.discipline_codes.some((c) => selected.has(c as Discipline)));

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

      {filtered.length === 0 ? (
        <p className={styles.note}>Aucune sortie pour cette sélection.</p>
      ) : (
        filtered.map((event) => (
          <OutingRow
            key={event.id}
            day={formatEventDay(event.starts_at)}
            month={formatEventMonth(event.starts_at)}
            title={event.title ?? event.discipline_labels.join(" + ")}
            subtitle={`${new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(event.starts_at))} · ${event.location}`}
            disciplines={event.discipline_codes.map((code, i) => ({ code: code as Discipline, label: event.discipline_labels[i] ?? code }))}
            slotsLeft={event.places_left}
            slotsTotal={event.capacity}
            full={event.places_left <= 0}
            href={`/club/${clubSlug}/sorties/${event.id}`}
          />
        ))
      )}
    </div>
  );
}
