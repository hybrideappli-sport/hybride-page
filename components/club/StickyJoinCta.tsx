"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import styles from "./StickyJoinCta.module.css";

/**
 * Barre d'action fixe en bas d'écran, mobile uniquement (2026-08-27).
 *
 * La page d'adhésion est longue par choix : les explications sur le 1 €,
 * l'assurance et la contribution HelloAsso sont là pour éviter les
 * malentendus et ne doivent pas être raccourcies. Sur téléphone, le bouton se
 * retrouvait donc très bas. Un bouton en HAUT de page a été écarté : il
 * permettrait de partir vers le paiement sans avoir lu l'explication de la
 * contribution pré-cochée — exactement ce que cette page existe pour éviter.
 *
 * S'efface dès que le vrai bouton entre dans le champ : deux boutons
 * identiques affichés en même temps se lisent comme un défaut. On observe
 * l'élément par son id plutôt que par une ref, faute de pouvoir passer une ref
 * depuis un composant serveur.
 */
export function StickyJoinCta({
  href,
  label,
  watchId,
  revealAfterPassed = false,
}: {
  href: string;
  label: string;
  watchId: string;
  /**
   * La barre n'apparaît qu'une fois le vrai bouton SORTI PAR LE HAUT de l'écran,
   * au lieu d'être là tant qu'on ne l'a pas atteint. Pour la fiche du sweat
   * (2026-11-24), où le bouton est à un écran du haut : afficher la barre dès
   * l'arrivée mettait deux « Je précommande » à l'écran en même temps. /adherer
   * garde le comportement d'origine, son bouton est tout en bas d'une page
   * qu'on doit lire.
   */
  revealAfterPassed?: boolean;
}) {
  const [show, setShow] = useState(!revealAfterPassed);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;

    if (revealAfterPassed) {
      // Position relue à chaque défilement, et non un IntersectionObserver : un
      // saut d'un coup de « dépassé » à « pas encore atteint » (lien d'ancre,
      // retour en haut) ne franchit jamais le bord de l'écran, l'observateur ne
      // se déclencherait pas et la barre resterait affichée. Constaté au test.
      const check = () => setShow(target.getBoundingClientRect().bottom <= 0);
      const timeout = setTimeout(check, 0);
      window.addEventListener("scroll", check, { passive: true });
      window.addEventListener("resize", check);
      return () => {
        clearTimeout(timeout);
        window.removeEventListener("scroll", check);
        window.removeEventListener("resize", check);
      };
    }

    // setState depuis un observateur = notification d'un système externe, pas
    // un rendu en cascade — ne relève pas de react-hooks/set-state-in-effect.
    const observer = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId, revealAfterPassed]);

  return (
    <div className={`${styles.bar} ${show ? "" : styles.barHidden}`}>
      <Button href={href} target="_blank" rel="noopener noreferrer" className={styles.button}>
        {label}
      </Button>
    </div>
  );
}
