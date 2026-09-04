import { notFound } from "next/navigation";

import { activityLabel, Tag } from "@/components/ui/Tag";
import { BackToClub } from "@/components/club/BackToClub";
import { RitualBody } from "@/components/club/RitualBody";
import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { CLUB } from "@/lib/config";
import { getRitualBySlug } from "@/lib/rituals/content";
import { clubMetadata } from "@/lib/seo";
import styles from "./page.module.css";


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

  const { frontmatter } = ritual;

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} />

      <BackToClub clubSlug={CLUB.slug} hash="le-club" />

      <RitualBody
        ritual={ritual}
        showSchedule
        heading={
          <>
            <Tag variant={frontmatter.activity}>{activityLabel[frontmatter.activity]}</Tag>
            <h1 className={styles.title}>{frontmatter.title}</h1>
          </>
        }
      />

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
