"use client";

import { useEffect, useState } from "react";

import { unitsRemaining } from "@/lib/countdown";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { getSweatPreorderOffer, offerForPhase, type SweatPreorderOffer, type SweatPreorderPhase } from "@/lib/club/sweat-preorder";

export interface SweatOfferState {
  offer: SweatPreorderOffer;
  /**
   * Décompte jusqu'à la fin du palier, « 14 j 06 h 12 min ». `null` avant le
   * montage (aucun chiffre au rendu serveur, voir lib/use-countdown.ts) et une
   * fois la précommande fermée.
   */
  remainingText: string | null;
}

/**
 * Le palier recalculé sur l'horloge du VISITEUR.
 *
 * Les pages du club sortent d'un cache : un prix décidé au rendu serveur le
 * 8 décembre à 23h50 resterait à 36 € le 9 au matin. Le serveur ne fournit donc
 * qu'une valeur de DÉPART (`initialPhase`), identique au premier rendu client —
 * aucun désaccord d'hydratation — puis le montage relit l'heure et suit chaque
 * bascule sans rechargement.
 *
 * Même principe que useCountdown : delta absolu relu à chaque tour, et sous
 * `prefers-reduced-motion` un affichage qui ne bouge qu'à la minute.
 */
export function useSweatOffer(initialPhase: SweatPreorderPhase): SweatOfferState {
  const [nowMs, setNowMs] = useState<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    // Minuterie plutôt qu'appel synchrone (react-hooks/set-state-in-effect).
    const timeout = setTimeout(tick, 0);
    const interval = setInterval(tick, 1_000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const offer = nowMs === null ? offerForPhase(initialPhase) : getSweatPreorderOffer(new Date(nowMs));

  let remainingText: string | null = null;
  if (nowMs !== null && offer.endsAtIso) {
    const left = new Date(offer.endsAtIso).getTime() - nowMs;
    remainingText = unitsRemaining(left, { withSeconds: !reducedMotion })
      .map((u) => `${u.value} ${u.short.toLowerCase()}`)
      .join(" ");
  }

  return { offer, remainingText };
}
