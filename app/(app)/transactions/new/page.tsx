"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, Wallet } from "lucide-react";
import { useLocalData } from "@/lib/db/use-local-data";
import { formOptions } from "@/lib/local-queries";
import { TransactionForm } from "@/components/transaction-form";
import { EmptyState } from "@/components/empty-state";
import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";

export default function NewTransactionPage() {
  const { ready, accounts, categories } = useLocalData();
  const { accounts: accOpts, categories: catOpts } = useMemo(
    () => formOptions(accounts, categories),
    [accounts, categories],
  );

  if (!ready) return <PageLoading />;

  return (
    <div className="space-y-4">
      <Link
        href="/transactions"
        className="inline-flex items-center text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" /> Transactions
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">Add transaction</h1>

      {accOpts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Create an account first"
          description="You need at least one account before adding a transaction."
          action={
            <Button asChild>
              <Link href="/accounts">Go to accounts</Link>
            </Button>
          }
        />
      ) : (
        <TransactionForm accounts={accOpts} categories={catOpts} />
      )}
    </div>
  );
}
