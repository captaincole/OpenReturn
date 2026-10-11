import { logout } from "@/lib/localAuth";
import { NextResponse } from "next/server";

export async function POST() {
  await logout();
  return NextResponse.json({ ok: true });
}
