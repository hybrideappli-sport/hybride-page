import Link from "next/link";

import { Button } from "@/components/ui/Button";
import styles from "./ClubNav.module.css";

export function ClubNav({ clubSlug, helloAssoUrl }: { clubSlug: string; helloAssoUrl: string | null }) {
  return (
    <nav className={styles.nav}>
      <Link href={`/club/${clubSlug}`} className={styles.brand}>
        Hybride
      </Link>
      <a className={styles.link} href="#le-club">
        Le club
      </a>
      <a className={styles.link} href="#la-semaine">
        La semaine
      </a>
      <a className={styles.link} href="#sorties">
        Inscription
      </a>
      <Link className={styles.link} href={`/club/${clubSlug}/shop`}>
        Shop
      </Link>
      <a className={styles.link} href="#nous-trouver">
        Nous trouver
      </a>
      {helloAssoUrl ? (
        <Button href={helloAssoUrl} size="mini" target="_blank" rel="noopener noreferrer">
          Rejoindre
        </Button>
      ) : null}
    </nav>
  );
}
