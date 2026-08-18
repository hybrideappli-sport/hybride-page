import { Button } from "./Button";
import { Tag, type Discipline } from "./Tag";
import styles from "./OutingRow.module.css";

interface OutingRowProps {
  day: number;
  month: string;
  title: string;
  subtitle: string;
  href: string;
  /** Un événement porte une ou plusieurs disciplines (club.event_disciplines). */
  disciplines?: { code: Discipline; label: string }[];
  /** Places restantes / capacité. Omis (avec `full`) quand l'événement est complet. */
  slotsLeft?: number;
  slotsTotal?: number;
  full?: boolean;
}

export function OutingRow({ day, month, title, subtitle, href, disciplines = [], slotsLeft, slotsTotal, full = false }: OutingRowProps) {
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
      <div className={styles.slots}>
        {full ? "complet" : (
          <>
            <b>{slotsLeft}</b>/{slotsTotal}
          </>
        )}
      </div>
      <div className={styles.go}>
        <Button href={href} size="mini" variant={full ? "line" : "fill"}>
          {full ? "Liste d'attente" : "S'inscrire"}
        </Button>
      </div>
    </div>
  );
}
