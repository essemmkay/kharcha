"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  deleteTransaction,
  updateTransaction,
} from "@/lib/actions/transactions";
import { enqueue } from "@/lib/sync/outbox";
import type { TxRow } from "@/lib/tx-row";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Opt = { id: string; name: string };
type AccountOpt = { id: string; name: string; currency: string };
type TxType = "INCOME" | "EXPENSE" | "TRANSFER";

export type TransactionFormValues = {
  id: string;
  type: TxType;
  amount: number;
  date: string; // ISO
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  note: string | null;
  tags: string[];
};

const types: { value: TxType; label: string; active: string }[] = [
  { value: "INCOME", label: "Income", active: "bg-income text-income-foreground" },
  { value: "EXPENSE", label: "Expense", active: "bg-expense text-expense-foreground" },
  { value: "TRANSFER", label: "Transfer", active: "bg-foreground text-background" },
];

export function TransactionForm({
  accounts,
  categories,
  transaction,
}: {
  accounts: AccountOpt[];
  categories: { INCOME: Opt[]; EXPENSE: Opt[] };
  transaction?: TransactionFormValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [type, setType] = useState<TxType>(transaction?.type ?? "EXPENSE");
  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount) : "",
  );
  const [date, setDate] = useState(
    format(transaction ? new Date(transaction.date) : new Date(), "yyyy-MM-dd"),
  );
  const [accountId, setAccountId] = useState(
    transaction?.accountId ?? accounts[0]?.id ?? "",
  );
  const [toAccountId, setToAccountId] = useState(
    transaction?.toAccountId ?? accounts.find((a) => a.id !== accountId)?.id ?? "",
  );
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [note, setNote] = useState(transaction?.note ?? "");
  const [tags, setTags] = useState((transaction?.tags ?? []).join(", "));

  const catOptions = useMemo(
    () => (type === "INCOME" ? categories.INCOME : categories.EXPENSE),
    [type, categories],
  );

  // Keep a valid category selected when the type changes.
  const effectiveCategory =
    type !== "TRANSFER" && !catOptions.some((c) => c.id === categoryId)
      ? catOptions[0]?.id ?? ""
      : categoryId;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const base = { amount, date, accountId, note, tags: tagList };
    const input =
      type === "TRANSFER"
        ? { ...base, type, toAccountId }
        : { ...base, type, categoryId: effectiveCategory };

    // Edits of an existing row stay direct-to-server.
    if (transaction) {
      startTransition(async () => {
        const res = await updateTransaction(transaction.id, input);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Transaction updated");
        router.push("/transactions");
        router.refresh();
      });
      return;
    }

    // New transactions go into the outbox: show instantly, sync in background.
    const acc = accounts.find((a) => a.id === accountId);
    const display: TxRow = {
      id: crypto.randomUUID(),
      type,
      amount: Number(amount),
      date: new Date(date).toISOString(),
      account: acc?.name ?? "",
      toAccount:
        type === "TRANSFER"
          ? accounts.find((a) => a.id === toAccountId)?.name ?? null
          : null,
      category:
        type === "TRANSFER"
          ? null
          : catOptions.find((c) => c.id === effectiveCategory)?.name ?? null,
      categoryColor: null,
      note: note || null,
      currency: acc?.currency ?? "USD",
      tags: tagList,
    };
    enqueue(input, display);
    toast.success("Transaction added");
    router.push("/transactions");
  }

  function remove() {
    return deleteTransaction(transaction!.id).then((res) => {
      if (res.ok) {
        router.push("/transactions");
        router.refresh();
      }
      return res;
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Type segmented control */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {types.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={cn(
              "rounded-lg py-2 text-sm font-medium transition-colors",
              type === t.value ? t.active : "text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="space-y-1 text-center">
        <Label htmlFor="tx-amount" className="sr-only">
          Amount
        </Label>
        <Input
          id="tx-amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="h-16 border-0 bg-transparent text-center text-4xl font-semibold tabular shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tx-account">
          {type === "TRANSFER" ? "From account" : "Account"}
        </Label>
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger id="tx-account" className="w-full">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {type === "TRANSFER" ? (
        <div className="space-y-2">
          <Label htmlFor="tx-to">To account</Label>
          <Select value={toAccountId} onValueChange={setToAccountId}>
            <SelectTrigger id="tx-to" className="w-full">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((a) => a.id !== accountId)
                .map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="tx-category">Category</Label>
          <Select value={effectiveCategory} onValueChange={setCategoryId}>
            <SelectTrigger id="tx-category" className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {catOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="tx-date">Date</Label>
        <Input
          id="tx-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tx-note">Note (optional)</Label>
        <Textarea
          id="tx-note"
          value={note ?? ""}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tx-tags">Tags (comma separated, optional)</Label>
        <Input
          id="tx-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="work, reimbursable"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "Saving…" : transaction ? "Save changes" : "Add transaction"}
        </Button>
        {transaction && (
          <ConfirmDialog
            title="Delete transaction?"
            description="This permanently removes the transaction."
            onConfirm={remove}
            trigger={
              <Button type="button" variant="outline" size="icon" aria-label="Delete">
                <Trash2 className="size-4 text-destructive" />
              </Button>
            }
          />
        )}
      </div>
    </form>
  );
}
