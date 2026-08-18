import { formatEventDateLong, formatEventTime } from "@/lib/format";
import { getParentalAuthorization } from "@/lib/queries/club";
import { createClient } from "@/lib/supabase/server";
import { DecisionForm } from "./DecisionForm";
import styles from "./page.module.css";

/**
 * US-05 E1 — vue du parent, sans compte, atteinte via le lien unique de
 * l'e-mail. `get_parental_authorization` est lisible par `anon` (grant de
 * 20260812093500_club_transactional_functions.sql) : aucune authentification
 * requise, cohérent avec le zoning.
 */
export default async function ParentalAuthorizationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const supabase = await createClient();
  const auth = await getParentalAuthorization(supabase, token);

  if (!auth.found) {
    return (
      <div className={styles.wrap}>
        <h1>Lien invalide</h1>
        <p className={styles.state}>Ce lien n&rsquo;est plus valide — il a peut-être déjà été utilisé, ou n&rsquo;existe pas.</p>
      </div>
    );
  }

  if (auth.status !== "pending") {
    const messages: Record<string, string> = {
      confirmed: "Cette autorisation a déjà été confirmée.",
      denied: "Cette sortie a déjà été refusée.",
      expired: "Le délai de 48h est dépassé — la place a été libérée automatiquement.",
    };
    return (
      <div className={styles.wrap}>
        <h1>Autorisation parentale</h1>
        <p className={styles.state}>{messages[auth.status ?? ""] ?? "Cette demande n'est plus en attente."}</p>
      </div>
    );
  }

  if (auth.expired) {
    return (
      <div className={styles.wrap}>
        <h1>Autorisation parentale</h1>
        <p className={styles.state}>Le délai de 48h est dépassé — la place a été libérée automatiquement.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <h1>Autorisation parentale</h1>
      <p className={styles.accessNote}>Accessible via le lien unique de l&rsquo;e-mail — aucune authentification, aucun compte parent requis.</p>

      <div className={styles.recap}>
        <div className={styles.row}>
          <span className={styles.label}>Enfant</span>
          <span className={styles.value}>{auth.child_first_name}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Activité</span>
          <span className={styles.value}>{auth.event?.title ?? auth.event?.discipline_labels.join(" + ")}</span>
        </div>
        {auth.event?.starts_at ? (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Date</span>
              <span className={styles.value}>{formatEventDateLong(auth.event.starts_at)}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Heure</span>
              <span className={styles.value}>{formatEventTime(auth.event.starts_at)}</span>
            </div>
          </>
        ) : null}
        <div className={styles.row}>
          <span className={styles.label}>Lieu</span>
          <span className={styles.value}>{auth.event?.location}</span>
        </div>
      </div>

      {auth.requires_rgpd_consent && auth.rgpd_document ? (
        <div className={styles.document}>
          <h2>{auth.rgpd_document.title}</h2>
          <div className={styles.documentBody}>{auth.rgpd_document.body_md}</div>
        </div>
      ) : null}

      {auth.sport_authorization_document ? (
        <div className={styles.document}>
          <h2>{auth.sport_authorization_document.title}</h2>
          <div className={styles.documentBody}>{auth.sport_authorization_document.body_md}</div>
        </div>
      ) : null}

      <DecisionForm token={token} />
    </div>
  );
}
