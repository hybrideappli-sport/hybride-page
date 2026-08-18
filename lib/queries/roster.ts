import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database, "club">;

export interface RosterRow {
  registration_id: string;
  status: "confirmed" | "waitlist" | "pending_parental_authorization" | "cancelled";
  first_name: string;
  last_name: string;
  email: string;
  registered_at: string;
  is_minor_at_event: boolean;
  parental_status: "pending" | "confirmed" | "denied" | "expired" | null;
  hold_expires_at: string | null;
}

/** US-06 AC5 — `event_roster` (authenticated + club_admin vérifié en base, pas ici). */
export async function getEventRoster(supabase: Client, eventId: string): Promise<RosterRow[]> {
  const { data, error } = await supabase.rpc("event_roster", { p_event_id: eventId });
  if (error) throw new Error(`getEventRoster: ${error.message}`);
  return data ?? [];
}
