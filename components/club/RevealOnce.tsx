"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import styles from "./RevealOnce.module.css";

type State = "static" | "armed" | "in";

/**
 * Fondu d'entrée, UNE seule fois, quand le bloc entre dans l'écran — utilisé
 * par la bande des partenaires (PartnerBand), traitement « A » retenu le
 * 2026-10-14 : accrocher l'œil au moment où il passe, puis plus rien ne bouge.
 *
 * Les enfants directs apparaissent l'un après l'autre (décalage de 80ms, voir
 * le CSS), en fondu et en remontant de quelques pixels, moins d'une seconde
 * au total.
 *
 * POURQUOI PAS UNE ANIMATION CSS LIÉE AU DÉFILEMENT (`animation-timeline:
 * view()`) : elle suivrait le doigt — lente si l'on défile lentement, rejouée
 * à l'envers en remontant. On veut un événement, pas un curseur.
 *
 * RIEN N'EST MASQUÉ SANS DÉCISION EXPLICITE. Le HTML servi et le premier rendu
 * sont en état `static`, logos visibles : sans JavaScript, la bande est
 * simplement là. Le masquage (`armed`) n'est posé qu'après le montage, et
 * seulement si :
 * - la préférence « moins de mouvement » n'est PAS active — sinon on reste
 *   `static`, aucune animation, aucun masquage ;
 * - le bloc est HORS de l'écran au premier constat de l'observateur. Déjà
 *   visible au chargement (grand écran), le masquer pour le refaire
 *   apparaître ferait clignoter ce qu'on regarde déjà : on le laisse tel quel.
 */
export function RevealOnce({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>("static");

  useEffect(() => {
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let first = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (first) {
          first = false;
          if (entry.isIntersecting) {
            observer.disconnect();
            return;
          }
          setState("armed");
          return;
        }
        if (entry.isIntersecting) {
          setState("in");
          observer.disconnect();
        }
      },
      // Déclenché quand un cinquième du bloc est visible : assez tôt pour que
      // le mouvement soit vu, assez tard pour qu'il ne se joue pas sous le bord.
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${styles.reveal} ${className ?? ""}`} data-reveal={state}>
      {children}
    </div>
  );
}
