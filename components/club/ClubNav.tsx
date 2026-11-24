"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { SWEAT_PREORDER_UNTIL } from "@/lib/club/sweat-preorder";
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

  /*
   * « Shop » en bouton pendant la précommande du sweat (2026-11-24), jusqu'à
   * SWEAT_PREORDER_UNTIL — la même échéance que la bannière et les encarts.
   *
   * Part de `true`, à l'inverse de `highlighted` : c'est l'état de toute la
   * période où le bouton existe, et le HTML servi le montre donc d'emblée, sans
   * passer de lien à bouton sous les yeux du visiteur — la barre de navigation
   * ne doit pas bouger à l'hydratation. Après la clôture, le montage corrige.
   *
   * Une minuterie posée jusqu'à l'échéance bascule une page restée ouverte à
   * minuit le 16. Plafonnée : au-delà de ~24,8 jours, setTimeout se déclenche
   * immédiatement (délai stocké sur 32 bits).
   */
  const [preorderOpen, setPreorderOpen] = useState(true);
  useEffect(() => {
    const check = () => setPreorderOpen(!deadlinePassed(SWEAT_PREORDER_UNTIL));
    const first = setTimeout(check, 0);
    const msLeft = new Date(SWEAT_PREORDER_UNTIL).getTime() - Date.now();
    const atClose = msLeft > 0 && msLeft < 2 ** 31 - 1 ? setTimeout(check, msLeft + 1_000) : undefined;
    return () => {
      clearTimeout(first);
      if (atClose) clearTimeout(atClose);
    };
  }, []);

  return (
    <nav className={styles.nav}>
      <div className={styles.bar}>
        {/* Vers le club, plus vers « / » : l'accueil y redirige de toute façon
            depuis le retrait de l'application (2026-11-03, next.config.ts). */}
        <Link href={`/club/${clubSlug}`} className={styles.brand}>
          Hybride
        </Link>

        <div className={styles.links}>
          <Link className={styles.link} href={`/club/${clubSlug}/le-club`}>
            Le club
          </Link>
          <Link className={styles.link} href={`/club/${clubSlug}/planning`}>
            Planning
          </Link>
          {preorderOpen ? (
            <Link className={styles.shopButton} href={`/club/${clubSlug}/shop`}>
              Shop{" "}
              {/* Vrai texte, comme « Nouveau » plus bas : le lien s'annonce
                  « Shop Précommande », l'espace avant n'est pas décoratif. */}
              <span className={styles.preorderBadge}>Précommande</span>
            </Link>
          ) : (
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
          )}
        </div>

        {onJoinPage ? null : (
          // Contour pendant la précommande (2026-11-24) : « Shop » garde seul le
          // remplissage violet, la précommande est la priorité du moment. Plein
          // de nouveau à la clôture, en même temps que « Shop » redevient un lien.
          <Button
            href={joinHref}
            size="mini"
            variant={preorderOpen ? "line" : "fill"}
            className={`${styles.joinCta} ${preorderOpen ? styles.joinCtaOutline : ""}`}
          >
            Adhérer
          </Button>
        )}
      </div>
    </nav>
  );
}
