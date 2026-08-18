import { useId, type InputHTMLAttributes } from "react";

import styles from "./Input.module.css";

export interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  helpText?: string;
  errorMessage?: string;
}

/**
 * Champ labellisé — jamais de placeholder seul en guise de label (docs/architecture.md
 * §4). Erreur liée par aria-describedby + aria-invalid, pas seulement par la couleur.
 */
export function FormField({ label, helpText, errorMessage, className, ...props }: FormFieldProps) {
  const id = useId();
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = errorMessage ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        className={[styles.field, errorMessage ? styles.error : null, className].filter(Boolean).join(" ")}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {helpText ? (
        <p id={helpId} className={styles.help}>
          {helpText}
        </p>
      ) : null}
      {errorMessage ? (
        <p id={errorId} className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
