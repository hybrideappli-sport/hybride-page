"use client";

import { useEffect, useRef } from "react";

import { RegistrationCta } from "@/components/ui/RegistrationCta";
import { Tag } from "@/components/ui/Tag";
import type { AgendaEvent } from "@/lib/agenda/source";
import { formatEventDateLong, formatEventTime } from "@/lib/format";
import styles from "./EventSheet.module.css";

/**
 * Fiche du jour sélectionné : feuille depuis le bas sur mobile, modale centrée
 * sur grand écran (bascule en CSS pur, voir EventSheet.module.css).
 *
 * Bâtie sur <dialog>.showModal() plutôt que sur une div + gestion maison :
 * l'élément natif apporte la fermeture à Échap, le piégeage du focus dans la
 * fiche, le retour du focus à l'élément déclencheur à la fermeture et l'inertie
 * du reste de la page — tout ce qu'il aurait fallu réécrire (mal) à la main.
 * Seule la fermeture au clic extérieur reste à câbler : un clic sur le fond
 * cible l'élément <dialog> lui-même, pas son contenu.
 *
 * Prend la liste des sorties du jour, pas une sortie unique : une même date
 * peut en porter deux (un rituel plus une sortie programmée). Les empiler traite
 * le cas simple et le cas multiple de la même façon, sans sélecteur à part.
 *
 * La logique d'inscription ne change pas : RegistrationCta porte toujours ses
 * trois états (décompte / lien Luma / bientôt disponible), seul son emballage
 * bouge.
 */
export function EventSheet({ events, onClose }: { events: AgendaEvent[] | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = events !== null && events.length > 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    else if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  // "cancel" couvre Échap : on repasse par onClose pour que l'état React suive la
  // fermeture native, sinon la fiche resterait "ouverte" du point de vue du parent.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="event-sheet-title"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      {isOpen ? (
        <div className={styles.panel}>
          <div className={styles.head}>
            <h2 id="event-sheet-title" className={styles.date}>
              {formatEventDateLong(events[0].startsAtIso)}
            </h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer la fiche">
              ×
            </button>
          </div>

          <div className={styles.body}>
            {events.map((event) => (
              <EventBlock key={event.id} event={event} />
            ))}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}

function EventBlock({ event }: { event: AgendaEvent }) {
  const title = event.title ?? event.disciplines.map((d) => d.label).join(" + ");

  const facts: { label: string; value: string }[] = [
    { label: "Heure", value: formatEventTime(event.startsAtIso) },
    { label: "Durée", value: event.duration },
    { label: "Lieu", value: event.location },
  ];
  if (event.format) facts.push({ label: "Format", value: event.format });
  if (event.level) facts.push({ label: "Niveau", value: event.level });
  if (event.details) facts.push({ label: "Détails", value: event.details });

  return (
    <div className={styles.event}>
      <div className={styles.tags}>
        {event.disciplines.map((d) => (
          <Tag key={d.code} variant={d.code}>
            {d.label}
          </Tag>
        ))}
      </div>
      <h3 className={styles.title}>{title}</h3>

      <dl className={styles.facts}>
        {facts.map((fact) => (
          <div key={fact.label} className={styles.fact}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.cta}>
        <RegistrationCta opensAtIso={event.opensAtIso} lumaUrl={event.lumaUrl} />
      </div>
    </div>
  );
}
