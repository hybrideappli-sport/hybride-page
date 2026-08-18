import type { ReactElement } from "react";

import styles from "./RegistrationStatusBadge.module.css";

/** Aligné sur l'enum club.registrations.status (supabase/migrations/20260812093200_*.sql). */
export type RegistrationStatus = "confirmed" | "waitlist" | "pending_parental_authorization" | "cancelled";

const config: Record<RegistrationStatus, { label: string; className: string; icon: ReactElement }> = {
  confirmed: {
    label: "Confirmée",
    className: styles.confirmed,
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8.5 6.5 12 13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  waitlist: {
    label: "Liste d'attente",
    className: styles.waitlist,
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  pending_parental_authorization: {
    label: "En attente d'autorisation parentale",
    className: styles.pendingParental,
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2.5 4 8 8.5 13.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  cancelled: {
    label: "Annulée",
    className: styles.cancelled,
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
};

export function RegistrationStatusBadge({ status }: { status: RegistrationStatus }) {
  const { label, className, icon } = config[status];
  return (
    <span className={`${styles.badge} ${className}`}>
      {icon}
      {label}
    </span>
  );
}
