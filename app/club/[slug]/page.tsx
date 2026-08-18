import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { disciplineLabel, type Discipline } from "@/components/ui/Tag";
import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { CtaBand } from "@/components/club/CtaBand";
import { EventsAgenda } from "@/components/club/EventsAgenda";
import { PhotoStrip } from "@/components/club/PhotoStrip";
import { RitualsGrid } from "@/components/club/RitualsGrid";
import { WeekGrid } from "@/components/club/WeekGrid";
import { getPublishedClub, getUpcomingEvents } from "@/lib/queries/club";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

/**
 * "Semaine hybride" et "rituels récurrents" : contenu éditorial, volontairement
 * pas en base (US-02 : "on présente les rituels, pas les dates"). "Prochaines
 * sorties" en revanche vient de club.list_upcoming_events (données réelles,
 * lot L4). 5 disciplines, alignées sur club.disciplines (course/velo/eau/
 * montagne/collectif) — liste corrigée le 2026-08-17 : la précédente (4
 * activités calquées sur un schéma qui avait, à tort, écarté "rando"/montagne)
 * ne faisait pas foi, voir Tag.tsx.
 */
const WEEK = [
  { dow: "Lundi", discipline: "eau" as Discipline, disciplineLabel: disciplineLabel.eau, name: "Nage à la plage des Sablettes", when: "19:00 · 1h" },
  { dow: "Mardi", discipline: "course" as Discipline, disciplineLabel: disciplineLabel.course, name: "Fractionné piste", when: "18:45 · 8 × 400 m" },
  { dow: "Jeudi", discipline: "collectif" as Discipline, disciplineLabel: disciplineLabel.collectif, name: "Volley au parc", when: "19:00 · Parc de la Navale" },
  { dow: "Samedi", discipline: "velo" as Discipline, disciplineLabel: disciplineLabel.velo, name: "Sortie route", when: "08:30 · 60 à 90 km" },
];

const RITUALS = [
  {
    discipline: "velo" as Discipline,
    disciplineLabel: `${disciplineLabel.velo} · samedi`,
    title: "La route du samedi",
    description: "Départ groupé, deux allures, on ne laisse personne derrière. Entre 60 et 90 km selon la forme du jour, et un arrêt café obligatoire.",
    photoCaption: "photo — sortie route",
  },
  {
    discipline: "course" as Discipline,
    disciplineLabel: `${disciplineLabel.course} · mardi`,
    title: "Le fractionné du mardi",
    description: "Le seul créneau où on regarde le chrono. Séance construite, échauffement collectif, et personne ne repart sans avoir parlé à quelqu'un.",
    photoCaption: "photo — piste le soir",
  },
];

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createClient();
  const club = await getPublishedClub(supabase, slug);
  if (!club) notFound();

  const events = await getUpcomingEvents(supabase, slug);

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={club.slug} helloAssoUrl={club.hello_asso_url} />

      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{club.city} · depuis 2026</p>
          <h1 className={styles.heroTitle}>
            <span>Un club</span>
            <span>pour ceux qui</span>
            <span className={styles.heroAccent}>font tout.</span>
          </h1>
          <p className={`${styles.lead} ${styles.heroLead}`}>
            {club.tagline ?? "Course à pied, vélo, eau, montagne, collectif. Sorties gratuites, ouvertes à toutes les allures."}
          </p>
          <div className={styles.heroCta}>
            <Button href="#sorties">Voir les prochaines sorties</Button>
            <Button href="#le-club" variant="line">
              Comment ça marche
            </Button>
          </div>
        </div>
        <PhotoSlot ratio="4/5" radius="card" bordered caption="photo — groupe au départ, format portrait 4:5" />
      </div>

      <section id="la-semaine" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>La signature</p>
          <h2>Une semaine hybride</h2>
          <p className={styles.lead} style={{ marginTop: "var(--hy-space-2)" }}>
            Chaque discipline a sa couleur, chaque jour son rituel. C&rsquo;est la promesse du club en un coup d&rsquo;œil.
          </p>
        </div>
        <WeekGrid entries={WEEK} />
      </section>

      <section id="le-club" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>Nos rendez-vous</p>
          <h2>Ce qui revient chaque semaine</h2>
          <p className={styles.lead} style={{ marginTop: "var(--hy-space-2)" }}>
            On présente les rituels, pas les dates. Le rituel donne envie de venir, la date sert à réserver sa place.
          </p>
        </div>
        <RitualsGrid entries={RITUALS} />
      </section>

      <section id="sorties" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>Places limitées</p>
          <h2>Prochaines sorties</h2>
        </div>
        {events.length === 0 ? <p className={styles.note}>Aucune sortie programmée pour le moment.</p> : <EventsAgenda events={events} clubSlug={club.slug} />}
        <p className={styles.note} style={{ marginTop: "var(--hy-space-4)" }}>
          Créer un compte prend trente secondes et sert à gérer ta place. Les mineurs ont besoin d&rsquo;une autorisation parentale, demandée par e-mail à l&rsquo;inscription.
        </p>
      </section>

      <section id="nous-trouver" className={styles.section}>
        <p className={styles.eyebrow}>Le club en images</p>
        <PhotoStrip captions={["photo 1", "photo 2", "photo 3", "photo 4"]} />
      </section>

      <section className={styles.section}>
        <CtaBand
          title={
            <>
              Viens voir une fois.
              <br />
              Tu décideras après.
            </>
          }
          lead="La première sortie est libre et gratuite. L'adhésion annuelle vient ensuite, si le club te plaît."
          ctaLabel="Voir les prochaines sorties"
          ctaHref="#sorties"
        />
      </section>

      <ClubFooter clubSlug={club.slug} clubName={club.name} city={club.city} contactEmail={club.contact_email ?? null} />
    </div>
  );
}
