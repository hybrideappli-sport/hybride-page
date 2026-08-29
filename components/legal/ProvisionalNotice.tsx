import styles from "./ProvisionalNotice.module.css";

/**
 * Même motif que club.consent_documents / consent_documents côté app
 * ("*Contenu provisoire — à faire valider juridiquement avant mise en
 * production.*", 0014_health_data_processing_consent_v1_1_0.sql) : le texte
 * ci-dessous est un brouillon cohérent avec les décisions déjà actées, pas un
 * texte juridique validé.
 *
 * Plus rendu nulle part depuis le 2026-08-29 : les deux pages du club portent
 * des informations réelles (provisional={false}), et les deux pages de
 * l'entité commerciale renvoient un 404 tant que l'app n'est pas lancée. Le
 * composant est CONSERVÉ parce que `provisional` vaut `true` par défaut dans
 * LegalPage — si ces pages racine sont remises en ligne encore incomplètes, le
 * bandeau réapparaît tout seul. C'est le filet, pas du code mort.
 */
export function ProvisionalNotice() {
  return (
    <p className={styles.notice}>
      <strong>Contenu provisoire</strong> — à faire valider juridiquement avant mise en production (voir <code>docs/PRD.md</code> §8).
    </p>
  );
}
