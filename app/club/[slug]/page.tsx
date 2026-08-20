import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { disciplineLabel, Tag, type Discipline } from "@/components/ui/Tag";
import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { CtaBand } from "@/components/club/CtaBand";
import { PhotoStrip } from "@/components/club/PhotoStrip";
import { RitualRow } from "@/components/club/RitualRow";
import { SocialLinks } from "@/components/club/SocialLinks";
import { CLUB } from "@/lib/config";
import { getAllRituals } from "@/lib/rituals/content";
import styles from "./page.module.css";

const ALL_DISCIPLINES = Object.keys(disciplineLabel) as Discipline[];

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== CLUB.slug) notFound();

  const rituals = getAllRituals();

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} helloAssoUrl={CLUB.helloAssoUrl} />

      <div className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>{CLUB.city} · depuis 2026</p>
          <h1 className={styles.heroTitle}>
            <span>On vient pour le sport.</span>
            <span className={styles.heroAccent}>On reste pour les gens.</span>
          </h1>
          <div className={styles.heroDisciplines}>
            {ALL_DISCIPLINES.map((code) => (
              <Tag key={code} variant={code}>
                {disciplineLabel[code]}
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

      <section className={styles.section}>
        <p className={styles.eyebrow}>Le club</p>
        <div className={styles.about}>
          <p>Un club multisport, à Toulon.</p>
          <p>
            Course à pied, trail, rando, sorties vélo, bivouac, tournois de volley. On ne s&rsquo;enferme pas dans une discipline : on
            fait ce dont on a envie, quand on en a envie.
          </p>
          <p>
            Deux rendez-vous sont fixes — la piste du lundi et le run du mercredi. Tout le reste sort du groupe : quelqu&rsquo;un
            propose une sortie, trois personnes disent oui, et c&rsquo;est parti. Il se passe quelque chose presque tous les jours.
          </p>
          <p>Ce qu&rsquo;on cherche ici, c&rsquo;est simple : bien s&rsquo;entourer.</p>
          <p>
            Et c&rsquo;est gratuit. Toutes les sorties, sans exception. Ce n&rsquo;est pas une offre de lancement, c&rsquo;est comme ça
            qu&rsquo;on veut que le club fonctionne.
          </p>
        </div>
      </section>

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
              photoSrc={ritual.frontmatter.photo ? `/photos/${ritual.frontmatter.photo}` : null}
              photoAlt={ritual.frontmatter.photoAlt}
            />
          ))}
        </div>
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
              La première fois, tu ne connais personne.
              <br />
              La deuxième, si.
            </>
          }
          lead="Toutes nos sorties sont ouvertes. Tu viens, tu cours à ton rythme, et tu restes boire un coup si tu veux."
          ctaLabel="Voir les prochaines sorties"
          ctaHref={`/club/${CLUB.slug}/planning`}
        />
        <p className={styles.note} style={{ marginTop: "var(--hy-space-4)" }}>
          Le groupe WhatsApp, c&rsquo;est là que s&rsquo;organisent les afters et tout ce qui ne rentre pas dans le programme. Le lien
          arrive à l&rsquo;inscription sur Luma.
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
