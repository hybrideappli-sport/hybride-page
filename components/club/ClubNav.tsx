"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/Button";
import styles from "./ClubNav.module.css";

/**
 * Menu burger retiré (2026-08-28), après test auprès de proches : beaucoup de
 * gens ne le voient pas et manquent le planning, la boutique et la page club.
 * C'est une convention de métier, pas une convention grand public. Les entrées
 * sont donc visibles sans clic.
 *
 * Sur mobile, la barre passe sur DEUX lignes plutôt que de raccourcir les
 * libellés : à 375px il reste 327px utiles, et logo + 3 entrées + bouton sur
 * une seule ligne les dépassent. Sur deux lignes — logo et bouton en haut, les
 * entrées en dessous — tout tient largement, sans réduire ni les textes ni les
 * zones tactiles.
 *
 * Une barre fixe en bas façon application a été envisagée puis écartée : elle
 * entrerait en collision avec la barre d'adhésion fixe de /adherer
 * (StickyJoinCta), et avec la barre d'outils de Safari sous elle.
 *
 * Le bouton d'adhésion reste un bouton plein, distinct des entrées : c'est une
 * action, pas une rubrique.
 */
export function ClubNav({ clubSlug }: { clubSlug: string }) {
  // Masqué sur la page d'adhésion elle-même : le bouton y pointerait vers la page
  // courante, et il s'ajouterait au bouton de la page plus à la barre fixe mobile
  // — trois fois la même action à l'écran.
  const joinHref = `/club/${clubSlug}/adherer`;
  const onJoinPage = usePathname() === joinHref;

  return (
    <nav className={styles.nav}>
      <div className={styles.bar}>
        <Link href="/" className={styles.brand}>
          Hybride
        </Link>

        <div className={styles.links}>
          <Link className={styles.link} href={`/club/${clubSlug}/le-club`}>
            Le club
          </Link>
          <Link className={styles.link} href={`/club/${clubSlug}/planning`}>
            Planning
          </Link>
          <Link className={styles.link} href={`/club/${clubSlug}/shop`}>
            Shop
          </Link>
        </div>

        {onJoinPage ? null : (
          <Button href={joinHref} size="mini" className={styles.joinCta}>
            Adhérer
          </Button>
        )}
      </div>
    </nav>
  );
}
