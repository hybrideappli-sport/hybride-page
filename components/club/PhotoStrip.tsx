import { PhotoSlot } from "@/components/ui/PhotoSlot";
import styles from "./PhotoStrip.module.css";

export function PhotoStrip({ captions }: { captions: [string, string, string, string] }) {
  return (
    <div className={styles.strip}>
      {captions.map((caption) => (
        <PhotoSlot key={caption} ratio="1/1" bordered caption={caption} />
      ))}
    </div>
  );
}
