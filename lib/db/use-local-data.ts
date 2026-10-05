"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/local";

// Live view of the local store for the read pages. `ready` is false until the
// first liveQuery resolves (initial paint) so pages can show a loading state
// instead of a flash of empty data before the first sync lands.
export function useLocalData() {
  const data = useLiveQuery(async () => {
    const [accounts, categories, transactions, meta] = await Promise.all([
      db.accounts.toArray(),
      db.categories.toArray(),
      db.transactions.toArray(),
      db.meta.get("state"),
    ]);
    return { accounts, categories, transactions, meta };
  }, []);

  return {
    ready: data !== undefined,
    accounts: data?.accounts ?? [],
    categories: data?.categories ?? [],
    transactions: data?.transactions ?? [],
    baseCurrency: data?.meta?.baseCurrency ?? "USD",
    email: data?.meta?.email ?? null,
    name: data?.meta?.name ?? null,
  };
}
