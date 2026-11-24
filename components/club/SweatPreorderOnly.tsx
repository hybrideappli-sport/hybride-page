"use client";

import type { ReactNode } from "react";

import type { SweatPreorderPhase } from "@/lib/club/sweat-preorder";
import { useSweatOffer } from "@/lib/club/use-sweat-offer";

/**
 * Montre son contenu tant que la précommande est ouverte, sur l'horloge du
 * VISITEUR. Le contenu est rendu par le serveur dans tous les cas : une page
 * mise en cache le 15 décembre perd donc l'encart le 16 sans être refabriquée
 * — même procédé que la prop `opened` de ShopCountdown.
 *
 * Réservé aux mises en avant (accueil, planning) : la carte du shop et la fiche
 * restent après la clôture, en « Précommande terminée ».
 */
export function SweatPreorderOnly({ initialPhase, children }: { initialPhase: SweatPreorderPhase; children: ReactNode }) {
  const { offer } = useSweatOffer(initialPhase);
  return offer.phase === "closed" ? null : <>{children}</>;
}
