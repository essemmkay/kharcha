import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth";
import { pullChanges } from "@/lib/actions/sync";

// Headless delta-pull endpoint for the native app. GET /api/sync?since=<iso>.
// Omit `since` on first sync to get everything. Returns the SyncSnapshot
// (live rows + tombstones since the cursor) for the client to merge.
export async function GET(req: NextRequest) {
  const user = await getAuthedUser();
  if (!user)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );

  const since = req.nextUrl.searchParams.get("since") ?? undefined;
  const result = await pullChanges(since);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
