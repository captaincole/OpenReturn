import type { MiddlewareHandler } from "hono";
import { createHash, timingSafeEqual } from "node:crypto";

/*
 * A foreign Origin is a page we did not serve: the proxy and MCP clients
 * send none, and Studio is same-origin. A foreign Host is DNS rebinding.
 * Set ALLOWED_HOSTS with MASTRA_HOST when the port opens to other machines;
 * "*.example.com" matches subdomains only.
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

function isAllowed(hostname: string, allowed: string[]): boolean {
  return allowed.some((entry) =>
    entry.startsWith("*.") ? hostname.endsWith(entry.slice(1)) : hostname === entry,
  );
}

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

/* Compares digests, so the time does not depend on the token. */
export function bearerMatches(header: string | undefined, token: string): boolean {
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(header ?? ""), digest(`Bearer ${token}`));
}
