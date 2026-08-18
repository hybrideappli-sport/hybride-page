import { Card } from "@/components/ui/Card";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { Tag, type Discipline } from "@/components/ui/Tag";
import styles from "./RitualsGrid.module.css";

export interface RitualEntry {
  discipline: Discipline;
  disciplineLabel: string;
  title: string;
  description: string;
  photoCaption: string;
}

export function RitualsGrid({ entries }: { entries: RitualEntry[] }) {
  return (
    <div className={styles.rituals}>
      {entries.map((entry) => (
        <Card key={entry.title}>
          <PhotoSlot ratio="16/10" radius="none" caption={entry.photoCaption} />
          <div className={styles.body}>
            <Tag variant={entry.discipline}>{entry.disciplineLabel}</Tag>
            <h3 className={styles.title}>{entry.title}</h3>
            <p className={styles.text}>{entry.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
