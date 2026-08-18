import styles from "./ProvisionalNotice.module.css";

/**
 * Même motif que club.consent_documents / consent_documents côté app
 * ("*Contenu provisoire — à faire valider juridiquement avant mise en
 * production.*", 0014_health_data_processing_consent_v1_1_0.sql) : le texte
 * ci-dessous est un brouillon cohérent avec les décisions déjà actées
 * (00-brief-site-hybride.md), pas un texte juridique validé.
 */
export function ProvisionalNotice() {
  return (
    <p className={styles.notice}>
      <strong>Contenu provisoire</strong> — à faire valider juridiquement avant mise en production (voir <code>docs/PRD.md</code> §8).
    </p>
  );
}
