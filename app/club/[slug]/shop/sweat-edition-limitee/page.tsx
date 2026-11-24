import Link from "next/link";
import { notFound } from "next/navigation";

import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { StickyJoinCta } from "@/components/club/StickyJoinCta";
import { SweatBadges } from "@/components/club/SweatBadges";
import { SweatGallery } from "@/components/club/SweatGallery";
import { SweatOffer } from "@/components/club/SweatOffer";
import { SweatPreorderOnly } from "@/components/club/SweatPreorderOnly";
import { getSweatPreorderPhase, SWEAT_FACTS, SWEAT_NAME, SWEAT_PHOTOS, SWEAT_SELLING_POINTS } from "@/lib/club/sweat-preorder";
import { CLUB, HELLOASSO_SWEAT_URL } from "@/lib/config";
import { clubMetadata } from "@/lib/seo";
import styles from "./page.module.css";

const REAL_CTA_ID = "sweat-cta";

/*
 * Description SANS PRIX : elle reste affichée dans les aperçus WhatsApp et les
 * résultats de recherche bien après le 9 décembre, où « 36 € » deviendrait faux.
 */
export const metadata = clubMetadata({
  title: "Sweat Hybride édition limitée — précommande · Hybride Club Toulon",
  description:
    "Sweat à capuche noir, logo H côté cœur et relief de Toulon imprimé en violet au dos. Édition limitée, en précommande jusqu'au 15 décembre, aucun réassort.",
  path: "/club/toulon/shop/sweat-edition-limitee",
  image: {
    url: "/og/sweat-edition-limitee.jpg",
    width: 1199,
    height: 630,
    alt: "Deux membres du club en sweat Hybride au bord de l'eau : logo H devant, relief de Toulon en violet au dos",
  },
});

/**
 * Fiche du sweat (2026-11-24) — l'adresse à coller dans les stories et sur
 * WhatsApp. Elle reste en ligne après la clôture, en « Précommande terminée » :
 * un lien partagé ne doit pas tomber en 404.
 */
export default async function SweatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== CLUB.slug) notFound();

  const initialPhase = getSweatPreorderPhase();

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} />

      <Link href={`/club/${CLUB.slug}/shop`} className={styles.back}>
        ← Retour à la boutique
      </Link>

      <div className={styles.layout}>
        <SweatGallery photos={SWEAT_PHOTOS} />

        <div className={styles.info}>
          <SweatBadges />
          <h1 className={styles.title}>{SWEAT_NAME}</h1>
          <p className={styles.lead}>
            Noir, logo H côté cœur. Au dos, le relief de Toulon imprimé en violet, sous « Hybride · Club · Toulon ».
          </p>

          <SweatOffer initialPhase={initialPhase} ctaId={REAL_CTA_ID} size="large" />

          <ul className={styles.points}>
            {SWEAT_SELLING_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          <dl className={styles.facts}>
            {SWEAT_FACTS.map((fact) => (
              <div key={fact.label} className={styles.fact}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>

          <p className={styles.outboundNote}>
            ↗ La coupe et la taille se choisissent sur HelloAsso.com, qui s’ouvre dans un nouvel onglet. Rien n’est collecté ni encaissé
            sur ce site.
          </p>
        </div>
      </div>

      <ClubFooter
        clubSlug={CLUB.slug}
        clubName={CLUB.name}
        legalCity={CLUB.legalCity}
        contactEmail={CLUB.contactEmail}
        stravaUrl={CLUB.stravaUrl}
        instagramUrl={CLUB.instagramUrl}
      />

      {/* Barre fixe mobile : elle n'apparaît qu'une fois le vrai bouton dépassé
          vers le bas de la page (caractéristiques, pied de page) — jamais en
          même temps que lui. Retirée à la clôture avec le vrai bouton. */}
      <SweatPreorderOnly initialPhase={initialPhase}>
        <StickyJoinCta href={HELLOASSO_SWEAT_URL} label="Je précommande ↗" watchId={REAL_CTA_ID} revealAfterPassed />
      </SweatPreorderOnly>
    </div>
  );
}
