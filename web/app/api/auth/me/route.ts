import { getUserSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    userId: session.userId,
    email: session.email,
    displayName: session.displayName,
  });
}
