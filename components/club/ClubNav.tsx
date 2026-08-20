"use client";

import Link from "next/link";
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
export function ClubNav({ clubSlug, helloAssoUrl }: { clubSlug: string; helloAssoUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className={styles.nav}>
      <div className={styles.bar}>
        <Link href={`/club/${clubSlug}`} className={styles.brand} onClick={close}>
          Hybride
        </Link>
        <div className={styles.links}>
          <a className={styles.link} href="#le-club">
            Le club
          </a>
          <a className={styles.link} href="#sorties">
            Inscription
          </a>
          <Link className={styles.link} href={`/club/${clubSlug}/shop`}>
            Shop
          </Link>
          <a className={styles.link} href="#nous-trouver">
            Nous trouver
          </a>
          {helloAssoUrl ? (
            <Button href={helloAssoUrl} size="mini" target="_blank" rel="noopener noreferrer">
              Rejoindre
            </Button>
          ) : null}
        </div>
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
        <a className={styles.menuLink} href="#le-club" onClick={close}>
          Le club
        </a>
        <a className={styles.menuLink} href="#sorties" onClick={close}>
          Inscription
        </a>
        <Link className={styles.menuLink} href={`/club/${clubSlug}/shop`} onClick={close}>
          Shop
        </Link>
        <a className={styles.menuLink} href="#nous-trouver" onClick={close}>
          Nous trouver
        </a>
        {helloAssoUrl ? (
          <Button href={helloAssoUrl} size="mini" target="_blank" rel="noopener noreferrer" className={styles.menuCta} onClick={close}>
            Rejoindre
          </Button>
        ) : null}
      </div>
    </nav>
  );
}
