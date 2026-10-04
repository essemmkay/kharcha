import Link from "next/link";
import { ChevronLeft, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getFormOptions } from "@/lib/form-options";
import { TransactionForm } from "@/components/transaction-form";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default async function NewTransactionPage() {
  const user = await requireUser();
  const { accounts, categories } = await getFormOptions(user.id);

  return (
    <div className="space-y-4">
      <Link
        href="/transactions"
        className="inline-flex items-center text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" /> Transactions
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">Add transaction</h1>

      {accounts.length === 0 ? (
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
        <TransactionForm accounts={accounts} categories={categories} />
      )}
    </div>
  );
}
