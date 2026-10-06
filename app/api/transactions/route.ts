import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/actions/transactions";

// Headless write endpoint for the native app. Body: { op, id?, input? }.
// See app/api/accounts/route.ts for the dispatch contract.
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
      result = await createTransaction(body.input);
      break;
    case "update":
      result = await updateTransaction(body.id, body.input);
      break;
    case "delete":
      result = await deleteTransaction(body.id);
      break;
    default:
      return NextResponse.json(
        { ok: false, error: "Unknown op" },
        { status: 400 },
      );
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
