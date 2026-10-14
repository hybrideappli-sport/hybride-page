import type { Partner } from "@/lib/club/partners";
import { PartnerLogo } from "./PartnerLogo";
import styles from "./PartnerList.module.css";

/**
 * Liste des partenaires d'une catégorie, sur /club/[slug]/partenaires. Itère
 * sur la donnée (lib/club/partners.ts) — ajouter un partenaire ne demande rien
 * d'autre qu'une entrée dans le tableau.
 *
 * Logo AU-DESSUS du texte, et non à côté (2026-10-14) : à côté tenait tant que
 * le seul logo était le portrait de Little Bistrok. Ceux de La Lagune et de
 * Terre de Running sont deux fois plus larges que hauts ; à 375px, posés à
 * côté, ils laisseraient une centaine de pixels au texte.
 *
 * Aucune icône illustrative : le seul signe est la flèche ↗ des liens sortants,
 * qui existe déjà partout ailleurs sur le site et signale une sortie du site.
 *
 * Composant serveur : rien ici n'a besoin d'état ni d'événement.
 */
export function PartnerList({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) return null;

  return (
    <ul className={styles.list}>
      {partners.map((partner) => (
        <li key={partner.slug} className={styles.item}>
          <PartnerLogo logo={partner.logo} size="card" />

          <div className={styles.body}>
            <h3 className={styles.name}>{partner.name}</h3>
            {partner.description ? <p className={styles.description}>{partner.description}</p> : null}
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
