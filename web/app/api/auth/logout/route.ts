import { ACCESS_SIGN_OUT_PATH, behindAccess } from "@/lib/authMode";
import { logout } from "@/lib/localAuth";
import { NextResponse } from "next/server";

/* `next` is the page that ends the session: Cloudflare's own sign-out, or the login screen. */
export async function POST() {
  if (behindAccess()) return NextResponse.json({ ok: true, next: ACCESS_SIGN_OUT_PATH });
  await logout();
  return NextResponse.json({ ok: true, next: "/login" });
}
