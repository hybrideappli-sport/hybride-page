import Link from "next/link";

import type { Partner } from "@/lib/club/partners";
import { PartnerLogo } from "./PartnerLogo";
import { RevealOnce } from "./RevealOnce";
import styles from "./PartnerBand.module.css";

/**
 * Bande des partenaires sous le hero de /club/[slug] (2026-10-14), à la
 * demande du client, qui a pris cet emplacement en connaissance de cause : il
 * avait été écarté parce que des logos en haut d'une page de recrutement
 * risquent de se lire comme un argument d'adhésion. L'argument de l'adhésion
 * est l'assurance, et lui seul. Ce qui limite ce risque, et ne doit pas
 * disparaître en retouchant la bande :
 *
 * - AUCUN AVANTAGE, AUCUN CHIFFRE. Pas de « -10 % », pas de « réductions »,
 *   pas de « pour les adhérents ». Les avantages se lisent sur la page dédiée.
 * - PAS DE FORMULE DE CAUTION. « Partenaires du club », un fait. Jamais « Ils
 *   nous font confiance » ni « Ils nous soutiennent » : ce sont des gages de
 *   sérieux, c'est-à-dire des arguments.
 * - SOBRE. Logos agrandis le 2026-10-14 (40px fixes, puis toute la largeur
 *   disponible, plafond 64px) mais toujours sans phrase ni bouton :
 *   intitulé en petites capitales, en violet d'accent depuis le 2026-10-14
 *   (la couleur des liens du site, pas une couleur d'offre).
 *   Elle se remarque comme un fait de la page, pas comme une offre.
 * - PAS DE DÉFILEMENT. Les logos tiennent sur une ligne dès 375px : les
 *   faire défiler obligerait à les dupliquer en boucle, et un bandeau de
 *   logos qui défile est la forme même du bandeau de sponsors.
 * - UN SEUL MOUVEMENT, À L'ENTRÉE. Les logos apparaissent en fondu, l'un
 *   après l'autre, quand la bande entre dans l'écran, puis ne bougent plus
 *   (RevealOnce). Rien en boucle : un mouvement qui revient est celui d'une
 *   publicité. Rien du tout sous « moins de mouvement ».
 * - AUCUN LIEN VERS /adherer, ni ici ni sur la page d'arrivée.
 *
 * Toute la bande est UN lien vers /club/[slug]/partenaires. Logos en `alt`
 * vide : le lien s'annonce « Partenaires du club », qui dit où il mène ; les
 * noms sont sur la page d'arrivée.
 */
export function PartnerBand({ partners, href }: { partners: Partner[]; href: string }) {
  if (partners.length === 0) return null;

  return (
    <Link href={href} className={styles.band}>
      <span className={styles.label}>
        Partenaires du club <span aria-hidden="true">→</span>
      </span>
      <RevealOnce className={styles.logos}>
        {partners.map((partner) => (
          <PartnerLogo key={partner.slug} logo={partner.logo} size="strip" />
        ))}
      </RevealOnce>
    </Link>
  );
}
