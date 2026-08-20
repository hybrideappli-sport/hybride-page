import type { LucideIcon } from "lucide-react";

import styles from "./SocialLink.module.css";

/**
 * Icône monochrome neutre (lucide-react), jamais un logo de marque déposée —
 * Strava et Instagram n'ont pas de composant dédié dans lucide (retiré du set
 * pour cette même raison de licence), le choix de l'icône de substitution est
 * fait par l'appelant. Zone cliquable 44px minimum (accessibilité tactile),
 * le nom du réseau porté par `aria-label` puisque l'icône seule ne le dit pas.
 */
export function SocialLink({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={styles.link}>
      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
    </a>
  );
}
