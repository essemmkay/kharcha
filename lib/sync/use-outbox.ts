"use client";

import { useSyncExternalStore } from "react";
import {
  discard,
  flush,
  getSnapshot,
  getSyncing,
  subscribe,
  type OutboxEntry,
} from "@/lib/sync/outbox";

const serverSnapshot: OutboxEntry[] = [];

export function useOutbox() {
  const pending = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
  const syncing = useSyncExternalStore(subscribe, getSyncing, () => false);
  return { pending, count: pending.length, syncing, flush, discard };
}
