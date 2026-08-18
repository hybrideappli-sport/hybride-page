"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { cancelEvent, type CancelEventState } from "@/lib/actions/admin-events";

const initialState: CancelEventState = {};

export function CancelEventButton({ eventId }: { eventId: string }) {
  const [state, formAction, pending] = useActionState(cancelEvent, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <Button type="submit" variant="line" size="mini" disabled={pending}>
        {pending ? "…" : "Annuler"}
      </Button>
      {state.error ? <p role="alert">{state.error}</p> : null}
    </form>
  );
}
