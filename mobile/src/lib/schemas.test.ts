import { describe, expect, it } from "vitest";
import { accountSchema, categorySchema, transactionSchema } from "@/lib/schemas";

// Offline sync replays a payload the client already transformed, so optional
// text fields arrive as `null` (not undefined). The schema must accept that or
// every blank-note/icon/color mutation gets parked server-side. These guard the
// `.nullish()` fix in optionalText (regression: ".optional()" rejected null).
describe("schema idempotency under sync replay (null optional fields)", () => {
  it("accepts a transaction with note: null", () => {
    const r = transactionSchema.safeParse({
      type: "EXPENSE",
      amount: 10,
      date: "2026-10-12T00:00:00.000Z",
      accountId: "acc-1",
      categoryId: "cat-1",
      note: null,
      tags: [],
    });
    expect(r.success).toBe(true);
  });

  it("accepts a category with icon and color null", () => {
    const r = categorySchema.safeParse({
      name: "Groceries",
      kind: "EXPENSE",
      icon: null,
      color: null,
      parentId: null,
    });
    expect(r.success).toBe(true);
  });

  it("accepts an account with note: null", () => {
    const r = accountSchema.safeParse({
      name: "Cash",
      type: "CASH",
      currency: "USD",
      openingBalance: 0,
      note: null,
    });
    expect(r.success).toBe(true);
  });
});
