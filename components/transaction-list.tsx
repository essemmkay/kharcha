"use client";

import { ReceiptText } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { TransactionRow } from "@/components/transaction-row";
import { EmptyState } from "@/components/empty-state";
import { db } from "@/lib/db/local";
import type { TxRow } from "@/lib/tx-row";

export function TransactionList({
  rows,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Tap + to add your first income or expense.",
}: {
  rows: TxRow[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  // Rows come from the local store already; mark the ones still in the sync
  // queue (not yet confirmed by the server) as unsynced.
  const pendingIds = useLiveQuery(
    async () => {
      const q = await db.queue.where("entity").equals("transaction").toArray();
      return new Set(q.map((m) => m.recordId));
    },
    [],
    new Set<string>(),
  );

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }
  return (
    <div className="divide-y">
      {rows.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} unsynced={pendingIds.has(tx.id)} />
      ))}
    </div>
  );
}
