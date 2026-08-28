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
      <ClubNav clubSlug={CLUB.slug} />
      {/*
       * Informations réelles depuis le 2026-08-28 (statuts, récépissé
       * préfectoral, liste des dirigeants) — d'où provisional={false}.
       *
       * Aucune mention du Journal officiel des associations : le récépissé
       * précise que l'insertion y est facultative et que c'est lui qui fait
       * foi. Ne réintroduire cette mention que si une publication a
       * effectivement eu lieu.
       */}
      <LegalPage title="Mentions légales" updatedAt="2026-08-28" provisional={false}>
        <h2>Éditeur</h2>
        <p>
          {CLUB.name}, association régie par la loi du 1<sup>er</sup> juillet 1901.
        </p>
        <p>Siège social : {CLUB.legalAddress}.</p>
        <p>
          Déclarée à la {CLUB.declaration} — récépissé n<sup>o</sup> {CLUB.rnaNumber}.
        </p>

        <h2>Responsable de publication</h2>
        <p>{CLUB.publicationDirector}.</p>

        <h2>Contact</h2>
        <p>
          <a href={`mailto:${CLUB.contactEmail}`}>{CLUB.contactEmail}</a>
        </p>

        <h2>Hébergeur</h2>
        <p>
          Vercel Inc.
          <br />
          340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis
          <br />
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
            vercel.com
          </a>
        </p>

        <h2>Responsable de traitement</h2>
        <p>
          {CLUB.name} est responsable du traitement des données collectées via ce point club, distinctement de l&rsquo;entité commerciale
          éditrice de l&rsquo;app Hybride — voir la{" "}
          <a href={`/club/${CLUB.slug}/politique-de-confidentialite`}>politique de confidentialité</a>.
        </p>
      </LegalPage>
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
