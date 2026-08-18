import type { ReactNode } from "react";

import styles from "./Tag.module.css";

/**
 * Liste fermée à 5 valeurs, alignée sur club.disciplines (supabase/migrations/
 * 20260812093100_club_core_tables.sql, source de vérité côté schéma). Distincte
 * du FORMAT (trail, piste, longe-côte, bivouac, volley…) : étiquette secondaire
 * descriptive, non colorée, non filtrable, non modélisée en base — rendue via
 * `variant="format"`. Un événement porte une ou plusieurs disciplines
 * (club.event_disciplines) : plusieurs `<Tag>` par événement, pas un seul.
 */
export type Discipline = "course" | "velo" | "eau" | "montagne" | "collectif";
export type TagVariant = Discipline | "format";

export const disciplineLabel: Record<Discipline, string> = {
  course: "Course à pied",
  velo: "Vélo",
  eau: "Eau",
  montagne: "Montagne",
  collectif: "Collectif",
};

const variantClass: Record<TagVariant, string> = {
  course: styles.course,
  velo: styles.velo,
  eau: styles.eau,
  montagne: styles.montagne,
  collectif: styles.collectif,
  format: styles.format,
};

export function Tag({ variant, children }: { variant: TagVariant; children: ReactNode }) {
  return <span className={`${styles.tag} ${variantClass[variant]}`}>{children}</span>;
}
