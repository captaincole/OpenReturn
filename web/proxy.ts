import { ACCESS_JWT_HEADER, behindAccess } from "@/lib/authMode";
import { isCrossSiteWrite } from "@/lib/crossSite";
import { NextResponse, type NextRequest } from "next/server";

/*
 * Next.js 16 Middleware. Optimistic gate only: the Edge runtime cannot read
 * app.db, so this checks cookie presence. Every layout and route handler
 * verifies with getUserSession(). The cookie name is duplicated from
 * lib/localAuth.ts on purpose: importing it pulls node:crypto into Edge.
 *
 * A cookie never sends /login or /setup to the home page from here. After a
 * reset the browser still holds its old cookie; the home page then sends it
 * back to /login, and the two redirects made a loop. The login layout sends a
 * signed-in user home, because it can check the cookie.
 *
 * Behind Cloudflare Access (lib/authMode.ts) there is no cookie of ours and no
 * login page: a request without Access's token did not come through Access,
 * and gets a 403. lib/accessAuth.ts checks the token itself. A write from
 * another site gets a 403 too (lib/crossSite.ts).
 */

const SESSION_COOKIE = "openreturn_session";

const PUBLIC_PATHS = ["/login", "/setup", "/api/auth"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (publicPath) => pathname === publicPath || pathname.startsWith(`${publicPath}/`),
  );
}

/*
 * Nonce CSP: injected markup (stored reference HTML, XSS) cannot run script,
 * and same-origin img/connect stops a prompt injection from leaking data in
 * an image URL. Inline styles: React style props need them. No
 * upgrade-insecure-requests: the app is plain http on localhost and the LAN.
 */
function contentSecurityPolicy(nonce: string): string {
  const dev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/* Route handlers (JSON, PDFs, downloads) get no CSP; pages do. */
function isPage(pathname: string): boolean {
  return !pathname.startsWith("/api/") && !pathname.startsWith("/documents/");
}

/* The answer for a request that may not go on, or null when it may. */
function refusal(request: NextRequest): NextResponse | null {
  if (behindAccess()) {
    const { headers, method } = request;
    if (!headers.has(ACCESS_JWT_HEADER)) {
      return new NextResponse("Sign in through Cloudflare Access.", { status: 403 });
    }
    return isCrossSiteWrite(method, headers.get("origin"), headers.get("host"))
      ? new NextResponse("This request came from another site.", { status: 403 })
      : null;
  }
  if (request.cookies.has(SESSION_COOKIE) || isPublic(request.nextUrl.pathname)) return null;
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  const refused = refusal(request);
  if (refused) return refused;
  const { pathname } = request.nextUrl;
  if (!isPage(pathname)) return NextResponse.next();

  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js reads the nonce from this request header and puts it on its own scripts.
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
