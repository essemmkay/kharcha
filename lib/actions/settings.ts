"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { profileSchema } from "@/lib/schemas";
import { zodMessage, type ActionResult } from "@/lib/types";

export async function updateProfile(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, baseCurrency: parsed.data.baseCurrency },
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true, data: { id: user.id } };
}

export async function exportData(): Promise<ActionResult<string>> {
  const user = await requireUser();
  const [accounts, categories, transactions, tags] = await Promise.all([
    prisma.account.findMany({ where: { userId: user.id } }),
    prisma.category.findMany({ where: { userId: user.id } }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      include: { tags: { select: { name: true } } },
    }),
    prisma.tag.findMany({ where: { userId: user.id } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user: { email: user.email, name: user.name, baseCurrency: user.baseCurrency },
    accounts,
    categories,
    transactions,
    tags,
  };
  return { ok: true, data: JSON.stringify(payload, null, 2) };
}
