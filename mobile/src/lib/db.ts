import * as SQLite from "expo-sqlite";
import type {
  SyncAccount,
  SyncCategory,
  SyncTransaction,
  Mutation,
} from "@/lib/sync/types";

// The local mirror of the user's data, replacing the web Dexie store. Rows are
// kept as JSON blobs (the wire shape verbatim: money as number, dates as ISO
// strings) because every read loads the full set and aggregates in JS (see
// local-queries), exactly as the Dexie version did. The queue is an ordered
// mutation log; meta holds the sync cursor + identity for offline display.

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

let database: SQLite.SQLiteDatabase | null = null;
let opening: Promise<SQLite.SQLiteDatabase> | null = null;

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("kharcha.db", {
    enableChangeListener: true,
  });
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY NOT NULL, json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY NOT NULL, json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY NOT NULL, json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS queue (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      id TEXT NOT NULL, entity TEXT NOT NULL, op TEXT NOT NULL,
      recordId TEXT NOT NULL, payload TEXT NOT NULL, error TEXT
    );
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
  `);
  database = db;
  return db;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (database) return Promise.resolve(database);
  if (!opening) opening = open();
  return opening;
}

// ---- Data tables (accounts / categories / transactions) -------------------

type RowShape = {
  accounts: SyncAccount;
  categories: SyncCategory;
  transactions: SyncTransaction;
};

export async function getAll<T extends DataTable>(
  table: T,
): Promise<RowShape[T][]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ json: string }>(
    `SELECT json FROM ${table}`,
  );
  return rows.map((r) => JSON.parse(r.json) as RowShape[T]);
}

export async function upsert<T extends DataTable>(
  table: T,
  row: RowShape[T],
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO ${table} (id, json) VALUES (?, ?)
     ON CONFLICT(id) DO UPDATE SET json = excluded.json`,
    [row.id, JSON.stringify(row)],
  );
}

export async function getRow<T extends DataTable>(
  table: T,
  id: string,
): Promise<RowShape[T] | undefined> {
  const db = await getDb();
  const r = await db.getFirstAsync<{ json: string }>(
    `SELECT json FROM ${table} WHERE id = ?`,
    [id],
  );
  return r ? (JSON.parse(r.json) as RowShape[T]) : undefined;
}

export async function removeRow(table: DataTable, id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [id]);
}

// ---- Queue ----------------------------------------------------------------

export async function enqueueRow(m: Mutation): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO queue (id, entity, op, recordId, payload, error)
     VALUES (?, ?, ?, ?, ?, NULL)`,
    [m.id, m.entity, m.op, m.recordId, JSON.stringify(m.payload)],
  );
}

export async function listQueue(): Promise<QueueRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    seq: number;
    id: string;
    entity: string;
    op: string;
    recordId: string;
    payload: string;
    error: string | null;
  }>(`SELECT * FROM queue ORDER BY seq ASC`);
  return rows.map((r) => ({
    seq: r.seq,
    id: r.id,
    entity: r.entity as Mutation["entity"],
    op: r.op as Mutation["op"],
    recordId: r.recordId,
    payload: JSON.parse(r.payload),
    error: r.error ?? undefined,
  }));
}

export async function deleteQueue(seq: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM queue WHERE seq = ?`, [seq]);
}

export async function setQueueError(seq: number, error: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE queue SET error = ? WHERE seq = ?`, [error, seq]);
}

// ---- Meta -----------------------------------------------------------------

export async function getMeta(): Promise<SyncMeta> {
  const db = await getDb();
  const r = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = 'state'`,
  );
  return r ? { ...DEFAULT_META, ...(JSON.parse(r.value) as SyncMeta) } : DEFAULT_META;
}

export async function setMeta(patch: Partial<SyncMeta>): Promise<void> {
  const db = await getDb();
  const next = { ...(await getMeta()), ...patch };
  await db.runAsync(
    `INSERT INTO meta (key, value) VALUES ('state', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [JSON.stringify(next)],
  );
}

// Fires whenever any table changes, so the read hook can reload.
export function onChange(listener: () => void): () => void {
  const sub = SQLite.addDatabaseChangeListener(() => listener());
  return () => sub.remove();
}
