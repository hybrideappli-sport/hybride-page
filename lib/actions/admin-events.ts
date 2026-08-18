"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { triggerEmailDispatch } from "@/lib/email/trigger-dispatch";
import { createClient } from "@/lib/supabase/server";

export interface CreateEventState {
  error?: string;
}

const createSchema = z.object({
  clubId: z.string().uuid(),
  disciplineCodes: z.array(z.enum(["course", "velo", "eau", "montagne", "collectif"])).min(1, "Choisis au moins une discipline"),
  title: z.string().trim().optional(),
  date: z.string().min(1, "Date requise"),
  time: z.string().min(1, "Heure requise"),
  location: z.string().trim().min(1, "Lieu requis"),
  level: z.string().trim().optional(),
  capacity: z.coerce.number().int().min(1, "Capacité minimum 1"),
});

/**
 * US-06 AC2. `club.create_event()` (RPC) et non plus une policy RLS
 * `events_insert_admin` seule (ADR-004 §1, amendé 20260812093500) : une sortie
 * porte désormais une ou plusieurs disciplines (club.event_disciplines),
 * écriture multi-table qu'un simple prédicat de ligne ne peut plus exprimer.
 * Pas d'édition au P0 (US-06 AC3, pas de policy UPDATE côté schéma).
 */
export async function createEvent(_prevState: CreateEventState, formData: FormData): Promise<CreateEventState> {
  const parsed = createSchema.safeParse({
    ...Object.fromEntries(formData),
    disciplineCodes: formData.getAll("disciplineCodes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnecte-toi." };

  const startsAt = new Date(`${parsed.data.date}T${parsed.data.time}:00`);
  if (Number.isNaN(startsAt.getTime())) return { error: "Date ou heure invalide." };

  const { error } = await supabase.rpc("create_event", {
    p_club_id: parsed.data.clubId,
    p_discipline_codes: parsed.data.disciplineCodes,
    p_starts_at: startsAt.toISOString(),
    p_location: parsed.data.location,
    p_capacity: parsed.data.capacity,
    p_title: parsed.data.title || undefined,
    p_level: parsed.data.level || undefined,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/sorties");
  redirect("/admin/sorties");
}

export interface CancelEventState {
  error?: string;
}

/** US-06 AC4 — annule en cascade les inscriptions et enfile les e-mails (club.cancel_event). */
export async function cancelEvent(_prevState: CancelEventState, formData: FormData): Promise<CancelEventState> {
  const eventId = formData.get("eventId");
  if (typeof eventId !== "string") return { error: "Événement introuvable." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_event", { p_event_id: eventId });
  if (error) return { error: error.message };

  triggerEmailDispatch();
  revalidatePath("/admin/sorties");
  return {};
}

export interface AddParticipantState {
  error?: string;
}

const addParticipantSchema = z.object({
  eventId: z.string().uuid(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  birthDate: z.string().min(1),
  email: z.string().trim().email(),
});

/**
 * US-06 AC6. L'admin inscrit quelqu'un qui n'a pas de compte : ce repo n'a pas
 * de mécanisme pour créer un auth.users depuis le serveur sans mot de passe
 * (inviteUserByEmail existe côté Supabase Admin API mais suppose un envoi
 * d'e-mail configuré, lot L7). Marqué non implémenté plutôt que bricolé.
 */
export async function addParticipant(_prevState: AddParticipantState, _formData: FormData): Promise<AddParticipantState> {
  return { error: "Pas encore disponible : nécessite la création de compte côté serveur (lot L7, invitation par e-mail)." };
}
