import { redirect } from "next/navigation";

import { RegistrationStatusBadge } from "@/components/ui/RegistrationStatusBadge";
import { formatEventDateLong } from "@/lib/format";
import { getMyRegistrations } from "@/lib/queries/club";
import { createClient } from "@/lib/supabase/server";
import { CancelButton } from "./CancelButton";
import styles from "./page.module.css";

/** US-04 D3 — remplace l'ancien mécanisme "annulation par lien" (compte obligatoire désormais). */
export default async function MesInscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?next=/mes-inscriptions");

  const registrations = await getMyRegistrations(supabase, user.id);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Mes inscriptions</h1>

      {registrations.length === 0 ? (
        <p className={styles.empty}>Aucune inscription pour le moment.</p>
      ) : (
        registrations.map((registration) => (
          <div key={registration.id} className={styles.row}>
            <div className={styles.main}>
              <div className={styles.eventTitle}>{registration.event?.title ?? registration.event?.discipline_labels.join(" + ")}</div>
              {registration.event ? <div className={styles.eventDate}>{formatEventDateLong(registration.event.starts_at)}</div> : null}
            </div>
            <RegistrationStatusBadge status={registration.status} />
            {registration.status !== "cancelled" ? <CancelButton registrationId={registration.id} /> : null}
          </div>
        ))
      )}
    </div>
  );
}
