import Dexie, { type EntityTable } from "dexie";
import type {
  SyncAccount,
  SyncCategory,
  SyncTransaction,
  Mutation,
} from "@/lib/sync/types";

// Single-row meta record holding the sync cursor and the signed-in identity
// (seeded on first pull, used for offline display only — auth stays server-side).
export type SyncMeta = {
  key: "state";
  lastSync: string | null;
  email: string | null;
  name: string | null;
  baseCurrency: string;
};

// Queue rows get an auto-increment `seq` so push replays in insertion order.
type QueueRow = Mutation & { seq?: number };

// The local mirror of the user's data. Tables store the wire shapes verbatim
// (money as number, dates as ISO strings); tombstoned rows are kept until a
// pull removes them, and reads filter `deletedAt` out (see lib/local-queries).
export class KharchaDB extends Dexie {
  accounts!: EntityTable<SyncAccount, "id">;
  categories!: EntityTable<SyncCategory, "id">;
  transactions!: EntityTable<SyncTransaction, "id">;
  queue!: EntityTable<QueueRow, "seq">;
  meta!: EntityTable<SyncMeta, "key">;

  constructor() {
    super("kharcha");
    this.version(1).stores({
      accounts: "id, updatedAt, deletedAt, archived",
      categories: "id, updatedAt, deletedAt, kind, parentId",
      transactions: "id, date, accountId, toAccountId, categoryId, type, deletedAt, updatedAt",
      queue: "++seq, recordId, entity",
      meta: "key",
    });
  }
}

export const db = new KharchaDB();

export async function getMeta(): Promise<SyncMeta> {
  return (
    (await db.meta.get("state")) ?? {
      key: "state",
      lastSync: null,
      email: null,
      name: null,
      baseCurrency: "USD",
    }
  );
}

export async function setMeta(patch: Partial<Omit<SyncMeta, "key">>): Promise<void> {
  const current = await getMeta();
  await db.meta.put({ ...current, ...patch, key: "state" });
}
