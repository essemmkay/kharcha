import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";

export type TxFilter = {
  from?: Date;
  to?: Date;
  accountId?: string;
  categoryId?: string;
  type?: "INCOME" | "EXPENSE" | "TRANSFER";
};

// --- Balances -------------------------------------------------------------

async function balanceMap(userId: string): Promise<Map<string, number>> {
  const [inc, exp, tout, tin] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["accountId"],
      where: { userId, type: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["accountId"],
      where: { userId, type: "EXPENSE" },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["accountId"],
      where: { userId, type: "TRANSFER" },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["toAccountId"],
      where: { userId, type: "TRANSFER" },
      _sum: { amount: true },
    }),
  ]);

  const map = new Map<string, number>();
  const add = (id: string | null, delta: number) => {
    if (!id) return;
    map.set(id, (map.get(id) ?? 0) + delta);
  };
  inc.forEach((r) => add(r.accountId, toNumber(r._sum.amount)));
  exp.forEach((r) => add(r.accountId, -toNumber(r._sum.amount)));
  tout.forEach((r) => add(r.accountId, -toNumber(r._sum.amount)));
  tin.forEach((r) => add(r.toAccountId, toNumber(r._sum.amount)));
  return map;
}

export async function getAccountsWithBalances(userId: string) {
  const [accounts, deltas] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      orderBy: [{ archived: "asc" }, { createdAt: "asc" }],
    }),
    balanceMap(userId),
  ]);
  return accounts.map((a) => ({
    ...a,
    balance: toNumber(a.openingBalance) + (deltas.get(a.id) ?? 0),
  }));
}

export async function getNetWorth(userId: string): Promise<number> {
  const accounts = await getAccountsWithBalances(userId);
  return accounts
    .filter((a) => !a.archived)
    .reduce((sum, a) => sum + a.balance, 0);
}

// --- Dashboard ------------------------------------------------------------

export async function getMonthlySummary(
  userId: string,
  month: Date,
  accountId?: string,
) {
  const from = startOfMonth(month);
  const to = endOfMonth(month);
  const accWhere = accountId ? { accountId } : {};

  const [byCat, totals] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "EXPENSE", date: { gte: from, lte: to }, ...accWhere },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: {
        userId,
        type: { in: ["INCOME", "EXPENSE"] },
        date: { gte: from, lte: to },
        ...accWhere,
      },
      _sum: { amount: true },
    }),
  ]);

  const catIds = byCat.map((c) => c.categoryId).filter(Boolean) as string[];
  const cats = await prisma.category.findMany({
    where: { id: { in: catIds } },
    select: { id: true, name: true, color: true },
  });
  const catName = new Map(cats.map((c) => [c.id, c]));

  const byCategory = byCat
    .map((c) => ({
      id: c.categoryId ?? "none",
      name: c.categoryId ? catName.get(c.categoryId)?.name ?? "Uncategorized" : "Uncategorized",
      color: (c.categoryId && catName.get(c.categoryId)?.color) || null,
      total: toNumber(c._sum.amount),
    }))
    .sort((a, b) => b.total - a.total);

  const income = toNumber(totals.find((t) => t.type === "INCOME")?._sum.amount);
  const expense = toNumber(totals.find((t) => t.type === "EXPENSE")?._sum.amount);

  return { income, expense, net: income - expense, byCategory };
}

export async function getIncomeExpenseSeries(
  userId: string,
  months = 6,
  accountId?: string,
) {
  const start = startOfMonth(subMonths(new Date(), months - 1));
  const txs = await prisma.transaction.findMany({
    where: {
      userId,
      type: { in: ["INCOME", "EXPENSE"] },
      date: { gte: start },
      ...(accountId ? { accountId } : {}),
    },
    select: { date: true, type: true, amount: true },
  });

  const buckets = new Map<string, { income: number; expense: number }>();
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    buckets.set(format(d, "yyyy-MM"), { income: 0, expense: 0 });
  }
  for (const t of txs) {
    const key = format(t.date, "yyyy-MM");
    const b = buckets.get(key);
    if (!b) continue;
    if (t.type === "INCOME") b.income += toNumber(t.amount);
    else b.expense += toNumber(t.amount);
  }
  return Array.from(buckets.entries()).map(([key, v]) => ({
    label: format(new Date(key + "-01"), "MMM"),
    income: v.income,
    expense: v.expense,
  }));
}

export async function getNetWorthSeries(userId: string, months = 12) {
  const accounts = await prisma.account.findMany({
    where: { userId, archived: false },
    select: { id: true, openingBalance: true },
  });
  const ids = accounts.map((a) => a.id);
  const openingTotal = accounts.reduce(
    (s, a) => s + toNumber(a.openingBalance),
    0,
  );
  if (ids.length === 0) return [];

  const start = startOfMonth(subMonths(new Date(), months - 1));

  const [before, within] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where: {
        userId,
        type: { in: ["INCOME", "EXPENSE"] },
        accountId: { in: ids },
        date: { lt: start },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: { in: ["INCOME", "EXPENSE"] },
        accountId: { in: ids },
        date: { gte: start },
      },
      select: { date: true, type: true, amount: true },
    }),
  ]);

  const beforeIncome = toNumber(before.find((b) => b.type === "INCOME")?._sum.amount);
  const beforeExpense = toNumber(before.find((b) => b.type === "EXPENSE")?._sum.amount);
  let running = openingTotal + beforeIncome - beforeExpense;

  const deltas = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    deltas.set(format(subMonths(new Date(), i), "yyyy-MM"), 0);
  }
  for (const t of within) {
    const key = format(t.date, "yyyy-MM");
    if (!deltas.has(key)) continue;
    deltas.set(
      key,
      deltas.get(key)! + (t.type === "INCOME" ? toNumber(t.amount) : -toNumber(t.amount)),
    );
  }

  return Array.from(deltas.entries()).map(([key, delta]) => {
    running += delta;
    return { label: format(new Date(key + "-01"), "MMM"), value: running };
  });
}

// --- Transactions list ----------------------------------------------------

const txInclude = {
  account: { select: { name: true, currency: true } },
  toAccount: { select: { name: true } },
  category: { select: { name: true, color: true } },
  tags: { select: { name: true } },
} as const;

function whereFromFilter(userId: string, f: TxFilter) {
  return {
    userId,
    ...(f.type ? { type: f.type } : {}),
    ...(f.accountId
      ? { OR: [{ accountId: f.accountId }, { toAccountId: f.accountId }] }
      : {}),
    ...(f.categoryId ? { categoryId: f.categoryId } : {}),
    ...(f.from || f.to
      ? { date: { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lte: f.to } : {}) } }
      : {}),
  };
}

export async function listTransactions(userId: string, f: TxFilter = {}) {
  return prisma.transaction.findMany({
    where: whereFromFilter(userId, f),
    include: txInclude,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 500,
  });
}

export async function getRecentTransactions(
  userId: string,
  limit = 8,
  accountId?: string,
) {
  return prisma.transaction.findMany({
    where: whereFromFilter(userId, accountId ? { accountId } : {}),
    include: txInclude,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

// --- Reports / PDF --------------------------------------------------------

export async function getReport(userId: string, from: Date, to: Date, f: TxFilter = {}) {
  const txs = await prisma.transaction.findMany({
    where: {
      userId,
      type: f.type ?? { in: ["INCOME", "EXPENSE"] },
      date: { gte: from, lte: to },
      ...(f.accountId ? { accountId: f.accountId } : {}),
      ...(f.categoryId ? { categoryId: f.categoryId } : {}),
    },
    include: txInclude,
    orderBy: [{ date: "asc" }],
  });

  let income = 0;
  let expense = 0;
  const catMap = new Map<string, { name: string; color: string | null; income: number; expense: number }>();
  const accMap = new Map<string, { name: string; income: number; expense: number }>();

  const items = txs.map((t) => {
    const amount = toNumber(t.amount);
    const catName = t.category?.name ?? "Uncategorized";
    const accName = t.account.name;
    if (t.type === "INCOME") income += amount;
    if (t.type === "EXPENSE") expense += amount;

    const c = catMap.get(catName) ?? { name: catName, color: t.category?.color ?? null, income: 0, expense: 0 };
    if (t.type === "INCOME") c.income += amount;
    else if (t.type === "EXPENSE") c.expense += amount;
    catMap.set(catName, c);

    const a = accMap.get(accName) ?? { name: accName, income: 0, expense: 0 };
    if (t.type === "INCOME") a.income += amount;
    else if (t.type === "EXPENSE") a.expense += amount;
    accMap.set(accName, a);

    return {
      date: t.date,
      type: t.type,
      account: accName,
      category: catName,
      note: t.note ?? "",
      amount,
    };
  });

  return {
    totals: { income, expense, net: income - expense },
    byCategory: Array.from(catMap.values()).sort((a, b) => b.expense - a.expense),
    byAccount: Array.from(accMap.values()),
    items,
  };
}
