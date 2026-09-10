import styles from "./CalendarReminderLink.module.css";

/**
 * Lien de téléchargement d'un rappel .ics. Partagé par le rappel hebdomadaire
 * des inscriptions (planning) et le rappel d'ouverture de la boutique — ce sont
 * les précautions ci-dessous, plus que le style, qui méritaient d'être écrites
 * une seule fois.
 *
 * BALISE <a> NATIVE, et pas <Link> ni <Button href> : la cible est un fichier,
 * pas une page. Une navigation client de Next n'a rien à y faire, et son
 * prefetch irait chercher une charge RSC qui n'existe pas.
 *
 * AUCUN ATTRIBUT `download` : le Content-Type de la route fait déjà télécharger
 * les navigateurs de bureau, et `download` n'apporterait rien sur mobile —
 * Safari iOS enregistre le .ics dans tous les cas.
 *
 * PAS DE `target="_blank"` non plus : la cible n'est pas une page à consulter,
 * l'ouvrir dans un onglet laisserait une fenêtre vide derrière le
 * téléchargement.
 */
export function CalendarReminderLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} className={styles.link}>
      {children}
    </a>
  );
}
