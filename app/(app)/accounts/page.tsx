"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Coins, Gem, Landmark, Plus, Wallet } from "lucide-react";
import { useLocalData } from "@/lib/db/use-local-data";
import { accountsWithBalances, netWorth } from "@/lib/local-queries";
import { formatMoney } from "@/lib/money";
import { AccountSheet } from "@/components/account-sheet";
import { AccountActions } from "@/components/account-actions";
import { EmptyState } from "@/components/empty-state";
import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const typeIcon = { BANK: Landmark, CASH: Coins, ASSET: Gem } as const;

export default function AccountsPage() {
  const { ready, accounts, transactions, baseCurrency } = useLocalData();

  const { rows, worth } = useMemo(
    () => ({
      rows: accountsWithBalances(accounts, transactions),
      worth: netWorth(accounts, transactions),
    }),
    [accounts, transactions],
  );

  if (!ready) return <PageLoading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Net worth {formatMoney(worth, baseCurrency)}
          </p>
        </div>
        <AccountSheet
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> Add
            </Button>
          }
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add your bank, cash, or an asset to start tracking."
          action={<AccountSheet trigger={<Button>Add account</Button>} />}
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((a) => {
            const Icon = typeIcon[a.type];
            const values = {
              id: a.id,
              name: a.name,
              type: a.type,
              currency: a.currency,
              openingBalance: a.openingBalance,
              note: a.note,
              archived: a.archived,
            };
            return (
              <Card key={a.id} className="flex flex-row items-center gap-3 p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-5" />
                </div>
                <Link href={`/accounts/${a.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {a.name}
                    {a.archived && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (archived)
                      </span>
                    )}
                  </p>
                  <p className="text-sm tabular text-muted-foreground">
                    {formatMoney(a.balance, a.currency)}
                  </p>
                </Link>
                <AccountActions account={values} />
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
