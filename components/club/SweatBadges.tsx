import styles from "./SweatBadges.module.css";

/** « Édition limitée » + « Précommande » — carte du shop et fiche du sweat. */
export function SweatBadges() {
  return (
    <ul className={styles.badges} aria-label="Statut">
      <li className={styles.limited}>Édition limitée</li>
      <li className={styles.preorder}>Précommande</li>
    </ul>
  );
}
