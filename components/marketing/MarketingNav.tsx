import Link from "next/link";

import styles from "./MarketingNav.module.css";

/**
 * Vitrine app (/) — nav volontairement nue (docs/design/direction-visuelle-accueil.html) :
 * rien à cliquer sauf les deux portes posées dans le corps de la page. Aucun
 * lien croisé vers du contenu club ici, y compris "Trouver un club" (retiré le
 * 2026-08-17) — c'est le rôle de la porte "Le club", pas de la nav.
 */
export function MarketingNav() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.brand}>
        Hybride
      </Link>
      <span className={styles.place}>Toulon · Var</span>
    </nav>
  );
}
