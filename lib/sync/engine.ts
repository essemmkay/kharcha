"use client";

import { db, getMeta, setMeta } from "@/lib/db/local";
import {
  createAccount,
  updateAccount,
  deleteAccount,
} from "@/lib/actions/accounts";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/categories";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/actions/transactions";
import { pullChanges } from "@/lib/actions/sync";
import type { ActionResult } from "@/lib/types";
import type { Entity, Mutation, Op } from "@/lib/sync/types";

// ---- "syncing" flag, exposed to React via useSyncExternalStore ------------

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
  const mutation: Mutation = { id: crypto.randomUUID(), entity, op, recordId, payload };
  await db.queue.add(mutation);
  void sync();
}

// Dispatch one queued mutation to its server action.
function dispatch(m: Mutation): Promise<ActionResult<unknown>> {
  const p = m.payload as Record<string, unknown>;
  switch (m.entity) {
    case "account":
      if (m.op === "create") return createAccount(p);
      if (m.op === "update") return updateAccount(m.recordId, p);
      return deleteAccount(m.recordId);
    case "category":
      if (m.op === "create") return createCategory(p);
      if (m.op === "update") return updateCategory(m.recordId, p);
      return deleteCategory(m.recordId, p?.reassignToId as string | undefined);
    case "transaction":
      if (m.op === "create") return createTransaction(p);
      if (m.op === "update") return updateTransaction(m.recordId, p);
      return deleteTransaction(m.recordId);
  }
}

// ---- Push: replay the queue in order --------------------------------------

async function push(): Promise<void> {
  if (!navigator.onLine) return;
  // Replay in insertion order; re-read each pass so mid-flush adds aren't lost.
  // Creates carry client ids (upsert), so a replayed mutation is idempotent.
  for (;;) {
    const batch = await db.queue.orderBy("seq").toArray();
    const next = batch.find((m) => !m.error);
    if (!next) return;
    try {
      const res = await dispatch(next);
      if (res.ok) {
        await db.queue.delete(next.seq!);
      } else {
        // Permanent rejection (validation/ownership): keep for manual discard.
        await db.queue.update(next.seq!, { error: res.error });
      }
    } catch {
      return; // Transient (offline/DB): stop, retry on next sync.
    }
  }
}

// ---- Pull: merge server deltas into the local store -----------------------

async function pull(): Promise<void> {
  if (!navigator.onLine) return;
  const { lastSync } = await getMeta();
  const res = await pullChanges(lastSync ?? undefined);
  if (!res.ok) return;
  const snap = res.data;

  await db.transaction("rw", db.accounts, db.categories, db.transactions, async () => {
    for (const a of snap.accounts) {
      if (a.deletedAt) await db.accounts.delete(a.id);
      else await db.accounts.put(a);
    }
    for (const c of snap.categories) {
      if (c.deletedAt) await db.categories.delete(c.id);
      else await db.categories.put(c);
    }
    for (const tx of snap.transactions) {
      if (tx.deletedAt) await db.transactions.delete(tx.id);
      else await db.transactions.put(tx);
    }
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
  await db.queue.delete(seq);
}
