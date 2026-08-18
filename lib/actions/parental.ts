"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

import { triggerEmailDispatch } from "@/lib/email/trigger-dispatch";
import { createClient } from "@/lib/supabase/server";

export interface DecideParentalState {
  error?: string;
  decided?: "confirmed" | "denied";
}

/**
 * US-05 AC4-AC8. Preuve calculée côté serveur (ADR-004 §4) : jamais acceptée du
 * client. `PROOF_IP_SALT` pas encore configuré (lot L7/devops) — hash quand
 * même avec un sel de repli explicite plutôt que de stocker l'IP en clair ou de
 * bloquer la fonctionnalité en attendant une variable d'env.
 */
export async function decideParentalAuthorization(
  _prevState: DecideParentalState,
  formData: FormData,
): Promise<DecideParentalState> {
  const token = formData.get("token");
  const approve = formData.get("approve") === "true";
  if (typeof token !== "string" || !token) return { error: "Lien invalide." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  const userAgent = h.get("user-agent") ?? "unknown";
  const salt = process.env.PROOF_IP_SALT ?? "dev-only-salt-not-for-production";
  const ipHash = createHash("sha256").update(`${salt}:${ip}`).digest("hex");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("decide_parental_authorization", {
    p_token: token,
    p_approve: approve,
    p_ip_hash: ipHash,
    p_user_agent: userAgent,
  });
  if (error) return { error: error.message };

  triggerEmailDispatch();
  const result = data as { status?: string } | null;
  return { decided: result?.status === "confirmed" ? "confirmed" : "denied" };
}
