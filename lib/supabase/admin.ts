import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

/**
 * Client service_role — contourne RLS. `import "server-only"` fait échouer le
 * build si ce module finit importé côté client (docs/architecture.md §4).
 *
 * Trois chemins d'usage autorisés (docs/architecture.md §6) :
 *  1. club.register_for_event / cancel_registration / decide_parental_authorization
 *     — les fonctions elles-mêmes sont security definer, mais l'appel RPC passe
 *     par service_role pour porter l'identité de l'appelant en paramètre plutôt
 *     que via auth.uid() (utile pour l'inscription manuelle par un admin, US-06 AC6).
 *  2. Actions admin (créer/annuler un événement, export CSV) — après vérification
 *     du rôle club_admin côté appelant.
 *  3. club.expire_parental_holds / autres jobs planifiés, appelés en dehors de
 *     tout contexte de requête utilisateur.
 *
 * Ne JAMAIS instancier ce client pour relayer une requête utilisateur sans avoir
 * d'abord vérifié son identité/rôle avec le client serveur standard (server.ts).
 */
export function createAdminClient() {
  return createSupabaseClient<Database, "club">(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    db: { schema: "club" },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
