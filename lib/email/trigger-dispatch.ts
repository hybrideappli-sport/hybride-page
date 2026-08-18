import "server-only";

import { after } from "next/server";

import { dispatchPendingEmails } from "@/lib/email/dispatch";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * ADR-006 §3 — chemin nominal : dispatch immédiat après commit, hors du cycle de
 * rendu (`after()`). Best-effort : une erreur ici ne doit jamais faire échouer
 * l'action métier déjà commitée — le cron de reprise couvre l'échec (ADR-006 §6).
 */
export function triggerEmailDispatch(): void {
  after(async () => {
    try {
      await dispatchPendingEmails(createAdminClient());
    } catch (err) {
      console.error("triggerEmailDispatch: échec du dispatch immédiat, le cron reprendra", err);
    }
  });
}
