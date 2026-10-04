"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartPie,
  LayoutDashboard,
  Plus,
  ReceiptText,
  Settings,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/transactions/new", label: "Add", icon: Plus },
  { href: "/reports", label: "Reports", icon: ChartPie },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-56 shrink-0 border-r p-4 md:block">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wallet className="size-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Kharcha</span>
      </div>
      <nav aria-label="Primary" className="space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/transactions/new"
              ? pathname === href
              : pathname.startsWith(href) && pathname !== "/transactions/new";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
