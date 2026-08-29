"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import styles from "./PlanningCountdown.module.css";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Unités affichées, adaptées à ce qu'il reste : au-delà d'une heure on montre
 * (jours) / heures / minutes, dans la dernière heure on bascule sur minutes /
 * secondes. Un « 0 J » ou un « 00 H » immobile n'apprend rien.
 */
function unitsRemaining(msRemaining: number): { value: string; label: string }[] {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const seconds = total % 60;

  if (total < 3_600) {
    return [
      { value: pad(minutes), label: minutes === 1 ? "minute" : "minutes" },
      { value: pad(seconds), label: seconds === 1 ? "seconde" : "secondes" },
    ];
  }

  const units = [
    { value: pad(hours), label: hours === 1 ? "heure" : "heures" },
    { value: pad(minutes), label: minutes === 1 ? "minute" : "minutes" },
  ];
  if (days > 0) units.unshift({ value: String(days), label: days === 1 ? "jour" : "jours" });
  return units;
}

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
 * Trois précautions, chacune pour un mode de panne déjà rencontré sur ce site :
 *
 * 1. LES CHIFFRES SONT CALCULÉS CÔTÉ CLIENT, JAMAIS AU RENDU SERVEUR — sinon
 *    une page mise en cache sert un décompte figé à l'heure de sa génération
 *    (même raison que RegistrationCta.tsx et le jour courant de
 *    PlanningCalendar.tsx). `remaining` reste `null` jusqu'au montage, et les
 *    emplacements affichent alors des tirets plutôt qu'une valeur fausse.
 *
 * 2. LE CACHE DE PAGE NE PEUT PAS RETENIR LA GRILLE — parce que le serveur
 *    l'envoie dans tous les cas et que seul le client choisit laquelle des deux
 *    vues monter. Un visiteur qui arrive à 10 h 01 sur une page fabriquée à
 *    9 h 30 voit au pire le décompte le temps d'une image, puis la grille : le
 *    contenu était déjà là, il n'y a rien à re-fabriquer côté serveur.
 *
 * 3. UNE PAGE LAISSÉE OUVERTE BASCULE TOUTE SEULE — une minuterie relit
 *    `Date.now()` chaque seconde. Elle ne cumule pas d'écart (chaque tour
 *    recalcule un delta absolu, il ne décrémente pas un compteur), donc une
 *    mise en veille de l'onglet ou un ralentissement d'arrière-plan retarde au
 *    pire l'affichage, jamais le résultat.
 */
export function PlanningCountdown({ targetIso, text, initiallyOpen, heading, waiting, calendar }: PlanningCountdownProps) {
  const [open, setOpen] = useState(initiallyOpen);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const targetMs = new Date(targetIso).getTime();
    // Échéance illisible : on ouvre, on ne bloque jamais le planning sur une
    // faute de frappe dans la configuration.
    if (Number.isNaN(targetMs)) {
      const fallback = setTimeout(() => setOpen(true), 0);
      return () => clearTimeout(fallback);
    }

    let interval: ReturnType<typeof setInterval> | undefined;

    // setTimeout(…, 0) plutôt qu'un appel synchrone : la première mise à jour
    // vient de la même minuterie que les suivantes, pas d'un rendu en cascade
    // (react-hooks/set-state-in-effect) — contournement déjà utilisé dans
    // RegistrationCta.tsx et PlanningCalendar.tsx.
    const update = () => {
      const left = targetMs - Date.now();
      if (left <= 0) {
        setOpen(true);
        setRemaining(0);
        if (interval) clearInterval(interval);
        return;
      }
      setOpen(false);
      setRemaining(left);
    };

    const timeout = setTimeout(update, 0);
    // Une seconde, et non une minute : c'est le pas d'affichage des secondes
    // dans la dernière heure, et il rend la bascule exacte à la seconde. Le
    // travail par tour se limite à une soustraction et à un rendu de deux
    // nombres.
    interval = setInterval(update, 1_000);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [targetIso]);

  if (open) return <>{calendar}</>;

  const units = remaining === null ? null : unitsRemaining(remaining);

  return (
    <>
      {heading}
      <section className={styles.wrap}>
        <p className={styles.text}>{text}</p>

        {/* role="timer" sans région live : annoncer chaque seconde rendrait la
            page inutilisable au lecteur d'écran. */}
        <div className={styles.units} role="timer">
          {(units ?? [{ value: "--", label: "heures" }, { value: "--", label: "minutes" }]).map((unit) => (
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
