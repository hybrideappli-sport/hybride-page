import { NextResponse } from "next/server";

import { dispatchPendingEmails } from "@/lib/email/dispatch";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * ADR-006 §3 — filet de reprise, pas le chemin nominal (celui-ci est `after()`
 * immédiat depuis les Server Actions). Toutes les 5 minutes (Vercel Cron, à
 * configurer par `devops` : docs/architecture.md §9), protégé par CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const results = await dispatchPendingEmails(admin, 100);

  return NextResponse.json({
    processed: results.length,
    sent: results.filter((r) => r.outcome === "sent").length,
    failed: results.filter((r) => r.outcome === "failed").length,
    pending: results.filter((r) => r.outcome === "pending").length,
  });
}
