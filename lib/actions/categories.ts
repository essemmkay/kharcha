"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { categorySchema } from "@/lib/schemas";
import { zodMessage, type ActionResult } from "@/lib/types";

function revalidate() {
  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function createCategory(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };

  const fields = {
    name: parsed.data.name,
    kind: parsed.data.kind,
    parentId: parsed.data.parentId,
    icon: parsed.data.icon,
    color: parsed.data.color,
  };
  try {
    const c = parsed.data.id
      ? await prisma.category.upsert({
          where: { id: parsed.data.id },
          create: { id: parsed.data.id, userId: user.id, ...fields },
          update: { ...fields, deletedAt: null },
          select: { id: true },
        })
      : await prisma.category.create({
          data: { userId: user.id, ...fields },
          select: { id: true },
        });
    revalidate();
    return { ok: true, data: c };
  } catch {
    return { ok: false, error: "A category with that name already exists" };
  }
}

export async function updateCategory(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };

  const result = await prisma.category.updateMany({
    where: { id, userId: user.id },
    data: {
      name: parsed.data.name,
      kind: parsed.data.kind,
      parentId: parsed.data.parentId,
      icon: parsed.data.icon,
      color: parsed.data.color,
    },
  });
  if (result.count === 0) return { ok: false, error: "Category not found" };
  revalidate();
  return { ok: true, data: { id } };
}

// Soft-deletes a category (tombstone for delta sync). Transactions keep their
// row but lose the category link (null), unless reassignToId is given. Either
// way the touched transactions get a fresh updatedAt so the change propagates.
export async function deleteCategory(
  id: string,
  reassignToId?: string,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();

  const owned = await prisma.category.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!owned) return { ok: false, error: "Category not found" };

  await prisma.transaction.updateMany({
    where: { userId: user.id, categoryId: id },
    data: { categoryId: reassignToId ?? null },
  });
  await prisma.category.updateMany({
    where: { id, userId: user.id },
    data: { deletedAt: new Date() },
  });
  revalidate();
  return { ok: true, data: { id } };
}
