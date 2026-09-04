import Link from "next/link";
import { notFound } from "next/navigation";

import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { RitualBody } from "@/components/club/RitualBody";
import { StickyRegisterCta } from "@/components/club/StickyRegisterCta";
import { RegistrationCta } from "@/components/ui/RegistrationCta";
import { Tag } from "@/components/ui/Tag";
import { getAgendaEvents } from "@/lib/agenda/source";
import { getMonthKey } from "@/lib/agenda/planning";
import { CLUB } from "@/lib/config";
import { formatEventDateLong, formatEventTime } from "@/lib/format";
import { findRitualForEvent } from "@/lib/rituals/content";
import { clubMetadata } from "@/lib/seo";
import styles from "./page.module.css";

/** Cible observée par la barre fixe : elle s'efface dès que le vrai bouton entre dans le champ. */
const REAL_CTA_ID = "inscription-sortie";

/**
 * Page d'une sortie — remplace la fenêtre modale du planning (2026-09-04).
 *
 * DEUX FORMES, selon qu'un rituel se trouve derrière la sortie (2026-09-11) :
 *
 * - Sortie rattachée à un rituel (piste du lundi, run chill du mercredi, soirées).
 *   L'en-tête ne porte que ce qui appartient à l'occurrence — sa date et son
 *   heure — et tout le reste de la page EST le rituel : texte complet, photos,
 *   niveau, point de rendez-vous. Pas un lien vers le rituel, son contenu.
 *   Quelqu'un qui ouvre « Run chill Mourillon du 16 septembre » comprend tout
 *   sans naviguer ailleurs. Le texte n'est pas dupliqué pour autant : les deux
 *   pages rendent le même composant RitualBody, sur le même fichier Markdown.
 *
 * - Sortie sans rituel (trail, bivouac, nage, vélo, danse fit, volley). Inchangée :
 *   ses informations pratiques venues du tableur, et la colonne `Détails` quand
 *   elle est remplie.
 *
 * Sortie introuvable = vrai 404 (not-found.tsx), jamais une page en 200 qui
 * ferait croire à un contenu existant.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string; eventSlug: string }> }) {
  const { slug, eventSlug } = await params;
  if (slug !== CLUB.slug) return {};

  const event = (await getAgendaEvents()).find((e) => e.slug === eventSlug);
  if (!event) return {};

  const title = event.title ?? event.activityLabelText;
  const parts = [
    `${formatEventDateLong(event.startsAtIso)}, ${formatEventTime(event.startsAtIso)}.`,
    `${event.activityLabelText} à ${event.location}.`,
    event.level ? `${event.level}.` : null,
  ];

  return clubMetadata({
    title: `${title} — ${CLUB.name}`,
    description: event.details ?? parts.filter(Boolean).join(" "),
    path: `/club/${CLUB.slug}/sorties/${eventSlug}`,
  });
}

export default async function EventPage({ params }: { params: Promise<{ slug: string; eventSlug: string }> }) {
  const { slug, eventSlug } = await params;
  if (slug !== CLUB.slug) notFound();

  const event = (await getAgendaEvents()).find((e) => e.slug === eventSlug);
  if (!event) notFound();

  const title = event.title ?? event.activityLabelText;
  const ritual = findRitualForEvent(event);
  const monthKey = getMonthKey(event.startsAtIso);

  const heading = (
    <>
      <Tag variant={event.activity}>{event.activityLabelText}</Tag>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.when}>
        {formatEventDateLong(event.startsAtIso)} · {formatEventTime(event.startsAtIso)}
      </p>
    </>
  );

  const registration = (
    <div className={styles.cta} id={REAL_CTA_ID}>
      <RegistrationCta opensAtIso={event.opensAtIso} lumaUrl={event.lumaUrl} startsAtIso={event.startsAtIso} />
    </div>
  );

  const details = event.details ? <p className={styles.details}>{event.details}</p> : null;

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} />

      {/* Retour au planning DU MOIS DE LA SORTIE, pas au mois courant : on revient
          là d'où l'on vient, y compris depuis un lien reçu par message. */}
      <Link href={`/club/${CLUB.slug}/planning?month=${monthKey}`} className={styles.back}>
        ← Retour au planning
      </Link>

      {ritual ? (
        <>
          {/* Le point de rendez-vous du tableur l'emporte sur celui du rituel : il est
              saisi par sortie et souvent plus précis (« Parking du Yacht club, plage
              du Mourillon » contre « Le Mourillon »). */}
          <RitualBody ritual={ritual} heading={heading} meetingPoint={event.location} photoFirstOnMobile={false} />

          {details}
          {registration}

          {/* Le lien reste, en complément et non plus comme moyen d'accès : il mène à
              la page du rituel, sans date — celle qu'on partage quand on parle du
              rendez-vous en général plutôt que d'une occurrence. */}
          <p className={styles.ritualLink}>
            <Link href={`/club/${CLUB.slug}/rituels/${ritual.frontmatter.slug}`}>
              Voir la page du rituel : {ritual.frontmatter.title} →
            </Link>
          </p>
        </>
      ) : (
        <>
          <div className={styles.hero}>{heading}</div>

          <dl className={styles.facts}>
            {[
              { label: "Durée", value: event.duration },
              { label: "Lieu", value: event.location },
              ...(event.format ? [{ label: "Format", value: event.format }] : []),
              ...(event.level ? [{ label: "Niveau", value: event.level }] : []),
            ].map((fact) => (
              <div key={fact.label} className={styles.fact}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>

          {details}
          {registration}
        </>
      )}

      <StickyRegisterCta lumaUrl={event.lumaUrl} startsAtIso={event.startsAtIso} watchId={REAL_CTA_ID} />

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
