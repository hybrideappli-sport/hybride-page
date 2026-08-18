"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { triggerEmailDispatch } from "@/lib/email/trigger-dispatch";
import { createClient } from "@/lib/supabase/server";

export interface RegisterState {
  error?: string;
  success?: boolean;
  status?: "confirmed" | "waitlist" | "pending_parental_authorization";
}

const schema = z.object({
  eventId: z.string().uuid(),
  parentEmail: z.string().trim().email().optional().or(z.literal("")),
});

/**
 * US-04 AC2-AC4. `register_for_event` porte tout l'invariant métier (verrou de
 * capacité ADR-003, régime mineur, promotion) — cette action ne fait que
 * valider l'entrée et relayer l'appel sous la session de l'utilisateur
 * connecté (p_member_profile_id par défaut = auth.uid(), pas besoin de le
 * passer). `authenticated` a EXECUTE direct sur cette fonction (grant de
 * 20260812093500_club_transactional_functions.sql) — pas de service_role ici.
 */
export async function registerForEvent(_prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Formulaire invalide." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connecte-toi pour t'inscrire." };

  const { data, error } = await supabase.rpc("register_for_event", {
    p_event_id: parsed.data.eventId,
    p_parent_email: parsed.data.parentEmail || undefined,
  });

  if (error) {
    // 22023 = parent_email_required (contrainte PL/pgSQL, voir migration) : message
    // actionnable plutôt que le code d'erreur brut.
    if (error.message.includes("parent_email_required")) {
      return { error: "Tu es mineur·e pour cette sortie : l'email d'un parent est requis." };
    }
    return { error: error.message };
  }

  revalidatePath("/mes-inscriptions");
  triggerEmailDispatch();
  const result = data as { status: RegisterState["status"] } | null;
  return { success: true, status: result?.status };
}

export interface CancelState {
  error?: string;
  success?: boolean;
}

export async function cancelRegistration(_prevState: CancelState, formData: FormData): Promise<CancelState> {
  const registrationId = formData.get("registrationId");
  if (typeof registrationId !== "string") return { error: "Inscription introuvable." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_registration", { p_registration_id: registrationId });
  if (error) return { error: error.message };

  revalidatePath("/mes-inscriptions");
  triggerEmailDispatch();
  return { success: true };
}
