"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useLocalData } from "@/lib/db/use-local-data";
import { accountsWithBalances, listLocalTransactions } from "@/lib/local-queries";
import { formatMoney } from "@/lib/money";
import { TransactionList } from "@/components/transaction-list";
import { AccountSheet } from "@/components/account-sheet";
import { EmptyState } from "@/components/empty-state";
import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { ready, accounts, categories, transactions } = useLocalData();

  const view = useMemo(() => {
    const account = accountsWithBalances(accounts, transactions).find((a) => a.id === id);
    const rows = listLocalTransactions(transactions, accounts, categories, {
      accountId: id,
    });
    return { account, rows };
  }, [accounts, categories, transactions, id]);

  if (!ready) return <PageLoading />;

  const { account } = view;
  if (!account) {
    return (
      <div className="space-y-4">
        <Link href="/accounts" className="inline-flex items-center text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> Accounts
        </Link>
        <EmptyState
          icon={Wallet}
          title="Account not found"
          description="It may have been deleted on another device."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/accounts"
        className="inline-flex items-center text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" /> Accounts
      </Link>

      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{account.name}</p>
            <p className="text-2xl font-semibold tabular">
              {formatMoney(account.balance, account.currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Opening {formatMoney(account.openingBalance, account.currency)}
              {account.note ? ` · ${account.note}` : ""}
            </p>
          </div>
          <AccountSheet
            account={{
              id: account.id,
              name: account.name,
              type: account.type,
              currency: account.currency,
              openingBalance: account.openingBalance,
              note: account.note,
            }}
            trigger={<Button variant="outline" size="sm">Edit</Button>}
          />
        </div>
      </Card>

      <div>
        <h2 className="mb-1 px-2 text-sm font-medium text-muted-foreground">
          Transactions
        </h2>
        <TransactionList
          rows={view.rows}
          emptyTitle="No transactions on this account"
          emptyDescription="Add income, an expense, or a transfer to see it here."
        />
      </div>
    </div>
  );
}
