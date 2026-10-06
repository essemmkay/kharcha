import { supabase } from "./supabase";

// Thin client for the headless Next.js API. Attaches the current Supabase
// access token as a Bearer header.
//
// Transport/transient failures (offline, 5xx, 401-before-refresh) THROW so the
// sync engine keeps the mutation queued and retries later. Only a real server
// response (200 ok / 400 validation+ownership) is returned as an ActionResult,
// which the engine treats as a permanent outcome.
const BASE = process.env.EXPO_PUBLIC_API_URL;

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
): Promise<ActionResult<T>> {
  if (!BASE) throw new MissingApiUrlError("EXPO_PUBLIC_API_URL not set");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(await authHeaders()),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  // 5xx and 401 are transient (server hiccup / token mid-refresh): retry later.
  if (res.status >= 500 || res.status === 401) {
    throw new Error(`Transient HTTP ${res.status}`);
  }
  // Anything other than a JSON API response (e.g. an HTML 404/landing page when
  // EXPO_PUBLIC_API_URL points at a deploy without the /api routes) is a config
  // error, not a transient one. Surface it clearly instead of failing on parse.
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `${path} returned ${res.status} ${contentType || "non-JSON"}. Is EXPO_PUBLIC_API_URL pointing at the deployed headless API?`,
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
