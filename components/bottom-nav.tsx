"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartPie, LayoutDashboard, Plus, ReceiptText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/reports", label: "Reports", icon: ChartPie },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 items-center">
        {items.slice(0, 2).map((it) => (
          <NavLink key={it.href} {...it} active={pathname.startsWith(it.href)} />
        ))}
        <li className="flex justify-center">
          <Link
            href="/transactions/new"
            aria-label="Add transaction"
            className="flex size-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
          >
            <Plus className="size-6" />
          </Link>
        </li>
        {items.slice(2).map((it) => (
          <NavLink key={it.href} {...it} active={pathname.startsWith(it.href)} />
        ))}
      </ul>
    </nav>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex min-h-14 flex-col items-center justify-center gap-1 text-xs",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="size-5" />
        <span>{label}</span>
      </Link>
    </li>
  );
}
