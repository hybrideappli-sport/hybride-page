import { notFound } from "next/navigation";

import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { LegalPage } from "@/components/legal/LegalPage";
import { CLUB } from "@/lib/config";
import { clubMetadata } from "@/lib/seo";
import styles from "../page.module.css";

export const metadata = clubMetadata({
  title: "Politique de confidentialité — Hybride Club Toulon",
  description: "Ce site ne collecte aucune donnée personnelle : ni compte, ni formulaire, ni inscription en ligne. Ce qui part chez Luma et HelloAsso, et vos droits.",
  path: "/club/toulon/politique-de-confidentialite",
});

export default async function ClubPrivacyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== CLUB.slug) notFound();

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} />
      {/* provisional={false} depuis le 2026-08-29 : le contenu est à jour — siège
          social réel, responsable de traitement, contact RGPD. Le bandeau
          « Contenu provisoire » n'avait plus lieu d'être. */}
      <LegalPage title="Politique de confidentialité" updatedAt="2026-08-29" provisional={false}>
        <h2>Responsable de traitement</h2>
        <p>
          {CLUB.name} (association régie par la loi du 1<sup>er</sup> juillet 1901), dont le siège social est situé {CLUB.legalAddress},
          est seule responsable de ce point club. Cette responsabilité est distincte de celle de l&rsquo;entité commerciale éditrice de
          l&rsquo;app Hybride, responsable de traitement séparée pour ses propres finalités.
        </p>
        <p>
          Pour toute demande relative à vos données (accès, rectification, effacement, opposition) :{" "}
          <a href={`mailto:${CLUB.contactEmail}`}>{CLUB.contactEmail}</a>.
        </p>

        <h2>Ce que ce site collecte lui-même</h2>
        <p>
          Rien. Ce site ne propose ni compte, ni formulaire, ni inscription en ligne : c&rsquo;est une vitrine et un agenda en lecture seule.
          L&rsquo;inscription aux sorties se fait sur Luma, l&rsquo;adhésion, les dons et les achats sur HelloAsso — voir ci-dessous. Aucune
          donnée d&rsquo;identité, de contact ou de paiement ne transite par ce site avant d&rsquo;arriver chez l&rsquo;un de ces deux
          prestataires.
        </p>

        <h2>Destinataires externes</h2>
        <ul>
          <li>
            <strong>Luma</strong> (inscription aux sorties) — ce site ne transmet aucune donnée à Luma : le bouton d&rsquo;inscription de chaque
            sortie est un simple lien sortant, ouvert dans un nouvel onglet. Une fois sur Luma, vos données (identité, contact) sont collectées
            et traitées directement par Luma, société américaine, selon sa propre politique de confidentialité — y compris, potentiellement, un
            hébergement hors Union européenne.
          </li>
          <li>
            <strong>HelloAsso</strong> (adhésion à l&rsquo;association, don et boutique merch) — même principe : lien sortant uniquement, vos
            données (paiement, coordonnées) sont collectées et traitées directement par HelloAsso, pour le compte de l&rsquo;association, selon
            sa propre politique de confidentialité.
          </li>
        </ul>

        <h2>Autorisation parentale</h2>
        <p>
          Pour les sorties destinées aux mineurs, l&rsquo;autorisation d&rsquo;un représentant légal est recueillie sur papier, hors ligne — pas
          sur ce site. Pour toute question sur cette procédure : {CLUB.contactEmail}.
        </p>

        <h2>Infrastructure technique</h2>
        <p>
          Le contenu de ce site (présentation du club) est intégré directement au code du site. L&rsquo;agenda des sorties provient d&rsquo;un
          tableur Google publié en lecture seule. Ni l&rsquo;un ni l&rsquo;autre ne porte de donnée personnelle d&rsquo;un visiteur, seulement
          le contenu public déjà affiché sur les pages du site.
        </p>

        <h2>Vos droits</h2>
        <p>Une question sur vos données, où qu&rsquo;elles soient traitées : {CLUB.contactEmail}.</p>
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
