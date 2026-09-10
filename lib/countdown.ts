/**
 * Partie PURE des comptes à rebours du site : aucune dépendance à React, donc
 * importable aussi bien depuis un composant serveur que depuis un composant
 * client. Le hook, lui, vit dans lib/use-countdown.ts — les deux ne peuvent pas
 * partager un fichier : `app/club/[slug]/shop/page.tsx` est un composant
 * serveur et importe `deadlinePassed` ; un `useState` dans le même module
 * ferait échouer la compilation.
 */

/**
 * Verdict de l'horloge SERVEUR pour `initiallyOpen`. Isolée dans une fonction
 * parce qu'elle lit l'horloge : le rendu qui l'appelle n'est donc pas
 * idempotent, et c'est assumé — aucune décision finale n'en dépend, le client
 * recalcule au montage et corrige. Même rôle et même contrat que
 * `deadlineHasPassed` côté planning (lib/agenda/planning.ts).
 *
 * Une échéance vide ou illisible renvoie `true` : mieux vaut une page ouverte
 * qu'une page bloquée par une faute de frappe dans la configuration.
 */
export function deadlinePassed(iso: string): boolean {
  if (iso.trim() === "") return true;
  const targetMs = new Date(iso).getTime();
  if (Number.isNaN(targetMs)) return true;
  return new Date().getTime() >= targetMs;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export interface CountdownUnit {
  value: string;
  label: string;
}

/**
 * Unités adaptées à ce qu'il reste : au-delà d'une heure on montre (jours) /
 * heures / minutes, dans la dernière heure on bascule sur minutes / secondes.
 * Un « 0 J » ou un « 00 H » immobile n'apprend rien.
 *
 * `withSeconds: false` retire les secondes en toute circonstance — c'est la
 * réponse à `prefers-reduced-motion`. La règle globale de globals.css ne peut
 * rien ici : le décompte n'est pas une animation CSS mais du texte remplacé par
 * JavaScript, et c'est le chiffre qui saute chaque seconde qui gêne.
 */
export function unitsRemaining(msRemaining: number, { withSeconds = true }: { withSeconds?: boolean } = {}): CountdownUnit[] {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const seconds = total % 60;

  if (total < 3_600) {
    const lastHour: CountdownUnit[] = [{ value: pad(minutes), label: minutes === 1 ? "minute" : "minutes" }];
    if (withSeconds) lastHour.push({ value: pad(seconds), label: seconds === 1 ? "seconde" : "secondes" });
    return lastHour;
  }

  const units: CountdownUnit[] = [
    { value: pad(hours), label: hours === 1 ? "heure" : "heures" },
    { value: pad(minutes), label: minutes === 1 ? "minute" : "minutes" },
  ];
  if (days > 0) units.unshift({ value: String(days), label: days === 1 ? "jour" : "jours" });
  return units;
}
