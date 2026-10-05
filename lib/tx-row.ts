// Plain transaction row rendered by TransactionList/TransactionRow and produced
// by lib/local-queries from the local store.
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
