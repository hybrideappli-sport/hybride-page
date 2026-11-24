"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  SWEAT_BANNER_DISMISSED_KEY,
  SWEAT_BANNER_ID,
  SWEAT_BANNER_COUNTDOWN_LEAD,
  SWEAT_BANNER_SNOOZE_MS,
  SWEAT_PHOTOS,
  sweatProductPath,
  type SweatPreorderPhase,
} from "@/lib/club/sweat-preorder";
import { useSweatOffer } from "@/lib/club/use-sweat-offer";
import { HELLOASSO_SWEAT_URL } from "@/lib/config";
import styles from "./SweatPreorderBanner.module.css";

/** La photo principale du sweat (le duo à la rambarde), comme partout ailleurs. */
const SWEAT_BANNER_PHOTO = SWEAT_PHOTOS[0];

function readDismissedRecently(): boolean {
  // Navigation privée Safari : la lecture peut lever. Une bannière de trop vaut
  // mieux qu'une page cassée.
  try {
    const at = Number(window.localStorage.getItem(SWEAT_BANNER_DISMISSED_KEY));
    return at > 0 && Date.now() - at < SWEAT_BANNER_SNOOZE_MS;
  } catch {
    return false;
  }
}

/**
 * Bandeau d'annonce de la précommande, en tête de toutes les pages du club
 * (2026-11-24). Monté une fois par app/club/[slug]/layout.tsx.
 *
 * NON COLLANT : il défile avec la page. Sur un téléphone, un bandeau fixé en
 * haut mangerait l'écran sur chaque page — l'annonce est vue à l'arrivée, ça
 * suffit, et les pages à barre fixe en bas (adhésion, sortie, fiche du sweat)
 * n'en ont pas une seconde.
 *
 * FERMABLE 24 H. L'horodatage de la fermeture est gardé dans localStorage ; un
 * script du layout le lit avant l'affichage (SWEAT_BANNER_EARLY_HIDE_SCRIPT),
 * ce composant le relit au montage. Passé 24 h, le bandeau revient.
 *
 * Disparaît seul à la clôture de la précommande, sur l'horloge du visiteur.
 */
export function SweatPreorderBanner({ clubSlug, initialPhase }: { clubSlug: string; initialPhase: SweatPreorderPhase }) {
  const { offer, closingRemainingText } = useSweatOffer(initialPhase);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDismissed(readDismissedRecently()), 0);
    return () => clearTimeout(timeout);
  }, []);

  if (dismissed || offer.phase === "closed") return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(SWEAT_BANNER_DISMISSED_KEY, String(Date.now()));
    } catch {
      // Stockage refusé : le bandeau se ferme pour cette page, il reviendra à la suivante.
    }
    setDismissed(true);
  };

  return (
    <aside id={SWEAT_BANNER_ID} className={styles.banner} aria-label="Précommande du sweat Hybride">
      {/* Fond photo décoratif (alt vide) : le texte dit déjà tout. Photo du
          sweat réel — Banniere.png, la maquette prévue pour ce fond, porte
          les coordonnées erronées 5.552 et est écartée (2026-11-24). */}
      <Image src={SWEAT_BANNER_PHOTO.src} alt="" fill sizes="100vw" className={styles.bg} />
      <div className={styles.inner}>
        <p className={styles.text}>
          <Link href={sweatProductPath(clubSlug)} className={styles.title}>
            Précommande ouverte — Sweat Hybride édition limitée
          </Link>
          {/* Pas de prix ici (2026-11-24) : la bannière est sur toutes les pages,
              et le prix ne doit apparaître qu'une fois par page — dans la carte,
              l'encart ou la fiche. Le décompte vise la clôture, pas le palier. */}
          <span className={styles.meta}>
            {SWEAT_BANNER_COUNTDOWN_LEAD}{" "}
            <span role="timer" className={styles.timer}>
              {closingRemainingText ?? "—"}
            </span>
          </span>
        </p>
        <a href={HELLOASSO_SWEAT_URL} target="_blank" rel="noopener noreferrer" className={styles.cta}>
          Je précommande ↗
        </a>
        <button type="button" className={styles.close} onClick={dismiss} aria-label="Masquer l’annonce pendant 24 heures">
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
