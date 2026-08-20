"use client";

import { useState } from "react";

import { OutingRow } from "@/components/ui/OutingRow";
import { disciplineLabel, type Discipline } from "@/components/ui/Tag";
import type { AgendaEvent } from "@/lib/agenda/source";
import { formatEventDay, formatEventMonth } from "@/lib/format";
import styles from "./EventsAgenda.module.css";

const ALL_DISCIPLINES = Object.keys(disciplineLabel) as Discipline[];

/**
 * Un événement porte une ou plusieurs disciplines (colonnes Course/Vélo/Eau/
 * Montagne/Collectif du tableur, ADR-010 §2) : le filtre agit sur la LISTE
 * d'événements (chaque événement au plus une fois), jamais en itérant
 * discipline par discipline — c'est ce qui évite qu'un swim and run apparaisse
 * deux fois quand "Eau" et "Course à pied" sont cochés ensemble.
 */
export function EventsAgenda({ events }: { events: AgendaEvent[] }) {
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
        ))
      )}
    </div>
  );
}
