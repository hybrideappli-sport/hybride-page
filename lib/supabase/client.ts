import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";

/** Client navigateur — clé publique (anon), schéma club par défaut. */
export function createClient() {
  return createBrowserClient<Database, "club">(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    db: { schema: "club" },
  });
}
