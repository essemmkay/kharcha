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

  try {
    const c = await prisma.category.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        kind: parsed.data.kind,
        parentId: parsed.data.parentId,
        icon: parsed.data.icon,
        color: parsed.data.color,
      },
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

// Deletes a category. Transactions keep their row but lose the category link
// (onDelete: SetNull), unless reassignToId is given.
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

  if (reassignToId) {
    await prisma.transaction.updateMany({
      where: { userId: user.id, categoryId: id },
      data: { categoryId: reassignToId },
    });
  }
  await prisma.category.delete({ where: { id } });
  revalidate();
  return { ok: true, data: { id } };
}
