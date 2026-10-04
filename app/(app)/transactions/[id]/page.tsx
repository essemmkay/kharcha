import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFormOptions } from "@/lib/form-options";
import { toNumber } from "@/lib/money";
import { TransactionForm } from "@/components/transaction-form";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const tx = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
    include: { tags: { select: { name: true } } },
  });
  if (!tx) notFound();

  const { accounts, categories } = await getFormOptions(user.id, true);

  return (
    <div className="space-y-4">
      <Link
        href="/transactions"
        className="inline-flex items-center text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" /> Transactions
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">Edit transaction</h1>

      <TransactionForm
        accounts={accounts}
        categories={categories}
        transaction={{
          id: tx.id,
          type: tx.type,
          amount: toNumber(tx.amount),
          date: tx.date.toISOString(),
          accountId: tx.accountId,
          toAccountId: tx.toAccountId,
          categoryId: tx.categoryId,
          note: tx.note,
          tags: tx.tags.map((t) => t.name),
        }}
      />
    </div>
  );
}
