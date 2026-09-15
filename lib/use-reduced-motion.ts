"use client";

import { useEffect, useState } from "react";

/**
 * La préférence système « moins de mouvement », lue APRÈS le montage.
 *
 * `false` au premier rendu, toujours : `matchMedia` n'existe pas côté serveur,
 * et partir d'une valeur fixe garde le premier rendu client identique au HTML
 * reçu. La vraie valeur arrive juste après, dans l'effet.
 *
 * L'écouteur suit un changement de réglage sans rechargement — quelqu'un qui
 * active la préférence pendant sa visite voit le mouvement s'arrêter.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    const initial = setTimeout(sync, 0);
    media.addEventListener("change", sync);
    return () => {
      clearTimeout(initial);
      media.removeEventListener("change", sync);
    };
  }, []);

  return reduced;
}
