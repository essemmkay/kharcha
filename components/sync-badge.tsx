"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, RefreshCw, Trash2 } from "lucide-react";
import { useOutbox } from "@/lib/sync/use-outbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function SyncBadge() {
  const { pending, count, syncing, flush, discard } = useOutbox();
  const router = useRouter();

  // Try to sync on load, when coming back online, and when the tab regains focus.
  useEffect(() => {
    void flush();
    const onOnline = () => void flush();
    const onVisible = () => {
      if (document.visibilityState === "visible") void flush();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [flush]);

  // When the queue drains, pull the now-synced rows from the server.
  useEffect(() => {
    if (count === 0) router.refresh();
  }, [count, router]);

  if (count === 0) return null;

  const errored = pending.filter((e) => e.error);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <CloudOff className={cn("size-4", errored.length && "text-destructive")} />
          <span className="tabular">{count}</span>
          <span className="sr-only">unsynced transactions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          {count} unsynced {count === 1 ? "transaction" : "transactions"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void flush();
          }}
          disabled={syncing}
        >
          <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
          {syncing ? "Syncing…" : "Sync now"}
        </DropdownMenuItem>
        {errored.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-destructive">
              Rejected by server
            </DropdownMenuLabel>
            {errored.map((e) => (
              <DropdownMenuItem
                key={e.id}
                onSelect={(ev) => {
                  ev.preventDefault();
                  discard(e.id);
                }}
                className="flex-col items-start gap-0.5"
              >
                <span className="flex items-center gap-1.5 text-destructive">
                  <Trash2 className="size-3.5" /> Discard
                </span>
                <span className="text-xs text-muted-foreground">{e.error}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
