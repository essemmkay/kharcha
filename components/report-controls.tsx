"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ReportControls({
  from,
  to,
  accounts,
}: {
  from: string;
  to: string;
  accounts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const account = sp.get("account") ?? "all";
  const type = sp.get("type") ?? "all";

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-3 rounded-xl border p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="r-from">From</Label>
          <Input
            id="r-from"
            type="date"
            value={from}
            onChange={(e) => setParam("from", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="r-to">To</Label>
          <Input
            id="r-to"
            type="date"
            value={to}
            onChange={(e) => setParam("to", e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Account</Label>
          <Select
            value={account}
            onValueChange={(v) => setParam("account", v === "all" ? null : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Select
            value={type}
            onValueChange={(v) => setParam("type", v === "all" ? null : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Income + Expense</SelectItem>
              <SelectItem value="INCOME">Income only</SelectItem>
              <SelectItem value="EXPENSE">Expense only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
