import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { activityLabel, type Activity } from "@/components/ui/Tag";
import type { RitualContent } from "@/lib/rituals/content";
import styles from "./RitualBody.module.css";

/** `social-run` porte un tiret, illégal comme nom de classe de module CSS. */
const ACTIVITY_CLASS: Record<Activity, string> = {
  piste: "piste",
  "social-run": "socialRun",
  trail: "trail",
  velo: "velo",
  nage: "nage",
  bivouac: "bivouac",
  soirees: "soirees",
  communautaire: "communautaire",
};

/**
 * Le contenu d'un rituel : photo, informations pratiques, lien carte et texte
 * complet.
 *
 * Extrait de la page rituel le 2026-09-11, parce que la page d'une SORTIE
 * rattachée à un rituel affiche désormais ce contenu en entier plutôt qu'un lien
 * vers lui — quelqu'un qui ouvre « Run chill Mourillon du 16 septembre » doit
 * tout comprendre sans naviguer ailleurs. Le texte n'existe donc qu'à un seul
 * endroit dans le code, comme il n'existe qu'à un seul endroit dans le contenu
 * (content/rituels/*.md).
 *
 * Ce qui distingue les deux pages est passé en props, pas dupliqué :
 * - `heading` : le titre et ce qui l'accompagne. Sur la page du rituel, le nom du
 *   rituel ; sur une page de sortie, le nom de la sortie avec sa date et son heure.
 * - `showSchedule` : jour et horaire du rituel. Affichés sur la page du rituel,
 *   omis sur une page de sortie — l'en-tête y porte déjà la date et l'heure de
 *   l'occurrence, qui font foi.
 * - `photoFirstOnMobile` : sur la page du rituel, la photo passe avant le texte en
 *   colonne unique (même composition que la page club). Sur une page de sortie
 *   c'est l'inverse : la date de l'occurrence doit être la première chose lue,
 *   pas une image qui la repousse sous le pli.
 * - `meetingPoint` : le point de rendez-vous de l'occurrence, souvent plus précis
 *   que celui du rituel (« Parking du Yacht club, plage du Mourillon » contre
 *   « Le Mourillon »). Absent, on retombe sur celui du rituel.
 */
export function RitualBody({
  ritual,
  heading,
  showSchedule = false,
  photoFirstOnMobile = true,
  meetingPoint,
}: {
  ritual: RitualContent;
  heading: ReactNode;
  showSchedule?: boolean;
  photoFirstOnMobile?: boolean;
  meetingPoint?: string;
}) {
  const { frontmatter, blocks } = ritual;
  const photoSrc = frontmatter.photo ? `/photos/${frontmatter.photo}` : undefined;

  const facts: { label: string; value: string }[] = [];
  if (showSchedule) {
    facts.push({ label: "Jour", value: frontmatter.day });
    facts.push({ label: "Horaire", value: frontmatter.time });
  }
  facts.push({ label: "Niveau", value: frontmatter.level });
  if (frontmatter.capacity) facts.push({ label: "Places", value: frontmatter.capacity });
  facts.push({ label: "Rendez-vous", value: meetingPoint ?? frontmatter.meetingPoint });
  if (frontmatter.coach) facts.push({ label: "Encadrement", value: frontmatter.coach });

  return (
    <>
      <div className={`${styles.hero} ${photoFirstOnMobile ? "" : styles.heroTextFirst}`}>
        <div className={styles.heroText}>
          {heading}

          <dl className={styles.facts}>
            {facts.map((fact) => (
              <div key={fact.label} className={styles.fact}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>

          {frontmatter.mapsUrl ? (
            <Button href={frontmatter.mapsUrl} variant="line" size="mini" target="_blank" rel="noopener noreferrer">
              Voir le point de départ sur la carte ↗
            </Button>
          ) : null}
        </div>

        {/* Sans photo : carte typographique aux couleurs de l'activité, jamais un
            cadre gris « photo à venir » — qui se lirait comme une image cassée
            plutôt que comme un choix (2026-08-28, soirées Hybride). */}
        {photoSrc ? (
          <PhotoSlot ratio="4/5" radius="card" bordered src={photoSrc} alt={frontmatter.photoAlt} />
        ) : (
          <div className={`${styles.typoCard} ${styles[ACTIVITY_CLASS[frontmatter.activity]]}`} aria-hidden="true">
            <span className={styles.typoCardLabel}>{activityLabel[frontmatter.activity]}</span>
            <span className={styles.typoCardTitle}>{frontmatter.title}</span>
            <span className={styles.typoCardDay}>{frontmatter.day}</span>
          </div>
        )}
      </div>

      <div className={styles.body}>
        {blocks.map((block, i) => {
          if (block.type === "heading") {
            return (
              <h2 key={i} className={styles.blockHeading}>
                {block.text}
              </h2>
            );
          }
          if (block.type === "image") {
            return (
              <div key={i} className={styles.galleryPhoto}>
                <PhotoSlot ratio="1/1" radius="card" src={`/photos/${block.src}`} alt={block.alt} />
              </div>
            );
          }
          return (
            <p key={i} className={styles.paragraph}>
              {block.parts.map((part, j) =>
                typeof part === "string" ? (
                  part
                ) : (
                  <Link key={j} href={part.href} className={styles.inlineLink}>
                    {part.text}
                  </Link>
                ),
              )}
            </p>
          );
        })}
      </div>
    </>
  );
}
