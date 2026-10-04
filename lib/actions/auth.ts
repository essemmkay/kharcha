"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

// Signup is disabled for v1 (single-user app). Create your one user in the
// Supabase dashboard (Authentication > Users) and also turn off "Allow new
// users to sign up" in Supabase auth settings. Re-add a signUp action here when
// opening the app to multiple users.

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
