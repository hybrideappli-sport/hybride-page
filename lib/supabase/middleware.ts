import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/types/database";

/**
 * Rafraîchit la session à chaque requête (obligatoire avec @supabase/ssr — sans
 * ça, un token expiré en cours de navigation déconnecte silencieusement).
 * Ne fait aucune redirection d'autorisation elle-même : les gardes de rôle
 * (US-06, dashboard admin) vivent dans app/admin/layout.tsx, pas ici.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database, "club">(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    db: { schema: "club" },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // Ne pas retirer : déclenche le rafraîchissement du token si nécessaire.
  await supabase.auth.getUser();

  return supabaseResponse;
}
