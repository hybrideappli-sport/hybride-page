import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { disciplineLabel, Tag, type Discipline } from "@/components/ui/Tag";
import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { CtaBand } from "@/components/club/CtaBand";
import { EventsAgenda } from "@/components/club/EventsAgenda";
import { PhotoStrip } from "@/components/club/PhotoStrip";
import { RitualsGrid } from "@/components/club/RitualsGrid";
import { SocialLinks } from "@/components/club/SocialLinks";
import { getAgendaEvents } from "@/lib/agenda/source";
import { CLUB } from "@/lib/config";
import styles from "./page.module.css";

const ALL_DISCIPLINES = Object.keys(disciplineLabel) as Discipline[];

/**
 * "Rituels récurrents" : contenu éditorial, volontairement pas en base (US-02 :
 * "on présente les rituels, pas les dates"). Deux vrais rendez-vous à jour, lieu
 * et horaire fixes chaque semaine — communiqués en session le 2026-08-20. Tout
 * le reste (vélo, trail, volley…) existe mais s'organise au coup par coup, sans
 * créneau fixe : ce n'est pas un rituel, ça vit dans le tableur et apparaît
 * dans "Prochaines sorties" quand c'est programmé — pas ici. Une grille "Une
 * semaine hybride" à 4 jours fixes a existé ici avant cette date : supprimée,
 * elle promettait un planning qui n'existait pas (risque réel : quelqu'un se
 * déplace un jour où il n'y a personne). L'idée qu'elle portait — le club est
 * multisport — reste affichée juste en dessous, sans promettre de créneau.
 */
const RITUALS = [
  {
    discipline: "course" as Discipline,
    disciplineLabel: `${disciplineLabel.course} · lundi`,
    title: "La piste du lundi",
    description:
      "Rendez-vous à la piste Léo Lagrange, à Toulon, tous les lundis à 18h30. Séance d'athlétisme encadrée par Esteban, athlète et ancien coach d'athlétisme. Tous niveaux acceptés.",
    photoCaption: "photo — piste Léo Lagrange",
  },
  {
    discipline: "course" as Discipline,
    disciplineLabel: `${disciplineLabel.course} · mercredi`,
    title: "Le Run chill du mercredi",
    description:
      "Trois groupes d'allure : 5 min/km, 6 min 20/km et 6 min 50/km. Tout le monde est le bienvenu, dans la limite des places. Bonne ambiance et after assuré. Rendez-vous à 19h ou 19h30 selon les semaines — l'agenda ci-dessous fait foi pour l'heure exacte.",
    photoCaption: "photo — Run chill Mourillon",
  },
];

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== CLUB.slug) notFound();

  const events = await getAgendaEvents();

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} helloAssoUrl={CLUB.helloAssoUrl} />

      <div className={styles.hero}>
        <div>
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
            Cinq disciplines, une seule communauté. Les rituels du lundi et du mercredi ci-dessous sont fixes ; le reste — vélo, trail, volley
            — s&rsquo;organise sortie par sortie, à retrouver dans les prochaines sorties.
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
        <RitualsGrid entries={RITUALS} />
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
        <PhotoStrip captions={["photo 1", "photo 2", "photo 3", "photo 4"]} />
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
              Tu décideras après.
            </>
          }
          lead="La première sortie est libre et gratuite. L'adhésion annuelle vient ensuite, si le club te plaît."
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
