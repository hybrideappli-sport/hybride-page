import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { RegistrationStatusBadge } from "@/components/ui/RegistrationStatusBadge";
import { formatEventDateLong, formatEventTime } from "@/lib/format";
import { getEventPublic } from "@/lib/queries/club";
import { getEventRoster } from "@/lib/queries/roster";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

/** US-06 F3 — 3 états distincts (confirmés, liste d'attente, attente parentale). */
export default async function EventRosterPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?next=/admin/sorties/${eventId}`);

  const event = await getEventPublic(supabase, eventId);
  if (!event) notFound();

  // event_roster lève une exception si l'appelant n'est pas club_admin du club de
  // l'événement (is_club_admin vérifié en base) — pas de vérification dupliquée ici.
  const roster = await getEventRoster(supabase, eventId);

  const confirmed = roster.filter((r) => r.status === "confirmed");
  const waitlist = roster.filter((r) => r.status === "waitlist");
  const pendingParental = roster.filter((r) => r.status === "pending_parental_authorization");

  return (
    <div>
      <h1>{event.title ?? event.discipline_labels.join(" + ")}</h1>
      <p className={styles.recap}>
        {formatEventDateLong(event.starts_at)} · {formatEventTime(event.starts_at)} · {event.location}
      </p>
      <p className={styles.recap}>
        {confirmed.length} confirmés · {waitlist.length} en attente · {pendingParental.length} en attente parentale
      </p>

      <div className={styles.actions}>
        <Button href={`/api/admin/events/${eventId}/export.csv`} variant="line" size="mini">
          Exporter CSV
        </Button>
      </div>

      <div className={styles.section}>
        <h2>Confirmés ({confirmed.length})</h2>
        {confirmed.length === 0 ? <p className={styles.empty}>Personne d&rsquo;inscrit pour le moment.</p> : null}
        {confirmed.map((r) => (
          <div key={r.registration_id} className={styles.participant}>
            <span>
              {r.first_name} {r.last_name}
            </span>
            <span className={styles.participantEmail}>{r.email}</span>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <h2>Liste d&rsquo;attente ({waitlist.length})</h2>
        {waitlist.length === 0 ? <p className={styles.empty}>Aucune liste d&rsquo;attente.</p> : null}
        {waitlist.map((r) => (
          <div key={r.registration_id} className={styles.participant}>
            <span>
              {r.first_name} {r.last_name}
            </span>
            <span className={styles.participantEmail}>{r.email}</span>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <h2>En attente d&rsquo;autorisation parentale ({pendingParental.length})</h2>
        {pendingParental.length === 0 ? <p className={styles.empty}>Aucune demande en cours.</p> : null}
        {pendingParental.map((r) => (
          <div key={r.registration_id} className={styles.participant}>
            <span>
              {r.first_name} {r.last_name}
            </span>
            <RegistrationStatusBadge status="pending_parental_authorization" />
          </div>
        ))}
      </div>
    </div>
  );
}
