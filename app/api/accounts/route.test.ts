import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// Mock auth + the domain actions so the handler's own logic (auth gate, body
// validation, op dispatch, status mapping) is exercised without a DB/Supabase.
const getAuthedUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getAuthedUser: () => getAuthedUser() }));

const createAccount = vi.fn();
const updateAccount = vi.fn();
const deleteAccount = vi.fn();
vi.mock("@/lib/actions/accounts", () => ({
  createAccount: (...a: unknown[]) => createAccount(...a),
  updateAccount: (...a: unknown[]) => updateAccount(...a),
  deleteAccount: (...a: unknown[]) => deleteAccount(...a),
}));

import { POST } from "./route";

function post(body?: unknown): NextRequest {
  return new Request("http://localhost/api/accounts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  getAuthedUser.mockResolvedValue({ id: "u1" });
});

describe("POST /api/accounts", () => {
  it("401s when unauthenticated", async () => {
    getAuthedUser.mockResolvedValue(null);
    const res = await POST(post({ op: "create", input: {} }));
    expect(res.status).toBe(401);
    expect(createAccount).not.toHaveBeenCalled();
  });

  it("400s on a body with no op", async () => {
    const res = await POST(post({ input: {} }));
    expect(res.status).toBe(400);
  });

  it("400s on an unknown op", async () => {
    const res = await POST(post({ op: "frobnicate" }));
    expect(res.status).toBe(400);
  });

  it("dispatches create and returns the action result", async () => {
    createAccount.mockResolvedValue({ ok: true, data: { id: "a1" } });
    const input = { name: "Cash", type: "CASH", currency: "USD", openingBalance: 0 };
    const res = await POST(post({ op: "create", input }));
    expect(createAccount).toHaveBeenCalledWith(input);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, data: { id: "a1" } });
  });

  it("maps an action failure to 400", async () => {
    createAccount.mockResolvedValue({ ok: false, error: "bad" });
    const res = await POST(post({ op: "create", input: {} }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "bad" });
  });

  it("passes id through to update and delete", async () => {
    updateAccount.mockResolvedValue({ ok: true, data: { id: "a1" } });
    deleteAccount.mockResolvedValue({ ok: true, data: { id: "a1" } });
    await POST(post({ op: "update", id: "a1", input: { name: "x" } }));
    expect(updateAccount).toHaveBeenCalledWith("a1", { name: "x" });
    await POST(post({ op: "delete", id: "a1" }));
    expect(deleteAccount).toHaveBeenCalledWith("a1");
  });
});
