"use client";

import { unitsRemaining } from "@/lib/countdown";
import { useCountdown } from "@/lib/use-countdown";
import styles from "./ShopCountdown.module.css";

interface ShopCountdownProps {
  /**
   * Instant d'ouverture, ISO 8601 avec décalage explicite (voir
   * SHOP_OPENING_TO). Sert au décompte ET, tel quel, à l'attribut `datetime`
   * du <time> — c'est déjà un datetime valide, il n'y a pas de seconde
   * écriture de la date à maintenir.
   */
  targetIso: string;
  /**
   * La même date en toutes lettres (« 15 septembre à 18h »), calculée par le
   * serveur avec `formatOpeningLabel`. Passée en prop plutôt que formatée ici :
   * une seule évaluation, donc aucune chance que le SSR et le client tombent
   * sur deux libellés différents.
   */
  openingLabel: string;
  /**
   * Verdict de l'horloge SERVEUR, valeur de DÉPART uniquement — évite un
   * clignotement du décompte si l'échéance est déjà passée. Le montage
   * recalcule et corrige si la page sortait d'un cache.
   */
  initiallyOpen: boolean;
}

/**
 * Compte à rebours jusqu'à l'ouverture de la boutique, puis bascule.
 *
 * Remplace la composition graphique qui tenait cette place depuis le
 * 2026-08-25 : trois blocs de chiffres floutés, `aria-hidden`, posés là faute
 * de date ferme. La note qui les accompagnait prévoyait ce remplacement — la
 * date existe désormais (SHOP_OPENING_TO).
 *
 * L'écrin est conservé (cadre, halo violet) : seuls les chiffres changent de
 * nature. En revanche l'animation `hy-teaser-pulse` disparaît — des chiffres
 * qui pulsent ET qui changent chaque seconde, c'est un mouvement de trop, et
 * elle n'avait de sens que sur des glyphes décoratifs.
 *
 * ACCESSIBILITÉ — deux traitements opposés, délibérément :
 *
 * - LE DÉCOMPTE N'EST PAS ANNONCÉ. `role="timer"` porte un `aria-live="off"`
 *   implicite ; sans lui, un lecteur d'écran égrènerait chaque seconde et la
 *   page deviendrait inutilisable. Les chiffres restent lisibles à la demande,
 *   et le sens ne repose pas sur eux : la phrase « La boutique ouvre le 15
 *   septembre à 18h » le porte en toutes lettres, dans un <time> daté.
 *
 * - LA BASCULE, ELLE, EST ANNONCÉE. C'est un évènement unique et non une
 *   boucle : `aria-live="polite"` est justifié là, et seulement là.
 */
export function ShopCountdown({ targetIso, openingLabel, initiallyOpen }: ShopCountdownProps) {
  const { remaining, open, reducedMotion } = useCountdown(targetIso, initiallyOpen);

  if (open) {
    return (
      <section className={styles.panel}>
        <div className={styles.glow} aria-hidden="true" />
        {/* Bascule explicite : le décompte disparaît, il ne se fige pas sur
            00:00:00. Pas de lien ni de catalogue ici — ni les produits ni
            l'URL HelloAsso n'existaient au moment d'écrire ceci (2026-09-10),
            et annoncer une boutique qui n'ouvre sur rien coûterait plus de
            confiance que le décompte n'en aura gagné. */}
        <p className={styles.openTitle} aria-live="polite">
          La boutique est ouverte.
        </p>
        <p className={styles.lead}>Les tee-shirts que vous voyez au départ du mercredi, en vrai, à votre taille.</p>
      </section>
    );
  }

  // `null` tant que le montage n'a pas eu lieu : le serveur et le premier rendu
  // client affichent les mêmes tirets, donc aucun désaccord d'hydratation.
  const units = remaining === null ? null : unitsRemaining(remaining, { withSeconds: !reducedMotion });

  return (
    <section className={styles.panel}>
      <div className={styles.glow} aria-hidden="true" />

      <p className={styles.openTitle}>
        La boutique ouvre le <time dateTime={targetIso}>{openingLabel}</time>.
      </p>

      <div className={styles.units} role="timer">
        {(units ?? [
          { value: "--", label: "heures" },
          { value: "--", label: "minutes" },
        ]).map((unit) => (
          <span key={unit.label} className={styles.unit}>
            <span className={styles.value}>{unit.value}</span>
            <span className={styles.label}>{unit.label}</span>
          </span>
        ))}
      </div>

      <p className={styles.lead}>Les tee-shirts que vous voyez au départ du mercredi, en vrai, à votre taille.</p>
    </section>
  );
}
