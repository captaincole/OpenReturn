import { behindAccess } from "@/lib/authMode";
import { noticeIsDue } from "@/lib/dataNotice";
import { AGENT_ROUTES, isProxyRoute } from "@/lib/proxyRoutes";
import { proxyTarget } from "@/lib/proxyTarget";
import { getUserSession } from "@/lib/session";
import { type NextRequest, NextResponse } from "next/server";

/*
 * The only bridge from the browser to the agent. The agent never sees a
 * browser credential. The body passes straight through, so SSE does not buffer.
 * Only the routes in AGENT_ROUTES pass: the agent also serves Mastra's own.
 *
 * The agent has no login: this proxy names the session's user in
 * USER_ID_HEADER (cade/src/mastra/server/userMiddleware.ts reads it). No
 * header of the browser's request passes, so the browser cannot name a user.
 *
 * Behind Cloudflare Access the instance has more than one user, and the agent
 * believes USER_ID_HEADER only from a caller with AGENT_API_TOKEN. So this
 * proxy refuses to forward without the token. It also forwards nothing for a
 * person who has not accepted the first-visit notice.
 */

const USER_ID_HEADER = "x-openreturn-user-id";

const AGENT_INTERNAL_URL = process.env.AGENT_INTERNAL_URL ?? "http://127.0.0.1:4111";

/* The headers the agent gets: two of the browser's, the user, and the token. */
function agentHeaders(request: NextRequest, userId: string): Headers {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);
  headers.set(USER_ID_HEADER, userId);
  if (process.env.AGENT_API_TOKEN) {
    headers.set("authorization", `Bearer ${process.env.AGENT_API_TOKEN}`);
  }
  return headers;
}

async function forward(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
): Promise<Response> {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (behindAccess() && !process.env.AGENT_API_TOKEN) {
    return NextResponse.json(
      { error: "AUTH_MODE=cloudflare-access needs AGENT_API_TOKEN, here and on the agent" },
      { status: 500 },
    );
  }
  if (await noticeIsDue(session.userId)) {
    return NextResponse.json({ error: "notice not accepted" }, { status: 403 });
  }

  const { path } = await params;
  if (!isProxyRoute(AGENT_ROUTES, request.method, path)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const target = proxyTarget(path, request.nextUrl.search, AGENT_INTERNAL_URL);
  if (!target) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstream = await fetch(target, {
    method: request.method,
    headers: agentHeaders(request, session.userId),
    body: hasBody ? request.body : undefined,
    // Required by undici when forwarding a ReadableStream body.
    ...(hasBody ? { duplex: "half" as const } : {}),
  });

  const responseHeaders = new Headers();
  for (const header of ["content-type", "cache-control", "transfer-encoding"]) {
    const value = upstream.headers.get(header);
    if (value) responseHeaders.set(header, value);
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, ctx.params);
}
