import { useEffect, useState, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { getSyncing, subscribeSyncing, sync } from "@/lib/sync/engine";
import { listQueue, onChange } from "@/lib/db";

// Drives background sync and exposes status to the UI. Triggers: mount, when the
// connection returns (NetInfo), and when the app foregrounds (AppState). Also
// tracks the count of still-pending (non-errored) queued mutations.
export function useSync() {
  const syncing = useSyncExternalStore(subscribeSyncing, getSyncing, getSyncing);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    void sync();
    const unsubNet = NetInfo.addEventListener((s) => {
      if (s.isConnected) void sync();
    });
    const appSub = AppState.addEventListener("change", (state) => {
      if (state === "active") void sync();
    });
    return () => {
      unsubNet();
      appSub.remove();
    };
  }, []);

  useEffect(() => {
    const refresh = () =>
      void listQueue().then((q) =>
        setPending(q.filter((m) => !m.error).length),
      );
    refresh();
    return onChange(refresh);
  }, []);

  return { syncing, pending, syncNow: sync };
}
