import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/types/database";

/**
 * Client serveur (Server Components, Server Actions, Route Handlers) — clé
 * publique (anon), identité portée par les cookies de session, RLS active.
 * Jamais utilisé pour des écritures qui doivent contourner RLS : voir admin.ts.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database, "club">(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    db: { schema: "club" },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Appelé depuis un Server Component : le middleware rafraîchit déjà la
          // session, cet appel peut être ignoré sans risque (doc @supabase/ssr).
        }
      },
    },
  });
}
