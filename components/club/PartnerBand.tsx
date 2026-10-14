"use client";

import { Pause, Play } from "lucide-react";
import Link from "next/link";
import { useState, type CSSProperties } from "react";

import type { Partner } from "@/lib/club/partners";
import { PartnerLogo } from "./PartnerLogo";
import styles from "./PartnerBand.module.css";

/** Hauteur des logos pendant le défilement — le plafond de `.strip`. */
const LOGO_HEIGHT = 64;
/** Marge du fond clair (`.strip.light`), de chaque côté. */
const LIGHT_PADDING = 5;
/** Écart entre deux logos, et après le dernier d'une série : `--hy-space-3`. */
const GAP = 16;
/**
 * Vitesse de défilement, en pixels par seconde. Le carrousel du shop a
 * montré qu'à 30 px/s le mouvement ne se perçoit plus (ShopCarousel,
 * mesure du 2026-09-15) ; 40 reste au-dessus, deux fois plus lent que les
 * photos du shop (90) : un logo traverse un écran de 375px en ~8s.
 */
const SPEED_PX_PER_SECOND = 40;
/**
 * Copies de la série dans la piste. Il en faut assez pour couvrir la largeur
 * visible PLUS une série : ~440px par série, bande jusqu'à ~1070px sur grand
 * écran → 4. Le décalage d'un tour vaut 1/4 de la piste (voir le CSS).
 */
const COPIES = 4;

/** Largeur d'un logo à LOGO_HEIGHT, fond clair compris — tirée de la donnée. */
function tileWidth(logo: Partner["logo"]): number {
  const ratio = logo.width / logo.height;
  return logo.background === "light"
    ? (LOGO_HEIGHT - 2 * LIGHT_PADDING) * ratio + 2 * LIGHT_PADDING
    : LOGO_HEIGHT * ratio;
}

/**
 * Bande des partenaires sous le hero de /club/[slug] : intitulé et logos qui
 * défilent, le tout menant à /club/[slug]/partenaires.
 *
 * Emplacement et défilement choisis par le client en connaissance de cause
 * (2026-10-14) : tous deux avaient été déconseillés, parce que des logos en
 * haut d'une page de recrutement — a fortiori qui défilent, la forme même du
 * bandeau de sponsors — risquent de se lire comme un argument d'adhésion. Or
 * l'argument de l'adhésion est l'assurance, et lui seul. Ce qui limite ce
 * risque, et ne doit pas disparaître en retouchant la bande :
 *
 * - AUCUN AVANTAGE, AUCUN CHIFFRE. Pas de « -10 % », pas de « réductions »,
 *   pas de « pour les adhérents ». Les avantages se lisent sur la page dédiée.
 * - PAS DE FORMULE DE CAUTION. « Partenaires du club », un fait. Jamais « Ils
 *   nous font confiance » ni « Ils nous soutiennent » : ce sont des gages de
 *   sérieux, c'est-à-dire des arguments.
 * - PAS DE PHRASE NI DE BOUTON D'ACTION. Intitulé en petites capitales
 *   violettes (la couleur des liens du site, pas une couleur d'offre).
 * - AUCUN LIEN VERS /adherer, ni ici ni sur la page d'arrivée.
 *
 * DÉFILEMENT. CSS pur : COPIES séries identiques bout à bout, décalées d'une
 * série par tour (-100% / COPIES de la piste), donc une boucle sans couture
 * quel que soit le nombre de partenaires. La durée d'un tour est calculée
 * depuis les dimensions des logos pour garder SPEED_PX_PER_SECOND constant.
 * Sur téléphone, moins d'une série est visible : on ne voit jamais deux fois
 * le même logo à la fois. Sur grand écran, ~2,4 séries — la répétition se voit.
 *
 * PAUSE (WCAG 2.2.2 : un mouvement automatique de plus de 5s doit pouvoir être
 * arrêté). Au survol et au focus clavier, en CSS ; et un bouton pause/lecture,
 * seul moyen au doigt — toucher la bande ouvre la page partenaires. Le bouton
 * est À CÔTÉ du lien et non dedans : un bouton dans un lien est invalide.
 *
 * MOINS DE MOUVEMENT. Aucun défilement, une seule série, logos réduits
 * ensemble pour tenir sur une ligne : la bande statique d'avant le
 * carrousel. Le bouton, sans objet, est masqué. Le fondu d'entrée
 * (RevealOnce) a été retiré avec l'arrivée du défilement : les logos entrent
 * déjà en continu par la droite, deux mouvements se seraient superposés.
 *
 * DEUX LIENS, UNE SEULE ANNONCE. L'intitulé est le lien, annoncé « Partenaires
 * du club ». Les logos mènent au même endroit pour qui les touche, par un
 * second lien sorti de l'arbre d'accessibilité et du parcours au clavier
 * (`aria-hidden`, `tabIndex={-1}`) : l'annoncer aussi doublerait l'intitulé.
 */
export function PartnerBand({ partners, href }: { partners: Partner[]; href: string }) {
  const [paused, setPaused] = useState(false);
  if (partners.length === 0) return null;

  const period = partners.reduce((sum, partner) => sum + tileWidth(partner.logo) + GAP, 0);
  const trackStyle = { "--marquee-duration": `${(period / SPEED_PX_PER_SECOND).toFixed(2)}s` } as CSSProperties;

  return (
    <div className={styles.band}>
      <div className={styles.head}>
        <Link href={href} className={styles.label}>
          Partenaires du club <span aria-hidden="true">→</span>
        </Link>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "Reprendre le défilement des logos" : "Mettre en pause le défilement des logos"}
        >
          {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
        </button>
      </div>

      <Link href={href} className={styles.viewport} aria-hidden="true" tabIndex={-1}>
        <div className={styles.track} style={trackStyle} data-paused={paused}>
          {Array.from({ length: COPIES }, (_, copy) => (
            <div key={copy} className={styles.series}>
              {partners.map((partner) => (
                <PartnerLogo key={partner.slug} logo={partner.logo} size="strip" />
              ))}
            </div>
          ))}
        </div>
      </Link>
    </div>
  );
}
