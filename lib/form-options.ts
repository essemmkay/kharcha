import { prisma } from "@/lib/prisma";

// Accounts and categories used to populate transaction form selects.
export async function getFormOptions(userId: string, includeArchived = false) {
  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({
      where: { userId, ...(includeArchived ? {} : { archived: false }) },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, currency: true },
    }),
    prisma.category.findMany({
      where: { userId, archived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, kind: true },
    }),
  ]);

  return {
    accounts,
    categories: {
      INCOME: categories.filter((c) => c.kind === "INCOME").map(({ id, name }) => ({ id, name })),
      EXPENSE: categories.filter((c) => c.kind === "EXPENSE").map(({ id, name }) => ({ id, name })),
    },
  };
}
