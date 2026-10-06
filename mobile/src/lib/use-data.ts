import { useCallback, useEffect, useState } from "react";
import { getAll, getMeta, onChange, type SyncMeta } from "@/lib/db";
import type {
  SyncAccount,
  SyncCategory,
  SyncTransaction,
} from "@/lib/sync/types";

type Data = {
  accounts: SyncAccount[];
  categories: SyncCategory[];
  transactions: SyncTransaction[];
  meta: SyncMeta;
};

// Live view of the local SQLite store, replacing the web useLiveQuery hook.
// Reloads on every database change event. `ready` is false until the first load
// resolves so screens can show a loading state instead of empty data.
export function useLocalData() {
  const [data, setData] = useState<Data | null>(null);

  const load = useCallback(async () => {
    const [accounts, categories, transactions, meta] = await Promise.all([
      getAll("accounts"),
      getAll("categories"),
      getAll("transactions"),
      getMeta(),
    ]);
    setData({ accounts, categories, transactions, meta });
  }, []);

  useEffect(() => {
    void load();
    return onChange(() => void load());
  }, [load]);

  return {
    ready: data !== null,
    accounts: data?.accounts ?? [],
    categories: data?.categories ?? [],
    transactions: data?.transactions ?? [],
    baseCurrency: data?.meta.baseCurrency ?? "USD",
    email: data?.meta.email ?? null,
    name: data?.meta.name ?? null,
  };
}
