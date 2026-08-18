import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database, "club">;

export interface AdminClub {
  id: string;
  slug: string;
  name: string;
}

/**
 * US-06 AC1. `admin_roles_select_own` (RLS) : chacun ne voit que ses propres
 * rôles. `super_admin` a `club_id = null` (portée globale, décision 2 du
 * brief) — au P0, sans interface multi-clubs, on lui donne accès au seul club
 * publié plutôt que de construire un sélecteur pour une UI qui n'existe pas
 * encore.
 */
export async function getAdminClubs(supabase: Client, userId: string): Promise<AdminClub[]> {
  const { data: roles, error } = await supabase.from("admin_roles").select("role, club_id").eq("profile_id", userId);
  if (error) throw new Error(`getAdminClubs: ${error.message}`);
  if (!roles || roles.length === 0) return [];

  const isSuperAdmin = roles.some((r) => r.role === "super_admin");
  const clubIds = roles.filter((r) => r.club_id).map((r) => r.club_id as string);

  const query = supabase.from("clubs").select("id, slug, name");
  const { data: clubs, error: clubsError } = isSuperAdmin ? await query.eq("is_published", true) : await query.in("id", clubIds);
  if (clubsError) throw new Error(`getAdminClubs: ${clubsError.message}`);

  return clubs ?? [];
}

export interface AdminEvent {
  id: string;
  title: string | null;
  discipline_codes: string[];
  starts_at: string;
  location: string;
  capacity: number;
  status: "published" | "cancelled";
  confirmed: number;
  waitlist: number;
  pendingParental: number;
}

/** US-06 AC1/AC5 — `events_read_admin` (RLS) : toutes les sorties du club, annulées comprises. */
export async function getAdminEvents(supabase: Client, clubId: string): Promise<AdminEvent[]> {
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, starts_at, location, capacity, status, event_disciplines(discipline_code)")
    .eq("club_id", clubId)
    .order("starts_at", { ascending: false });
  if (error) throw new Error(`getAdminEvents: ${error.message}`);
  if (!events || events.length === 0) return [];

  const { data: registrations, error: regError } = await supabase
    .from("registrations")
    .select("event_id, status")
    .in(
      "event_id",
      events.map((e) => e.id),
    );
  if (regError) throw new Error(`getAdminEvents: ${regError.message}`);

  return events.map((event) => {
    const rows = (registrations ?? []).filter((r) => r.event_id === event.id);
    const { event_disciplines, ...rest } = event;
    return {
      ...rest,
      discipline_codes: event_disciplines.map((ed) => ed.discipline_code),
      confirmed: rows.filter((r) => r.status === "confirmed").length,
      waitlist: rows.filter((r) => r.status === "waitlist").length,
      pendingParental: rows.filter((r) => r.status === "pending_parental_authorization").length,
    };
  });
}
