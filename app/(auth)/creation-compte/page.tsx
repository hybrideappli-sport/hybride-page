import { CreationCompteForm } from "./CreationCompteForm";
import styles from "./page.module.css";

/** US-03 C1. Champs collectés une seule fois, réutilisés pour toute inscription future (AC1). */
export default async function CreationComptePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Créer un compte</h1>
      <CreationCompteForm next={next} />
      <p className={styles.altLink}>
        Déjà un compte ? <a href="/connexion">Se connecter</a>
      </p>
    </div>
  );
}
