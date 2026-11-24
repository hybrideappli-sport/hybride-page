"use client";

import { Button } from "@/components/ui/Button";
import type { SweatPreorderPhase } from "@/lib/club/sweat-preorder";
import { useSweatOffer } from "@/lib/club/use-sweat-offer";
import { HELLOASSO_SWEAT_URL } from "@/lib/config";
import styles from "./SweatOffer.module.css";

/**
 * Prix du moment, palier, décompte et bouton de précommande — le même bloc
 * partout où le sweat apparaît, pour qu'un prix ne puisse jamais différer
 * d'une page à l'autre. Tout vient de lib/club/sweat-preorder.ts.
 *
 * Une fois la précommande fermée, le bouton disparaît : ne reste que l'état,
 * et la date de livraison pour ceux qui ont commandé.
 *
 * ACCESSIBILITÉ : le décompte (`role="timer"`) n'est pas annoncé, comme ceux du
 * planning et de la boutique ; la phrase `offerDetail` porte les dates en
 * toutes lettres, c'est elle qui fait foi.
 */
export function SweatOffer({
  initialPhase,
  ctaId,
  size = "default",
}: {
  /** Palier vu par l'horloge SERVEUR — valeur de départ, recalculée au montage. */
  initialPhase: SweatPreorderPhase;
  /** id du bouton, pour qu'une barre fixe (StickyJoinCta) s'efface devant lui. */
  ctaId?: string;
  size?: "default" | "large";
}) {
  const { offer, remainingText } = useSweatOffer(initialPhase);
  const closed = offer.phase === "closed";

  return (
    <div className={`${styles.offer} ${size === "large" ? styles.large : ""}`}>
      <div className={styles.priceRow}>
        <span className={`${styles.stamp} ${closed ? styles.stampClosed : ""}`}>{offer.priceLabel ?? "Terminée"}</span>
        <span className={styles.offerLabel}>{offer.offerLabel}</span>
      </div>

      <p className={styles.detail}>{offer.offerDetail}</p>

      {offer.countdownLead ? (
        <p className={styles.countdown}>
          {offer.countdownLead}{" "}
          <span role="timer" className={styles.countdownValue}>
            {remainingText ?? "—"}
          </span>
        </p>
      ) : null}

      {closed ? null : (
        <div className={styles.cta} id={ctaId}>
          <Button href={HELLOASSO_SWEAT_URL} target="_blank" rel="noopener noreferrer">
            Je précommande ↗
          </Button>
        </div>
      )}
    </div>
  );
}
