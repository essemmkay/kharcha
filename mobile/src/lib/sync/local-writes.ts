import { randomUUID } from "expo-crypto";
import {
  getDb,
  getAll,
  getRow,
  upsert,
  removeRow,
} from "@/lib/db";
import { enqueue } from "@/lib/sync/engine";
import { accountSchema, categorySchema, transactionSchema } from "@/lib/schemas";
import { zodMessage, type ActionResult } from "@/lib/types";

// Local write path, ported from the web Dexie version: validate with the same
// zod schema the server uses, apply optimistically to SQLite (the read hook
// re-renders on the change event), then queue the mutation for background push.
// Creates mint a client-authoritative id so the queued create is idempotent.
type Result = ActionResult<{ id: string }>;

const now = () => new Date().toISOString();
const newId = () => randomUUID();

// ---- Accounts -------------------------------------------------------------

export async function saveAccount(values: unknown): Promise<Result> {
  const parsed = accountSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };
  const d = parsed.data;
  const isUpdate = !!d.id;
  const id = d.id ?? newId();
  const existing = isUpdate ? await getRow("accounts", id) : undefined;

  await upsert("accounts", {
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
  const a = await getRow("accounts", id);
  if (!a) return { ok: false, error: "Account not found" };
  await upsert("accounts", { ...a, archived, updatedAt: now() });
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
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await removeRow("accounts", id);
    const txs = await getAll("transactions");
    for (const t of txs)
      if (t.accountId === id || t.toAccountId === id)
        await removeRow("transactions", t.id);
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
  const existing = isUpdate ? await getRow("categories", id) : undefined;

  await upsert("categories", {
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
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await removeRow("categories", id);
    const txs = await getAll("transactions");
    for (const t of txs)
      if (t.categoryId === id)
        await upsert("transactions", {
          ...t,
          categoryId: reassignToId ?? null,
          updatedAt: now(),
        });
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
  const existing = isUpdate ? await getRow("transactions", id) : undefined;

  await upsert("transactions", {
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
  await removeRow("transactions", id);
  await enqueue("transaction", "delete", id, {});
  return { ok: true, data: { id } };
}
