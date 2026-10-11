import { useEffect, useSyncExternalStore } from "react";
import { sync, subscribeSyncing, getSyncing, getLastError } from "@/lib/sync/engine";
import { listQueue } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

// Drives background sync: once on mount, and whenever the tab comes back online
// or becomes visible again. Exposes the syncing flag, pending-queue count, and
// last error for a status badge.
export function useSync() {
  const syncing = useSyncExternalStore(subscribeSyncing, getSyncing);
  const error = useSyncExternalStore(subscribeSyncing, getLastError);
  const pending = useLiveQuery(async () => (await listQueue()).length, [], 0);

  useEffect(() => {
    void sync();
    const trigger = () => void sync();
    const onVisible = () => {
      if (document.visibilityState === "visible") trigger();
    };
    window.addEventListener("online", trigger);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", trigger);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return { syncing, pending: pending ?? 0, error, syncNow: () => void sync() };
}
