import Link from "next/link";
import { format } from "date-fns";
import { ArrowDownRight, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { signedMoney } from "@/lib/money";
import type { TxRow } from "@/lib/tx-row";

const meta = {
  INCOME: { icon: ArrowUpRight, tint: "text-income", bg: "bg-income/10" },
  EXPENSE: { icon: ArrowDownRight, tint: "text-expense", bg: "bg-expense/10" },
  TRANSFER: { icon: ArrowLeftRight, tint: "text-transfer", bg: "bg-muted" },
} as const;

export function TransactionRow({
  tx,
  unsynced = false,
}: {
  tx: TxRow;
  unsynced?: boolean;
}) {
  const m = meta[tx.type];
  const Icon = m.icon;
  const title =
    tx.type === "TRANSFER" ? "Transfer" : tx.category ?? "Uncategorized";
  const subtitle =
    tx.type === "TRANSFER"
      ? `${tx.account} → ${tx.toAccount ?? "?"}`
      : tx.account;

  const inner = (
    <>
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          m.bg,
          m.tint,
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        <p className="truncate text-sm text-muted-foreground">
          {subtitle}
          {tx.note ? ` · ${tx.note}` : ""}
        </p>
      </div>
      <div className="text-right">
        <p className={cn("font-semibold tabular", m.tint)}>
          {signedMoney(tx.amount, tx.type, tx.currency)}
        </p>
        {unsynced ? (
          <p className="text-xs text-muted-foreground">Unsynced</p>
        ) : (
          <p className="text-xs text-muted-foreground tabular">
            {format(new Date(tx.date), "MMM d")}
          </p>
        )}
      </div>
    </>
  );

  // Unsynced rows have only a temp id, so they aren't tappable yet.
  if (unsynced) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-2 py-2 opacity-60">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/transactions/${tx.id}`}
      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60"
    >
      {inner}
    </Link>
  );
}
