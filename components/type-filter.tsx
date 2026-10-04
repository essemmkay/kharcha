"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const options = [
  { value: "", label: "All" },
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
  { value: "TRANSFER", label: "Transfer" },
] as const;

export function TypeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = sp.get("type") ?? "";

  function set(value: string) {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set("type", value);
    else p.delete("type");
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => set(o.value)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-sm",
            current === o.value
              ? "border-primary bg-primary/10 text-primary"
              : "text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
