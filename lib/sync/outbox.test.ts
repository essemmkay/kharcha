import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TxRow } from "@/lib/tx-row";

const createTransaction = vi.fn();
vi.mock("@/lib/actions/transactions", () => ({ createTransaction }));

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? (this.m.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

const row = (id: string): TxRow => ({
  id,
  type: "EXPENSE",
  amount: 5,
  date: new Date().toISOString(),
  account: "Cash",
  toAccount: null,
  category: "Food",
  categoryColor: null,
  note: null,
  currency: "USD",
  tags: [],
});

describe("outbox flush", () => {
  let outbox: typeof import("@/lib/sync/outbox");
  const nav = { onLine: false };

  beforeEach(async () => {
    vi.resetModules(); // reset module-level cache/syncing between tests
    createTransaction.mockReset();
    nav.onLine = false;
    vi.stubGlobal("localStorage", new MemStorage());
    vi.stubGlobal("navigator", nav); // navigator is getter-only in node
    outbox = await import("@/lib/sync/outbox");
  });

  it("clears entries that sync successfully", async () => {
    outbox.enqueue({ accountId: "a" }, row("t1")); // queued offline, no flush
    outbox.enqueue({ accountId: "a" }, row("t2"));
    expect(outbox.getSnapshot()).toHaveLength(2);

    nav.onLine = true;
    createTransaction.mockResolvedValue({ ok: true, data: { id: "s" } });
    await outbox.flush();

    expect(outbox.getSnapshot()).toHaveLength(0);
    expect(createTransaction).toHaveBeenCalledTimes(2);
  });

  it("keeps and marks a server-rejected entry", async () => {
    outbox.enqueue({ accountId: "bad" }, row("t1"));
    nav.onLine = true;
    createTransaction.mockResolvedValue({ ok: false, error: "Account not found" });
    await outbox.flush();

    const pending = outbox.getSnapshot();
    expect(pending).toHaveLength(1);
    expect(pending[0].error).toBe("Account not found");
  });

  it("stops on a network error, keeping entries for retry", async () => {
    outbox.enqueue({}, row("t1"));
    outbox.enqueue({}, row("t2"));
    nav.onLine = true;
    createTransaction.mockRejectedValue(new Error("offline"));
    await outbox.flush();

    expect(outbox.getSnapshot()).toHaveLength(2);
    expect(createTransaction).toHaveBeenCalledTimes(1); // broke after first failure
  });
});
