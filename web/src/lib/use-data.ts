import { useLiveQuery } from "dexie-react-hooks";
import { db, getMeta } from "@/lib/db";

// Live view of the local IndexedDB store. useLiveQuery re-runs whenever any of
// the touched tables change (optimistic writes, sync pulls), so screens re-render
// automatically. `ready` is false until the first query resolves.
export function useLocalData() {
  const data = useLiveQuery(async () => {
    const [accounts, categories, transactions, meta] = await Promise.all([
      db.accounts.toArray(),
      db.categories.toArray(),
      db.transactions.toArray(),
      getMeta(),
    ]);
    return { accounts, categories, transactions, meta };
  }, []);

  return {
    ready: data !== undefined,
    accounts: data?.accounts ?? [],
    categories: data?.categories ?? [],
    transactions: data?.transactions ?? [],
    baseCurrency: data?.meta.baseCurrency ?? "USD",
    email: data?.meta.email ?? null,
    name: data?.meta.name ?? null,
  };
}
