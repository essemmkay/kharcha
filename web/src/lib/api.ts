import { supabase } from "./supabase";

// Thin client for the headless Next.js API. Attaches the current Supabase
// access token as a Bearer header. Ported from the mobile api.ts; only the env
// var name differs (Vite instead of Expo).
//
// Transport/transient failures (offline, 5xx, 401-before-refresh) THROW so the
// sync engine keeps the mutation queued and retries later. Only a real server
// response (200 ok / 400 validation+ownership) is returned as an ActionResult.
const BASE = import.meta.env.VITE_API_URL;

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export class MissingApiUrlError extends Error {}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  retried = false,
): Promise<ActionResult<T>> {
  if (!BASE) throw new MissingApiUrlError("VITE_API_URL not set");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(await authHeaders()),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  // A 401 is usually just an expired access token. Force one refresh and retry
  // with the new token before treating it as transient; otherwise an expired
  // session leaves every push/pull stuck on "Sync error" forever.
  if (res.status === 401 && !retried) {
    const { data } = await supabase.auth.refreshSession();
    if (data.session) return request<T>(method, path, body, true);
  }
  // 5xx and a still-unauthorized 401 are transient (server hiccup / dead
  // session that needs a manual re-login): retry later.
  if (res.status >= 500 || res.status === 401) {
    throw new Error(`Transient HTTP ${res.status}`);
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `${path} returned ${res.status} ${contentType || "non-JSON"}. Is VITE_API_URL pointing at the deployed headless API?`,
    );
  }
  return (await res.json()) as ActionResult<T>;
}

export function apiGet<T>(path: string): Promise<ActionResult<T>> {
  return request<T>("GET", path);
}

export function apiPost<T>(path: string, body: unknown): Promise<ActionResult<T>> {
  return request<T>("POST", path, body);
}
