import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";

import { signOut } from "@/lib/actions/auth";
import { getAdminClubs } from "@/lib/queries/admin";
import { createClient } from "@/lib/supabase/server";
import styles from "./layout.module.css";

/** US-06 AC1 — garde de rôle. Aucune page du dashboard n'est accessible sans rôle admin. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?next=/admin/sorties");

  const clubs = await getAdminClubs(supabase, user.id);
  if (clubs.length === 0) redirect("/");

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <Link href="/admin/sorties" className={styles.brand}>
          Espace organisateur
        </Link>
        <form action={signOut}>
          <button type="submit" className={styles.signOut}>
            Déconnexion
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
