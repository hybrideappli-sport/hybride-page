import Link from "next/link";
import { notFound } from "next/navigation";

import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { PlanningCalendar } from "@/components/club/PlanningCalendar";
import { eventsInMonth, getCurrentMonthKey, getMonthLabel, shiftMonthKey } from "@/lib/agenda/planning";
import { getAgendaEvents } from "@/lib/agenda/source";
import { CLUB } from "@/lib/config";
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

  const allEvents = await getAgendaEvents();
  const events = eventsInMonth(allEvents, monthKey);

  const prevMonthKey = shiftMonthKey(monthKey, -1);
  const nextMonthKey = shiftMonthKey(monthKey, 1);

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} helloAssoUrl={CLUB.helloAssoUrl} />

      <div className={styles.hero}>
        <p className={styles.eyebrow}>Planning</p>
        <div className={styles.monthNav}>
          <Link href={`/club/${CLUB.slug}/planning?month=${prevMonthKey}`} aria-label="Mois précédent" className={styles.monthArrow}>
            ←
          </Link>
          <h1 className={styles.title}>{getMonthLabel(monthKey)}</h1>
          <Link href={`/club/${CLUB.slug}/planning?month=${nextMonthKey}`} aria-label="Mois suivant" className={styles.monthArrow}>
            →
          </Link>
        </div>
      </div>

      <PlanningCalendar events={events} monthKey={monthKey} clubSlug={CLUB.slug} />

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
