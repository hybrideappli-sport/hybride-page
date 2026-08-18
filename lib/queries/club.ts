import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database, "club">;

export interface PublishedClub {
  id: string;
  slug: string;
  name: string;
  city: string;
  tagline: string | null;
  contact_email: string | null;
  instagram_url: string | null;
  meeting_point: string | null;
  hello_asso_url: string | null;
}

export async function getPublishedClub(supabase: Client, slug: string): Promise<PublishedClub | null> {
  const { data, error } = await supabase
    .from("clubs")
    .select("id, slug, name, city, tagline, contact_email, instagram_url, meeting_point, hello_asso_url")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(`getPublishedClub: ${error.message}`);
  return data;
}

export interface UpcomingEvent {
  id: string;
  club_slug: string;
  discipline_codes: string[];
  discipline_labels: string[];
  title: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string;
  level: string | null;
  capacity: number;
  occupied: number;
  places_left: number;
  waitlist_count: number;
}

export async function getUpcomingEvents(supabase: Client, clubSlug: string): Promise<UpcomingEvent[]> {
  const { data, error } = await supabase.rpc("list_upcoming_events", { p_club_slug: clubSlug });
  if (error) throw new Error(`getUpcomingEvents: ${error.message}`);
  return data ?? [];
}

export interface EventPublic {
  id: string;
  club_slug: string;
  club_name: string;
  discipline_codes: string[];
  discipline_labels: string[];
  title: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string;
  location_url: string | null;
  level: string | null;
  capacity: number;
  status: string;
  occupied: number;
  places_left: number;
  waitlist_count: number;
}

/** Le RPC renvoie `Json` non typé (jsonb_build_object côté SQL) — forme documentée dans
 * 20260812093500_club_transactional_functions.sql, `club.get_event_public`. */
export async function getEventPublic(supabase: Client, eventId: string): Promise<EventPublic | null> {
  const { data, error } = await supabase.rpc("get_event_public", { p_event_id: eventId });
  if (error) throw new Error(`getEventPublic: ${error.message}`);
  return (data as EventPublic | null) ?? null;
}

interface ConsentDocument {
  code: string;
  version: string;
  title: string;
  body_md: string;
}

export interface ParentalAuthorization {
  found: boolean;
  status?: "pending" | "confirmed" | "denied" | "expired";
  expired?: boolean;
  hold_expires_at?: string;
  child_first_name?: string;
  requires_rgpd_consent?: boolean;
  event?: {
    id: string;
    title: string | null;
    discipline_codes: string[];
    discipline_labels: string[];
    starts_at: string;
    location: string;
    status: string;
  };
  club?: { slug: string; name: string };
  sport_authorization_document?: ConsentDocument;
  rgpd_document?: ConsentDocument | null;
}

/** US-05 E1 — accessible par un parent sans compte (anon), via le token seul. */
export async function getParentalAuthorization(supabase: Client, token: string): Promise<ParentalAuthorization> {
  const { data, error } = await supabase.rpc("get_parental_authorization", { p_token: token });
  if (error) throw new Error(`getParentalAuthorization: ${error.message}`);
  return (data as ParentalAuthorization | null) ?? { found: false };
}

export interface MyRegistration {
  id: string;
  status: "confirmed" | "waitlist" | "pending_parental_authorization" | "cancelled";
  event: { id: string; club_slug: string; title: string | null; discipline_labels: string[]; starts_at: string } | null;
}

/** US-04 D3 — `registrations_select_own` (RLS) : chacun ne voit que ses propres inscriptions. */
export async function getMyRegistrations(supabase: Client, userId: string): Promise<MyRegistration[]> {
  const { data, error } = await supabase
    .from("registrations")
    .select("id, status, events(id, title, starts_at, clubs(slug), event_disciplines(discipline_code, disciplines(label)))")
    .eq("member_profile_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getMyRegistrations: ${error.message}`);

  return (data ?? []).map((r) => {
    // Supabase-js type la relation imbriquée comme un objet ou un tableau selon le sens de la
    // FK détecté ; ici events/clubs sont côté "un" (objet), event_disciplines côté "plusieurs"
    // (tableau, table de liaison) — cast défensif plutôt qu'un any implicite.
    const event = r.events as unknown as
      | {
          id: string;
          title: string | null;
          starts_at: string;
          clubs: { slug: string } | null;
          event_disciplines: { discipline_code: string; disciplines: { label: string } | null }[];
        }
      | null;
    return {
      id: r.id,
      status: r.status,
      event: event
        ? {
            id: event.id,
            club_slug: event.clubs?.slug ?? "",
            title: event.title,
            discipline_labels: event.event_disciplines.map((ed) => ed.disciplines?.label ?? ed.discipline_code),
            starts_at: event.starts_at,
          }
        : null,
    };
  });
}
