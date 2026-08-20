import Image from "next/image";
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
  /**
   * Logo plutôt que photo plein cadre (ex. porte "app", tant qu'aucune photo n'existe) — traitement
   * différent, jamais `photoSrc` : un logo flotte centré (`object-fit: contain`, taille bornée), il
   * ne remplit pas le cadre comme une photo (`object-fit: cover`). Voir .logoWrap/.logo ci-dessous.
   */
  logoSrc?: string;
  logoAlt?: string;
}

/**
 * Panneau photo plein cadre avec texte posé dessus — carrefour à deux portes à
 * égalité stricte (docs/design/direction-visuelle-accueil.html). Aucun fond de
 * carte ni bordure : la photo va bord à bord, un dégradé assure la lisibilité
 * du texte. `PhotoSlot` porte l'image (ratio figé, next/image, animations) ;
 * ce composant n'ajoute que le calque de superposition.
 */
export function Door({ href, kicker, title, description, goLabel, photoCaption, photoSrc, photoAlt, logoSrc, logoAlt }: DoorProps) {
  const isDisabled = !href;

  const content = (
    <PhotoSlot ratio="4/5" radius="card" caption={logoSrc ? undefined : photoCaption} src={photoSrc} alt={photoAlt ?? ""}>
      <div className={styles.scrim} />
      {logoSrc ? (
        <div className={styles.logoWrap}>
          {/* unoptimized : la conversion automatique WebP/AVIF de next/image (pipeline `sharp`) supprime le
              canal alpha de ce PNG — vérifié le 2026-08-20, le fichier source et la variante PNG optimisée
              sont corrects, seule la variante WebP négociée par Chrome ne l'est pas. Petit logo statique,
              coût négligeable à servir tel quel plutôt que de dépendre d'une pipeline qui casse la transparence. */}
          <Image src={logoSrc} alt={logoAlt ?? ""} fill unoptimized className={styles.logo} />
        </div>
      ) : null}
      <div className={styles.body}>
        <span className={styles.kicker}>{kicker}</span>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        <span className={isDisabled ? styles.goDisabled : styles.go}>{goLabel}</span>
      </div>
    </PhotoSlot>
  );

  if (isDisabled) {
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
