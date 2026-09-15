"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { SHOP_NAV_HIGHLIGHT_UNTIL } from "@/lib/config";
import { deadlinePassed } from "@/lib/countdown";
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

  /*
   * Mise en avant du lien « Shop » jusqu'à SHOP_NAV_HIGHLIGHT_UNTIL.
   *
   * L'échéance est lue APRÈS LE MONTAGE, jamais au rendu : lire l'horloge en
   * rendant ferait de cette barre — présente sur toutes les pages du club — un
   * élément non idempotent, et une page mise en cache figerait le verdict à
   * l'heure de sa génération. Partir de `false` garde par ailleurs le premier
   * rendu client identique au HTML reçu.
   *
   * Effet de bord assumé, et plutôt heureux : le lien s'allume juste après
   * l'hydratation plutôt que d'être déjà coloré, ce qui fait une apparition
   * douce au lieu d'un état figé.
   */
  const [highlighted, setHighlighted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHighlighted(!deadlinePassed(SHOP_NAV_HIGHLIGHT_UNTIL)), 0);
    return () => clearTimeout(t);
  }, []);

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
          <Link className={`${styles.link} ${highlighted ? styles.linkNew : ""}`} href={`/club/${clubSlug}/shop`}>
            Shop{highlighted ? " " : null}
            {/* L'espace ci-dessus n'est pas décoratif : sans lui le lien
                s'annonce « ShopNouveau » d'un seul tenant. La marge CSS ne sépare
                que pour l'œil.
                Un vrai élément et non un `content` CSS : les pseudo-éléments ne
                sont pas annoncés de façon fiable par tous les lecteurs d'écran,
                or « nouveau » est une information, pas une décoration. Le lien
                s'annonce alors « Shop Nouveau », ce qui est exactement le sens. */}
            {highlighted ? <span className={styles.newBadge}>Nouveau</span> : null}
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
