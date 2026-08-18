"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { disciplineLabel, type Discipline } from "@/components/ui/Tag";
import { createEvent, type CreateEventState } from "@/lib/actions/admin-events";
import styles from "./page.module.css";

const initialState: CreateEventState = {};

const DISCIPLINES = Object.entries(disciplineLabel) as [Discipline, string][];

export function CreateEventForm({ clubId }: { clubId: string }) {
  const [state, formAction, pending] = useActionState(createEvent, initialState);

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="clubId" value={clubId} />

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>Disciplines (au moins une)</legend>
        {DISCIPLINES.map(([code, label]) => (
          <label key={code} className={styles.checkboxLabel}>
            <input type="checkbox" name="disciplineCodes" value={code} />
            {label}
          </label>
        ))}
      </fieldset>

      <FormField label="Titre (optionnel)" name="title" />
      <FormField label="Date" name="date" type="date" required />
      <FormField label="Heure" name="time" type="time" required />
      <FormField label="Lieu de rendez-vous" name="location" required />
      <FormField label="Niveau requis (optionnel)" name="level" />
      <FormField label="Capacité maximale" name="capacity" type="number" min={1} required />

      {state.error ? (
        <p className={styles.formError} role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Publication…" : "Publier la sortie"}
      </Button>
    </form>
  );
}
