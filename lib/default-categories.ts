import { prisma } from "@/lib/prisma";

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Food",
  "Groceries",
  "Dining",
  "Rent",
  "Transport",
  "Utilities",
  "Health",
  "Shopping",
  "Entertainment",
  "Education",
  "Other",
];

export const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Interest",
  "Gift",
  "Refund",
  "Other",
];

export async function seedDefaultCategories(userId: string) {
  await prisma.category.createMany({
    data: [
      ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
        userId,
        name,
        kind: "EXPENSE" as const,
      })),
      ...DEFAULT_INCOME_CATEGORIES.map((name) => ({
        userId,
        name,
        kind: "INCOME" as const,
      })),
    ],
    skipDuplicates: true,
  });
}
