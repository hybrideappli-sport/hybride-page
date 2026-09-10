import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { activityLabel, Tag, type Activity } from "@/components/ui/Tag";
import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { CtaBand } from "@/components/club/CtaBand";
import { PartnerList } from "@/components/club/PartnerList";
import { RitualRow } from "@/components/club/RitualRow";
import { PARTNERS } from "@/lib/club/partners";
import { CLUB } from "@/lib/config";
import { getAllRituals } from "@/lib/rituals/content";
import { clubMetadata } from "@/lib/seo";
import styles from "./page.module.css";

const ALL_ACTIVITIES = Object.keys(activityLabel) as Activity[];

export const metadata = clubMetadata({
  title: "Hybride Club Toulon — club de running et multisport",
  description: "Club de sport à Toulon : piste le lundi, run chill le mercredi, trail, vélo, nage en eau libre. Toutes les allures. Première séance découverte, puis 1 € pour l'année.",
  path: "/club/toulon",
});

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== CLUB.slug) notFound();

  const rituals = getAllRituals();

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} />

      <div className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>{CLUB.city} · depuis 2026</p>
          <h1 className={styles.heroTitle}>
            <span>On vient pour le sport.</span>
            <span className={styles.heroAccent}>On reste pour l&rsquo;ambiance.</span>
          </h1>
          <div className={styles.heroDisciplines}>
            {ALL_ACTIVITIES.map((code) => (
              <Tag key={code} variant={code}>
                {activityLabel[code]}
              </Tag>
            ))}
          </div>
          <p className={`${styles.lead} ${styles.heroLead}`}>
            Toutes les allures, tous les niveaux — et un after à chaque fois, au bar ou sur la plage.
          </p>
          <div className={styles.heroCta}>
            <Button href={`/club/${CLUB.slug}/planning`}>Voir le planning</Button>
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

      <section id="le-club" className={styles.section}>
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>Nos rendez-vous</p>
          <h2>Ce qui revient chaque semaine</h2>
        </div>
        <div className={styles.ritualsList}>
          {rituals.map((ritual) => (
            <RitualRow
              key={ritual.frontmatter.slug}
              href={`/club/${CLUB.slug}/rituels/${ritual.frontmatter.slug}`}
              title={ritual.frontmatter.title}
              day={ritual.frontmatter.day}
              activity={ritual.frontmatter.activity}
              photoSrc={ritual.frontmatter.photo ? `/photos/${ritual.frontmatter.photo}` : null}
              photoAlt={ritual.frontmatter.photoAlt}
            />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <CtaBand
          title={
            <>
              La première fois, tu ne connais personne.
              <br />
              La deuxième, si.
            </>
          }
          lead="La première séance est une découverte : tu viens, tu suis le groupe à ton rythme, et tu restes boire un coup si tu veux. Ensuite, l’adhésion est de 1 € pour l’année."
          ctaLabel="Voir les prochaines sorties"
          ctaHref={`/club/${CLUB.slug}/planning`}
        />
      </section>

      {/*
       * Dernière section avant le pied de page, et c'est délibéré : ces
       * avantages s'adressent aux adhérents déjà là, pas aux visiteurs qui
       * découvrent le club. Placée plus haut — au-dessus du bandeau crème, par
       * exemple — elle se lirait comme un argument de l'adhésion, alors que
       * l'argument de l'adhésion est l'assurance, et lui seul. Pour la même
       * raison, aucun lien vers /adherer ici.
       *
       * Seul endroit du site où les partenaires sont listés (arbitrage du
       * 2026-09-10 : la section avait d'abord été posée sur /le-club, elle en a
       * été retirée pour ne pas afficher deux fois le même bloc). Ajouter un
       * partenaire = une entrée dans lib/club/partners.ts, rien d'autre.
       */}
      {PARTNERS.length > 0 ? (
        <section className={styles.partners}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>Nos partenaires</p>
            <h2>Des lieux qui font un geste</h2>
          </div>
          <PartnerList partners={PARTNERS} />
          {PARTNERS.some((partner) => partner.url) ? (
            <p className={styles.outboundNote}>↗ Les fiches partenaires ouvrent un autre site, dans un nouvel onglet.</p>
          ) : null}
        </section>
      ) : null}

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
