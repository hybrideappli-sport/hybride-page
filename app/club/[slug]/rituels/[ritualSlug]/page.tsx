import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { disciplineLabel, Tag } from "@/components/ui/Tag";
import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { CLUB } from "@/lib/config";
import { getRitualBySlug } from "@/lib/rituals/content";
import styles from "./page.module.css";

export default async function RitualPage({ params }: { params: Promise<{ slug: string; ritualSlug: string }> }) {
  const { slug, ritualSlug } = await params;
  if (slug !== CLUB.slug) notFound();

  const ritual = getRitualBySlug(ritualSlug);
  if (!ritual) notFound();

  const { frontmatter, blocks } = ritual;
  const photoSrc = frontmatter.photo ? `/photos/rituels/${frontmatter.slug}/${frontmatter.photo}` : undefined;

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} helloAssoUrl={CLUB.helloAssoUrl} />

      <Link href={`/club/${CLUB.slug}#le-club`} className={styles.back}>
        ← Retour au club
      </Link>

      <div className={styles.hero}>
        <div className={styles.heroText}>
          <Tag variant={frontmatter.discipline}>{disciplineLabel[frontmatter.discipline]}</Tag>
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
        <PhotoSlot
          ratio="4/5"
          radius="card"
          bordered
          caption="photo — à venir"
          src={photoSrc}
          alt={frontmatter.photoAlt}
        />
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
                <PhotoSlot ratio="1/1" radius="card" src={`/photos/rituels/${frontmatter.slug}/${block.src}`} alt={block.alt} />
              </div>
            );
          }
          return (
            <p key={i} className={styles.paragraph}>
              {block.text}
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
