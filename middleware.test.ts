import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { middleware } from "./middleware";

const req = (method: string) =>
  new Request("http://localhost/api/sync", { method }) as unknown as NextRequest;

describe("api CORS middleware", () => {
  it("answers preflight with 204 + CORS headers", () => {
    const res = middleware(req("OPTIONS"));
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Headers")).toContain("authorization");
  });

  it("adds Allow-Origin to a passed-through request", () => {
    const res = middleware(req("GET"));
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
