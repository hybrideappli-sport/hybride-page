import styles from "./AboutBand.module.css";

/**
 * Deuxième respiration crème de la page (2026-08-21) — la référence visuelle
 * (docs/design/direction-visuelle-sombre.html) ne prévoyait qu'un seul moment
 * clair (CtaBand.module.css), délibérément. Écart assumé, demandé en session :
 * le noir intégral sur toute la hauteur de la page pesait plus que ce que le
 * ton des textes pouvait à lui seul corriger. Couleurs identiques à CtaBand
 * (#12232B/#4A5C64), pas une nouvelle teinte — les deux bandeaux doivent se
 * lire comme un seul langage visuel, pas deux.
 */
export function AboutBand() {
  return (
    <div className={styles.band}>
      <p className={styles.eyebrow}>Qui on est</p>
      <p className={styles.text}>
        Hybride est né de deux Toulonnais qui aiment autant le sport que la fête. Esteban encadre les séances, Ambre s&rsquo;occupe du
        reste. Ils cherchaient un club où s&rsquo;entraîner sérieusement sans se prendre au sérieux — et ne le trouvaient pas à Toulon.
        Alors ils l&rsquo;ont monté.
      </p>
    </div>
  );
}
