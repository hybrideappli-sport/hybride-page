import Image from "next/image";

import type { Partner } from "@/lib/club/partners";
import styles from "./PartnerList.module.css";

/**
 * Liste des partenaires du club. Itère sur la donnée (lib/club/partners.ts) —
 * ajouter un partenaire ne demande rien d'autre qu'une entrée dans le tableau.
 *
 * Aucune icône illustrative : le seul signe est la flèche ↗ des liens sortants,
 * qui existe déjà partout ailleurs sur la page et signale une sortie du site,
 * pas une décoration.
 *
 * Composant serveur : rien ici n'a besoin d'état ni d'événement.
 */
export function PartnerList({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) return null;

  return (
    <ul className={styles.list}>
      {partners.map((partner) => (
        <li key={partner.slug} className={styles.item}>
          <div className={`${styles.logoWrap} ${partner.logo.background === "light" ? styles.logoLight : ""}`}>
            {/*
             * `unoptimized`, comme pour le logo de Door.tsx : la conversion
             * WebP/AVIF de next/image (pipeline `sharp`) supprime le canal alpha
             * des PNG dans ce projet — constaté le 2026-08-20, seule la variante
             * WebP négociée par Chrome est touchée. Ce logo-ci est transparent
             * autour de sa pastille et posé à même le fond noir : perdre l'alpha
             * lui collerait un rectangle opaque. Un petit PNG statique, servi
             * tel quel, coûte moins cher qu'une pipeline qui casse ce dont on
             * dépend.
             *
             * `alt` vide, et c'est délibéré : le nom du partenaire est écrit
             * juste à côté dans le titre. Le décrire ici le ferait annoncer deux
             * fois par un lecteur d'écran.
             */}
            <Image
              src={partner.logo.src}
              alt=""
              width={partner.logo.width}
              height={partner.logo.height}
              unoptimized
              className={styles.logo}
            />
          </div>

          <div className={styles.body}>
            <h3 className={styles.name}>{partner.name}</h3>
            <p className={styles.description}>{partner.description}</p>
            <p className={styles.benefit}>{partner.benefit}</p>
            {partner.url ? (
              <p className={styles.linkLine}>
                {/*
                 * `noreferrer` n'est pas seulement l'habitude qui accompagne
                 * `noopener` : il empêche d'annoncer au site d'arrivée la page
                 * d'où vient le visiteur. Les fiches partenaires sont hébergées
                 * chez des tiers (Google pour Little Bistrok) — ce site ne
                 * collecte rien, il n'a pas à faire collecter à sa place.
                 */}
                <a href={partner.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  Voir la fiche ↗
                </a>
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
