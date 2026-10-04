"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AccountForm, type AccountFormValues } from "@/components/account-form";

export function AccountSheet({
  trigger,
  account,
}: {
  trigger: React.ReactNode;
  account?: AccountFormValues;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-w-lg">
        <SheetHeader>
          <SheetTitle>{account ? "Edit account" : "New account"}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6">
          <AccountForm account={account} onDone={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
