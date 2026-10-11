import Dexie, { type Table } from "dexie";
import type {
  SyncAccount,
  SyncCategory,
  SyncTransaction,
  Mutation,
} from "@/lib/sync/types";

// Local mirror of the user's data in IndexedDB (Dexie). Rows are stored as the
// wire shape verbatim (money as number, dates as ISO strings); every read loads
// the full set and aggregates in JS (see local-queries). The queue is an
// ordered mutation log; meta holds the sync cursor + identity for offline use.
//
// This is the web counterpart of mobile/src/lib/db.ts (expo-sqlite); it exposes
// the same function surface so the sync engine and local-writes port 1:1.

export type DataTable = "accounts" | "categories" | "transactions";

export type SyncMeta = {
  lastSync: string | null;
  email: string | null;
  name: string | null;
  baseCurrency: string;
};

export type QueueRow = Mutation & { seq: number };

const DEFAULT_META: SyncMeta = {
  lastSync: null,
  email: null,
  name: null,
  baseCurrency: "USD",
};

type RowShape = {
  accounts: SyncAccount;
  categories: SyncCategory;
  transactions: SyncTransaction;
};

class KharchaDB extends Dexie {
  accounts!: Table<SyncAccount, string>;
  categories!: Table<SyncCategory, string>;
  transactions!: Table<SyncTransaction, string>;
  queue!: Table<QueueRow, number>;
  meta!: Table<{ key: string; value: SyncMeta }, string>;

  constructor() {
    super("kharcha");
    this.version(1).stores({
      accounts: "id",
      categories: "id",
      transactions: "id",
      queue: "++seq",
      meta: "key",
    });
  }
}

export const db = new KharchaDB();

function table<T extends DataTable>(name: T): Table<RowShape[T], string> {
  return db[name] as Table<RowShape[T], string>;
}

// Run several writes atomically across the data tables.
export function tx(cb: () => Promise<void>): Promise<void> {
  return db.transaction("rw", db.accounts, db.categories, db.transactions, cb);
}

// ---- Data tables ----------------------------------------------------------

export function getAll<T extends DataTable>(name: T): Promise<RowShape[T][]> {
  return table(name).toArray();
}

export function upsert<T extends DataTable>(name: T, row: RowShape[T]): Promise<string> {
  return table(name).put(row);
}

export function getRow<T extends DataTable>(
  name: T,
  id: string,
): Promise<RowShape[T] | undefined> {
  return table(name).get(id);
}

export function removeRow(name: DataTable, id: string): Promise<void> {
  return table(name).delete(id);
}

// ---- Queue ----------------------------------------------------------------

export async function enqueueRow(m: Mutation): Promise<void> {
  await db.queue.add(m as QueueRow); // seq auto-assigned
}

export function listQueue(): Promise<QueueRow[]> {
  return db.queue.orderBy("seq").toArray();
}

export function deleteQueue(seq: number): Promise<void> {
  return db.queue.delete(seq);
}

export async function setQueueError(seq: number, error: string): Promise<void> {
  await db.queue.update(seq, { error });
}

// ---- Meta -----------------------------------------------------------------

export async function getMeta(): Promise<SyncMeta> {
  const row = await db.meta.get("state");
  return row ? { ...DEFAULT_META, ...row.value } : DEFAULT_META;
}

export async function setMeta(patch: Partial<SyncMeta>): Promise<void> {
  const next = { ...(await getMeta()), ...patch };
  await db.meta.put({ key: "state", value: next });
}

// Wipe everything on sign-out so the next user starts clean.
export async function clearLocal(): Promise<void> {
  await Promise.all([
    db.accounts.clear(),
    db.categories.clear(),
    db.transactions.clear(),
    db.queue.clear(),
    db.meta.clear(),
  ]);
}
