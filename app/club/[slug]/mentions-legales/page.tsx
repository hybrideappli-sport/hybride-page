import { notFound } from "next/navigation";

import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { LegalPage } from "@/components/legal/LegalPage";
import { CLUB } from "@/lib/config";
import styles from "../page.module.css";

export default async function ClubMentionsLegalesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== CLUB.slug) notFound();

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} helloAssoUrl={CLUB.helloAssoUrl} />
      <LegalPage title="Mentions légales" updatedAt="2026-08-14">
        <h2>Éditeur</h2>
        <p>
          {CLUB.name}, association loi du 1er juillet 1901, {CLUB.legalCity}. Déclarée au Journal officiel des associations (JOAFE) — numéro
          RNA à compléter.
        </p>
        <p>Contact : {CLUB.contactEmail}</p>

        <h2>Responsable de publication</h2>
        <p>Le bureau de l&rsquo;association — nom du représentant légal à compléter.</p>

        <h2>Hébergement</h2>
        <p>Vercel Inc. — hébergement mutualisé avec l&rsquo;app Hybride sur un domaine commun (00-brief-site-hybride.md, décision 1).</p>

        <h2>Responsable de traitement</h2>
        <p>
          {CLUB.name} est responsable du traitement des données collectées via ce point club, distinctement de l&rsquo;entité commerciale
          éditrice de l&rsquo;app Hybride — voir la{" "}
          <a href={`/club/${CLUB.slug}/politique-de-confidentialite`}>politique de confidentialité</a>.
        </p>
      </LegalPage>
      <ClubFooter clubSlug={CLUB.slug} clubName={CLUB.name} legalCity={CLUB.legalCity} contactEmail={CLUB.contactEmail} />
    </div>
  );
}
