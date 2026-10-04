"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CategoryForm, type CategoryFormValues } from "@/components/category-form";

export function CategorySheet({
  trigger,
  kind,
  parents,
  category,
}: {
  trigger: React.ReactNode;
  kind: "INCOME" | "EXPENSE";
  parents: { id: string; name: string }[];
  category?: CategoryFormValues;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-w-lg">
        <SheetHeader>
          <SheetTitle>{category ? "Edit category" : "New category"}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6">
          <CategoryForm
            category={category}
            kind={kind}
            parents={parents}
            onDone={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
