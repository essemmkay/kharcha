import Link from "next/link";
import { ChartPie, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getIncomeExpenseSeries,
  getMonthlySummary,
  getNetWorth,
  getNetWorthSeries,
  getRecentTransactions,
} from "@/lib/queries";
import { monthRange, first } from "@/lib/dates";
import type { SearchParams } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { toTxRow } from "@/lib/tx-row";
import { FilterBar } from "@/components/filter-bar";
import { TransactionList } from "@/components/transaction-list";
import { EmptyState } from "@/components/empty-state";
import { ExpenseDonut } from "@/components/charts/expense-donut";
import { IncomeExpenseBar } from "@/components/charts/income-expense-bar";
import { NetWorthLine } from "@/components/charts/networth-line";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const user = await requireUser();
  const { month } = monthRange(first(sp.month));
  const accountId = first(sp.account) || undefined;
  const cur = user.baseCurrency;

  const [accounts, netWorth, summary, ieSeries, nwSeries, recent] =
    await Promise.all([
      prisma.account.findMany({
        where: { userId: user.id, archived: false },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true },
      }),
      getNetWorth(user.id),
      getMonthlySummary(user.id, month, accountId),
      getIncomeExpenseSeries(user.id, 6, accountId),
      getNetWorthSeries(user.id, 12),
      getRecentTransactions(user.id, 6, accountId),
    ]);

  const topCategories = summary.byCategory.slice(0, 5);

  return (
    <div className="space-y-4">
      <FilterBar accounts={accounts} />

      {/* Net worth */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Net worth</p>
          <p className="text-3xl font-semibold tabular">
            {formatMoney(netWorth, cur)}
          </p>
        </CardContent>
      </Card>

      {/* Month income / expense */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Income</p>
            <p className="text-xl font-semibold tabular text-income">
              {formatMoney(summary.income, cur)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Expense</p>
            <p className="text-xl font-semibold tabular text-expense">
              {formatMoney(summary.expense, cur)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses by category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expenses by category</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.byCategory.length === 0 ? (
            <EmptyState
              icon={ChartPie}
              title="No expenses this month"
              description="Add a few transactions to see the breakdown."
            />
          ) : (
            <div className="grid items-center gap-4 sm:grid-cols-2">
              <ExpenseDonut data={summary.byCategory} currency={cur} />
              <ul className="space-y-2">
                {topCategories.map((c) => (
                  <li key={c.id} className="flex justify-between text-sm">
                    <span className="truncate">{c.name}</span>
                    <span className="tabular font-medium">
                      {formatMoney(c.total, cur)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Income vs expense */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Income vs expense</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeExpenseBar data={ieSeries} currency={cur} />
        </CardContent>
      </Card>

      {/* Net worth trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Net worth trend</CardTitle>
        </CardHeader>
        <CardContent>
          {nwSeries.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No data yet"
              description="Create accounts and add transactions to see the trend."
            />
          ) : (
            <NetWorthLine data={nwSeries} currency={cur} />
          )}
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Recent transactions</CardTitle>
          <Link href="/transactions" className="text-sm text-primary">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <TransactionList
            rows={recent.map(toTxRow)}
            emptyTitle="No transactions yet"
            emptyDescription="Tap + to add your first one."
          />
        </CardContent>
      </Card>
    </div>
  );
}
