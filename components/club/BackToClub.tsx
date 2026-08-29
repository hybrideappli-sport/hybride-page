import Link from "next/link";

import styles from "./BackToClub.module.css";

/**
 * Retour vers l'accueil du club — extrait de la page rituel le 2026-08-29, où
 * ce lien vivait en clair, pour être posé aussi sur Le club, Planning, Shop et
 * Adhérer. Un seul endroit à corriger désormais : formulation, style et
 * destination.
 *
 * JAMAIS vers `/` : la racine est le palier aux deux portes, pas l'accueil du
 * club. « Retour au club » qui fait sortir du club serait un mensonge.
 *
 * `hash` sert au seul cas de la page rituel, qui revient sur la section d'où
 * l'on vient (la liste des rituels) plutôt qu'en haut de page. Ailleurs on vise
 * le haut : c'est le hero du club qu'on veut retrouver.
 *
 * Pas de marge extérieure ici : l'espacement appartient à la page, comme pour
 * tout composant réutilisé à des endroits qui n'ont pas la même respiration.
 * `min-height: 44px` en revanche est porté par le composant — c'est une zone
 * tactile, pas une décision de mise en page.
 */
export function BackToClub({ clubSlug, hash }: { clubSlug: string; hash?: string }) {
  return (
    <Link href={`/club/${clubSlug}${hash ? `#${hash}` : ""}`} className={styles.back}>
      ← Retour au club
    </Link>
  );
}
