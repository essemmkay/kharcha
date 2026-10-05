"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/local";
import {
  sync,
  discard,
  getSyncing,
  subscribeSyncing,
} from "@/lib/sync/engine";

// Drives background sync (mount / online / tab-visible) and exposes queue state
// to the UI. Mount the trigger effects once (in SyncBadge, rendered app-wide).
export function useSync() {
  const pending = useLiveQuery(() => db.queue.orderBy("seq").toArray(), [], []);
  const meta = useLiveQuery(() => db.meta.get("state"), []);
  const syncing = useSyncExternalStore(subscribeSyncing, getSyncing, () => false);

  useEffect(() => {
    void sync();
    const onOnline = () => void sync();
    const onVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const errored = pending.filter((m) => m.error);
  return {
    pending,
    count: pending.length,
    errored,
    syncing,
    lastSync: meta?.lastSync ?? null,
    sync,
    discard,
  };
}
