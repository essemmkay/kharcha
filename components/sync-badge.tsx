"use client";

import { CloudOff, RefreshCw, Trash2 } from "lucide-react";
import { useSync } from "@/lib/sync/use-sync";
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

// Mounted once in the (app) header. useSync drives background sync (mount /
// online / tab-visible) and exposes the queue; the badge appears only while
// changes are pending.
export function SyncBadge() {
  const { count, errored, syncing, sync, discard } = useSync();

  if (count === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <CloudOff className={cn("size-4", errored.length && "text-destructive")} />
          <span className="tabular">{count}</span>
          <span className="sr-only">unsynced changes</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          {count} unsynced {count === 1 ? "change" : "changes"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void sync();
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
                key={e.seq}
                onSelect={(ev) => {
                  ev.preventDefault();
                  void discard(e.seq!);
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
