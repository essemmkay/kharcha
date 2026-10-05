"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { transactionSchema } from "@/lib/schemas";
import { zodMessage, type ActionResult } from "@/lib/types";

function revalidate() {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/accounts");
}

type Parsed = ReturnType<typeof transactionSchema.safeParse>;

async function assertOwnership(
  userId: string,
  data: Extract<Parsed, { success: true }>["data"],
): Promise<string | null> {
  const accountIds = [data.accountId];
  if (data.type === "TRANSFER") accountIds.push(data.toAccountId);
  const count = await prisma.account.count({
    where: { userId, id: { in: accountIds } },
  });
  if (count !== accountIds.length) return "Account not found";

  if (data.type !== "TRANSFER") {
    const cat = await prisma.category.count({
      where: { userId, id: data.categoryId, kind: data.type },
    });
    if (cat === 0) return "Category not found for this type";
  }
  return null;
}

function tagConnect(userId: string, tags: string[]) {
  const unique = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)));
  return unique.map((name) => ({
    where: { userId_name: { userId, name } },
    create: { userId, name },
  }));
}

export async function createTransaction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  const d = parsed.data;

  const ownErr = await assertOwnership(user.id, d);
  if (ownErr) return { ok: false, error: ownErr };

  const fields = {
    type: d.type,
    amount: d.amount,
    date: d.date,
    accountId: d.accountId,
    toAccountId: d.type === "TRANSFER" ? d.toAccountId : null,
    categoryId: d.type === "TRANSFER" ? null : d.categoryId,
    note: d.note,
  };
  const tags = { connectOrCreate: tagConnect(user.id, d.tags ?? []) };

  // With a client-authoritative id, upsert makes a replayed create idempotent.
  const tx = d.id
    ? await prisma.transaction.upsert({
        where: { id: d.id },
        create: { id: d.id, userId: user.id, ...fields, tags },
        update: { ...fields, deletedAt: null, tags: { set: [], ...tags } },
        select: { id: true },
      })
    : await prisma.transaction.create({
        data: { userId: user.id, ...fields, tags },
        select: { id: true },
      });
  revalidate();
  return { ok: true, data: tx };
}

export async function updateTransaction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  const d = parsed.data;

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Transaction not found" };

  const ownErr = await assertOwnership(user.id, d);
  if (ownErr) return { ok: false, error: ownErr };

  await prisma.transaction.update({
    where: { id },
    data: {
      type: d.type,
      amount: d.amount,
      date: d.date,
      accountId: d.accountId,
      toAccountId: d.type === "TRANSFER" ? d.toAccountId : null,
      categoryId: d.type === "TRANSFER" ? null : d.categoryId,
      note: d.note,
      tags: { set: [], connectOrCreate: tagConnect(user.id, d.tags ?? []) },
    },
  });
  revalidate();
  return { ok: true, data: { id } };
}

export async function deleteTransaction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  // Soft delete: set a tombstone so the delta pull propagates the removal.
  // No deletedAt filter, so a replayed delete stays idempotently successful.
  const result = await prisma.transaction.updateMany({
    where: { id, userId: user.id },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) return { ok: false, error: "Transaction not found" };
  revalidate();
  return { ok: true, data: { id } };
}
