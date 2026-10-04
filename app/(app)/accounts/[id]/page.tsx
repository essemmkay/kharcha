import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccountsWithBalances, listTransactions } from "@/lib/queries";
import { formatMoney, toNumber } from "@/lib/money";
import { toTxRow } from "@/lib/tx-row";
import { TransactionList } from "@/components/transaction-list";
import { AccountSheet } from "@/components/account-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const account = await prisma.account.findFirst({
    where: { id, userId: user.id },
  });
  if (!account) notFound();

  const [withBalances, txs] = await Promise.all([
    getAccountsWithBalances(user.id),
    listTransactions(user.id, { accountId: id }),
  ]);
  const balance = withBalances.find((a) => a.id === id)?.balance ?? 0;

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
              {formatMoney(balance, account.currency)}
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
              openingBalance: toNumber(account.openingBalance),
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
          rows={txs.map(toTxRow)}
          emptyTitle="No transactions on this account"
          emptyDescription="Add income, an expense, or a transfer to see it here."
        />
      </div>
    </div>
  );
}
