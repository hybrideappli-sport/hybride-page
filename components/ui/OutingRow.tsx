import { RegistrationCta } from "./RegistrationCta";
import { Tag, type Discipline } from "./Tag";
import styles from "./OutingRow.module.css";

interface OutingRowProps {
  day: number;
  month: string;
  title: string;
  subtitle: string;
  /** Un événement porte une ou plusieurs disciplines (club.event_disciplines / colonnes du tableur). */
  disciplines?: { code: Discipline; label: string }[];
  /** Ex. "1h30" — remplace le compteur de places restantes, retiré avec l'inscription en compte (ADR-010 §6). */
  duration?: string;
  /** Ex. "62 km · 850 m D+" — optionnel, pertinent seulement pour certaines disciplines. */
  details?: string;
  /** Ouverture différée + lien Luma (ADR-010 §3) — voir RegistrationCta pour les 3 états. */
  opensAtIso: string;
  lumaUrl: string | null;
}

export function OutingRow({ day, month, title, subtitle, disciplines = [], duration, details, opensAtIso, lumaUrl }: OutingRowProps) {
  return (
    <div className={styles.outing}>
      <div className={styles.date}>
        <div className={styles.day}>{day}</div>
        <div className={styles.month}>{month}</div>
      </div>
      <div className={styles.main}>
        {disciplines.length > 0 ? (
          <div className={styles.tags}>
            {disciplines.map((d) => (
              <Tag key={d.code} variant={d.code}>
                {d.label}
              </Tag>
            ))}
          </div>
        ) : null}
        <div className={styles.title}>{title}</div>
        <div className={styles.sub}>{subtitle}</div>
      </div>
      {duration ? (
        <div className={styles.duration}>
          {duration}
          {details ? <span className={styles.details}> · {details}</span> : null}
        </div>
      ) : null}
      <div className={styles.cta}>
        <RegistrationCta opensAtIso={opensAtIso} lumaUrl={lumaUrl} />
      </div>
    </div>
  );
}
