"use client";

import { useEffect, useState } from "react";

/**
 * Mécanique commune aux comptes à rebours du site — celui du planning
 * (PlanningCountdown) et celui de la boutique (ShopCountdown). Une seule
 * implémentation des précautions ci-dessous : elles sont assez subtiles pour
 * qu'une deuxième copie finisse par en oublier une.
 *
 * 1. AUCUN CHIFFRE N'EST CALCULÉ AU RENDU SERVEUR. `remaining` vaut `null`
 *    jusqu'au montage, et c'est à l'appelant d'afficher des tirets en
 *    attendant. Le HTML du serveur et le premier rendu client sont donc
 *    identiques par construction — il n'y a pas de valeur qui puisse diverger.
 *    Ce n'est pas seulement l'avertissement React que l'on évite : une page
 *    mise en cache servirait un décompte figé à l'heure de sa génération (même
 *    piège que RegistrationCta.tsx et le jour courant de PlanningCalendar.tsx).
 *
 * 2. LE DELTA EST ABSOLU À CHAQUE TOUR. La minuterie ne décrémente pas un
 *    compteur, elle relit `Date.now()` : un onglet mis en veille ou ralenti en
 *    arrière-plan retarde au pire l'affichage, jamais le résultat.
 *
 * 3. UNE ÉCHÉANCE ILLISIBLE OUVRE. Une faute de frappe dans la configuration
 *    ne doit jamais laisser un visiteur devant une page bloquée.
 */

export interface CountdownState {
  /** Millisecondes restantes, ou `null` tant que le montage n'a pas eu lieu. */
  remaining: number | null;
  /** L'échéance est-elle passée ? */
  open: boolean;
  /** `false` au premier rendu, puis la vraie préférence du visiteur. */
  reducedMotion: boolean;
}

/**
 * @param targetIso Instant visé, ISO 8601 avec DÉCALAGE EXPLICITE
 *   (`2026-09-15T18:00:00+02:00`) — jamais un `Z`, jamais une date nue, qui
 *   serait interprétée en UTC et décalerait tout de deux heures en été.
 * @param initiallyOpen Verdict de l'horloge SERVEUR, valeur de départ
 *   uniquement : elle évite un clignotement quand l'échéance est déjà passée,
 *   et le montage la recalcule pour corriger une page sortie d'un cache.
 */
export function useCountdown(targetIso: string, initiallyOpen = false): CountdownState {
  const [open, setOpen] = useState(initiallyOpen);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Lue après le montage, jamais au rendu : `matchMedia` n'existe pas côté
  // serveur, et partir de `false` garde le premier rendu client identique au
  // HTML reçu. L'écouteur suit un changement de réglage sans rechargement.
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    const initial = setTimeout(sync, 0);
    media.addEventListener("change", sync);
    return () => {
      clearTimeout(initial);
      media.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const targetMs = new Date(targetIso).getTime();
    if (Number.isNaN(targetMs)) {
      const fallback = setTimeout(() => setOpen(true), 0);
      return () => clearTimeout(fallback);
    }

    let interval: ReturnType<typeof setInterval> | undefined;

    const update = () => {
      const left = targetMs - Date.now();
      if (left <= 0) {
        setOpen(true);
        setRemaining(0);
        if (interval) clearInterval(interval);
        return;
      }
      setOpen(false);
      /*
       * Sous `prefers-reduced-motion`, la valeur posée dans l'état est arrondie
       * à la minute : elle ne change donc plus qu'une fois par minute, et React
       * cesse de re-rendre à chaque seconde (un `setState` de valeur identique
       * ne déclenche pas de rendu). Le TICK, lui, reste à la seconde — c'est ce
       * qui garde la bascule à zéro exacte, au lieu de la retarder de près
       * d'une minute.
       */
      setRemaining(reducedMotion ? Math.floor(left / 60_000) * 60_000 : left);
    };

    // setTimeout(…, 0) plutôt qu'un appel synchrone : la première mise à jour
    // vient de la même minuterie que les suivantes, et non d'un rendu en
    // cascade (react-hooks/set-state-in-effect).
    const timeout = setTimeout(update, 0);
    interval = setInterval(update, 1_000);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [targetIso, reducedMotion]);

  return { remaining, open, reducedMotion };
}

