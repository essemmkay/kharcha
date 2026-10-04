"use client";

import { useState, useTransition } from "react";
import { LogOut, Download } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/lib/actions/auth";
import { exportData } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";

export function ExportDataButton() {
  const [pending, setPending] = useState(false);

  async function onExport() {
    setPending(true);
    try {
      const res = await exportData();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const blob = new Blob([res.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kharcha-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" onClick={onExport} disabled={pending}>
      <Download className="size-4" />
      {pending ? "Exporting…" : "Export data (JSON)"}
    </Button>
  );
}

export function LogoutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      onClick={() => startTransition(() => signOut())}
      disabled={pending}
    >
      <LogOut className="size-4" />
      Log out
    </Button>
  );
}
