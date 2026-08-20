import { PhotoSlot } from "@/components/ui/PhotoSlot";
import styles from "./PhotoStrip.module.css";

export interface PhotoStripItem {
  caption: string;
  src?: string;
  alt?: string;
}

export function PhotoStrip({ photos }: { photos: [PhotoStripItem, PhotoStripItem, PhotoStripItem, PhotoStripItem] }) {
  return (
    <div className={styles.strip}>
      {photos.map((photo) => (
        <PhotoSlot key={photo.caption} ratio="1/1" bordered caption={photo.caption} src={photo.src} alt={photo.alt ?? ""} />
      ))}
    </div>
  );
}
