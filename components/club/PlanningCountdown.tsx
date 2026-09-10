"use client";

import type { ReactNode } from "react";

import { unitsRemaining } from "@/lib/countdown";
import { useCountdown } from "@/lib/use-countdown";
import styles from "./PlanningCountdown.module.css";

interface PlanningCountdownProps {
  /** Instant d'ouverture, ISO 8601 avec décalage explicite (voir PLANNING_COUNTDOWN_TO). */
  targetIso: string;
  text: string;
  /**
   * Verdict de l'horloge SERVEUR, utilisé pour le HTML initial et pour le
   * premier rendu client — les deux identiques, donc aucun désaccord
   * d'hydratation. Il n'est qu'une valeur de départ : le montage recalcule
   * tout sur l'horloge du visiteur et corrige si la page venait d'un cache.
   */
  initiallyOpen: boolean;
  /** Titre du mois, commun aux deux états. */
  heading: ReactNode;
  /** Rappel des rituels, affiché pendant l'attente. */
  waiting: ReactNode;
  /**
   * La grille du planning, TOUJOURS rendue par le serveur même pendant le
   * décompte : c'est ce qui permet le basculement sans rechargement.
   */
  calendar: ReactNode;
}

/**
 * Compte à rebours puis bascule automatique vers la grille du planning.
 *
 * La mécanique (hydratation, minuterie, bascule) vit dans `useCountdown`
 * — lib/countdown.ts, partagée avec le décompte de la boutique depuis le
 * 2026-09-10 ; les trois précautions qu'elle porte y sont documentées. Ce
 * composant ne garde que ce qui lui est propre : la présentation, et le fait
 * que la grille remplace le décompte au lieu de le suivre.
 *
 * CE QUI VAUT ENCORE D'ÊTRE DIT ICI : le cache de page ne peut pas retenir la
 * grille, parce que le serveur l'envoie dans tous les cas et que seul le client
 * choisit laquelle des deux vues monter. Un visiteur qui arrive à 10 h 01 sur
 * une page fabriquée à 9 h 30 voit au pire le décompte le temps d'une image,
 * puis la grille : le contenu était déjà là, il n'y a rien à re-fabriquer côté
 * serveur.
 */
export function PlanningCountdown({ targetIso, text, initiallyOpen, heading, waiting, calendar }: PlanningCountdownProps) {
  const { remaining, open, reducedMotion } = useCountdown(targetIso, initiallyOpen);

  if (open) return <>{calendar}</>;

  // Les secondes disparaissent sous `prefers-reduced-motion` (2026-09-10,
  // aligné sur le décompte de la boutique) : le chiffre qui saute chaque
  // seconde est le mouvement gênant, et la règle globale de globals.css ne
  // l'atteint pas — ce n'est pas une animation CSS mais du texte remplacé.
  const units = remaining === null ? null : unitsRemaining(remaining, { withSeconds: !reducedMotion });

  return (
    <>
      {heading}
      <section className={styles.wrap}>
        <p className={styles.text}>{text}</p>

        {/* role="timer" sans région live : annoncer chaque seconde rendrait la
            page inutilisable au lecteur d'écran. */}
        <div className={styles.units} role="timer">
          {(units ?? [
            { value: "--", label: "heures" },
            { value: "--", label: "minutes" },
          ]).map((unit) => (
            <div key={unit.label} className={styles.unit}>
              <span className={styles.value}>{unit.value}</span>
              <span className={styles.label}>{unit.label}</span>
            </div>
          ))}
        </div>

        {waiting}
      </section>
    </>
  );
}
