import Link from "next/link";
import { notFound } from "next/navigation";

import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { PlanningCalendar } from "@/components/club/PlanningCalendar";
import { eventsInMonth, getCurrentMonthKey, getMonthLabel, shiftMonthKey } from "@/lib/agenda/planning";
import { getAgendaEvents } from "@/lib/agenda/source";
import { getAllRituals } from "@/lib/rituals/content";
import { CLUB, PLANNING_NOTICE } from "@/lib/config";
import styles from "./page.module.css";

const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

export default async function PlanningPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { slug } = await params;
  if (slug !== CLUB.slug) notFound();

  const { month } = await searchParams;
  const monthKey = month && MONTH_KEY_PATTERN.test(month) ? month : getCurrentMonthKey();

  // Message d'attente : on ne lit même pas le tableur, et les flèches de mois
  // disparaissent avec la grille — naviguer entre des mois qui afficheraient
  // tous le même message serait une affordance morte.
  const notice = PLANNING_NOTICE.trim();
  const rituals = notice ? getAllRituals() : [];

  const allEvents = notice ? [] : await getAgendaEvents();
  const events = eventsInMonth(allEvents, monthKey);

  const prevMonthKey = shiftMonthKey(monthKey, -1);
  const nextMonthKey = shiftMonthKey(monthKey, 1);

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} />

      <div className={styles.hero}>
        <p className={styles.eyebrow}>Planning</p>
        {notice ? (
          <h1 className={styles.title}>{getMonthLabel(monthKey)}</h1>
        ) : (
          <div className={styles.monthNav}>
            <Link href={`/club/${CLUB.slug}/planning?month=${prevMonthKey}`} aria-label="Mois précédent" className={styles.monthArrow}>
              ←
            </Link>
            <h1 className={styles.title}>{getMonthLabel(monthKey)}</h1>
            <Link href={`/club/${CLUB.slug}/planning?month=${nextMonthKey}`} aria-label="Mois suivant" className={styles.monthArrow}>
              →
            </Link>
          </div>
        )}
      </div>

      {notice ? (
        <section className={styles.notice}>
          <p className={styles.noticeText}>{notice}</p>
          <p className={styles.noticeLead}>En attendant, les rendez-vous fixes ne bougent pas :</p>
          <ul className={styles.noticeRituals}>
            {rituals.map((r) => (
              <li key={r.frontmatter.slug}>
                <Link href={`/club/${CLUB.slug}/rituels/${r.frontmatter.slug}`}>{r.frontmatter.title}</Link>{" "}
                <span className={styles.noticeDay}>{r.frontmatter.day}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <PlanningCalendar events={events} monthKey={monthKey} clubSlug={CLUB.slug} />
      )}

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
