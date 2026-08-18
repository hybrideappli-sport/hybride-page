"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { createClient as createClientType } from "@/lib/supabase/server";

export interface CreateAccountState {
  error?: string;
}

/** US-03 AC6 : `next` explicite prioritaire, sinon redirection par rôle. */
async function resolveRedirect(supabase: Awaited<ReturnType<typeof createClientType>>, userId: string, next?: string): Promise<string> {
  if (next && next.startsWith("/")) return next;

  const { data: roles } = await supabase.from("admin_roles").select("role").eq("profile_id", userId).limit(1);
  if (roles && roles.length > 0) return "/admin/sorties";

  return "/";
}

const schema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  birthDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Date de naissance invalide"),
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  next: z.string().optional(),
});

/**
 * US-03 AC1. `signUp` porte `raw_user_meta_data.origin = "club"` — dérivé en
 * `profiles.app_enrolled = false` par `handle_new_user()` côté app
 * (hybrideappli/supabase/migrations/0017_app_enrolled_from_signup_metadata.sql).
 * Aucune écriture directe sur `public.profiles` depuis ce repo (ADR-001 §4,
 * corrigé le 2026-08-12).
 *
 * `enable_confirmations = false` en local (supabase/config.toml) : signUp()
 * renvoie une session active immédiatement. En prod, ce comportement dépend
 * de la configuration Auth du projet partagé — à vérifier avant lancement
 * (devops), sinon l'insert club.member_profiles qui suit échouera faute de
 * session (pas de garde applicatif à ajouter ici : RLS le refuserait
 * proprement de toute façon).
 */
export async function createAccount(_prevState: CreateAccountState, formData: FormData): Promise<CreateAccountState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const { firstName, lastName, birthDate, email, password, next } = parsed.data;

  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { origin: "club", first_name: firstName, last_name: lastName, birth_date: birthDate },
    },
  });
  if (signUpError) return { error: signUpError.message };
  if (!signUpData.user) return { error: "Compte non créé, réessaie." };

  const { error: memberError } = await supabase.from("member_profiles").insert({
    id: signUpData.user.id,
    first_name: firstName,
    last_name: lastName,
    birth_date: birthDate,
  });
  if (memberError) return { error: memberError.message };

  redirect(await resolveRedirect(supabase, signUpData.user.id, next));
}

export interface SignInState {
  error?: string;
}

const signInSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
  next: z.string().optional(),
});

/** US-03 AC2/AC6 — écran unique, public et admin : la redirection dépend du rôle, pas de l'écran. */
export async function signIn(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { error: "Email ou mot de passe incorrect." };
  if (!data.user) return { error: "Connexion impossible, réessaie." };

  redirect(await resolveRedirect(supabase, data.user.id, parsed.data.next));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
