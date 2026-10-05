"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveCategory } from "@/lib/sync/local-writes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CategoryFormValues = {
  id?: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
  parentId: string | null;
};

export function CategoryForm({
  category,
  kind,
  parents,
  onDone,
}: {
  category?: CategoryFormValues;
  kind: "INCOME" | "EXPENSE";
  parents: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(category?.name ?? "");
  const [parentId, setParentId] = useState(category?.parentId ?? "none");

  const parentOptions = parents.filter((p) => p.id !== category?.id);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveCategory({
        id: category?.id,
        name,
        kind: category?.kind ?? kind,
        parentId: parentId === "none" ? null : parentId,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(category ? "Category updated" : "Category created");
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cat-name">Name</Label>
        <Input
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Groceries"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-parent">Parent category (optional)</Label>
        <Select value={parentId} onValueChange={setParentId}>
          <SelectTrigger id="cat-parent" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (top level)</SelectItem>
            {parentOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : category ? "Save changes" : "Add category"}
      </Button>
    </form>
  );
}
