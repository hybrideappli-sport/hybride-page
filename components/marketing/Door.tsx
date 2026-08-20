import Link from "next/link";
import type { ReactNode } from "react";

import { PhotoSlot } from "@/components/ui/PhotoSlot";
import styles from "./Door.module.css";

interface DoorProps {
  /** Absent = porte non cliquable (ex. app pas encore disponible) — reste visuellement une porte, sans lien mort. */
  href?: string;
  kicker: string;
  title: ReactNode;
  description: string;
  goLabel: string;
  photoCaption: string;
  photoSrc?: string;
  photoAlt?: string;
}

/**
 * Panneau photo plein cadre avec texte posé dessus — carrefour à deux portes à
 * égalité stricte (docs/design/direction-visuelle-accueil.html). Aucun fond de
 * carte ni bordure : la photo va bord à bord, un dégradé assure la lisibilité
 * du texte. `PhotoSlot` porte l'image (ratio figé, next/image, animations) ;
 * ce composant n'ajoute que le calque de superposition.
 */
export function Door({ href, kicker, title, description, goLabel, photoCaption, photoSrc, photoAlt }: DoorProps) {
  const content = (
    <PhotoSlot ratio="4/5" radius="card" caption={photoCaption} src={photoSrc} alt={photoAlt ?? ""}>
      <div className={styles.scrim} />
      <div className={styles.body}>
        <span className={styles.kicker}>{kicker}</span>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        <span className={styles.go}>{goLabel}</span>
      </div>
    </PhotoSlot>
  );

  if (!href) {
    return (
      <div className={styles.door} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={styles.door}>
      {content}
    </Link>
  );
}
