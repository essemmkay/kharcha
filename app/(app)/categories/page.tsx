"use client";

import { useMemo } from "react";
import { Plus, Tag } from "lucide-react";
import { useLocalData } from "@/lib/db/use-local-data";
import { CategorySheet } from "@/components/category-sheet";
import { CategoryActions } from "@/components/category-actions";
import { EmptyState } from "@/components/empty-state";
import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Cat = { id: string; name: string; kind: "INCOME" | "EXPENSE"; parentId: string | null };

function CategoryList({ kind, cats }: { kind: "INCOME" | "EXPENSE"; cats: Cat[] }) {
  const parents = cats.map((c) => ({ id: c.id, name: c.name }));
  const parentName = new Map(cats.map((c) => [c.id, c.name]));

  if (cats.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title={`No ${kind.toLowerCase()} categories`}
        description="Add one to organize your transactions."
        action={
          <CategorySheet
            kind={kind}
            parents={parents}
            trigger={<Button>Add category</Button>}
          />
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <CategorySheet
          kind={kind}
          parents={parents}
          trigger={
            <Button size="sm" variant="outline">
              <Plus className="size-4" /> Add
            </Button>
          }
        />
      </div>
      <ul className="divide-y rounded-xl border">
        {cats.map((c) => (
          <li key={c.id} className="flex items-center gap-2 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{c.name}</p>
              {c.parentId && (
                <p className="text-xs text-muted-foreground">
                  in {parentName.get(c.parentId) ?? "—"}
                </p>
              )}
            </div>
            <CategoryActions
              category={{ id: c.id, name: c.name, kind: c.kind, parentId: c.parentId }}
              parents={parents.filter((p) => p.id !== c.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CategoriesPage() {
  const { ready, categories } = useLocalData();

  const { expense, income } = useMemo(() => {
    const cats = categories
      .map((c) => ({ id: c.id, name: c.name, kind: c.kind, parentId: c.parentId }))
      .sort(
        (a, b) =>
          (a.parentId ?? "").localeCompare(b.parentId ?? "") ||
          a.name.localeCompare(b.name),
      );
    return {
      expense: cats.filter((c) => c.kind === "EXPENSE"),
      income: cats.filter((c) => c.kind === "INCOME"),
    };
  }, [categories]);

  if (!ready) return <PageLoading />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Categories</h1>
      <Tabs defaultValue="expense">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expense">Expense</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>
        <TabsContent value="expense" className="mt-4">
          <CategoryList kind="EXPENSE" cats={expense} />
        </TabsContent>
        <TabsContent value="income" className="mt-4">
          <CategoryList kind="INCOME" cats={income} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
