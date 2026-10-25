import Image from "next/image";
import Link from "next/link";

import type { AgendaEvent } from "@/lib/agenda/source";
import { formatEventDateLong, formatEventTime } from "@/lib/format";
import styles from "./NextSoireeCard.module.css";

/**
 * « Prochaine soirée Hybride », en haut du planning (2026-10-25). Demande du
 * client : dans la grille, une soirée pèse autant qu'une sortie ordinaire —
 * et, partageant sa case avec une autre (cas du 31/10, avec un trail), elle
 * se réduit à une demi-bande tronquée « Soirée h… ».
 *
 * PAS UNE POP-UP. Une fenêtre par-dessus la page masquerait le planning, qui
 * est la raison de venir ; il faudrait la fermer à chaque visite ; et elle
 * entrerait en collision avec la bannière d'installation (PwaInstallBanner),
 * déjà posée en bas des pages du club. Une carte dans le flux se voit dès
 * l'arrivée sans rien cacher.
 *
 * Ce qu'elle COÛTE : ~110px avant la grille à 375px — l'arbitrage du
 * 2026-09-09 avait au contraire descendu la phrase des inscriptions sous la
 * grille pour la remonter. Assumé ici parce que la carte n'existe que quand
 * une soirée approche (voir `getNextEventOfActivity`), pas en permanence.
 *
 * Une seule entrée animée, au chargement — coupée sous « moins de mouvement »
 * par la règle globale de globals.css.
 */
export function NextSoireeCard({
  event,
  href,
  photoSrc,
}: {
  event: AgendaEvent;
  href: string;
  photoSrc: string | null;
}) {
  return (
    <Link href={href} className={styles.card}>
      {photoSrc ? (
        <span className={styles.visual}>
          {/* `alt` vide : le visuel illustre, le titre juste à côté dit déjà
              de quelle soirée il s'agit, et c'est lui que le lien annonce. */}
          <Image src={photoSrc} alt="" width={1080} height={1350} sizes="72px" className={styles.image} />
        </span>
      ) : null}
      <span className={styles.body}>
        <span className={styles.eyebrow}>Prochaine soirée Hybride</span>
        <span className={styles.title}>{event.title ?? event.activityLabelText}</span>
        <span className={styles.when}>
          {formatEventDateLong(event.startsAtIso)}{" "}
          {/* Insécable : à 375px l'heure passait seule à la ligne. */}
          <span className={styles.nowrap}>· {formatEventTime(event.startsAtIso)}</span>
        </span>
        <span className={styles.cta}>Voir la soirée →</span>
      </span>
    </Link>
  );
}
