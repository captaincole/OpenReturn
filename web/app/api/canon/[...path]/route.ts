import { getOwnerSession } from "@/lib/localAuth";
import { type NextRequest, NextResponse } from "next/server";

/*
 * Server-side proxy to Canon, the reference library: the document list,
 * a document's PDF or cleaned HTML. Same shape as the Cade proxy
 * (/api/agent): the session cookie authenticates the browser, the Next
 * server forwards on localhost, and Canon's port never faces the browser.
 * Corpus data is not user data, but the gate keeps the instance private.
 */

const CANON_INTERNAL_URL = process.env.CANON_INTERNAL_URL ?? "http://127.0.0.1:4112";

async function forward(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
): Promise<Response> {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const target = new URL(`/${path.join("/")}${request.nextUrl.search}`, CANON_INTERNAL_URL);

  const headers = new Headers();
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);
  if (process.env.CANON_API_TOKEN) {
    headers.set("authorization", `Bearer ${process.env.CANON_API_TOKEN}`);
  }

  const upstream = await fetch(target, { method: "GET", headers });

  const responseHeaders = new Headers();
  for (const h of ["content-type", "cache-control"]) {
    const v = upstream.headers.get(h);
    if (v) responseHeaders.set(h, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

/* Read-only: the library has nothing for the browser to write. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, ctx.params);
}
