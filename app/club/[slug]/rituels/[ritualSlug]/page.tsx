import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { activityLabel, Tag, type Activity } from "@/components/ui/Tag";
import { BackToClub } from "@/components/club/BackToClub";
import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { CLUB } from "@/lib/config";
import { getRitualBySlug } from "@/lib/rituals/content";
import { clubMetadata } from "@/lib/seo";
import styles from "./page.module.css";

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
 * Titre et description déduits du frontmatter : jour, horaire, niveau et point de
 * rendez-vous. Rien à ressaisir, et la description reste juste toute seule quand
 * le Markdown est modifié depuis GitHub. C'est aussi ce qui fait apparaître
 * « Toulon » sans l'écrire à la main : le point de rendez-vous le porte déjà.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string; ritualSlug: string }> }) {
  const { slug, ritualSlug } = await params;
  if (slug !== CLUB.slug) return {};

  const ritual = getRitualBySlug(ritualSlug);
  if (!ritual) return {};

  const { title, day, time, level, meetingPoint, metaDescription } = ritual.frontmatter;
  const phrases = [`${day}, ${time}.`, level ? `${level}.` : null, meetingPoint ? `Rendez-vous : ${meetingPoint}.` : null];

  return clubMetadata({
    title: `${title} — ${CLUB.name}`,
    description: metaDescription ?? phrases.filter(Boolean).join(" "),
    path: `/club/${CLUB.slug}/rituels/${ritualSlug}`,
  });
}

export default async function RitualPage({ params }: { params: Promise<{ slug: string; ritualSlug: string }> }) {
  const { slug, ritualSlug } = await params;
  if (slug !== CLUB.slug) notFound();

  const ritual = getRitualBySlug(ritualSlug);
  if (!ritual) notFound();

  const { frontmatter, blocks } = ritual;
  const photoSrc = frontmatter.photo ? `/photos/${frontmatter.photo}` : undefined;

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} />

      <BackToClub clubSlug={CLUB.slug} hash="le-club" />

      <div className={styles.hero}>
        <div className={styles.heroText}>
          <Tag variant={frontmatter.activity}>{activityLabel[frontmatter.activity]}</Tag>
          <h1 className={styles.title}>{frontmatter.title}</h1>
          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>Jour</dt>
              <dd>{frontmatter.day}</dd>
            </div>
            <div className={styles.fact}>
              <dt>Horaire</dt>
              <dd>{frontmatter.time}</dd>
            </div>
            <div className={styles.fact}>
              <dt>Niveau</dt>
              <dd>{frontmatter.level}</dd>
            </div>
            {frontmatter.capacity ? (
              <div className={styles.fact}>
                <dt>Places</dt>
                <dd>{frontmatter.capacity}</dd>
              </div>
            ) : null}
            <div className={styles.fact}>
              <dt>Rendez-vous</dt>
              <dd>{frontmatter.meetingPoint}</dd>
            </div>
            {frontmatter.coach ? (
              <div className={styles.fact}>
                <dt>Encadrement</dt>
                <dd>{frontmatter.coach}</dd>
              </div>
            ) : null}
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
