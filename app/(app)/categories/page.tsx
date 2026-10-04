import { Plus, Tag } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategorySheet } from "@/components/category-sheet";
import { CategoryActions } from "@/components/category-actions";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export default async function CategoriesPage() {
  const user = await requireUser();
  const cats = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    select: { id: true, name: true, kind: true, parentId: true },
  });
  const expense = cats.filter((c) => c.kind === "EXPENSE");
  const income = cats.filter((c) => c.kind === "INCOME");

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
