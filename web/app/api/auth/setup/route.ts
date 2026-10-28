import { createOwner, login, ownerExists } from "@/lib/localAuth";
import { NextResponse } from "next/server";

/*
 * One-shot, no credentials: accept only a JSON body. A cross-site form post
 * cannot send JSON without a CORS preflight, so another site cannot create
 * an owner whose password it knows.
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
  await login(password);
  return NextResponse.json({ ok: true });
}
