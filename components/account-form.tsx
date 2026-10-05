"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveAccount } from "@/lib/sync/local-writes";
import { accountTypes } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AccountFormValues = {
  id?: string;
  name: string;
  type: (typeof accountTypes)[number];
  currency: string;
  openingBalance: number;
  note: string | null;
};

const typeLabels: Record<(typeof accountTypes)[number], string> = {
  BANK: "Bank",
  CASH: "Cash",
  ASSET: "Asset",
};

export function AccountForm({
  account,
  onDone,
}: {
  account?: AccountFormValues;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState(account?.type ?? "BANK");
  const [currency, setCurrency] = useState(account?.currency ?? "USD");
  const [openingBalance, setOpeningBalance] = useState(
    account ? String(account.openingBalance) : "0",
  );
  const [note, setNote] = useState(account?.note ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveAccount({
        id: account?.id,
        name,
        type,
        currency,
        openingBalance,
        note,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(account ? "Account updated" : "Account created");
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="acc-name">Name</Label>
        <Input
          id="acc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Checking"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="acc-type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger id="acc-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accountTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {typeLabels[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="acc-currency">Currency</Label>
          <Input
            id="acc-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            placeholder="USD"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="acc-opening">Opening balance</Label>
        <Input
          id="acc-opening"
          type="number"
          inputMode="decimal"
          step="0.01"
          value={openingBalance}
          onChange={(e) => setOpeningBalance(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="acc-note">Note (optional)</Label>
        <Textarea
          id="acc-note"
          value={note ?? ""}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : account ? "Save changes" : "Create account"}
      </Button>
    </form>
  );
}
