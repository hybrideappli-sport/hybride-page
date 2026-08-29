import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { COMMERCIAL_LEGAL_PAGES_PUBLISHED } from "@/lib/config";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { LegalPage } from "@/components/legal/LegalPage";
import styles from "../(marketing)/page.module.css";

/**
 * Retirée de la navigation et désindexée le 2026-08-28, tant que l'app n'est
 * pas lancée : cette page est publique et décrit une entité dont tous les
 * champs sont encore entre crochets. Une page absente vaut mieux qu'une page à
 * crochets.
 *
 * `noindex` via les métadonnées et NON un Disallow dans robots.txt : un
 * robots.txt empêche l'exploration, donc le moteur ne verrait jamais la
 * directive noindex — et pourrait indexer l'URL quand même si un lien externe
 * y mène. La balise est le seul outil qui retire vraiment des résultats.
 *
 * À rétablir au lancement de l'app : supprimer ce bloc `metadata` et remettre
 * les deux liens dans le pied de page de app/(marketing)/page.tsx.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function MarketingPrivacyPage() {
  // Voir COMMERCIAL_LEGAL_PAGES_PUBLISHED : page non servie tant que l'app n'est
  // pas lancée, fichier conservé pour la remise en ligne.
  if (!COMMERCIAL_LEGAL_PAGES_PUBLISHED) notFound();

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
