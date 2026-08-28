import type { ReactNode } from "react";

import styles from "./Tag.module.css";

/**
 * Code couleur PAR ACTIVITÉ depuis le 2026-08-28, repris de l'agenda visuel du
 * club. Remplace les 5 familles précédentes (course / vélo / eau / montagne /
 * collectif), qui regroupaient des sorties très différentes sous une même
 * couleur.
 *
 * Une sortie porte UNE activité, plus plusieurs : avec cette taxonomie
 * l'activité est déjà complète en elle-même (« social run » n'est pas
 * « course + collectif »). C'est ce qui permet au tableur de n'avoir qu'une
 * colonne à liste déroulante au lieu d'une case à cocher par valeur — voir
 * lib/agenda/source.ts.
 *
 * `bivouac` couvre AUSSI la rando (décision du 2026-08-28) : marche en montagne
 * dans les deux cas, et pas de neuvième couleur — la palette est déjà au-delà
 * de ce qu'un œil mémorise. Le tableur accepte « Rando » comme saisie et la
 * range ici (lib/agenda/source.ts).
 *
 * Ajouter une activité = une entrée ici, une paire de jetons dans globals.css,
 * une entrée dans la liste déroulante du tableur. Lire d'abord la règle sur la
 * taille de la palette, en tête de la section ACTIVITÉS de globals.css.
 */
export type Activity = "piste" | "social-run" | "trail" | "velo" | "nage" | "bivouac" | "soirees" | "communautaire";
export type TagVariant = Activity | "format";

export const activityLabel: Record<Activity, string> = {
  piste: "Piste",
  "social-run": "Social run",
  trail: "Trail",
  velo: "Vélo",
  nage: "Nage en eau libre",
  bivouac: "Rando, bivouac",
  soirees: "Soirée Hybride",
  communautaire: "Événement communautaire",
};

const variantClass: Record<TagVariant, string> = {
  piste: styles.piste,
  "social-run": styles.socialRun,
  trail: styles.trail,
  velo: styles.velo,
  nage: styles.nage,
  bivouac: styles.bivouac,
  soirees: styles.soirees,
  communautaire: styles.communautaire,
  format: styles.format,
};

export function Tag({ variant, children }: { variant: TagVariant; children: ReactNode }) {
  return <span className={`${styles.tag} ${variantClass[variant]}`}>{children}</span>;
}
