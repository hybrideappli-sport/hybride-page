"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { signIn, type SignInState } from "@/lib/actions/auth";
import styles from "../creation-compte/page.module.css";

const initialState: SignInState = {};

export function ConnexionForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className={styles.form}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormField label="Email" name="email" type="email" autoComplete="email" required />
      <FormField label="Mot de passe" name="password" type="password" autoComplete="current-password" required />

      {state.error ? (
        <p className={styles.formError} role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
