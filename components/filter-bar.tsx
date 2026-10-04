"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addMonths, format, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AccountOption = { id: string; name: string };

export function FilterBar({ accounts }: { accounts: AccountOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const monthStr = sp.get("month") ?? format(new Date(), "yyyy-MM");
  const month = new Date(`${monthStr}-01T00:00:00`);
  const account = sp.get("account") ?? "all";

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-lg border">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous month"
          onClick={() => setParam("month", format(subMonths(month, 1), "yyyy-MM"))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-28 text-center text-sm font-medium tabular">
          {format(month, "MMMM yyyy")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next month"
          onClick={() => setParam("month", format(addMonths(month, 1), "yyyy-MM"))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <Select
        value={account}
        onValueChange={(v) => setParam("account", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[9.5rem]" aria-label="Filter by account">
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
  );
}
