"use client";

import { useActionState } from "react";

import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { createAccount, type CreateAccountState } from "@/lib/actions/auth";
import styles from "./page.module.css";

const initialState: CreateAccountState = {};

export function CreationCompteForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(createAccount, initialState);

  return (
    <form action={formAction} className={styles.form}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormField label="Prénom" name="firstName" autoComplete="given-name" required />
      <FormField label="Nom" name="lastName" autoComplete="family-name" required />
      <FormField label="Date de naissance" name="birthDate" type="date" autoComplete="bday" required />
      <FormField label="Email" name="email" type="email" autoComplete="email" required />
      <FormField label="Mot de passe" name="password" type="password" autoComplete="new-password" required helpText="8 caractères minimum" />

      {state.error ? (
        <p className={styles.formError} role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
