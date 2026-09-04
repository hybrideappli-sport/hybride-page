"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import styles from "./StickyRegisterCta.module.css";

/**
 * Barre d'inscription fixe en bas d'écran sur une page de sortie, mobile
 * uniquement (2026-09-11) — même dispositif que StickyJoinCta sur la page
 * d'adhésion, et mêmes précautions : fond plein, zone sûre iOS, espace réservé
 * en bas de page côté CSS de la page.
 *
 * DEUX CAS OÙ ELLE N'EXISTE PAS DU TOUT, plutôt qu'une barre qui n'annonce rien :
 *
 * - Sortie passée. Il n'y a plus d'action possible ; la mention « Cette sortie a
 *   eu lieu » est déjà dans le corps de la page, à sa place.
 * - Aucune URL Luma. Une barre fixe occupe en permanence le bas d'un petit écran :
 *   c'est un coût d'espace qui se justifie par une action à portée de pouce, pas
 *   par un état à annoncer. « Inscriptions bientôt disponibles » reste affiché en
 *   ligne dans la page, où il informe sans obstruer.
 *
 * L'instant est calculé après le montage, jamais au rendu serveur : une page
 * mise en cache figerait « passée » à l'heure de sa génération (même raison que
 * RegistrationCta et PlanningCountdown).
 */
export function StickyRegisterCta({ lumaUrl, startsAtIso, watchId }: { lumaUrl: string | null; startsAtIso: string; watchId: string }) {
  const [now, setNow] = useState<number | null>(null);
  const [realCtaVisible, setRealCtaVisible] = useState(false);

  useEffect(() => {
    // setTimeout(…, 0) plutôt qu'un appel synchrone : la mise à jour vient d'une
    // minuterie et non d'un rendu en cascade (react-hooks/set-state-in-effect).
    const update = () => setNow(Date.now());
    const timeout = setTimeout(update, 0);
    const interval = setInterval(update, 60_000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;
    // setState depuis un observateur = notification d'un système externe, pas un
    // rendu en cascade.
    const observer = new IntersectionObserver(([entry]) => setRealCtaVisible(entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId]);

  if (now === null) return null;
  if (!lumaUrl) return null;
  if (now >= new Date(startsAtIso).getTime()) return null;

  return (
    <div className={`${styles.bar} ${realCtaVisible ? styles.barHidden : ""}`}>
      <Button href={lumaUrl} target="_blank" rel="noopener noreferrer" className={styles.button}>
        S&rsquo;inscrire sur Luma ↗
      </Button>
    </div>
  );
}
