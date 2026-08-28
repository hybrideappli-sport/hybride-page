import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PhotoSlot } from "@/components/ui/PhotoSlot";
import type { Activity } from "@/components/ui/Tag";
import styles from "./RitualRow.module.css";

/** `social-run` porte un tiret, illégal comme nom de classe de module CSS. */
const ACTIVITY_CLASS: Record<Activity, string> = {
  piste: "piste",
  "social-run": "socialRun",
  trail: "trail",
  velo: "velo",
  nage: "nage",
  bivouac: "bivouac",
  soirees: "soirees",
  communautaire: "communautaire",
};

/**
 * Ligne compacte, pas une carte plein écran (US mobile, 2026-08-21) : deux
 * rituels sur une même page méritaient mieux qu'un scroll interminable pour
 * les voir tous les deux. La vignette est un repère visuel, pas une
 * illustration — le contenu complet (parcours, ambiance, galerie) vit sur la
 * page dédiée, pas ici.
 *
 * Sans photo (2026-08-28, arrivée des soirées Hybride dont le premier
 * événement n'a pas encore eu lieu) : pastille typographique aux couleurs de
 * l'activité plutôt qu'un rectangle gris. Un placeholder gris se lit comme une
 * image qui n'a pas chargé — un défaut ; une pastille colorée se lit comme un
 * parti pris.
 */
export function RitualRow({
  href,
  title,
  day,
  activity,
  photoSrc,
  photoAlt,
}: {
  href: string;
  title: string;
  day: string;
  activity: Activity;
  photoSrc?: string | null;
  photoAlt?: string;
}) {
  return (
    <Link href={href} className={styles.row}>
      <div className={styles.thumb}>
        {photoSrc ? (
          <PhotoSlot ratio="1/1" radius="default" src={photoSrc} alt={photoAlt ?? ""} />
        ) : (
          <span className={`${styles.monogram} ${styles[ACTIVITY_CLASS[activity]]}`} aria-hidden="true">
            {title.replace(/^(Les|Le|La|L\u2019)\s*/i, "").charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className={styles.text}>
        <span className={styles.title}>{title}</span>
        <span className={styles.day}>{day}</span>
      </div>
      <ArrowRight size={20} strokeWidth={1.75} className={styles.arrow} aria-hidden="true" />
    </Link>
  );
}
