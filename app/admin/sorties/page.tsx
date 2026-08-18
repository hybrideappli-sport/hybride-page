import { redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { disciplineLabel, type Discipline } from "@/components/ui/Tag";
import { formatEventDateLong, formatEventTime } from "@/lib/format";
import { getAdminClubs, getAdminEvents } from "@/lib/queries/admin";
import { createClient } from "@/lib/supabase/server";
import { CancelEventButton } from "./CancelEventButton";
import styles from "./page.module.css";

/** US-06 F1 — un seul club de résolu au P0 (pas de sélecteur multi-clubs, P1). */
export default async function AdminSortiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?next=/admin/sorties");

  const clubs = await getAdminClubs(supabase, user.id);
  const club = clubs[0];
  if (!club) redirect("/");

  const events = await getAdminEvents(supabase, club.id);

  return (
    <div>
      <div className={styles.headRow}>
        <h1>Mes sorties — {club.name}</h1>
        <Button href="/admin/sorties/nouvelle" size="mini">
          + Créer une sortie
        </Button>
      </div>

      {events.length === 0 ? (
        <p className={styles.empty}>Aucune sortie à venir.</p>
      ) : (
        events.map((event) => (
          <div key={event.id} className={`${styles.row} ${event.status === "cancelled" ? styles.cancelled : ""}`}>
            <div className={styles.main}>
              <Link href={`/admin/sorties/${event.id}`} className={styles.eventTitle}>
                {event.title ?? event.discipline_codes.map((code) => disciplineLabel[code as Discipline] ?? code).join(" + ")}
              </Link>
              <div className={styles.eventMeta}>
                {formatEventDateLong(event.starts_at)} · {formatEventTime(event.starts_at)} · {event.location}
                {event.status === "cancelled" ? " · Annulée" : ""}
              </div>
            </div>
            <div className={styles.counts}>
              {event.confirmed}/{event.capacity} confirmés · {event.waitlist} en attente · {event.pendingParental} en attente parentale
            </div>
            {event.status === "published" ? <CancelEventButton eventId={event.id} /> : null}
          </div>
        ))
      )}
    </div>
  );
}
