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

  const fields = {
    name: parsed.data.name,
    type: parsed.data.type,
    currency: parsed.data.currency,
    openingBalance: parsed.data.openingBalance,
    note: parsed.data.note,
  };
  const a = parsed.data.id
    ? await prisma.account.upsert({
        where: { id: parsed.data.id },
        create: { id: parsed.data.id, userId: user.id, ...fields },
        update: { ...fields, deletedAt: null },
        select: { id: true },
      })
    : await prisma.account.create({
        data: { userId: user.id, ...fields },
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
      ...(parsed.data.archived !== undefined
        ? { archived: parsed.data.archived }
        : {}),
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
  const now = new Date();
  // Soft delete + application-level cascade: tombstone the account and every
  // transaction on either side of it, so the delta pull removes them all.
  // ponytail: app-cascade replaces DB onDelete; revisit if relations grow.
  const [account] = await prisma.$transaction([
    prisma.account.updateMany({
      where: { id, userId: user.id },
      data: { deletedAt: now },
    }),
    prisma.transaction.updateMany({
      where: { userId: user.id, OR: [{ accountId: id }, { toAccountId: id }] },
      data: { deletedAt: now },
    }),
  ]);
  if (account.count === 0) return { ok: false, error: "Account not found" };
  revalidate();
  return { ok: true, data: { id } };
}
