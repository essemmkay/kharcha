"use client";

import { Pencil, Trash2 } from "lucide-react";
import { deleteCategory } from "@/lib/sync/local-writes";
import { CategorySheet } from "@/components/category-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { CategoryFormValues } from "@/components/category-form";

export function CategoryActions({
  category,
  parents,
}: {
  category: CategoryFormValues;
  parents: { id: string; name: string }[];
}) {
  return (
    <div className="flex items-center">
      <CategorySheet
        kind={category.kind}
        parents={parents}
        category={category}
        trigger={
          <Button variant="ghost" size="icon" aria-label="Edit category">
            <Pencil className="size-4" />
          </Button>
        }
      />
      <ConfirmDialog
        title="Delete category?"
        description="Transactions keep their record but become uncategorized."
        onConfirm={() => deleteCategory(category.id!)}
        trigger={
          <Button variant="ghost" size="icon" aria-label="Delete category">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        }
      />
    </div>
  );
}
