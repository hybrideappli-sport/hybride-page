"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import styles from "./RegistrationCta.module.css";

function formatCountdown(msRemaining: number): string {
  const totalMinutes = Math.max(0, Math.round(msRemaining / 60_000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `Ouvre dans ${days} j ${hours} h`;
  if (hours > 0) return `Ouvre dans ${hours} h ${minutes} min`;
  return `Ouvre dans ${minutes} min`;
}

/**
 * Trois états (ADR-010 §3) : décompte avant `opensAtIso`, lien Luma après si
 * `lumaUrl` est renseignée, état neutre distinct sinon — jamais un lien mort,
 * jamais un décompte à zéro/négatif.
 *
 * `opensAtIso` à null = pas d'ouverture différée, la sortie est ouverte : une
 * sortie publiée est une sortie où l'on peut venir (décision du 2026-08-26,
 * après le retrait des colonnes d'ouverture du tableur). Le décompte est alors
 * simplement sauté, les deux autres états restent inchangés.
 *
 * Calculé côté client, jamais au rendu serveur : une page mise en cache ne
 * doit pas figer un décompte. `now` reste `null` jusqu'au montage (même
 * pattern que `PhotoSlot.tsx`) pour ne jamais afficher un état potentiellement
 * faux avant que le calcul réel n'ait eu lieu.
 */
export function RegistrationCta({ opensAtIso, lumaUrl }: { opensAtIso: string | null; lumaUrl: string | null }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // setTimeout(…, 0), pas un appel synchrone : la première mise à jour vient du même
    // mécanisme externe (minuterie) que les suivantes, pas d'un rendu en cascade
    // (react-hooks/set-state-in-effect).
    const update = () => setNow(Date.now());
    const timeout = setTimeout(update, 0);
    const interval = setInterval(update, 60_000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  if (now === null) return <div className={styles.cta} aria-hidden="true" />;

  if (opensAtIso !== null) {
    const opensAtMs = new Date(opensAtIso).getTime();
    if (now < opensAtMs) {
      return <p className={styles.countdown}>{formatCountdown(opensAtMs - now)}</p>;
    }
  }

  if (!lumaUrl) {
    return <p className={styles.pending}>Inscriptions bientôt disponibles</p>;
  }

  return (
    <Button href={lumaUrl} size="mini" target="_blank" rel="noopener noreferrer">
      S&rsquo;inscrire sur Luma
    </Button>
  );
}
