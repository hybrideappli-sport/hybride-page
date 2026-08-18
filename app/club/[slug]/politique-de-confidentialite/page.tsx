import { notFound } from "next/navigation";

import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { LegalPage } from "@/components/legal/LegalPage";
import styles from "../page.module.css";

const CLUB = {
  slug: "toulon",
  name: "Hybride Club Toulon",
  city: "La Seyne-sur-Mer",
  contactEmail: "contact@hybride-club.fr",
  helloAssoUrl: "https://www.helloasso.com/associations/hybride-club-toulon",
};

export default async function ClubPrivacyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== CLUB.slug) notFound();

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} helloAssoUrl={CLUB.helloAssoUrl} />
      <LegalPage title="Politique de confidentialité" updatedAt="2026-08-17">
        <h2>Responsable de traitement</h2>
        <p>
          {CLUB.name} (association loi 1901) est seule responsable des données collectées sur ce point club — inscription aux sorties, compte
          utilisateur, autorisation parentale. Ces données sont distinctes de celles traitées par l&rsquo;entité commerciale éditrice de l&rsquo;app
          Hybride, responsable de traitement séparée pour ses propres finalités.
        </p>

        <h2>Données collectées</h2>
        <ul>
          <li>À l&rsquo;inscription : prénom, nom, date de naissance, e-mail.</li>
          <li>Pour un inscrit mineur : e-mail du représentant légal, preuve horodatée de l&rsquo;autorisation parentale (décision de l&rsquo;autorisation, adresse IP hachée, navigateur).</li>
          <li>Historique des inscriptions (activité, date, statut) — nécessaire à la gestion des places et de la liste d&rsquo;attente.</li>
        </ul>

        <h2>Base légale</h2>
        <p>
          Consentement au traitement, recueilli à l&rsquo;inscription — donné directement par la personne dès 15 ans, ou par son représentant légal
          en deçà. L&rsquo;autorisation parentale de pratique sportive est un consentement distinct, requis jusqu&rsquo;à 18 ans indépendamment du
          RGPD.
        </p>

        <h2>Durée de conservation</h2>
        <p>3 ans après la dernière participation confirmée à une sortie, purge automatique au-delà (durée proposée, en attente de validation juridique).</p>

        <h2>Partage des données — aucune fuite vers la prospection commerciale</h2>
        <p>
          Aucune donnée d&rsquo;inscription à une sortie du club n&rsquo;est transmise ni réutilisée par l&rsquo;entité commerciale de l&rsquo;app
          Hybride à des fins de prospection ou de marketing, sans un consentement explicite et distinct, jamais coché par défaut. Les deux
          responsables de traitement utilisent une infrastructure technique commune (authentification), mais des schémas de données et des
          registres de consentement séparés.
        </p>

        <h2>Sous-traitants</h2>
        <ul>
          <li>
            <strong>Supabase</strong> (hébergement de la base de données et authentification) — Union européenne (Irlande).
          </li>
          <li>
            <strong>Resend</strong> (envoi des e-mails transactionnels du club : confirmation d&rsquo;inscription, autorisation parentale,
            annulation) — envoi depuis l&rsquo;Union européenne (Irlande), mais les données de compte et les journaux d&rsquo;envoi de ce
            prestataire sont hébergés aux États-Unis. Ce transfert hors UE est propre au club ; l&rsquo;entité commerciale éditrice de l&rsquo;app
            Hybride utilise un prestataire d&rsquo;e-mail distinct pour ses propres besoins.
          </li>
          <li>
            <strong>Supabase Auth / Brevo</strong> (e-mails de création de compte et de réinitialisation de mot de passe uniquement) — réglage
            technique partagé avec l&rsquo;app pour l&rsquo;infrastructure d&rsquo;authentification commune.
          </li>
          <li>
            <strong>HelloAsso</strong> (adhésion à l&rsquo;association et boutique merch) — ce site ne transmet aucune donnée à HelloAsso : les
            liens « Rejoindre » et « Voir sur la boutique » sont de simples liens sortants, ouverts dans un nouvel onglet. Une fois sur
            HelloAsso, vos données (paiement, coordonnées) sont collectées et traitées directement par HelloAsso, pour le compte de
            l&rsquo;association, selon sa propre politique de confidentialité.
          </li>
        </ul>

        <h2>Vos droits</h2>
        <p>Accès, rectification, effacement, opposition : {CLUB.contactEmail}.</p>
      </LegalPage>
      <ClubFooter clubSlug={CLUB.slug} clubName={CLUB.name} city={CLUB.city} contactEmail={CLUB.contactEmail} />
    </div>
  );
}
