"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChartPie, TrendingUp } from "lucide-react";
import { useLocalData } from "@/lib/db/use-local-data";
import {
  accountsWithBalances,
  incomeExpenseSeries,
  listLocalTransactions,
  monthlySummary,
  netWorth,
  netWorthSeries,
} from "@/lib/local-queries";
import { monthRange } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { FilterBar } from "@/components/filter-bar";
import { TransactionList } from "@/components/transaction-list";
import { EmptyState } from "@/components/empty-state";
import { ExpenseDonut } from "@/components/charts/expense-donut";
import { IncomeExpenseBar } from "@/components/charts/income-expense-bar";
import { NetWorthLine } from "@/components/charts/networth-line";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/page-loading";

export default function DashboardPage() {
  const sp = useSearchParams();
  const { ready, accounts, categories, transactions, baseCurrency: cur } =
    useLocalData();
  const { month } = monthRange(sp.get("month") ?? undefined);
  const accountId = sp.get("account") || undefined;

  const view = useMemo(() => {
    const accountOptions = accountsWithBalances(accounts, transactions)
      .filter((a) => !a.archived)
      .map((a) => ({ id: a.id, name: a.name }));
    return {
      accountOptions,
      netWorth: netWorth(accounts, transactions),
      summary: monthlySummary(transactions, categories, month, accountId),
      ieSeries: incomeExpenseSeries(transactions, 6, accountId),
      nwSeries: netWorthSeries(accounts, transactions, 12),
      recent: listLocalTransactions(
        transactions,
        accounts,
        categories,
        accountId ? { accountId } : {},
        6,
      ),
    };
  }, [accounts, categories, transactions, month, accountId]);

  if (!ready) return <PageLoading />;

  const { summary } = view;
  const topCategories = summary.byCategory.slice(0, 5);

  return (
    <div className="space-y-4">
      <FilterBar accounts={view.accountOptions} />

      {/* Net worth */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Net worth</p>
          <p className="text-3xl font-semibold tabular">
            {formatMoney(view.netWorth, cur)}
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
          <IncomeExpenseBar data={view.ieSeries} currency={cur} />
        </CardContent>
      </Card>

      {/* Net worth trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Net worth trend</CardTitle>
        </CardHeader>
        <CardContent>
          {view.nwSeries.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No data yet"
              description="Create accounts and add transactions to see the trend."
            />
          ) : (
            <NetWorthLine data={view.nwSeries} currency={cur} />
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
            rows={view.recent}
            emptyTitle="No transactions yet"
            emptyDescription="Tap + to add your first one."
          />
        </CardContent>
      </Card>
    </div>
  );
}
