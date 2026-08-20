import Link from "next/link";

import { SocialLinks } from "@/components/club/SocialLinks";
import styles from "./ClubFooter.module.css";

/**
 * US-07 : mentions légales et politique de confidentialité de l'ASSOCIATION,
 * distinctes de celles de l'entité commerciale (app, sur /). Aucun bloc de
 * promotion de l'app ici — décision actée au brief (deux responsables de
 * traitement distincts, pas de fuite de finalité vers la prospection app).
 */
export function ClubFooter({
  clubSlug,
  clubName,
  legalCity,
  contactEmail,
  stravaUrl,
  instagramUrl,
}: {
  clubSlug: string;
  clubName: string;
  /** Commune de domiciliation légale (siège social) — PAS la ville d'activité du club (CLUB.city). */
  legalCity: string;
  contactEmail: string | null;
  stravaUrl?: string;
  instagramUrl?: string;
}) {
  return (
    <footer className={styles.footer}>
      <p>
        <strong>{clubName}</strong> — association loi 1901, {legalCity}.
      </p>
      <SocialLinks stravaUrl={stravaUrl} instagramUrl={instagramUrl} />
      <p>
        <Link href={`/club/${clubSlug}/mentions-legales`}>Mentions légales</Link> ·{" "}
        <Link href={`/club/${clubSlug}/politique-de-confidentialite`}>Politique de confidentialité</Link> · Déclaration au JOAFE
        {contactEmail ? (
          <>
            {" "}
            · <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </>
        ) : null}
      </p>
    </footer>
  );
}
