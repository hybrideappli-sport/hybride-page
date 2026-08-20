import { Activity, Camera } from "lucide-react";

import { SocialLink } from "@/components/ui/SocialLink";
import styles from "./SocialLinks.module.css";

/**
 * Activity (Strava) / Camera (Instagram) : icônes de substitution neutres,
 * pas les logos des marques — voir SocialLink.tsx. Rendu identique partout où
 * ce bloc apparaît (pied de page club, section #nous-trouver) : même
 * composant, pas deux traitements visuels différents pour la même info.
 */
export function SocialLinks({ stravaUrl, instagramUrl }: { stravaUrl?: string; instagramUrl?: string }) {
  if (!stravaUrl && !instagramUrl) return null;

  return (
    <div className={styles.row}>
      {stravaUrl ? <SocialLink href={stravaUrl} label="Strava" icon={Activity} /> : null}
      {instagramUrl ? <SocialLink href={instagramUrl} label="Instagram" icon={Camera} /> : null}
    </div>
  );
}
