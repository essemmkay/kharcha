import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth";
import {
  createAccount,
  updateAccount,
  deleteAccount,
} from "@/lib/actions/accounts";

// Headless write endpoint for the native app. Body: { op, id?, input? }.
// Dispatches to the existing idempotent server actions (creates carry a
// client-authoritative id, so a replayed create upserts). The action re-reads
// the same Bearer token via headers() to scope by userId.
// ponytail: the pre-auth here plus the action's own auth = two token checks per
// write; collapse to one by passing userId when the web frontend is removed.
export async function POST(req: NextRequest) {
  const user = await getAuthedUser();
  if (!user)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );

  const body = await req.json().catch(() => null);
  if (!body || typeof body.op !== "string")
    return NextResponse.json(
      { ok: false, error: "Bad request" },
      { status: 400 },
    );

  let result;
  switch (body.op) {
    case "create":
      result = await createAccount(body.input);
      break;
    case "update":
      result = await updateAccount(body.id, body.input);
      break;
    case "delete":
      result = await deleteAccount(body.id);
      break;
    default:
      return NextResponse.json(
        { ok: false, error: "Unknown op" },
        { status: 400 },
      );
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
