"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { toNumber } from "@/lib/money";
import { type ActionResult } from "@/lib/types";
import type { SyncSnapshot } from "@/lib/sync/types";

// Delta pull: every row (per entity) touched since `sinceIso`, tombstones
// included so deletions propagate. First sync passes no cursor (epoch) and gets
// everything. The client merges by upserting live rows and removing tombstoned
// ones, then stores `serverTime` as the next cursor.
export async function pullChanges(
  sinceIso?: string,
): Promise<ActionResult<SyncSnapshot>> {
  const user = await requireUser();
  const since = sinceIso ? new Date(sinceIso) : new Date(0);
  const where = { userId: user.id, updatedAt: { gt: since } };

  const [accounts, categories, transactions] = await Promise.all([
    prisma.account.findMany({ where }),
    prisma.category.findMany({ where }),
    prisma.transaction.findMany({
      where,
      include: { tags: { select: { name: true } } },
    }),
  ]);

  return {
    ok: true,
    data: {
      serverTime: new Date().toISOString(),
      user: {
        email: user.email,
        name: user.name,
        baseCurrency: user.baseCurrency,
      },
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        currency: a.currency,
        openingBalance: toNumber(a.openingBalance),
        note: a.note,
        archived: a.archived,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        deletedAt: a.deletedAt?.toISOString() ?? null,
      })),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        kind: c.kind,
        icon: c.icon,
        color: c.color,
        parentId: c.parentId,
        archived: c.archived,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        deletedAt: c.deletedAt?.toISOString() ?? null,
      })),
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: toNumber(t.amount),
        date: t.date.toISOString(),
        accountId: t.accountId,
        toAccountId: t.toAccountId,
        categoryId: t.categoryId,
        note: t.note,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        deletedAt: t.deletedAt?.toISOString() ?? null,
        tags: t.tags.map((tag) => tag.name),
      })),
    },
  };
}
