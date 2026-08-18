import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { LegalPage } from "@/components/legal/LegalPage";
import styles from "../(marketing)/page.module.css";

export default function MarketingMentionsLegalesPage() {
  return (
    <div className={styles.wrap}>
      <MarketingNav />
      <LegalPage title="Mentions légales" updatedAt="2026-08-14">
        <h2>Éditeur</h2>
        <p>[Raison sociale de l&rsquo;entité commerciale] — [forme juridique], [SIRET à compléter], siège social [adresse à compléter].</p>
        <p>Contact : [e-mail de contact à compléter]</p>

        <h2>Directeur de la publication</h2>
        <p>[Nom à compléter]</p>

        <h2>Hébergement</h2>
        <p>Vercel Inc. — hébergement mutualisé avec le point club de Toulon sur un domaine commun (00-brief-site-hybride.md, décision 1).</p>

        <h2>Responsable de traitement</h2>
        <p>
          [Raison sociale] est responsable du traitement des données liées à l&rsquo;app Hybride, distinctement de l&rsquo;association Hybride
          Club Toulon — voir la <a href="/politique-de-confidentialite">politique de confidentialité</a>.
        </p>
      </LegalPage>
      <MarketingFooter />
    </div>
  );
}
