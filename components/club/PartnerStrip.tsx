import Link from "next/link";

import type { Partner } from "@/lib/club/partners";
import { PartnerLogo } from "./PartnerLogo";
import styles from "./PartnerStrip.module.css";

/**
 * Bloc compact des partenaires sur /club/[slug] : les logos et un lien vers
 * /club/[slug]/partenaires, où vivent les avantages en détail (2026-10-14).
 *
 * Les AVANTAGES NE SONT PAS RÉPÉTÉS ICI. Cette page est celle du recrutement,
 * avec le bandeau « 1 € pour l'année » juste au-dessus : posés à côté, « 10 %
 * de réduction » se liraient comme une raison d'adhérer — or l'argument de
 * l'adhésion est l'assurance, et lui seul. Ici on montre QUI soutient le club ;
 * ce à quoi un adhérent a droit se lit sur la page dédiée. Et aucun lien vers
 * /adherer, ni ici ni là-bas.
 *
 * Logos non cliquables : un seul lien, vers la page dédiée. Trois liens de plus
 * vers des sites tiers feraient sortir du site avant d'avoir lu quoi que ce soit.
 */
export function PartnerStrip({ partners, href }: { partners: Partner[]; href: string }) {
  if (partners.length === 0) return null;

  return (
    <div>
      <ul className={styles.logos}>
        {partners.map((partner) => (
          <li key={partner.slug}>
            <PartnerLogo logo={partner.logo} size="strip" alt={partner.name} />
          </li>
        ))}
      </ul>
      <p className={styles.linkLine}>
        <Link href={href} className={styles.link}>
          Voir les partenaires →
        </Link>
      </p>
    </div>
  );
}
