import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listTransactions } from "@/lib/queries";
import { monthRange, first } from "@/lib/dates";
import { toTxRow } from "@/lib/tx-row";
import { FilterBar } from "@/components/filter-bar";
import { TypeFilter } from "@/components/type-filter";
import { TransactionList } from "@/components/transaction-list";
import type { SearchParams } from "@/lib/types";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const user = await requireUser();

  const { from, to } = monthRange(first(sp.month));
  const accountId = first(sp.account);
  const type = first(sp.type) as "INCOME" | "EXPENSE" | "TRANSFER" | undefined;

  const [accounts, txs] = await Promise.all([
    prisma.account.findMany({
      where: { userId: user.id, archived: false },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    listTransactions(user.id, {
      from,
      to,
      accountId: accountId || undefined,
      type: type || undefined,
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
      <FilterBar accounts={accounts} />
      <TypeFilter />
      <TransactionList
        rows={txs.map(toTxRow)}
        emptyTitle="No transactions this month"
        emptyDescription="Try another month, or tap + to add one."
      />
    </div>
  );
}
