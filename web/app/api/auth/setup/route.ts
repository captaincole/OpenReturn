import { createOwner, login, ownerExists } from "@/lib/localAuth";
import { NextResponse } from "next/server";

/*
 * First-run setup: create the instance owner. 409s once an owner exists —
 * this is a one-shot endpoint, not a signup system.
 *
 * It takes no credentials, so it accepts only a JSON body, which is what
 * the setup page sends. A page on another site can post a form here
 * (text/plain) but cannot send JSON without a CORS preflight, so it
 * cannot create an owner whose password it knows.
 */
export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "body must be JSON" }, { status: 415 });
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
  await createOwner({ email, displayName, password });
  // Log the new owner in immediately, so they do not retype the password.
  await login(password);
  return NextResponse.json({ ok: true });
}
