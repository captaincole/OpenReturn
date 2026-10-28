import { NextResponse, type NextRequest } from "next/server";

/*
 * Next.js 16 Middleware. Optimistic gate only: the Edge runtime cannot read
 * app.db, so this checks cookie presence. Every layout and route handler
 * verifies with getOwnerSession(). The cookie name is duplicated from
 * lib/localAuth.ts on purpose: importing it pulls node:crypto into Edge.
 */

const SESSION_COOKIE = "openreturn_session";

const PUBLIC_PATHS = ["/login", "/setup", "/api/auth"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
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

export function proxy(request: NextRequest) {
  const hasCookie = request.cookies.has(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  if (!hasCookie && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (hasCookie && (pathname === "/login" || pathname === "/setup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  if (!isPage(pathname)) return NextResponse.next();

  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
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
