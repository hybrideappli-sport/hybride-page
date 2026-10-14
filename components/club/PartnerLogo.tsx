import Image from "next/image";

import type { Partner } from "@/lib/club/partners";
import styles from "./PartnerLogo.module.css";

/**
 * Logo d'un partenaire, partagé par la liste complète (PartnerList) et le bloc
 * compact de la page d'accueil du club (PartnerStrip). Le fond `light` se
 * décide dans la donnée (lib/club/partners.ts), jamais ici.
 *
 * La HAUTEUR est fixée par la taille, la largeur suit le format du fichier :
 * les logos n'ont pas tous le même (Little Bistrok portrait 0,64, Terre de
 * Running paysage 2,4). Caler la hauteur les fait tous peser pareil — une
 * largeur commune ferait paraître un logo large deux fois plus gros.
 */
export function PartnerLogo({ logo, size, alt = "" }: { logo: Partner["logo"]; size: "card" | "strip" | "band"; alt?: string }) {
  return (
    <div className={`${styles.wrap} ${styles[size]} ${logo.background === "light" ? styles.light : ""}`}>
      {/*
       * `unoptimized` : la conversion WebP/AVIF de next/image (pipeline `sharp`)
       * supprime le canal alpha des PNG dans ce projet — constaté le
       * 2026-08-20, seule la variante WebP négociée par Chrome est touchée.
       * Les trois logos dépendent de leur transparence (pastille de Little
       * Bistrok, coins arrondis de La Lagune, tracé de Terre de Running).
       *
       * `alt` vide par défaut, et c'est délibéré : dans une carte, le nom du
       * partenaire est écrit juste à côté — le décrire ici le ferait annoncer
       * deux fois par un lecteur d'écran. Le bloc compact, lui, n'affiche que
       * les logos : il passe le nom en `alt`.
       */}
      <Image src={logo.src} alt={alt} width={logo.width} height={logo.height} unoptimized className={styles.logo} />
    </div>
  );
}
