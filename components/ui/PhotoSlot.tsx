"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import styles from "./PhotoSlot.module.css";

const ratioClass = {
  "4/5": styles.ratio4x5,
  "16/10": styles.ratio16x10,
  "1/1": styles.ratio1x1,
} as const;

const radiusClass = {
  card: styles.radiusCard,
  default: styles.radiusDefault,
  none: null,
} as const;

interface PhotoSlotProps {
  ratio: keyof typeof ratioClass;
  radius?: keyof typeof radiusClass;
  bordered?: boolean;
  /** Légende visible tant qu'aucune vraie photo n'est fournie (emplacement à remplir). */
  caption?: string;
  src?: string;
  alt?: string;
  /** Calque superposé à l'image (ex. dégradé + texte d'une "porte" cliquable) — voir components/marketing/Door.tsx. */
  children?: ReactNode;
}

/**
 * Réserve la place exacte de la photo (ratio figé, next/image, aucun décalage de
 * mise en page). Sans `src` fourni, affiche le placeholder sombre du design +
 * une légende texte identifiant l'emplacement — à remplacer par la vraie photo.
 *
 * Animations ajoutées le 2026-08-16, inspirées de panamerun.com (validé par
 * l'utilisateur — "les petites animations avec les photos") : léger zoom au
 * survol (pur CSS), apparition en fondu + légère translation à l'entrée dans
 * le viewport (IntersectionObserver). Comportement exact de la référence non
 * observable directement (pas d'accès navigateur) — interprétation à corriger
 * si ce n'est pas ce que tu avais en tête.
 */
function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PhotoSlot({ ratio, radius = "default", bordered = false, caption, src, alt = "", children }: PhotoSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Lazy init plutôt qu'un setState synchrone dans l'effet : évite un rendu en
  // cascade pour le cas "mouvement réduit" (react-hooks/set-state-in-effect).
  const [revealed, setRevealed] = useState(prefersReducedMotion);

  useEffect(() => {
    if (revealed) return; // mouvement réduit : déjà révélé, pas d'observer à poser.

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed]);

  const classes = [
    styles.slot,
    ratioClass[ratio],
    radiusClass[radius],
    bordered ? styles.bordered : null,
    revealed ? styles.revealed : styles.hidden,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes}>
      <Image src={src ?? "/placeholder-photo.svg"} alt={alt} fill className={styles.image} sizes="(max-width: 860px) 100vw, 50vw" />
      {!src && caption ? <span className={styles.caption}>{caption}</span> : null}
      {children}
    </div>
  );
}
