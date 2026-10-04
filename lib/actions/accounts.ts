"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { accountSchema } from "@/lib/schemas";
import { zodMessage, type ActionResult } from "@/lib/types";

function revalidate() {
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/reports");
}

export async function createAccount(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };

  const a = await prisma.account.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      currency: parsed.data.currency,
      openingBalance: parsed.data.openingBalance,
      note: parsed.data.note,
    },
    select: { id: true },
  });
  revalidate();
  return { ok: true, data: a };
}

export async function updateAccount(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };

  const result = await prisma.account.updateMany({
    where: { id, userId: user.id },
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      currency: parsed.data.currency,
      openingBalance: parsed.data.openingBalance,
      note: parsed.data.note,
    },
  });
  if (result.count === 0) return { ok: false, error: "Account not found" };
  revalidate();
  return { ok: true, data: { id } };
}

export async function setAccountArchived(
  id: string,
  archived: boolean,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const result = await prisma.account.updateMany({
    where: { id, userId: user.id },
    data: { archived },
  });
  if (result.count === 0) return { ok: false, error: "Account not found" };
  revalidate();
  return { ok: true, data: { id } };
}

export async function deleteAccount(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  // Transactions referencing this account cascade (see schema onDelete).
  const result = await prisma.account.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) return { ok: false, error: "Account not found" };
  revalidate();
  return { ok: true, data: { id } };
}
