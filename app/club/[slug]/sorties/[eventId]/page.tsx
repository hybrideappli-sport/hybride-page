import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { Tag, type Discipline } from "@/components/ui/Tag";
import { formatEventDateLong, formatEventTime } from "@/lib/format";
import { getEventPublic, getPublishedClub } from "@/lib/queries/club";
import { createClient } from "@/lib/supabase/server";
import { RegisterForm } from "./RegisterForm";
import styles from "./page.module.css";

/** US-04 D1 — détail événement + inscription, données réelles. */
export default async function OutingDetailPage({ params }: { params: Promise<{ slug: string; eventId: string }> }) {
  const { slug, eventId } = await params;

  const supabase = await createClient();
  const club = await getPublishedClub(supabase, slug);
  if (!club) notFound();

  const event = await getEventPublic(supabase, eventId);
  if (!event || event.club_slug !== slug || event.status !== "published") notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let memberFirstName: string | null = null;
  if (user) {
    const { data: member } = await supabase.from("member_profiles").select("first_name").eq("id", user.id).maybeSingle();
    memberFirstName = member?.first_name ?? null;
  }

  const full = event.places_left <= 0;
  const disciplineText = event.discipline_labels.join(" + ");

  return (
    <div className={styles.wrap}>
      <a className={styles.back} href={`/club/${slug}`}>
        ← {disciplineText}
      </a>

      <PhotoSlot ratio="16/10" radius="card" bordered caption={`photo — ${event.title ?? disciplineText}`} />

      <div className={styles.tags}>
        {event.discipline_codes.map((code, i) => (
          <Tag key={code} variant={code as Discipline}>
            {event.discipline_labels[i] ?? code}
          </Tag>
        ))}
      </div>

      <h1 className={styles.title}>{event.title ?? disciplineText}</h1>

      <div className={styles.detail}>
        <div className={styles.row}>
          <span className={styles.label}>Date</span>
          <span className={styles.value}>{formatEventDateLong(event.starts_at)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Heure</span>
          <span className={styles.value}>{formatEventTime(event.starts_at)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Lieu de rendez-vous</span>
          <span className={styles.value}>{event.location}</span>
        </div>
        {event.level ? (
          <div className={styles.row}>
            <span className={styles.label}>Niveau requis</span>
            <span className={styles.value}>{event.level}</span>
          </div>
        ) : null}
        <div className={styles.row}>
          <span className={styles.label}>Capacité</span>
          <span className={styles.value}>{event.capacity} places</span>
        </div>
      </div>

      <p className={styles.statusBand}>{full ? "Complet — inscription en liste d'attente" : `${event.places_left} places restantes`}</p>

      <section className={styles.registerSection}>
        <h2>S&rsquo;inscrire</h2>

        {user ? (
          <>
            <p className={styles.registerNote}>
              Connecté{memberFirstName ? ` en tant que ${memberFirstName}` : ""}. Aucune ressaisie nécessaire — ton prénom, nom et date de
              naissance sont déjà sur ton compte.
            </p>
            <RegisterForm eventId={event.id} full={full} />
          </>
        ) : (
          <>
            <p className={styles.registerNote}>Un compte est nécessaire pour s&rsquo;inscrire — trente secondes, et il sert pour toutes les prochaines sorties.</p>
            <Button href={`/creation-compte?next=/club/${slug}/sorties/${eventId}`}>Se connecter ou créer un compte pour t&rsquo;inscrire</Button>
          </>
        )}
      </section>
    </div>
  );
}
