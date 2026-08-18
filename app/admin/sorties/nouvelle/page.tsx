import { redirect } from "next/navigation";

import { getAdminClubs } from "@/lib/queries/admin";
import { createClient } from "@/lib/supabase/server";
import { CreateEventForm } from "./CreateEventForm";

/** US-06 F2 — pas d'édition au P0 (US-06 AC3), création uniquement. */
export default async function NewEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?next=/admin/sorties/nouvelle");

  const clubs = await getAdminClubs(supabase, user.id);
  const club = clubs[0];
  if (!club) redirect("/");

  return (
    <div>
      <h1>Nouvelle sortie</h1>
      <CreateEventForm clubId={club.id} />
    </div>
  );
}
