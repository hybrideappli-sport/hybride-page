"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { decideParentalAuthorization, type DecideParentalState } from "@/lib/actions/parental";
import styles from "./page.module.css";

const initialState: DecideParentalState = {};

export function DecisionForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(decideParentalAuthorization, initialState);

  if (state.decided === "confirmed") {
    return <p className={styles.state}>Autorisation enregistrée, merci.</p>;
  }
  if (state.decided === "denied") {
    return <p className={styles.state}>Refus enregistré, la place a été libérée.</p>;
  }

  return (
    <form action={formAction} className={styles.actions}>
      <input type="hidden" name="token" value={token} />
      {state.error ? (
        <p className={styles.state} role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" name="approve" value="true" disabled={pending}>
        Autoriser
      </Button>
      <Button type="submit" name="approve" value="false" variant="line" disabled={pending}>
        Refuser
      </Button>
    </form>
  );
}
