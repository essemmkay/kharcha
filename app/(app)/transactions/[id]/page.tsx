"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ReceiptText } from "lucide-react";
import { useLocalData } from "@/lib/db/use-local-data";
import { formOptions } from "@/lib/local-queries";
import { TransactionForm } from "@/components/transaction-form";
import { EmptyState } from "@/components/empty-state";
import { PageLoading } from "@/components/page-loading";

export default function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { ready, accounts, categories, transactions } = useLocalData();

  const { tx, accOpts, catOpts } = useMemo(() => {
    const t = transactions.find((x) => x.id === id && !x.deletedAt);
    const opts = formOptions(accounts, categories, true);
    return { tx: t, accOpts: opts.accounts, catOpts: opts.categories };
  }, [accounts, categories, transactions, id]);

  if (!ready) return <PageLoading />;

  return (
    <div className="space-y-4">
      <Link
        href="/transactions"
        className="inline-flex items-center text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" /> Transactions
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">Edit transaction</h1>

      {!tx ? (
        <EmptyState
          icon={ReceiptText}
          title="Transaction not found"
          description="It may have been deleted on another device."
        />
      ) : (
        <TransactionForm
          accounts={accOpts}
          categories={catOpts}
          transaction={{
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            date: tx.date,
            accountId: tx.accountId,
            toAccountId: tx.toAccountId,
            categoryId: tx.categoryId,
            note: tx.note,
            tags: tx.tags,
          }}
        />
      )}
    </div>
  );
}
