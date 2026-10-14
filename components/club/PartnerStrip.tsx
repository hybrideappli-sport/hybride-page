import Link from "next/link";

import type { Partner } from "@/lib/club/partners";
import { PartnerLogo } from "./PartnerLogo";
import styles from "./PartnerStrip.module.css";

const COUNT_WORDS = ["", "Un", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit", "Neuf", "Dix"];

/**
 * Phrase d'accroche calculée depuis la donnée, pour ne jamais annoncer
 * « trois » quand il y en a quatre. Un FAIT — qui est partenaire — et rien
 * sur ce que ça rapporte : voir l'avertissement ci-dessous.
 *
 * Le mot doit nommer CE QUI EST COMPTÉ : des partenaires, pas des adresses.
 * « Lieux » était faux — Terre de Running a deux magasins, la phrase
 * annonçait trois lieux pour quatre adresses. « Commerces » compte une
 * enseigne une fois, quel que soit son nombre de magasins. Si un partenaire
 * cesse un jour d'être un commerce (une association, un club), c'est ce mot
 * qu'il faudra revoir.
 */
function leadFor(count: number): string {
  const word = COUNT_WORDS[count] ?? String(count);
  return count > 1
    ? `${word} commerces à Toulon et alentour sont partenaires du club.`
    : `${word} commerce à Toulon et alentour est partenaire du club.`;
}

/**
 * Bloc des partenaires sur /club/[slug] : un cadre entièrement cliquable vers
 * /club/[slug]/partenaires, où vivent les avantages en détail.
 *
 * PLUS VISIBLE, MÊME PLACE (2026-10-14). La section passait inaperçue sous le
 * bandeau crème. Elle n'a pas été remontée — au-dessus du « 1 € pour l'année »
 * elle se lirait comme un argument d'adhésion — elle a été renforcée sur
 * place : cadre bordé (le traitement des autres blocs du site), logos plus
 * grands, une phrase, et toute la surface comme cible.
 *
 * Les AVANTAGES NE SONT PAS RÉPÉTÉS ICI. Cette page est celle du recrutement :
 * posés sous le « 1 € », « 10 % de réduction » se liraient comme une raison
 * d'adhérer — or l'argument de l'adhésion est l'assurance, et lui seul. Ici on
 * montre QUI est partenaire ; ce à quoi un adhérent a droit se lit sur la page
 * dédiée. Et aucun lien vers /adherer, ni ici ni là-bas.
 *
 * Logos en `alt` vide : à l'intérieur du lien, leurs noms allongeraient
 * l'intitulé annoncé (« Little Bistrok La Lagune Terre de Running Trois commerces…
 * Voir les partenaires »). Le lien s'annonce par sa phrase et son appel, qui
 * disent où il mène ; les noms sont sur la page d'arrivée.
 */
export function PartnerStrip({ partners, href }: { partners: Partner[]; href: string }) {
  if (partners.length === 0) return null;

  return (
    <Link href={href} className={styles.card}>
      <div className={styles.logos}>
        {partners.map((partner) => (
          <PartnerLogo key={partner.slug} logo={partner.logo} size="strip" />
        ))}
      </div>
      <span className={styles.lead}>{leadFor(partners.length)}</span>
      <span className={styles.cta}>Voir les partenaires →</span>
    </Link>
  );
}
