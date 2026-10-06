import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import type {
  SyncAccount,
  SyncCategory,
  SyncTransaction,
} from "@/lib/sync/types";
import type { TxRow } from "@/lib/tx-row";

export type TxFilter = {
  from?: Date;
  to?: Date;
  accountId?: string;
  categoryId?: string;
  type?: "INCOME" | "EXPENSE" | "TRANSFER";
};

// Pure client-side ports of lib/queries.ts, computed over the local IndexedDB
// mirror instead of Prisma. Same return shapes so the existing presentational
// components (charts, TransactionList, ReportControls, PdfExportButton) are
// reused unchanged. Inputs are the live (non-tombstoned) rows; callers pass
// already-filtered arrays. Money stays as number (as everywhere at the edge).

const notDeleted = <T extends { deletedAt: string | null }>(rows: T[]) =>
  rows.filter((r) => !r.deletedAt);

// --- Balances -------------------------------------------------------------

function balanceDeltas(txs: SyncTransaction[]): Map<string, number> {
  const map = new Map<string, number>();
  const add = (id: string | null, d: number) => {
    if (!id) return;
    map.set(id, (map.get(id) ?? 0) + d);
  };
  for (const t of txs) {
    if (t.type === "INCOME") add(t.accountId, t.amount);
    else if (t.type === "EXPENSE") add(t.accountId, -t.amount);
    else {
      add(t.accountId, -t.amount);
      add(t.toAccountId, t.amount);
    }
  }
  return map;
}

export function accountsWithBalances(
  accounts: SyncAccount[],
  txs: SyncTransaction[],
) {
  const deltas = balanceDeltas(notDeleted(txs));
  return notDeleted(accounts)
    .slice()
    .sort(
      (a, b) =>
        Number(a.archived) - Number(b.archived) ||
        a.createdAt.localeCompare(b.createdAt),
    )
    .map((a) => ({ ...a, balance: a.openingBalance + (deltas.get(a.id) ?? 0) }));
}

export function netWorth(accounts: SyncAccount[], txs: SyncTransaction[]): number {
  return accountsWithBalances(accounts, txs)
    .filter((a) => !a.archived)
    .reduce((sum, a) => sum + a.balance, 0);
}

// --- Dashboard ------------------------------------------------------------

export function monthlySummary(
  txs: SyncTransaction[],
  categories: SyncCategory[],
  month: Date,
  accountId?: string,
) {
  const from = startOfMonth(month);
  const to = endOfMonth(month);
  const catMap = new Map(notDeleted(categories).map((c) => [c.id, c]));

  const inMonth = notDeleted(txs).filter((t) => {
    const d = new Date(t.date);
    if (d < from || d > to) return false;
    if (accountId && t.accountId !== accountId) return false;
    return true;
  });

  let income = 0;
  let expense = 0;
  const byCat = new Map<string, number>();
  for (const t of inMonth) {
    if (t.type === "INCOME") income += t.amount;
    else if (t.type === "EXPENSE") {
      expense += t.amount;
      const key = t.categoryId ?? "none";
      byCat.set(key, (byCat.get(key) ?? 0) + t.amount);
    }
  }

  const byCategory = Array.from(byCat.entries())
    .map(([id, total]) => ({
      id,
      name: id !== "none" ? catMap.get(id)?.name ?? "Uncategorized" : "Uncategorized",
      color: (id !== "none" && catMap.get(id)?.color) || null,
      total,
    }))
    .sort((a, b) => b.total - a.total);

  return { income, expense, net: income - expense, byCategory };
}

export function incomeExpenseSeries(
  txs: SyncTransaction[],
  months = 6,
  accountId?: string,
) {
  const start = startOfMonth(subMonths(new Date(), months - 1));
  const buckets = new Map<string, { income: number; expense: number }>();
  for (let i = months - 1; i >= 0; i--) {
    buckets.set(format(subMonths(new Date(), i), "yyyy-MM"), { income: 0, expense: 0 });
  }
  for (const t of notDeleted(txs)) {
    if (t.type === "TRANSFER") continue;
    if (accountId && t.accountId !== accountId) continue;
    const d = new Date(t.date);
    if (d < start) continue;
    const b = buckets.get(format(d, "yyyy-MM"));
    if (!b) continue;
    if (t.type === "INCOME") b.income += t.amount;
    else b.expense += t.amount;
  }
  return Array.from(buckets.entries()).map(([key, v]) => ({
    label: format(new Date(key + "-01"), "MMM"),
    income: v.income,
    expense: v.expense,
  }));
}

export function netWorthSeries(
  accounts: SyncAccount[],
  txs: SyncTransaction[],
  months = 12,
) {
  const active = notDeleted(accounts).filter((a) => !a.archived);
  if (active.length === 0) return [];
  const ids = new Set(active.map((a) => a.id));
  const openingTotal = active.reduce((s, a) => s + a.openingBalance, 0);
  const start = startOfMonth(subMonths(new Date(), months - 1));

  let before = 0;
  const within = notDeleted(txs).filter(
    (t) => t.type !== "TRANSFER" && ids.has(t.accountId),
  );
  const deltas = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    deltas.set(format(subMonths(new Date(), i), "yyyy-MM"), 0);
  }
  for (const t of within) {
    const d = new Date(t.date);
    const signed = t.type === "INCOME" ? t.amount : -t.amount;
    if (d < start) {
      before += signed;
      continue;
    }
    const key = format(d, "yyyy-MM");
    if (deltas.has(key)) deltas.set(key, deltas.get(key)! + signed);
  }

  let running = openingTotal + before;
  return Array.from(deltas.entries()).map(([key, delta]) => {
    running += delta;
    return { label: format(new Date(key + "-01"), "MMM"), value: running };
  });
}

// --- Transactions list ----------------------------------------------------

function rowBuilder(accounts: SyncAccount[], categories: SyncCategory[]) {
  const acc = new Map(accounts.map((a) => [a.id, a]));
  const cat = new Map(categories.map((c) => [c.id, c]));
  return (t: SyncTransaction): TxRow => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    date: t.date,
    account: acc.get(t.accountId)?.name ?? "",
    toAccount: t.toAccountId ? acc.get(t.toAccountId)?.name ?? null : null,
    category: t.categoryId ? cat.get(t.categoryId)?.name ?? null : null,
    categoryColor: t.categoryId ? cat.get(t.categoryId)?.color ?? null : null,
    note: t.note,
    currency: acc.get(t.accountId)?.currency ?? "USD",
    tags: t.tags,
  });
}

function matchesFilter(t: SyncTransaction, f: TxFilter): boolean {
  if (f.type && t.type !== f.type) return false;
  if (f.accountId && t.accountId !== f.accountId && t.toAccountId !== f.accountId)
    return false;
  if (f.categoryId && t.categoryId !== f.categoryId) return false;
  const d = new Date(t.date);
  if (f.from && d < f.from) return false;
  if (f.to && d > f.to) return false;
  return true;
}

const byDateDesc = (a: SyncTransaction, b: SyncTransaction) =>
  b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);

export function listLocalTransactions(
  txs: SyncTransaction[],
  accounts: SyncAccount[],
  categories: SyncCategory[],
  f: TxFilter = {},
  limit = 500,
): TxRow[] {
  const toRow = rowBuilder(accounts, categories);
  return notDeleted(txs)
    .filter((t) => matchesFilter(t, f))
    .sort(byDateDesc)
    .slice(0, limit)
    .map(toRow);
}

// --- Form options (transaction form selects) ------------------------------

export function formOptions(
  accounts: SyncAccount[],
  categories: SyncCategory[],
  includeArchived = false,
) {
  const accs = notDeleted(accounts)
    .filter((a) => includeArchived || !a.archived)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((a) => ({ id: a.id, name: a.name, currency: a.currency }));
  const cats = notDeleted(categories)
    .filter((c) => !c.archived)
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    accounts: accs,
    categories: {
      INCOME: cats.filter((c) => c.kind === "INCOME").map((c) => ({ id: c.id, name: c.name })),
      EXPENSE: cats.filter((c) => c.kind === "EXPENSE").map((c) => ({ id: c.id, name: c.name })),
    },
  };
}

// --- Reports --------------------------------------------------------------

export function report(
  txs: SyncTransaction[],
  accounts: SyncAccount[],
  categories: SyncCategory[],
  from: Date,
  to: Date,
  f: TxFilter = {},
) {
  const acc = new Map(accounts.map((a) => [a.id, a]));
  const cat = new Map(categories.map((c) => [c.id, c]));
  const types = f.type ? [f.type] : ["INCOME", "EXPENSE"];

  const rows = notDeleted(txs)
    .filter((t) => {
      if (!types.includes(t.type)) return false;
      const d = new Date(t.date);
      if (d < from || d > to) return false;
      if (f.accountId && t.accountId !== f.accountId) return false;
      if (f.categoryId && t.categoryId !== f.categoryId) return false;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  let income = 0;
  let expense = 0;
  const catAgg = new Map<string, { name: string; color: string | null; income: number; expense: number }>();
  const accAgg = new Map<string, { name: string; income: number; expense: number }>();

  const items = rows.map((t) => {
    const amount = t.amount;
    const catName = t.categoryId ? cat.get(t.categoryId)?.name ?? "Uncategorized" : "Uncategorized";
    const accName = acc.get(t.accountId)?.name ?? "";
    if (t.type === "INCOME") income += amount;
    if (t.type === "EXPENSE") expense += amount;

    const c = catAgg.get(catName) ?? {
      name: catName,
      color: (t.categoryId && cat.get(t.categoryId)?.color) || null,
      income: 0,
      expense: 0,
    };
    if (t.type === "INCOME") c.income += amount;
    else if (t.type === "EXPENSE") c.expense += amount;
    catAgg.set(catName, c);

    const a = accAgg.get(accName) ?? { name: accName, income: 0, expense: 0 };
    if (t.type === "INCOME") a.income += amount;
    else if (t.type === "EXPENSE") a.expense += amount;
    accAgg.set(accName, a);

    return {
      date: new Date(t.date),
      type: t.type,
      account: accName,
      category: catName,
      note: t.note ?? "",
      amount,
    };
  });

  return {
    totals: { income, expense, net: income - expense },
    byCategory: Array.from(catAgg.values()).sort((a, b) => b.expense - a.expense),
    byAccount: Array.from(accAgg.values()),
    items,
  };
}
