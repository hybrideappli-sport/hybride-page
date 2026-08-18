import { Card } from "@/components/ui/Card";
import { Tag, type Discipline } from "@/components/ui/Tag";
import styles from "./WeekGrid.module.css";

export interface WeekEntry {
  dow: string;
  discipline: Discipline;
  disciplineLabel: string;
  name: string;
  when: string;
}

export function WeekGrid({ entries }: { entries: WeekEntry[] }) {
  return (
    <div className={styles.week}>
      {entries.map((entry) => (
        <Card key={entry.dow} padded hoverLift className={styles.day}>
          <span className={styles.dow}>{entry.dow}</span>
          <Tag variant={entry.discipline}>{entry.disciplineLabel}</Tag>
          <span className={styles.name}>{entry.name}</span>
          <span className={styles.when}>{entry.when}</span>
        </Card>
      ))}
    </div>
  );
}
