import type { MiddlewareHandler } from "hono";
import { createHash, timingSafeEqual } from "node:crypto";

/*
 * Turns away two kinds of request this server never needs to answer:
 *
 *   A foreign Origin. Browsers send Origin on cross-site fetches and form
 *       posts. The web app's proxy and the MCP clients send none, and
 *       Studio is same-origin, so any other Origin is a page we did not
 *       serve trying to reach the owner's data.
 *   A foreign Host. A DNS-rebinding page reaches 127.0.0.1 under its own
 *       host name, and the Host header still carries that name.
 *
 * The names this server answers to are the loopback names plus
 * ALLOWED_HOSTS (comma-separated host names). An entry "*.example.com"
 * matches every subdomain of example.com, but not example.com itself.
 * Set ALLOWED_HOSTS together with MASTRA_HOST when the port is opened to
 * other machines.
 *
 * Mastra's own CORS layer is off (server.cors: false in index.ts), so no
 * response carries Access-Control-Allow-Origin.
 */

const LOOPBACK = ["localhost", "127.0.0.1", "[::1]"];

/* Env is read per request: dotenv may load after this module. */
function allowedHosts(): string[] {
  const extra = (process.env.ALLOWED_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return [...LOOPBACK, ...extra];
}

/* True when the host name equals an entry, or is a subdomain of a "*." entry. */
function isAllowed(hostname: string, allowed: string[]): boolean {
  return allowed.some((entry) =>
    entry.startsWith("*.") ? hostname.endsWith(entry.slice(1)) : hostname === entry,
  );
}

/* The host name of a Host header ("localhost:4111") or an Origin URL; "" when unparsable. */
function hostnameOf(value: string, isUrl: boolean): string {
  try {
    return new URL(isUrl ? value : `http://${value}`).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export const requestGuard: MiddlewareHandler = async (c, next) => {
  const allowed = allowedHosts();
  const host = c.req.header("Host");
  if (host !== undefined && !isAllowed(hostnameOf(host, false), allowed)) {
    return c.json({ error: "unknown host" }, 403);
  }
  const origin = c.req.header("Origin");
  if (origin !== undefined && !isAllowed(hostnameOf(origin, true), allowed)) {
    return c.json({ error: "cross-origin request refused" }, 403);
  }
  await next();
};

/* True when the Authorization header is `Bearer <token>`. Compares digests, so the time does not depend on the token. */
export function bearerMatches(header: string | undefined, token: string): boolean {
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(header ?? ""), digest(`Bearer ${token}`));
}
