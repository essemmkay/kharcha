import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/categories";

// Headless write endpoint for the native app. Body: { op, id?, input?,
// reassignToId? }. See app/api/accounts/route.ts for the dispatch contract.
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
      result = await createCategory(body.input);
      break;
    case "update":
      result = await updateCategory(body.id, body.input);
      break;
    case "delete":
      result = await deleteCategory(body.id, body.reassignToId);
      break;
    default:
      return NextResponse.json(
        { ok: false, error: "Unknown op" },
        { status: 400 },
      );
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
