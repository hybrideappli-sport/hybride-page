import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import { getEmailProvider } from "./provider-resend";
import { buildEmailContent, type EmailContext } from "./templates";
import { EmailSendError } from "./types";

type Client = SupabaseClient<Database, "club">;
type EmailLogRow = Database["club"]["Tables"]["email_log"]["Row"];

const MAX_ATTEMPTS = 5; // ADR-006 §6 — abandon définitif au-delà, distinct du plafond DB (10, garde-fou séparé).
const BACKOFF_MINUTES = [1, 5, 15, 60, 240];

interface EventRow {
  title: string | null;
  starts_at: string;
  location: string;
  clubs: { name: string } | null;
  event_disciplines: { discipline_code: string; disciplines: { label: string } | null }[];
}

/** Plusieurs disciplines possibles par événement (club.event_disciplines) — jointes pour l'affichage e-mail. */
function eventInfoFromRow(event: EventRow) {
  return {
    title: event.title,
    activityLabel: event.event_disciplines.map((ed) => ed.disciplines?.label ?? ed.discipline_code).join(" + "),
    startsAt: event.starts_at,
    location: event.location,
    clubName: event.clubs?.name ?? "",
  };
}

/**
 * `club.email_log` n'a AUCUNE policy RLS — table d'exploitation, `service_role`
 * uniquement (20260812093400_club_outbox_and_audit.sql). Le dispatcher ne peut
 * donc fonctionner qu'avec le client admin, jamais le client de session utilisateur.
 */
export async function fetchPendingEmails(admin: Client, limit = 25): Promise<EmailLogRow[]> {
  const { data, error } = await admin
    .from("email_log")
    .select("*")
    .in("status", ["pending", "failed"])
    .lt("attempts", MAX_ATTEMPTS)
    .lte("next_attempt_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`fetchPendingEmails: ${error.message}`);
  return data ?? [];
}

async function buildContext(admin: Client, row: EmailLogRow): Promise<EmailContext> {
  if (row.related_type === "registration") {
    const { data, error } = await admin
      .from("registrations")
      .select(
        "member_profiles(first_name), events(title, starts_at, location, clubs(name), event_disciplines(discipline_code, disciplines(label)))",
      )
      .eq("id", row.related_id)
      .single();
    if (error || !data) throw new Error(`buildContext(registration ${row.related_id}): ${error?.message ?? "introuvable"}`);

    const member = data.member_profiles as unknown as { first_name: string } | null;
    const event = data.events as unknown as EventRow | null;
    if (!member || !event) throw new Error(`buildContext(registration ${row.related_id}): relations manquantes`);

    return {
      kind: "registration",
      memberFirstName: member.first_name,
      event: eventInfoFromRow(event),
    };
  }

  // related_type === "parental_authorization"
  const { data, error } = await admin
    .from("parental_authorizations")
    .select(
      "token, member_profiles!parental_authorizations_minor_profile_id_fkey(first_name), registrations(events(title, starts_at, location, clubs(name), event_disciplines(discipline_code, disciplines(label))))",
    )
    .eq("id", row.related_id)
    .single();
  if (error || !data) throw new Error(`buildContext(parental ${row.related_id}): ${error?.message ?? "introuvable"}`);

  const minor = data.member_profiles as unknown as { first_name: string } | null;
  const registration = data.registrations as unknown as { events: EventRow | null } | null;
  const event = registration?.events;
  if (!minor || !event) throw new Error(`buildContext(parental ${row.related_id}): relations manquantes`);

  return {
    kind: "parental",
    childFirstName: minor.first_name,
    token: data.token,
    event: eventInfoFromRow(event),
  };
}

export interface DispatchResult {
  id: string;
  outcome: "sent" | "failed" | "pending";
}

/** Traite une ligne d'outbox : reconstruit le contenu, envoie, met à jour le statut. */
export async function dispatchOne(admin: Client, row: EmailLogRow): Promise<DispatchResult> {
  try {
    const context = await buildContext(admin, row);
    const content = buildEmailContent(row.email_type, context);
    const provider = getEmailProvider();
    const { providerMessageId } = await provider.send({ to: row.recipient, ...content });

    await admin
      .from("email_log")
      .update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: providerMessageId })
      .eq("id", row.id);
    return { id: row.id, outcome: "sent" };
  } catch (err) {
    const attempts = row.attempts + 1;
    const isFinal = attempts >= MAX_ATTEMPTS;
    const backoff = BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)];
    const message = err instanceof EmailSendError ? err.message : err instanceof Error ? err.message : String(err);

    await admin
      .from("email_log")
      .update({
        status: isFinal ? "failed" : "pending",
        attempts,
        last_error: message.slice(0, 1000),
        next_attempt_at: new Date(Date.now() + backoff * 60_000).toISOString(),
      })
      .eq("id", row.id);

    // Abandon définitif après 5 tentatives : le cas le plus grave est une demande
    // parentale jamais livrée (ADR-006 §6, "doit être alertée, pas seulement
    // journalisée" — alerte devops à câbler, non faite ici).
    return { id: row.id, outcome: isFinal ? "failed" : "pending" };
  }
}

export async function dispatchPendingEmails(admin: Client, limit = 25): Promise<DispatchResult[]> {
  const rows = await fetchPendingEmails(admin, limit);
  const results: DispatchResult[] = [];
  for (const row of rows) {
    results.push(await dispatchOne(admin, row));
  }
  return results;
}
