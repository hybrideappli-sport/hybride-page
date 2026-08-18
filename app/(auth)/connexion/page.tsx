import { ConnexionForm } from "./ConnexionForm";
import styles from "../creation-compte/page.module.css";

/** US-03 C2 — écran unique public + admin. */
export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Se connecter</h1>
      <ConnexionForm next={next} />
      <p className={styles.altLink}>
        Pas encore de compte ? <a href={next ? `/creation-compte?next=${encodeURIComponent(next)}` : "/creation-compte"}>Créer un compte</a>
      </p>
    </div>
  );
}
