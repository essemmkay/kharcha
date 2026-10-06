import { describe, expect, it } from "vitest";
import {
  accountsWithBalances,
  netWorth,
  monthlySummary,
  listLocalTransactions,
  report,
} from "./local-queries";
import type { SyncAccount, SyncCategory, SyncTransaction } from "./sync/types";

const acc = (id: string, name: string, opening: number): SyncAccount => ({
  id,
  name,
  type: "BANK",
  currency: "USD",
  openingBalance: opening,
  note: null,
  archived: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null,
});

const cat = (id: string, name: string, kind: "INCOME" | "EXPENSE"): SyncCategory => ({
  id,
  name,
  kind,
  icon: null,
  color: null,
  parentId: null,
  archived: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null,
});

const tx = (p: Partial<SyncTransaction> & Pick<SyncTransaction, "id" | "type" | "amount" | "date" | "accountId">): SyncTransaction => ({
  toAccountId: null,
  categoryId: null,
  note: null,
  createdAt: p.date,
  updatedAt: p.date,
  deletedAt: null,
  tags: [],
  ...p,
});

const accounts = [acc("a1", "Checking", 100), acc("a2", "Savings", 0)];
const categories = [cat("c1", "Salary", "INCOME"), cat("c2", "Groceries", "EXPENSE")];
const txs: SyncTransaction[] = [
  tx({ id: "t1", type: "INCOME", amount: 500, date: "2026-03-05T00:00:00.000Z", accountId: "a1", categoryId: "c1" }),
  tx({ id: "t2", type: "EXPENSE", amount: 200, date: "2026-03-10T00:00:00.000Z", accountId: "a1", categoryId: "c2" }),
  tx({ id: "t3", type: "TRANSFER", amount: 50, date: "2026-03-12T00:00:00.000Z", accountId: "a1", toAccountId: "a2" }),
  tx({ id: "t4", type: "EXPENSE", amount: 30, date: "2026-03-15T00:00:00.000Z", accountId: "a1" }),
  // tombstoned: must be excluded everywhere
  tx({ id: "t5", type: "EXPENSE", amount: 999, date: "2026-03-20T00:00:00.000Z", accountId: "a1", categoryId: "c2", deletedAt: "2026-03-21T00:00:00.000Z" }),
];

const MONTH = new Date("2026-03-01T00:00:00.000Z");

describe("balances", () => {
  it("applies income/expense/transfer signs and opening balance", () => {
    const rows = accountsWithBalances(accounts, txs);
    expect(rows.find((a) => a.id === "a1")!.balance).toBe(320); // 100+500-200-50-30
    expect(rows.find((a) => a.id === "a2")!.balance).toBe(50); // transfer in
  });
  it("sums net worth and ignores tombstones", () => {
    expect(netWorth(accounts, txs)).toBe(370);
  });
});

describe("monthlySummary", () => {
  it("totals income/expense and groups expenses by category", () => {
    const s = monthlySummary(txs, categories, MONTH);
    expect(s.income).toBe(500);
    expect(s.expense).toBe(230); // 200 + 30 (t5 excluded)
    expect(s.net).toBe(270);
    expect(s.byCategory).toEqual([
      { id: "c2", name: "Groceries", color: null, total: 200 },
      { id: "none", name: "Uncategorized", color: null, total: 30 },
    ]);
  });
});

describe("listLocalTransactions", () => {
  it("excludes tombstones and sorts by date desc", () => {
    const rows = listLocalTransactions(txs, accounts, categories);
    expect(rows.map((r) => r.id)).toEqual(["t4", "t3", "t2", "t1"]);
  });
  it("filters by type", () => {
    const rows = listLocalTransactions(txs, accounts, categories, { type: "EXPENSE" });
    expect(rows.map((r) => r.id)).toEqual(["t4", "t2"]);
  });
  it("matches either side of a transfer when filtering by account", () => {
    const rows = listLocalTransactions(txs, accounts, categories, { accountId: "a2" });
    expect(rows.map((r) => r.id)).toEqual(["t3"]);
  });
});

describe("report", () => {
  it("excludes transfers and tombstones; totals and groupings", () => {
    const r = report(txs, accounts, categories, new Date("2026-03-01"), new Date("2026-03-31T23:59:59"));
    expect(r.items.map((i) => i.account)).toEqual(["Checking", "Checking", "Checking"]);
    expect(r.totals).toEqual({ income: 500, expense: 230, net: 270 });
    expect(r.byCategory[0]).toEqual({ name: "Groceries", color: null, income: 0, expense: 200 });
    expect(r.byAccount).toEqual([{ name: "Checking", income: 500, expense: 230 }]);
  });
});
