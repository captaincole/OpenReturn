import { NextResponse, type NextRequest } from "next/server";

/*
 * Next.js 16 file convention: this is the renamed Middleware. It is an
 * optimistic gate only. The Edge runtime cannot read app.db to verify the
 * session HMAC, so this checks cookie PRESENCE and redirects. Every
 * layout and route handler re-verifies with getOwnerSession() in the Node
 * runtime.
 *
 * The cookie name is duplicated from lib/localAuth.ts on purpose. An
 * import of that module would pull node:crypto into the Edge bundle.
 */

const SESSION_COOKIE = "openreturn_session";

const PUBLIC_PATHS = ["/login", "/setup", "/api/auth"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/*
 * Content Security Policy for pages, the nonce pattern from the Next.js
 * CSP guide: only scripts that carry this request's nonce run, so markup
 * injected into a page (stored reference HTML, an XSS) cannot run script.
 * Images, fetches and form posts stay on this origin, which also stops
 * a prompt injection from sending data out in an image URL. Next.js reads
 * the nonce from the request header and puts it on its own scripts; the
 * root layout passes it to the theme script.
 *
 * Styles allow inline: React style props need it, and a style cannot
 * run script. No upgrade-insecure-requests: the app is plain http on
 * localhost and the LAN. Dev needs 'unsafe-eval' (React's dev stacks).
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
    // Match everything except Next.js internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
