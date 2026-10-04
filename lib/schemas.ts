import { z } from "zod";

export const accountTypes = ["BANK", "CASH", "ASSET"] as const;
export const categoryKinds = ["INCOME", "EXPENSE"] as const;
export const transactionTypes = ["INCOME", "EXPENSE", "TRANSFER"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null));

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  type: z.enum(accountTypes),
  currency: z.string().trim().min(3).max(3).toUpperCase().default("USD"),
  openingBalance: z.coerce.number().finite().default(0),
  note: optionalText(500),
});
export type AccountInput = z.input<typeof accountSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(40),
  kind: z.enum(categoryKinds),
  parentId: z.string().optional().nullable().default(null),
  icon: optionalText(40),
  color: optionalText(20),
});
export type CategoryInput = z.input<typeof categorySchema>;

const txBase = {
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.coerce.date(),
  accountId: z.string().min(1, "Account is required"),
  note: optionalText(500),
  tags: z.array(z.string().min(1).max(30)).max(10).optional().default([]),
};

export const transactionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("INCOME"),
    categoryId: z.string().min(1, "Category is required"),
    ...txBase,
  }),
  z.object({
    type: z.literal("EXPENSE"),
    categoryId: z.string().min(1, "Category is required"),
    ...txBase,
  }),
  z
    .object({
      type: z.literal("TRANSFER"),
      toAccountId: z.string().min(1, "Destination account is required"),
      ...txBase,
    })
    .refine((d) => d.toAccountId !== d.accountId, {
      message: "Transfer accounts must be different",
      path: ["toAccountId"],
    }),
]);
export type TransactionInput = z.input<typeof transactionSchema>;

export const profileSchema = z.object({
  name: optionalText(60),
  baseCurrency: z.string().trim().min(3).max(3).toUpperCase().default("USD"),
});
