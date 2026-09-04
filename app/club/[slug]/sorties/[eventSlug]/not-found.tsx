import Link from "next/link";

import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { CLUB } from "@/lib/config";
import { getAllRituals } from "@/lib/rituals/content";
import styles from "./not-found.module.css";

/**
 * Sortie introuvable — une ligne retirée du tableur, ou passée au statut
 * « brouillon ».
 *
 * Rendue par `notFound()`, donc AVEC un vrai code 404 : une page en 200 qui
 * dirait « introuvable » mentirait aux moteurs, qui garderaient l'adresse
 * indexée.
 *
 * Mais jamais une impasse (2026-09-04) : ces adresses circulent dans des
 * conversations pendant des mois, et quelqu'un qui remonte un fil en février
 * doit atterrir sur ce qui existe aujourd'hui — le planning et les rituels —
 * pas sur un mur. C'est aussi pour ça qu'on ne supprime pas les lignes passées
 * du tableur : cette page est le filet, pas le fonctionnement normal.
 */
export default function EventNotFound() {
  const rituals = getAllRituals();

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} />

      <div className={styles.body}>
        <p className={styles.eyebrow}>Sortie introuvable</p>
        <h1 className={styles.title}>Cette sortie n&rsquo;est plus au programme.</h1>
        <p className={styles.lead}>
          Elle a peut-être eu lieu, ou elle a été retirée depuis que ce lien a été partagé. Le reste du programme, lui, n&rsquo;a pas bougé.
        </p>

        <Link href={`/club/${CLUB.slug}/planning`} className={styles.primary}>
          Voir le planning du mois →
        </Link>

        <p className={styles.ritualsLead}>Et les rendez-vous qui reviennent chaque semaine :</p>
        <ul className={styles.rituals}>
          {rituals.map((r) => (
            <li key={r.frontmatter.slug}>
              <Link href={`/club/${CLUB.slug}/rituels/${r.frontmatter.slug}`}>{r.frontmatter.title}</Link>{" "}
              <span className={styles.day}>{r.frontmatter.day}</span>
            </li>
          ))}
        </ul>
      </div>

      <ClubFooter
        clubSlug={CLUB.slug}
        clubName={CLUB.name}
        legalCity={CLUB.legalCity}
        contactEmail={CLUB.contactEmail}
        stravaUrl={CLUB.stravaUrl}
        instagramUrl={CLUB.instagramUrl}
      />
    </div>
  );
}
