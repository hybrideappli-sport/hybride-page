import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { LegalPage } from "@/components/legal/LegalPage";
import styles from "../(marketing)/page.module.css";

export default function MarketingPrivacyPage() {
  return (
    <div className={styles.wrap}>
      <MarketingNav />
      <LegalPage title="Politique de confidentialité" updatedAt="2026-08-14">
        <h2>Responsable de traitement</h2>
        <p>
          [Raison sociale de l&rsquo;entité commerciale] est seule responsable des données traitées par l&rsquo;app Hybride (coach IA), distincte
          de l&rsquo;association Hybride Club Toulon.
        </p>

        <h2>Compte partagé</h2>
        <p>
          L&rsquo;authentification (e-mail, mot de passe) est commune entre l&rsquo;app et le point club de Toulon — un compte créé sur l&rsquo;un
          fonctionne sur l&rsquo;autre. Les données propres à chaque usage (profil sportif côté app, inscriptions aux sorties côté club) restent
          séparées et ne sont pas partagées entre les deux responsables de traitement sans consentement dédié.
        </p>

        <h2>Vos droits</h2>
        <p>Accès, rectification, effacement, opposition : [e-mail de contact à compléter].</p>
      </LegalPage>
      <MarketingFooter />
    </div>
  );
}
