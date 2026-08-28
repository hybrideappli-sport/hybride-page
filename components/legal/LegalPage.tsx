import type { ReactNode } from "react";

import { ProvisionalNotice } from "./ProvisionalNotice";
import styles from "./LegalPage.module.css";

/**
 * `provisional` par défaut à true : une page légale est provisoire tant que
 * personne n'a dit le contraire, jamais l'inverse — oublier de POSER le bandeau
 * ferait passer un brouillon pour un texte validé, oublier de le retirer ne
 * fait qu'un avertissement de trop.
 *
 * Passée à false le 2026-08-28 sur les seules mentions légales du club, dont
 * les informations viennent des statuts, du récépissé préfectoral et de la
 * liste des dirigeants. Les pages de l'entité commerciale (`/mentions-legales`,
 * `/politique-de-confidentialite`) restent provisoires, leurs champs étant
 * encore entre crochets.
 */
export function LegalPage({
  title,
  updatedAt,
  provisional = true,
  children,
}: {
  title: string;
  updatedAt: string;
  provisional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={styles.wrap}>
      <h1>{title}</h1>
      <p className={styles.updatedAt}>Dernière mise à jour : {updatedAt}</p>
      {provisional ? <ProvisionalNotice /> : null}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
