import { NextResponse } from "next/server";

import { getEventRoster } from "@/lib/queries/roster";
import { createClient } from "@/lib/supabase/server";

function csvEscape(value: string): string {
  if (value.includes(";") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * US-06 AC8. Génération à la demande, streaming direct, aucun fichier conservé
 * côté serveur (docs/architecture.md §6). BOM + séparateur `;` pour un Excel FR
 * (docs/architecture.md §8, test n°13/format CSV). `event_roster` fait déjà
 * respecter le rôle club_admin — pas de vérification dupliquée ici.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let roster;
  try {
    roster = await getEventRoster(supabase, eventId);
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const header = ["Prénom", "Nom", "Email", "Statut"].join(";");
  const rows = roster.map((r) => [r.first_name, r.last_name, r.email, r.status].map(csvEscape).join(";"));
  const csv = "﻿" + [header, ...rows].join("\n");

  await supabase.rpc("log_export", { p_event_id: eventId, p_row_count: roster.length });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscrits-${eventId}.csv"`,
    },
  });
}
