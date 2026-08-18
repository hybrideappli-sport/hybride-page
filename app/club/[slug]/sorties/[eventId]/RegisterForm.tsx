"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { registerForEvent, type RegisterState } from "@/lib/actions/registrations";
import styles from "./page.module.css";

const initialState: RegisterState = {};

const statusMessage: Record<NonNullable<RegisterState["status"]>, string> = {
  confirmed: "Inscription confirmée !",
  waitlist: "Tu es en liste d'attente — tu seras confirmé automatiquement si une place se libère.",
  pending_parental_authorization: "Un email a été envoyé à ton parent, réponse sous 48h.",
};

export function RegisterForm({ eventId, full }: { eventId: string; full: boolean }) {
  const [state, formAction, pending] = useActionState(registerForEvent, initialState);

  if (state.success && state.status) {
    return <p className={styles.registerNote}>{statusMessage[state.status]}</p>;
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <FormField
        label="Email d'un parent"
        name="parentEmail"
        type="email"
        helpText="Requis uniquement si tu es mineur·e à la date de la sortie."
      />
      {state.error ? (
        <p className={styles.registerNote} role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "…" : full ? "Rejoindre la liste d'attente" : "Je m'inscris"}
      </Button>
    </form>
  );
}
