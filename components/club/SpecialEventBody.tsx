import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import type { SpecialEvent } from "@/lib/agenda/special-events";
import type { AgendaEvent } from "@/lib/agenda/source";
import { LOCATION_PENDING } from "@/lib/agenda/source";
import type { Partner } from "@/lib/club/partners";
import { formatEventDateLong, formatEventTime } from "@/lib/format";
import { PartnerLogo } from "./PartnerLogo";
import styles from "./SpecialEventBody.module.css";

/**
 * Fiche spéciale d'une sortie (lib/agenda/special-events.ts) — remplace, pour
 * cette sortie seulement, la fiche habituelle de son activité.
 *
 * De haut en bas : un en-tête aux couleurs de l'activité, avec « H × logo du
 * partenaire » quand il y en a un ; les pastilles (accès, places, niveau) ; le
 * déroulé ; l'encadré crème, repris du bandeau de la page du club, pour le
 * chiffre qui compte ; le lieu ; l'inscription.
 *
 * Aucun lien vers /adherer : « Réservée aux adhérents » est une condition
 * d'accès, pas un argument. L'argument de l'adhésion est l'assurance, et lui
 * seul — voir l'avertissement en tête de special-events.ts.
 */
export function SpecialEventBody({
  event,
  special,
  partner,
  mapsUrl,
  registration,
}: {
  event: AgendaEvent;
  special: SpecialEvent;
  partner: Partner | null;
  /** Fiche Google Maps du lieu, quand on la connaît (adresse du partenaire). */
  mapsUrl: string | null;
  registration: ReactNode;
}) {
  const accent = {
    "--accent": `var(--hy-${event.activity})`,
    "--accent-bg": `var(--hy-${event.activity}-bg)`,
  } as CSSProperties;

  return (
    <div className={styles.page} style={accent}>
      <header className={styles.hero}>
        {partner ? (
          // Décoratif pour un lecteur d'écran : le surtitre dit déjà avec qui.
          <div className={styles.lockup} aria-hidden="true">
            <Image src="/photos/logo-hybride-mark.png" alt="" width={144} height={200} unoptimized className={styles.hybrideMark} />
            <span className={styles.times}>×</span>
            <PartnerLogo logo={partner.logo} size="hero" />
          </div>
        ) : null}

        <p className={styles.eyebrow}>{special.eyebrow}</p>
        <h1 className={styles.title}>{special.title ?? event.title ?? event.activityLabelText}</h1>
        <p className={styles.when}>
          {formatEventDateLong(event.startsAtIso)} <span className={styles.nowrap}>· {formatEventTime(event.startsAtIso)}</span>
        </p>
        <p className={styles.lead}>{special.lead}</p>

        <ul className={styles.badges}>
          {special.badges.map((badge) => (
            <li key={badge} className={styles.badge}>
              {badge}
            </li>
          ))}
        </ul>
      </header>

      <section className={styles.section} aria-labelledby="programme">
        <h2 id="programme" className={styles.sectionTitle}>
          Au programme
        </h2>
        <ol className={styles.program}>
          {special.program.map((step) => (
            <li key={step.title} className={styles.step}>
              {step.time ? <span className={styles.stepTime}>{step.time}</span> : null}
              <span className={styles.stepTitle}>{step.title}</span>
              <span className={styles.stepText}>{step.text}</span>
            </li>
          ))}
        </ol>
      </section>

      {special.highlight ? (
        <aside className={styles.highlight}>
          <p className={styles.figure}>{special.highlight.figure}</p>
          <p className={styles.highlightTitle}>{special.highlight.title}</p>
          <p className={styles.highlightText}>{special.highlight.text}</p>
        </aside>
      ) : null}

      <section className={styles.section} aria-labelledby="rendez-vous">
        <h2 id="rendez-vous" className={styles.sectionTitle}>
          Rendez-vous
        </h2>
        <p className={styles.place}>{special.place ?? event.location ?? LOCATION_PENDING}</p>
        {mapsUrl ? (
          <p className={styles.mapLine}>
            {/* `noreferrer` : ne pas annoncer au site d'arrivée d'où vient le visiteur. */}
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>
              Voir sur la carte ↗
            </a>
          </p>
        ) : null}
      </section>

      {registration}
    </div>
  );
}
