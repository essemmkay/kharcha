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

export async function signUp(
  email: string,
  password: string,
  name?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: name ? { name } : undefined },
  });
  if (error) return { error: error.message };
  // Email verification is off for v1, so a session is returned immediately.
  if (!data.session) {
    return { error: "Check your email to confirm your account, then log in." };
  }
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
