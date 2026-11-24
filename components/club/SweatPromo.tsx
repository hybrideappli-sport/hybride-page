import Image from "next/image";
import Link from "next/link";

import { SweatBadges } from "@/components/club/SweatBadges";
import { SweatOffer } from "@/components/club/SweatOffer";
import { SWEAT_PHOTOS, SWEAT_SELLING_POINTS, sweatProductPath, type SweatPreorderPhase } from "@/lib/club/sweat-preorder";
import styles from "./SweatPromo.module.css";

/**
 * Mise en avant du sweat hors de sa fiche (2026-11-24) :
 *
 * - `card` — encart du planning et carte en tête du shop : une photo, le prix,
 *   le bouton. Le shop ajoute les badges (`badges`).
 * - `section` — section de l'accueil : trois photos en bande, les arguments.
 *
 * Composant SERVEUR : seul SweatOffer, à l'intérieur, suit l'horloge. Le
 * masquage après la clôture se décide autour (SweatPreorderOnly), pas ici —
 * la carte du shop, elle, reste.
 */
export function SweatPromo({
  clubSlug,
  initialPhase,
  variant,
  badges = false,
  headingLevel = 2,
}: {
  clubSlug: string;
  initialPhase: SweatPreorderPhase;
  variant: "card" | "section";
  badges?: boolean;
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as const;
  const productHref = sweatProductPath(clubSlug);

  if (variant === "card") {
    const photo = SWEAT_PHOTOS[0];
    return (
      <section className={styles.card} aria-labelledby="sweat-promo-title">
        <Link href={productHref} className={styles.cardPhoto} tabIndex={-1} aria-hidden="true">
          <Image src={photo.src} alt="" width={photo.width} height={photo.height} sizes="(max-width: 860px) 100vw, 400px" className={styles.cardImage} />
        </Link>
        <div className={styles.cardBody}>
          {badges ? <SweatBadges /> : <p className={styles.eyebrow}>Édition limitée · précommande</p>}
          <Heading id="sweat-promo-title" className={styles.cardTitle}>
            <Link href={productHref}>Le sweat Hybride</Link>
          </Heading>
          <p className={styles.cardLead}>{SWEAT_SELLING_POINTS[1]} Aucun réassort.</p>
          <SweatOffer initialPhase={initialPhase} />
          <Link href={productHref} className={styles.more}>
            Voir le sweat et les photos →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="sweat-section-title">
      <div className={styles.sectionHead}>
        <p className={styles.eyebrow}>Édition limitée · précommande</p>
        <Heading id="sweat-section-title" className={styles.sectionTitle}>
          Le sweat du club
        </Heading>
      </div>

      <div className={styles.strip}>
        {SWEAT_PHOTOS.slice(0, 3).map((photo) => (
          <Image
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            sizes="(max-width: 860px) 70vw, 360px"
            className={styles.stripImage}
          />
        ))}
      </div>

      <div className={styles.sectionBody}>
        <ul className={styles.points}>
          {SWEAT_SELLING_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <div>
          <SweatOffer initialPhase={initialPhase} />
          <Link href={productHref} className={styles.more}>
            Voir le sweat et les photos →
          </Link>
        </div>
      </div>
    </section>
  );
}
