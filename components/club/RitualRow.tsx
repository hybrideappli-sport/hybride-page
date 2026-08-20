import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PhotoSlot } from "@/components/ui/PhotoSlot";
import styles from "./RitualRow.module.css";

/**
 * Ligne compacte, pas une carte plein écran (US mobile, 2026-08-21) : deux
 * rituels sur une même page méritaient mieux qu'un scroll interminable pour
 * les voir tous les deux. La vignette est un repère visuel, pas une
 * illustration — le contenu complet (parcours, ambiance, galerie) vit sur la
 * page dédiée, pas ici.
 */
export function RitualRow({
  href,
  title,
  day,
  photoSrc,
  photoAlt,
}: {
  href: string;
  title: string;
  day: string;
  photoSrc?: string | null;
  photoAlt?: string;
}) {
  return (
    <Link href={href} className={styles.row}>
      <div className={styles.thumb}>
        <PhotoSlot ratio="1/1" radius="default" src={photoSrc ?? undefined} alt={photoAlt ?? ""} />
      </div>
      <div className={styles.text}>
        <span className={styles.title}>{title}</span>
        <span className={styles.day}>{day}</span>
      </div>
      <ArrowRight size={20} strokeWidth={1.75} className={styles.arrow} aria-hidden="true" />
    </Link>
  );
}
