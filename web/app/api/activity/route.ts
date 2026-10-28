import { ACTIVITY_TAX_YEAR } from "@/lib/activity";
import { getOwnerSession } from "@/lib/localAuth";
import { fetchActivityItems } from "@/lib/serverDb";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitRaw) ? Math.min(limitRaw, 200) : 50;

  const items = await fetchActivityItems(session.userId, ACTIVITY_TAX_YEAR, limit);
  return NextResponse.json(items);
}
