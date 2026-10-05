"use client";

import { ReceiptText } from "lucide-react";
import { TransactionRow } from "@/components/transaction-row";
import { EmptyState } from "@/components/empty-state";
import { useOutbox } from "@/lib/sync/use-outbox";
import type { TxRow } from "@/lib/tx-row";

type TxType = TxRow["type"];

export function TransactionList({
  rows,
  pendingFilter,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Tap + to add your first income or expense.",
}: {
  rows: TxRow[];
  // Restrict which unsynced creates to show, matching the page's own filters.
  pendingFilter?: { type?: TxType; accountId?: string };
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const { pending } = useOutbox();

  const pendingRows = pending
    .filter((e) => {
      if (pendingFilter?.type && e.display.type !== pendingFilter.type) return false;
      if (pendingFilter?.accountId) {
        const inp = e.input as { accountId?: string; toAccountId?: string };
        if (
          inp.accountId !== pendingFilter.accountId &&
          inp.toAccountId !== pendingFilter.accountId
        )
          return false;
      }
      return true;
    })
    .map((e) => e.display);

  if (rows.length === 0 && pendingRows.length === 0) {
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
      {pendingRows.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} unsynced />
      ))}
      {rows.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} />
      ))}
    </div>
  );
}
