import Link from "next/link";
import { notFound } from "next/navigation";

import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { PlanningCalendar } from "@/components/club/PlanningCalendar";
import { PlanningCountdown } from "@/components/club/PlanningCountdown";
import { deadlineHasPassed, eventsInMonth, getCurrentMonthKey, getDefaultMonthKey, getMonthLabel, shiftMonthKey } from "@/lib/agenda/planning";
import { getAgendaEvents } from "@/lib/agenda/source";
import { getAllRituals } from "@/lib/rituals/content";
import { CLUB, PLANNING_COUNTDOWN_TEXT, PLANNING_COUNTDOWN_TO, PLANNING_NOTICE } from "@/lib/config";
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

  // Message figé (filet de secours) : prioritaire sur le compte à rebours, et
  // seul cas où l'on ne lit même pas le tableur.
  const notice = PLANNING_NOTICE.trim();
  const countdownTo = notice ? "" : PLANNING_COUNTDOWN_TO.trim();

  // Décompte en cours : le tableur est lu QUAND MÊME et la grille construite
  // quand même. C'est ce qui permet au client de basculer à l'échéance sans
  // rechargement ni redéploiement — voir PlanningCountdown.tsx.
  const allEvents = notice ? [] : await getAgendaEvents();

  const monthKey = month && MONTH_KEY_PATTERN.test(month) ? month : notice ? getCurrentMonthKey() : getDefaultMonthKey(allEvents);
  const events = eventsInMonth(allEvents, monthKey);

  const showRituals = Boolean(notice) || Boolean(countdownTo);
  const rituals = showRituals ? getAllRituals() : [];

  const prevMonthKey = shiftMonthKey(monthKey, -1);
  const nextMonthKey = shiftMonthKey(monthKey, 1);

  // Verdict de l'horloge serveur : valeur de DÉPART uniquement (évite un
  // clignotement du décompte une fois l'échéance passée). Le client la
  // recalcule au montage et corrige si la page sortait d'un cache.
  const initiallyOpen = deadlineHasPassed(countdownTo);

  // Titre seul pendant l'attente : les flèches de mois disparaissent avec la
  // grille — naviguer entre des mois qui afficheraient tous la même chose
  // serait une affordance morte.
  const plainHeading = (
    <div className={styles.hero}>
      <p className={styles.eyebrow}>Planning</p>
      <h1 className={styles.title}>{getMonthLabel(monthKey)}</h1>
    </div>
  );

  const calendar = (
    <>
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
    </>
  );

  const ritualsBlock = (
    <>
      <p className={styles.noticeLead}>En attendant, les rendez-vous fixes ne bougent pas :</p>
      <ul className={styles.noticeRituals}>
        {rituals.map((r) => (
          <li key={r.frontmatter.slug}>
            <Link href={`/club/${CLUB.slug}/rituels/${r.frontmatter.slug}`}>{r.frontmatter.title}</Link>{" "}
            <span className={styles.noticeDay}>{r.frontmatter.day}</span>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} />

      {notice ? (
        <>
          {plainHeading}
          <section className={styles.notice}>
            <p className={styles.noticeText}>{notice}</p>
            {ritualsBlock}
          </section>
        </>
      ) : countdownTo ? (
        <PlanningCountdown
          targetIso={countdownTo}
          text={PLANNING_COUNTDOWN_TEXT}
          initiallyOpen={initiallyOpen}
          heading={plainHeading}
          waiting={ritualsBlock}
          calendar={calendar}
        />
      ) : (
        calendar
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
