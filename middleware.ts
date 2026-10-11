import { NextRequest, NextResponse } from "next/server";

// CORS for the headless API. The native app isn't subject to CORS, but the
// web SPA (web/, a different origin) is. Bearer-token auth only — the browser
// fetch sends no cross-origin cookies — so `*` is safe here. GET/POST + a
// JSON content-type make every request non-simple, so preflight must pass.
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Max-Age": "86400",
};

export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS });
  }
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
  return res;
}

export const config = { matcher: "/api/:path*" };
