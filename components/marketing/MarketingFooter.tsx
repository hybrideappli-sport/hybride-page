import Link from "next/link";

import styles from "./MarketingFooter.module.css";

/**
 * US-07 : mentions légales et politique de confidentialité de l'ENTITÉ COMMERCIALE,
 * distinctes de celles de l'association (club, sur /club/*). Raison son nom
 * commercial réel n'est pas encore arrêté à ce stade — placeholder à corriger.
 */
export function MarketingFooter() {
  return (
    <footer className={styles.footer}>
      <p>
        <Link href="/mentions-legales">Mentions légales</Link> · <Link href="/politique-de-confidentialite">Politique de confidentialité</Link>
      </p>
    </footer>
  );
}
