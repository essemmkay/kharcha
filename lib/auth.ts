import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { seedDefaultCategories } from "@/lib/default-categories";

// Returns the app User for the current Supabase session, creating it on first
// login. Redirects to /login when there is no session. Use in server
// components and server actions.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const existing = await prisma.user.findUnique({
    where: { authId: authUser.id },
  });
  if (existing) return existing;

  // First login: create the app user and seed default categories.
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
