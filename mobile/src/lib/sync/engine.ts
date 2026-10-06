import { randomUUID } from "expo-crypto";
import {
  getDb,
  getMeta,
  setMeta,
  upsert,
  removeRow,
  enqueueRow,
  listQueue,
  deleteQueue,
  setQueueError,
} from "@/lib/db";
import { apiGet, apiPost, type ActionResult } from "@/lib/api";
import type { Entity, Mutation, Op, SyncSnapshot } from "@/lib/sync/types";

// Offline-first sync engine, ported from the web Dexie version. push() replays
// the ordered mutation queue through the headless API (idempotent: creates carry
// a client id -> upsert); pull() merges the delta snapshot into SQLite and
// advances the cursor. Transient failures (thrown by lib/api) stop a pass and
// retry later; server rejections (ok:false) mark the mutation for manual discard.

// ---- "syncing" flag, for useSyncExternalStore ----------------------------

let syncing = false;
const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}
export function subscribeSyncing(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function getSyncing(): boolean {
  return syncing;
}

// ---- Queueing -------------------------------------------------------------

export async function enqueue(
  entity: Entity,
  op: Op,
  recordId: string,
  payload: unknown,
): Promise<void> {
  const mutation: Mutation = { id: randomUUID(), entity, op, recordId, payload };
  await enqueueRow(mutation);
  void sync();
}

const PATHS: Record<Entity, string> = {
  account: "/api/accounts",
  category: "/api/categories",
  transaction: "/api/transactions",
};

// Dispatch one queued mutation to its API endpoint.
function dispatch(m: Mutation): Promise<ActionResult<unknown>> {
  const path = PATHS[m.entity];
  const p = m.payload as Record<string, unknown>;
  if (m.op === "create") return apiPost(path, { op: "create", input: p });
  if (m.op === "update")
    return apiPost(path, { op: "update", id: m.recordId, input: p });
  // delete (categories can carry a reassignToId)
  return apiPost(path, {
    op: "delete",
    id: m.recordId,
    reassignToId: p?.reassignToId as string | undefined,
  });
}

// ---- Push: replay the queue in order --------------------------------------

async function push(): Promise<void> {
  // Re-read each pass so mid-flush adds aren't lost. Creates carry client ids
  // (upsert), so a replayed mutation is idempotent server-side.
  for (;;) {
    const batch = await listQueue();
    const next = batch.find((m) => !m.error);
    if (!next) return;
    let res: ActionResult<unknown>;
    try {
      res = await dispatch(next);
    } catch {
      return; // Transient (offline/5xx/401): stop, retry on next sync.
    }
    if (res.ok) await deleteQueue(next.seq);
    // Permanent rejection (validation/ownership): keep for manual discard.
    else await setQueueError(next.seq, res.error);
  }
}

// ---- Pull: merge server deltas into the local store -----------------------

async function pull(): Promise<void> {
  const { lastSync } = await getMeta();
  const qs = lastSync ? `?since=${encodeURIComponent(lastSync)}` : "";
  let res: ActionResult<SyncSnapshot>;
  try {
    res = await apiGet<SyncSnapshot>(`/api/sync${qs}`);
  } catch {
    return; // Transient: retry next sync.
  }
  if (!res.ok) return;
  const snap = res.data;

  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const a of snap.accounts)
      a.deletedAt ? await removeRow("accounts", a.id) : await upsert("accounts", a);
    for (const c of snap.categories)
      c.deletedAt
        ? await removeRow("categories", c.id)
        : await upsert("categories", c);
    for (const tx of snap.transactions)
      tx.deletedAt
        ? await removeRow("transactions", tx.id)
        : await upsert("transactions", tx);
  });

  await setMeta({
    lastSync: snap.serverTime,
    email: snap.user.email,
    name: snap.user.name,
    baseCurrency: snap.user.baseCurrency,
  });
}

// ---- sync() = push then pull ----------------------------------------------

let running: Promise<void> | null = null;

export function sync(): Promise<void> {
  if (running) return running;
  syncing = true;
  emit();
  running = (async () => {
    try {
      await push();
      await pull();
    } finally {
      syncing = false;
      running = null;
      emit();
    }
  })();
  return running;
}

export async function discard(seq: number): Promise<void> {
  await deleteQueue(seq);
}
