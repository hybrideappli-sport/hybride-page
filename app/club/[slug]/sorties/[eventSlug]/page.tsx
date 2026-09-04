import Link from "next/link";
import { notFound } from "next/navigation";

import { ClubFooter } from "@/components/club/ClubFooter";
import { ClubNav } from "@/components/club/ClubNav";
import { RegistrationCta } from "@/components/ui/RegistrationCta";
import { Tag } from "@/components/ui/Tag";
import { getAgendaEvents } from "@/lib/agenda/source";
import { getMonthKey } from "@/lib/agenda/planning";
import { CLUB } from "@/lib/config";
import { formatEventDateLong, formatEventTime } from "@/lib/format";
import { findRitualForEvent } from "@/lib/rituals/content";
import { clubMetadata } from "@/lib/seo";
import styles from "./page.module.css";

/**
 * Page d'une sortie — remplace la fenêtre modale du planning (2026-09-04).
 *
 * Une seule route au lieu de deux chemins vers le même contenu : une sortie a
 * une adresse, elle se partage, s'ouvre dans un onglet, et son aperçu de lien
 * porte SON titre et non celui du site (voir generateMetadata plus bas — ces
 * pages vont circuler plus que les autres).
 *
 * Le contenu vient du tableur, sauf la description : elle n'y est pas, et n'y
 * sera pas. Une sortie récurrente renvoie vers son rituel, où le texte est écrit
 * une fois pour toutes (findRitualForEvent) ; une sortie unique porte la colonne
 * `Détails`, facultative, à remplir seulement quand il y a quelque chose à dire.
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

  const facts: { label: string; value: string }[] = [
    { label: "Date", value: formatEventDateLong(event.startsAtIso) },
    { label: "Heure", value: formatEventTime(event.startsAtIso) },
    { label: "Durée", value: event.duration },
    { label: "Lieu", value: event.location },
  ];
  if (event.format) facts.push({ label: "Format", value: event.format });
  if (event.level) facts.push({ label: "Niveau", value: event.level });

  return (
    <div className={styles.wrap}>
      <ClubNav clubSlug={CLUB.slug} />

      {/* Retour au planning DU MOIS DE LA SORTIE, pas au mois courant : on revient
          là d'où l'on vient, y compris depuis un lien reçu par message. */}
      <Link href={`/club/${CLUB.slug}/planning?month=${monthKey}`} className={styles.back}>
        ← Retour au planning
      </Link>

      <div className={styles.hero}>
        <Tag variant={event.activity}>{event.activityLabelText}</Tag>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <dl className={styles.facts}>
        {facts.map((fact) => (
          <div key={fact.label} className={styles.fact}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>

      {event.details ? <p className={styles.details}>{event.details}</p> : null}

      <div className={styles.cta}>
        <RegistrationCta opensAtIso={event.opensAtIso} lumaUrl={event.lumaUrl} startsAtIso={event.startsAtIso} />
      </div>

      {ritual ? (
        <section className={styles.ritual}>
          <p className={styles.ritualLead}>Ce rendez-vous fait partie d&rsquo;un rituel du club.</p>
          <Link href={`/club/${CLUB.slug}/rituels/${ritual.frontmatter.slug}`} className={styles.ritualLink}>
            En savoir plus sur {ritual.frontmatter.title} →
          </Link>
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
