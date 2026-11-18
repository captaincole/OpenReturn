import { getUserSession } from "@/lib/session";
import { acceptNotice } from "@/lib/userStore";
import { NextResponse } from "next/server";

/* Records that the signed-in person accepted the first-visit notice. JSON only, as /api/auth/setup. */
export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "body must be JSON" }, { status: 415 });
  }
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await acceptNotice(session.userId);
  return NextResponse.json({ ok: true });
}
