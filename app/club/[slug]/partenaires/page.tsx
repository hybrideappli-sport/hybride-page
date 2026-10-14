import { notFound } from "next/navigation";

import { BackToClub } from "@/components/club/BackToClub";
import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { PartnerList } from "@/components/club/PartnerList";
import { PARTNER_CATEGORIES, PARTNERS } from "@/lib/club/partners";
import { CLUB } from "@/lib/config";
import { clubMetadata } from "@/lib/seo";
import styles from "./page.module.css";

export const metadata = clubMetadata({
  title: "Nos partenaires — Hybride Club Toulon",
  description: "Les lieux partenaires du club Hybride à Toulon et alentour, et ce à quoi les adhérents ont droit sur présentation de leur carte.",
  path: "/club/toulon/partenaires",
});

/**
 * Page des partenaires (2026-10-14) — seul endroit du site où les avantages
 * sont énoncés. Accessible depuis le bloc compact de /club/[slug] et le pied de
 * page, PAS depuis la nav : une quatrième entrée déborderait à 375px tant que
 * le badge « Nouveau » du Shop est affiché, et ne laisserait plus de place à
 * une cinquième sans revenir au burger (retiré le 2026-08-28, voir ClubNav).
 *
 * CE QUI NE DOIT PAS ARRIVER ICI : un lien vers /adherer, ou une phrase qui
 * fait des avantages une raison d'adhérer. L'argument de l'adhésion est
 * l'assurance, et lui seul. Le chapeau dit à QUI s'adressent les avantages,
 * pas pourquoi adhérer.
 *
 * Une section par catégorie, dans l'ordre de PARTNER_CATEGORIES ; une
 * catégorie sans partenaire n'est pas rendue.
 */
export default async function ClubPartnersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== CLUB.slug) notFound();

  const sections = PARTNER_CATEGORIES.map((category) => ({
    ...category,
    partners: PARTNERS.filter((partner) => partner.category === category.id),
  })).filter((section) => section.partners.length > 0);

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} />

      <BackToClub clubSlug={CLUB.slug} />

      <div className={styles.hero}>
        <p className={styles.eyebrow}>Nos partenaires</p>
        <h1 className={styles.title}>Des lieux qui font un geste</h1>
        <p className={styles.lead}>
          Les avantages ci-dessous sont réservés aux adhérents, sur présentation de la carte d’adhérent HelloAsso.
        </p>
      </div>

      {sections.map((section) => (
        <section key={section.id} className={styles.category} aria-labelledby={`categorie-${section.id}`}>
          <h2 id={`categorie-${section.id}`} className={styles.categoryTitle}>
            {section.label}
          </h2>
          <PartnerList partners={section.partners} />
        </section>
      ))}

      {PARTNERS.some((partner) => partner.locations.length > 0) ? (
        <p className={styles.outboundNote}>↗ Les fiches partenaires ouvrent un autre site, dans un nouvel onglet.</p>
      ) : null}

      <ClubFooter
        clubSlug={CLUB.slug}
        clubName={CLUB.name}
        legalCity={CLUB.legalCity}
        contactEmail={CLUB.contactEmail}
        stravaUrl={CLUB.stravaUrl}
        instagramUrl={CLUB.instagramUrl}
      />
    </div>
  );
}
