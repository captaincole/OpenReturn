import { canonAuthHeaders, canonInternalUrl } from "@/lib/canonServer";
import { CANON_ROUTES, isProxyRoute } from "@/lib/proxyRoutes";
import { proxyTarget } from "@/lib/proxyTarget";
import { getUserSession } from "@/lib/session";
import { type NextRequest, NextResponse } from "next/server";

/*
 * Corpus data is not user data, but the session gate keeps the instance private.
 * Only the library's routes in CANON_ROUTES pass: Canon also serves MCP and Mastra's own.
 */

async function forward(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
): Promise<Response> {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  if (!isProxyRoute(CANON_ROUTES, request.method, path)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const target = proxyTarget(path, request.nextUrl.search, canonInternalUrl());
  if (!target) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }

  const headers = new Headers(canonAuthHeaders());
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const upstream = await fetch(target, { method: "GET", headers });

  const responseHeaders = new Headers();
  for (const header of ["content-type", "cache-control"]) {
    const value = upstream.headers.get(header);
    if (value) responseHeaders.set(header, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, ctx.params);
}
