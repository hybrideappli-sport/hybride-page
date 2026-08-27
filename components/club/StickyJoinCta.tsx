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
export function StickyJoinCta({ href, label, watchId }: { href: string; label: string; watchId: string }) {
  const [realCtaVisible, setRealCtaVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;
    // setState depuis un observateur = notification d'un système externe, pas
    // un rendu en cascade — ne relève pas de react-hooks/set-state-in-effect.
    const observer = new IntersectionObserver(([entry]) => setRealCtaVisible(entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId]);

  return (
    <div className={`${styles.bar} ${realCtaVisible ? styles.barHidden : ""}`}>
      <Button href={href} target="_blank" rel="noopener noreferrer" className={styles.button}>
        {label}
      </Button>
    </div>
  );
}
