"use client";

import { db } from "@/lib/db/local";
import { enqueue } from "@/lib/sync/engine";
import { accountSchema, categorySchema, transactionSchema } from "@/lib/schemas";
import { zodMessage, type ActionResult } from "@/lib/types";

// Client write path: validate with the same zod schema the server uses, apply
// optimistically to the local store (so useLiveQuery re-renders instantly), then
// queue the mutation for background push. Creates mint a client-authoritative id
// so the queued create is idempotent server-side (upsert).
type Result = ActionResult<{ id: string }>;

const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

// ---- Accounts -------------------------------------------------------------

export async function saveAccount(values: unknown): Promise<Result> {
  const parsed = accountSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  const d = parsed.data;
  const isUpdate = !!d.id;
  const id = d.id ?? newId();
  const existing = isUpdate ? await db.accounts.get(id) : undefined;

  await db.accounts.put({
    id,
    name: d.name,
    type: d.type,
    currency: d.currency,
    openingBalance: d.openingBalance,
    note: d.note,
    archived: existing?.archived ?? false,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
    deletedAt: null,
  });
  await enqueue("account", isUpdate ? "update" : "create", id, { ...d, id });
  return { ok: true, data: { id } };
}

export async function setAccountArchived(
  id: string,
  archived: boolean,
): Promise<Result> {
  const a = await db.accounts.get(id);
  if (!a) return { ok: false, error: "Account not found" };
  await db.accounts.put({ ...a, archived, updatedAt: now() });
  await enqueue("account", "update", id, {
    id,
    name: a.name,
    type: a.type,
    currency: a.currency,
    openingBalance: a.openingBalance,
    note: a.note,
    archived,
  });
  return { ok: true, data: { id } };
}

export async function deleteAccount(id: string): Promise<Result> {
  await db.transaction("rw", db.accounts, db.transactions, async () => {
    await db.accounts.delete(id);
    const orphans = await db.transactions
      .filter((t) => t.accountId === id || t.toAccountId === id)
      .primaryKeys();
    await db.transactions.bulkDelete(orphans);
  });
  await enqueue("account", "delete", id, {});
  return { ok: true, data: { id } };
}

// ---- Categories -----------------------------------------------------------

export async function saveCategory(values: unknown): Promise<Result> {
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  const d = parsed.data;
  const isUpdate = !!d.id;
  const id = d.id ?? newId();
  const existing = isUpdate ? await db.categories.get(id) : undefined;

  await db.categories.put({
    id,
    name: d.name,
    kind: d.kind,
    parentId: d.parentId ?? null,
    icon: d.icon,
    color: d.color,
    archived: existing?.archived ?? false,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
    deletedAt: null,
  });
  await enqueue("category", isUpdate ? "update" : "create", id, { ...d, id });
  return { ok: true, data: { id } };
}

export async function deleteCategory(
  id: string,
  reassignToId?: string,
): Promise<Result> {
  await db.transaction("rw", db.categories, db.transactions, async () => {
    await db.categories.delete(id);
    const affected = await db.transactions
      .filter((t) => t.categoryId === id)
      .toArray();
    await Promise.all(
      affected.map((t) =>
        db.transactions.put({
          ...t,
          categoryId: reassignToId ?? null,
          updatedAt: now(),
        }),
      ),
    );
  });
  await enqueue("category", "delete", id, { reassignToId });
  return { ok: true, data: { id } };
}

// ---- Transactions ---------------------------------------------------------

export async function saveTransaction(values: unknown): Promise<Result> {
  const parsed = transactionSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  const d = parsed.data;
  const isUpdate = !!d.id;
  const id = d.id ?? newId();
  const existing = isUpdate ? await db.transactions.get(id) : undefined;

  await db.transactions.put({
    id,
    type: d.type,
    amount: d.amount,
    date: d.date.toISOString(),
    accountId: d.accountId,
    toAccountId: d.type === "TRANSFER" ? d.toAccountId : null,
    categoryId: d.type === "TRANSFER" ? null : d.categoryId,
    note: d.note,
    tags: d.tags ?? [],
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
    deletedAt: null,
  });
  await enqueue("transaction", isUpdate ? "update" : "create", id, { ...d, id });
  return { ok: true, data: { id } };
}

export async function deleteTransaction(id: string): Promise<Result> {
  await db.transactions.delete(id);
  await enqueue("transaction", "delete", id, {});
  return { ok: true, data: { id } };
}
