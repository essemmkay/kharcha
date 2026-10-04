import { toNumber } from "@/lib/money";

export type TxRow = {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  date: string;
  account: string;
  toAccount: string | null;
  category: string | null;
  categoryColor: string | null;
  note: string | null;
  currency: string;
  tags: string[];
};

// Shape produced by queries using txInclude.
type RawTx = {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: unknown;
  date: Date;
  note: string | null;
  account: { name: string; currency: string };
  toAccount: { name: string } | null;
  category: { name: string; color: string | null } | null;
  tags: { name: string }[];
};

export function toTxRow(t: RawTx): TxRow {
  return {
    id: t.id,
    type: t.type,
    amount: toNumber(t.amount as never),
    date: t.date.toISOString(),
    account: t.account.name,
    toAccount: t.toAccount?.name ?? null,
    category: t.category?.name ?? null,
    categoryColor: t.category?.color ?? null,
    note: t.note,
    currency: t.account.currency,
    tags: t.tags.map((x) => x.name),
  };
}
