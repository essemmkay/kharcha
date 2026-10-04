import { describe, expect, it } from "vitest";
import { formatMoney, signedMoney, toNumber } from "./money";
import { transactionSchema } from "./schemas";

describe("money", () => {
  it("coerces Decimal-like values", () => {
    expect(toNumber("12.50")).toBe(12.5);
    expect(toNumber({ toString: () => "3.14" })).toBe(3.14);
    expect(toNumber(null)).toBe(0);
    expect(toNumber("not-a-number")).toBe(0);
  });

  it("formats currency", () => {
    expect(formatMoney(1000, "USD")).toBe("$1,000.00");
  });

  it("signs amounts by type", () => {
    expect(signedMoney(10, "INCOME", "USD")).toBe("+$10.00");
    expect(signedMoney(10, "EXPENSE", "USD")).toBe("-$10.00");
    expect(signedMoney(10, "TRANSFER", "USD")).toBe("$10.00");
  });
});

describe("transactionSchema", () => {
  const base = { amount: "5", date: "2026-10-01", accountId: "a1" };

  it("accepts a valid expense", () => {
    const r = transactionSchema.safeParse({
      ...base,
      type: "EXPENSE",
      categoryId: "c1",
    });
    expect(r.success).toBe(true);
  });

  it("rejects non-positive amounts", () => {
    const r = transactionSchema.safeParse({
      ...base,
      amount: "0",
      type: "EXPENSE",
      categoryId: "c1",
    });
    expect(r.success).toBe(false);
  });

  it("rejects a transfer to the same account", () => {
    const r = transactionSchema.safeParse({
      ...base,
      type: "TRANSFER",
      toAccountId: "a1",
    });
    expect(r.success).toBe(false);
  });

  it("accepts a transfer between different accounts", () => {
    const r = transactionSchema.safeParse({
      ...base,
      type: "TRANSFER",
      toAccountId: "a2",
    });
    expect(r.success).toBe(true);
  });
});
