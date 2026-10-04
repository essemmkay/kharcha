"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<ActionResult<unknown> | void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handle() {
    startTransition(async () => {
      const res = await onConfirm();
      if (res && res.ok === false) {
        toast.error(res.error);
        return;
      }
      toast.success("Done");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handle} disabled={pending}>
            {pending ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
