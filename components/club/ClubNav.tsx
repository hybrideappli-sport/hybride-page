"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import styles from "./ClubNav.module.css";

/**
 * Bande à défilement horizontal écartée (US mobile, 2026-08-21) : sur une nav
 * principale, un débordement assumé masque une partie des liens sans signal
 * fort qu'il y en a plus — un menu burger est le pattern que quiconque
 * reconnaît sur un site de club de sport, coût d'implémentation comparable.
 * En dessous de 860px (repris du point de rupture déjà utilisé par .hero et
 * .doors) : liens + CTA passent dans le panneau `.menu`, replié par défaut.
 */
export function ClubNav({ clubSlug }: { clubSlug: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Masqué sur la page d'adhésion elle-même : le bouton y pointerait vers la page
  // courante, et il s'ajouterait au bouton de la page plus à la barre fixe mobile
  // — trois fois la même action à l'écran.
  const joinHref = `/club/${clubSlug}/adherer`;
  const onJoinPage = usePathname() === joinHref;

  return (
    <nav className={styles.nav}>
      <div className={styles.bar}>
        <Link href="/" className={styles.brand} onClick={close}>
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

        {/* Hors du panneau repliable, donc visible sur mobile sans ouvrir le
            burger : c'est le seul geste que la page attend vraiment du visiteur.
            Pointe vers /adherer et non plus vers HelloAsso — l'écran de paiement
            comporte une contribution pré-cochée qu'il faut avoir expliquée avant. */}
        {onJoinPage ? null : (
          <Button href={joinHref} size="mini" className={styles.joinCta} onClick={close}>
            Adhérer
          </Button>
        )}

        <button
          type="button"
          className={styles.burger}
          aria-expanded={open}
          aria-controls="club-nav-menu"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={open ? styles.burgerBarOpenTop : styles.burgerBar} />
          <span className={open ? styles.burgerBarOpenMid : styles.burgerBar} />
          <span className={open ? styles.burgerBarOpenBottom : styles.burgerBar} />
        </button>
      </div>

      <div id="club-nav-menu" className={open ? styles.menuOpen : styles.menu}>
        <Link className={styles.menuLink} href={`/club/${clubSlug}/le-club`} onClick={close}>
          Le club
        </Link>
        <Link className={styles.menuLink} href={`/club/${clubSlug}/planning`} onClick={close}>
          Planning
        </Link>
        <Link className={styles.menuLink} href={`/club/${clubSlug}/shop`} onClick={close}>
          Shop
        </Link>
      </div>
    </nav>
  );
}
