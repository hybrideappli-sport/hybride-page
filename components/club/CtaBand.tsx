import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./CtaBand.module.css";

export function CtaBand({ title, lead, ctaLabel, ctaHref }: { title: ReactNode; lead: string; ctaLabel: string; ctaHref: string }) {
  return (
    <div className={styles.band}>
      <h2>{title}</h2>
      <p className={styles.lead}>{lead}</p>
      <Link href={ctaHref} className={styles.btn}>
        {ctaLabel}
      </Link>
    </div>
  );
}
