import type { ReactNode } from "react";

import { PwaInstallBanner } from "@/components/club/PwaInstallBanner";
import { SweatPreorderBanner } from "@/components/club/SweatPreorderBanner";
import { getSweatPreorderPhase, SWEAT_BANNER_EARLY_HIDE_SCRIPT } from "@/lib/club/sweat-preorder";
import { CLUB } from "@/lib/config";

/**
 * Premier layout du site (2026-09-25), créé pour une seule raison : monter la
 * bannière d'installation une fois pour les dix pages du club, au lieu de
 * l'importer dans chacune. Depuis le 2026-11-24 il monte aussi, en tête, le
 * bandeau de précommande du sweat. Aucune balise supplémentaire n'est introduite — les
 * pages continuent de poser elles-mêmes leur `ClubNav`, leur conteneur et leur
 * `ClubFooter`, et rien de leur mise en page ne change.
 *
 * VOLONTAIREMENT LIMITÉ AU CLUB. Les pages de la racine (/ et ses deux pages
 * légales) présentent l'entité commerciale et son application à venir : y
 * proposer d'épingler le site créerait exactement la confusion que la séparation
 * des deux univers cherche à éviter depuis le 2026-08-30 (lib/seo.ts). C'est
 * l'association qu'on installe.
 *
 * La bannière décide seule de se taire — déjà installé, refus mémorisé, desktop,
 * page portant déjà une barre fixe. Elle n'est jamais rendue côté serveur : le
 * HTML servi ne contient d'elle que le petit script ci-dessous.
 */

/**
 * Capteur de `beforeinstallprompt`, posé AVANT l'hydratation de React.
 *
 * Chromium émet cet événement UNE SEULE FOIS, dès qu'il a fini d'évaluer le
 * manifeste — ce qui peut tomber avant que le JavaScript de la page ne soit
 * exécuté, sur une connexion lente ou un téléphone modeste. Un écouteur posé
 * seulement dans le `useEffect` du composant le manquerait alors définitivement,
 * et le bouton « Installer » d'Android ne s'afficherait jamais, sans erreur ni
 * trace : une panne silencieuse et intermittente, le pire des cas.
 *
 * Ce script s'exécute au parcours du HTML, met l'événement de côté sur `window`,
 * et le composant vient l'y chercher au montage — tout en gardant son propre
 * écouteur pour le cas normal où l'événement arrive après.
 *
 * `preventDefault()` empêche Chrome de poser sa propre invitation par-dessus la
 * nôtre. Le nom de la propriété est dupliqué dans PwaInstallBanner.tsx : les
 * deux doivent rester d'accord.
 */
const INSTALL_PROMPT_CATCHER = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__hybrideInstallPrompt=e;});`;

export default function ClubLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Précommande du sweat (2026-11-24) : le script AVANT le bandeau, pour
          que la règle qui le masque existe déjà quand il est parcouru. */}
      <script dangerouslySetInnerHTML={{ __html: SWEAT_BANNER_EARLY_HIDE_SCRIPT }} />
      <SweatPreorderBanner clubSlug={CLUB.slug} initialPhase={getSweatPreorderPhase()} />
      {children}
      <script dangerouslySetInnerHTML={{ __html: INSTALL_PROMPT_CATCHER }} />
      <PwaInstallBanner />
    </>
  );
}
