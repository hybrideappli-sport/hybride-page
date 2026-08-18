"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { cancelRegistration, type CancelState } from "@/lib/actions/registrations";

const initialState: CancelState = {};

export function CancelButton({ registrationId }: { registrationId: string }) {
  const [state, formAction, pending] = useActionState(cancelRegistration, initialState);

  if (state.success) return <span>Annulée</span>;

  return (
    <form action={formAction}>
      <input type="hidden" name="registrationId" value={registrationId} />
      <Button type="submit" variant="line" size="mini" disabled={pending}>
        {pending ? "…" : "Annuler"}
      </Button>
      {state.error ? <p role="alert">{state.error}</p> : null}
    </form>
  );
}
