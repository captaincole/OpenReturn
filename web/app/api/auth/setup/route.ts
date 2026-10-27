import { createOwner, login, ownerExists } from "@/lib/localAuth";
import { NextResponse } from "next/server";

/*
 * First-run setup: create the instance owner. 409s once an owner exists —
 * this is a one-shot endpoint, not a signup system.
 *
 * It takes no credentials, so it accepts only what the setup page sends:
 * a JSON body from this origin. A page on another site can post a form
 * here (text/plain, its own Origin) but cannot send JSON without a CORS
 * preflight, so it cannot create an owner whose password it knows and
 * log the real owner's browser into that account.
 */
function fromSetupPage(request: Request): boolean {
  if (!request.headers.get("content-type")?.startsWith("application/json")) return false;
  const origin = request.headers.get("origin");
  if (origin === null) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false; // "null" (sandboxed frames, file://) or garbage
  }
}

export async function POST(request: Request) {
  if (!fromSetupPage(request)) {
    return NextResponse.json({ error: "cross-origin or non-JSON request" }, { status: 403 });
  }
  if (await ownerExists()) {
    return NextResponse.json({ error: "already set up" }, { status: 409 });
  }
  let body: { email?: string; displayName?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }
  const email = body.email?.trim();
  const displayName = body.displayName?.trim();
  const password = body.password ?? "";
  if (!email || !displayName) {
    return NextResponse.json({ error: "email and name are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "password must be at least 8 characters" }, { status: 400 });
  }
  try {
    await createOwner({ email, displayName, password });
  } catch {
    // Another setup request created the owner first.
    return NextResponse.json({ error: "already set up" }, { status: 409 });
  }
  // Log the new owner in immediately, so they do not retype the password.
  await login(password);
  return NextResponse.json({ ok: true });
}
