"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { SweatPhoto } from "@/lib/club/sweat-preorder";
import styles from "./SweatGallery.module.css";

/**
 * Carrousel de la fiche du sweat : défilement natif au doigt (scroll-snap),
 * points de pagination, flèches au-dessus de 860px.
 *
 * Pas de défilement automatique, contrairement à ShopCarousel : ici on regarde
 * un produit, et une photo qui part pendant qu'on lit le dos se rattrape mal.
 * Le défilement natif garde l'inertie du téléphone et marche sans JavaScript ;
 * le script ne fait que suivre la photo visible et piloter points et flèches.
 */
export function SweatGallery({ photos }: { photos: SweatPhoto[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.children) as HTMLElement[];
    // setState depuis un observateur = notification d'un système externe.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(slides.indexOf(entry.target as HTMLElement));
        }
      },
      { root: track, threshold: 0.6 },
    );
    slides.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(photos.length - 1, index));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  };

  return (
    <div className={styles.gallery} aria-roledescription="carrousel" aria-label="Photos du sweat">
      <div ref={trackRef} className={styles.track} tabIndex={0}>
        {photos.map((photo, i) => (
          <div
            key={photo.src}
            className={styles.slide}
            role="group"
            aria-roledescription="photo"
            aria-label={`${i + 1} sur ${photos.length}`}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              sizes="(max-width: 860px) 100vw, 560px"
              preload={i === 0}
              className={styles.image}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className={`${styles.arrow} ${styles.prev}`}
        onClick={() => goTo(active - 1)}
        disabled={active === 0}
        aria-label="Photo précédente"
      >
        ←
      </button>
      <button
        type="button"
        className={`${styles.arrow} ${styles.next}`}
        onClick={() => goTo(active + 1)}
        disabled={active === photos.length - 1}
        aria-label="Photo suivante"
      >
        →
      </button>

      <div className={styles.dots}>
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            className={`${styles.dot} ${i === active ? styles.dotActive : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Voir la photo ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
