import type { ReactNode } from "react";

import { ProvisionalNotice } from "./ProvisionalNotice";
import styles from "./LegalPage.module.css";

export function LegalPage({ title, updatedAt, children }: { title: string; updatedAt: string; children: ReactNode }) {
  return (
    <div className={styles.wrap}>
      <h1>{title}</h1>
      <p className={styles.updatedAt}>Dernière mise à jour : {updatedAt}</p>
      <ProvisionalNotice />
      <div className={styles.body}>{children}</div>
    </div>
  );
}
