"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useLocalData } from "@/lib/db/use-local-data";
import { accountsWithBalances, listLocalTransactions } from "@/lib/local-queries";
import { monthRange } from "@/lib/dates";
import { FilterBar } from "@/components/filter-bar";
import { TypeFilter } from "@/components/type-filter";
import { TransactionList } from "@/components/transaction-list";
import { PageLoading } from "@/components/page-loading";

export default function TransactionsPage() {
  const sp = useSearchParams();
  const { ready, accounts, categories, transactions } = useLocalData();

  const { from, to } = monthRange(sp.get("month") ?? undefined);
  const accountId = sp.get("account") || undefined;
  const type = (sp.get("type") as "INCOME" | "EXPENSE" | "TRANSFER" | null) || undefined;

  const view = useMemo(() => {
    const accountOptions = accountsWithBalances(accounts, transactions)
      .filter((a) => !a.archived)
      .map((a) => ({ id: a.id, name: a.name }));
    const rows = listLocalTransactions(transactions, accounts, categories, {
      from,
      to,
      accountId,
      type,
    });
    return { accountOptions, rows };
  }, [accounts, categories, transactions, from, to, accountId, type]);

  if (!ready) return <PageLoading />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
      <FilterBar accounts={view.accountOptions} />
      <TypeFilter />
      <TransactionList
        rows={view.rows}
        emptyTitle="No transactions this month"
        emptyDescription="Try another month, or tap + to add one."
      />
    </div>
  );
}
