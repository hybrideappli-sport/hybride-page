"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ShopPhoto } from "@/lib/club/shop-gallery";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import styles from "./ShopCarousel.module.css";

/**
 * Vitesse de défilement, EN PIXELS PAR SECONDE et non par image d'animation.
 *
 * La première version comptait par image (0,35 px/frame), ce qui liait la
 * vitesse au taux de rafraîchissement : deux fois plus rapide sur un écran
 * 120 Hz, et ralentie par le navigateur dès que le carrousel sort du champ.
 * Mesurée en ligne le 2026-09-15, elle donnait 30 px/s, soit une vignette
 * toutes les cinq secondes — au-dessous du seuil où l'œil perçoit un
 * mouvement. Le carrousel avait l'air immobile.
 *
 * 90 px/s = une vignette (152 px) toutes les 1,7 s : visible sans qu'on fixe
 * l'écran, assez lent pour qu'on puisse regarder une photo au passage.
 */
const SPEED_PX_PER_SECOND = 90;

/**
 * Plafond de l'intervalle entre deux images, en secondes.
 *
 * Sans lui, un onglet laissé en arrière-plan accumulerait le temps écoulé et le
 * carrousel bondirait de plusieurs centaines de pixels au retour. On avance au
 * plus comme si vingt images par seconde s'étaient écoulées.
 */
const MAX_FRAME_SECONDS = 1 / 20;

/** Délai d'inactivité avant que le mouvement ne reprenne, après un geste. */
const RESUME_DELAY_MS = 2_500;

/** Mélange de Fisher-Yates, sur une copie — jamais sur le tableau de configuration. */
function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Carrousel des photos du merch : défilement automatique lent, en boucle, dans
 * un ordre tiré à chaque visite — et qui rend la main au doigt à tout moment.
 *
 * ORDRE ALÉATOIRE SANS DÉSACCORD D'HYDRATATION. Le premier rendu, serveur comme
 * client, utilise l'ordre du tableau tel quel : déterministe des deux côtés,
 * donc identique par construction. Le tirage n'a lieu qu'au montage, dans un
 * effet, donc après l'hydratation. Un `Math.random()` au rendu serveur ferait
 * les deux fautes à la fois — un désaccord d'hydratation, et un « aléatoire »
 * figé par le cache, le même pour tous les visiteurs jusqu'à la prochaine
 * régénération de la page (même piège que Date.now()).
 *
 * Les `key` sont les `src` : au réordonnancement, React DÉPLACE les nœuds
 * existants au lieu de les recréer, donc aucune image n'est rechargée.
 *
 * BOUCLE. La liste est rendue DEUX FOIS bout à bout, et dès que le défilement a
 * parcouru la première copie on retranche sa largeur au `scrollLeft`. Le
 * contenu étant identique à cet endroit, le saut ne se voit pas. La seconde
 * copie est `aria-hidden` : un lecteur d'écran n'a pas à annoncer deux fois les
 * mêmes photos.
 *
 * LE MOUVEMENT ET LE CALAGE NE PEUVENT PAS COEXISTER. `scroll-snap-type:
 * mandatory` ramène en permanence vers un point de calage : un défilement
 * continu lutterait contre lui et saccaderait. Le calage est donc retiré
 * pendant le mouvement automatique et rendu dès que l'utilisateur prend la main
 * — il sert le geste humain, pas la machine. C'est ce que fait `data-snap`.
 *
 * `prefers-reduced-motion` COUPE LE MOUVEMENT, sans rien retirer d'autre : la
 * boucle, le glissement au doigt, le calage et le clavier continuent de
 * fonctionner. Ce qui disparaît est le déplacement non sollicité, et lui seul.
 */
export function ShopCarousel({ photos }: { photos: ShopPhoto[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Ordre du tableau au premier rendu, mélangé seulement après le montage.
  const [order, setOrder] = useState<ShopPhoto[]>(photos);
  const [mounted, setMounted] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    // setTimeout(…, 0) : la mise à jour ne vient pas d'un rendu en cascade
    // (react-hooks/set-state-in-effect), même contournement qu'ailleurs sur ce site.
    const t = setTimeout(() => {
      setOrder(shuffled(photos));
      setMounted(true);
    }, 0);
    return () => clearTimeout(t);
  }, [photos]);

  /** Met le mouvement en pause, et programme sa reprise après un temps calme. */
  const pauseThenResume = useCallback(() => {
    setInteracting(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setInteracting(false), RESUME_DELAY_MS);
  }, []);

  const moving = mounted && !reducedMotion && !interacting;

  useEffect(() => {
    if (!moving) return;
    let raf = 0;
    let previous = performance.now();
    const step = (now: number) => {
      const el = trackRef.current;
      // Temps réellement écoulé depuis l'image précédente : c'est ce qui rend
      // la vitesse identique sur un écran 60 Hz et sur un 120 Hz.
      const seconds = Math.min((now - previous) / 1000, MAX_FRAME_SECONDS);
      previous = now;
      if (el) {
        el.scrollLeft += SPEED_PX_PER_SECOND * seconds;
        // Recollage : une fois la première copie parcourue, on revient au même
        // point visuel de la copie précédente.
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [moving]);

  // Recollage pour les gestes de l'utilisateur, qui peuvent aussi dépasser la
  // première copie — dans les deux sens.
  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || moving) return;
    const half = el.scrollWidth / 2;
    if (half <= 0) return;
    if (el.scrollLeft >= half) el.scrollLeft -= half;
    else if (el.scrollLeft <= 0) el.scrollLeft += half;
  }, [moving]);

  useEffect(() => () => resumeTimer.current && clearTimeout(resumeTimer.current), []);

  if (order.length === 0) return null;

  // Deux copies bout à bout dès que le montage a eu lieu : avant, une seule,
  // pour que le HTML du serveur et le premier rendu client soient identiques.
  const copies = mounted ? [0, 1] : [0];

  return (
    <div
      ref={trackRef}
      className={styles.track}
      data-snap={moving ? "off" : "on"}
      tabIndex={0}
      role="group"
      aria-label={`${photos.length} autres photos du merch — faites défiler horizontalement`}
      onPointerDown={pauseThenResume}
      onTouchStart={pauseThenResume}
      onWheel={pauseThenResume}
      onKeyDown={pauseThenResume}
      onFocus={pauseThenResume}
      onMouseEnter={pauseThenResume}
      onScroll={handleScroll}
    >
      {copies.map((copy) =>
        order.map((photo) => (
          <figure
            key={`${copy}-${photo.src}`}
            className={styles.item}
            /* La seconde copie n'existe que pour la boucle : elle ne doit pas
               être annoncée une deuxième fois. */
            aria-hidden={copy === 1 ? true : undefined}
          >
            <Image src={photo.src} alt={copy === 1 ? "" : photo.alt} width={1200} height={2133} sizes="42vw" className={styles.itemImage} />
          </figure>
        )),
      )}
    </div>
  );
}
