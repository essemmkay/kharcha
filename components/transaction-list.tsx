import { ReceiptText } from "lucide-react";
import { TransactionRow } from "@/components/transaction-row";
import { EmptyState } from "@/components/empty-state";
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
        <TransactionRow key={tx.id} tx={tx} />
      ))}
    </div>
  );
}
