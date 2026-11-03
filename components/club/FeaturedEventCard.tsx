import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import type { AgendaEvent } from "@/lib/agenda/source";
import type { Partner } from "@/lib/club/partners";
import { formatEventDateLong, formatEventTime } from "@/lib/format";
import { PartnerLogo } from "./PartnerLogo";
import styles from "./FeaturedEventCard.module.css";

/**
 * Carte d'un événement mis en avant, en haut du planning. Née le 2026-10-25
 * pour « Prochaine soirée Hybride » (demande du client : dans la grille, une
 * soirée pesait autant qu'une sortie ordinaire, et partageant sa case elle se
 * réduisait à une demi-bande tronquée). Généralisée le 2026-11-03 pour mettre
 * en avant un autre événement à sa place (fiches spéciales `featured`,
 * lib/agenda/special-events.ts).
 *
 * La couleur suit l'ACTIVITÉ de l'événement (`--hy-<activité>`), celle de son
 * étiquette et de sa case dans la grille : rose pour une soirée, violet clair
 * pour un social run…
 *
 * PAS UNE POP-UP. Une fenêtre par-dessus la page masquerait le planning, qui
 * est la raison de venir ; il faudrait la fermer à chaque visite ; et elle
 * entrerait en collision avec la bannière d'installation (PwaInstallBanner).
 *
 * Ce qu'elle COÛTE : ~120px avant la grille à 375px, assumé parce qu'elle
 * n'existe que quand un événement approche.
 *
 * Une seule entrée animée, au chargement — coupée sous « moins de mouvement »
 * par la règle globale de globals.css.
 */
export function FeaturedEventCard({
  event,
  href,
  photoSrc,
  eyebrow,
  ctaLabel,
  partner,
  title,
}: {
  event: AgendaEvent;
  href: string;
  photoSrc: string | null;
  eyebrow: string;
  ctaLabel: string;
  /**
   * Partenaire co-organisateur : la carte s'ouvre alors sur « H × logo du
   * partenaire », en bandeau au-dessus du texte, À LA PLACE de la photo. Deux
   * logos côte à côte ne tiennent pas dans la vignette de 72px — celui de Terre
   * de Running y ferait 30px de haut.
   */
  partner?: Partner | null;
  /** Titre à la place de celui du tableur (fiche spéciale). */
  title?: string;
}) {
  const accent = {
    "--accent": `var(--hy-${event.activity})`,
    "--accent-bg": `var(--hy-${event.activity}-bg)`,
  } as CSSProperties;

  return (
    <Link href={href} className={`${styles.card} ${partner ? styles.cardLockup : ""}`} style={accent}>
      {partner ? (
        // Décoratif pour un lecteur d'écran : le surtitre (« Sortie avec Terre
        // de Running ») et le titre disent déjà qui organise.
        <span className={styles.lockup} aria-hidden="true">
          <Image src="/photos/logo-hybride-mark.png" alt="" width={144} height={200} unoptimized className={styles.hybrideMark} />
          <span className={styles.times}>×</span>
          <PartnerLogo logo={partner.logo} size="lockup" />
        </span>
      ) : photoSrc ? (
        <span className={styles.visual}>
          {/* `alt` vide : le visuel illustre, le titre juste à côté dit déjà
              de quel événement il s'agit, et c'est lui que le lien annonce.
              Dimensions nominales 4:5 : le cadre recadre (`object-fit: cover`). */}
          <Image src={photoSrc} alt="" width={1080} height={1350} sizes="72px" className={styles.image} />
        </span>
      ) : null}
      <span className={styles.body}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <span className={styles.title}>{title ?? event.title ?? event.activityLabelText}</span>
        <span className={styles.when}>
          {formatEventDateLong(event.startsAtIso)}{" "}
          {/* Insécable : à 375px l'heure passait seule à la ligne. */}
          <span className={styles.nowrap}>· {formatEventTime(event.startsAtIso)}</span>
        </span>
        <span className={styles.cta}>{ctaLabel} →</span>
      </span>
    </Link>
  );
}
