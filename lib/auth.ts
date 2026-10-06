import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { seedDefaultCategories } from "@/lib/default-categories";

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

// Find-or-create the app User for a verified Supabase auth identity, seeding
// default categories on first login. Shared by the cookie (web) and Bearer
// (native app) auth paths.
async function resolveAppUser(authUser: AuthUser) {
  const existing = await prisma.user.findUnique({
    where: { authId: authUser.id },
  });
  if (existing) return existing;

  const user = await prisma.user.create({
    data: {
      authId: authUser.id,
      email: authUser.email ?? "",
      name: (authUser.user_metadata?.name as string | undefined) ?? null,
    },
  });
  await seedDefaultCategories(user.id);
  return user;
}

// Resolves the app User for the current request from either an `Authorization:
// Bearer <token>` header (native app / API) or the Supabase session cookie
// (web). Returns null when unauthenticated. Works inside both route handlers
// and server actions, so an action invoked from a Bearer-authenticated handler
// picks up the same token through `headers()`.
export async function getAuthedUser() {
  const authHeader = (await headers()).get("authorization");
  const token = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (token) {
    const sb = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const {
      data: { user },
    } = await sb.auth.getUser(token);
    return user ? resolveAppUser(user) : null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? resolveAppUser(user) : null;
}

// Returns the app User for the current session, creating it on first login.
// Redirects to /login when there is no session. Use in server components and
// server actions. Route handlers should call getAuthedUser() and return 401.
export async function requireUser() {
  const user = await getAuthedUser();
  if (!user) redirect("/login");
  return user;
}
