import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { disciplineLabel, Tag, type Discipline } from "@/components/ui/Tag";
import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { CtaBand } from "@/components/club/CtaBand";
import { EventsAgenda } from "@/components/club/EventsAgenda";
import { PhotoStrip } from "@/components/club/PhotoStrip";
import { RitualRow } from "@/components/club/RitualRow";
import { SocialLinks } from "@/components/club/SocialLinks";
import { getAgendaEvents } from "@/lib/agenda/source";
import { CLUB } from "@/lib/config";
import { getAllRituals } from "@/lib/rituals/content";
import styles from "./page.module.css";

const ALL_DISCIPLINES = Object.keys(disciplineLabel) as Discipline[];

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== CLUB.slug) notFound();

  const events = await getAgendaEvents();
  const rituals = getAllRituals();

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} helloAssoUrl={CLUB.helloAssoUrl} />

      <div className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>{CLUB.city} · depuis 2026</p>
          <h1 className={styles.heroTitle}>
            <span>Un club</span>
            <span>pour ceux qui</span>
            <span className={styles.heroAccent}>font tout.</span>
          </h1>
          <p className={`${styles.lead} ${styles.heroLead}`}>{CLUB.tagline}</p>
          <div className={styles.heroCta}>
            <Button href="#sorties">Voir les prochaines sorties</Button>
            <Button href="#le-club" variant="line">
              Comment ça marche
            </Button>
          </div>
        </div>
        <PhotoSlot
          ratio="4/5"
          radius="card"
          bordered
          caption="photo — groupe au départ, format portrait 4:5"
          src="/photos/hero-club.jpg"
          alt="Le groupe du club Hybride Toulon au départ d'une sortie"
        />
      </div>

      <section id="la-semaine" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>La signature</p>
          <h2>On ne fait pas que courir.</h2>
          <p className={styles.lead} style={{ marginTop: "var(--hy-space-2)" }}>
            Cinq familles de sport, une seule communauté. Les rituels du lundi et du mercredi ci-dessous sont fixes ; tout le reste
            s&rsquo;organise sortie par sortie, à retrouver dans les prochaines sorties.
          </p>
        </div>
        <div className={styles.disciplinesRow}>
          {ALL_DISCIPLINES.map((code) => (
            <Tag key={code} variant={code}>
              {disciplineLabel[code]}
            </Tag>
          ))}
        </div>
      </section>

      <section id="le-club" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>Nos rendez-vous</p>
          <h2>Ce qui revient chaque semaine</h2>
          <p className={styles.lead} style={{ marginTop: "var(--hy-space-2)" }}>
            On présente les rituels, pas les dates. Le rituel donne envie de venir, la date sert à réserver sa place.
          </p>
        </div>
        <div className={styles.ritualsList}>
          {rituals.map((ritual) => (
            <RitualRow
              key={ritual.frontmatter.slug}
              href={`/club/${CLUB.slug}/rituels/${ritual.frontmatter.slug}`}
              title={ritual.frontmatter.title}
              day={ritual.frontmatter.day}
              photoSrc={ritual.frontmatter.photo ? `/photos/rituels/${ritual.frontmatter.slug}/${ritual.frontmatter.photo}` : null}
              photoAlt={ritual.frontmatter.photoAlt}
            />
          ))}
        </div>
      </section>

      <section id="sorties" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>Places limitées</p>
          <h2>Prochaines sorties</h2>
        </div>
        {events.length === 0 ? <p className={styles.note}>Aucune sortie programmée pour le moment.</p> : <EventsAgenda events={events} />}
      </section>

      <section id="nous-trouver" className={styles.section}>
        <p className={styles.eyebrow}>Le club en images</p>
        <PhotoStrip
          photos={[
            {
              caption: "photo 1",
              src: "/photos/bande-1.jpg",
              alt: "Un membre du club Hybride Toulon avec son vélo sur un circuit, au coucher du soleil",
            },
            {
              caption: "photo 2",
              src: "/photos/bande-2.jpg",
              alt: "Le groupe du club partageant des pizzas sur la plage au coucher du soleil",
            },
            {
              caption: "photo 3",
              src: "/photos/bande-3.jpg",
              alt: "Une partie de beach-volley entre membres du club au coucher du soleil",
            },
            {
              caption: "photo 4",
              src: "/photos/bande-4.jpg",
              alt: "Le groupe du club réuni autour d'un verre après une sortie",
            },
          ]}
        />
        {CLUB.stravaUrl || CLUB.instagramUrl ? (
          <div className={styles.socialRow} style={{ marginTop: "var(--hy-space-4)" }}>
            <span className={styles.note}>Suis-nous :</span>
            <SocialLinks stravaUrl={CLUB.stravaUrl} instagramUrl={CLUB.instagramUrl} />
          </div>
        ) : null}
      </section>

      <section className={styles.section}>
        <CtaBand
          title={
            <>
              Viens voir une fois.
              <br />
              Tu verras si ça te plaît.
            </>
          }
          lead="Pas d'inscription compliquée, pas d'engagement : tu viens comme tu es."
          ctaLabel="Voir les prochaines sorties"
          ctaHref="#sorties"
        />
        <p className={styles.note} style={{ marginTop: "var(--hy-space-4)" }}>
          On a aussi un groupe WhatsApp : le lien est communiqué au moment de l&rsquo;inscription à une sortie sur Luma.
        </p>
      </section>

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
