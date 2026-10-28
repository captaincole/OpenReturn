import type { MiddlewareHandler } from "hono";
import { bearerMatches } from "./requestGuard";

/*
 * Defense in depth for a port reachable beyond localhost; the web app's
 * proxy attaches the token server-side. Unset allows everything.
 */

const PROTECTED_PREFIXES = ["/api/", "/app/"];

export const tokenGate: MiddlewareHandler = async (c, next) => {
  const token = process.env.CANON_API_TOKEN;
  if (token && PROTECTED_PREFIXES.some((p) => c.req.path.startsWith(p))) {
    if (!bearerMatches(c.req.header("Authorization"), token)) {
      return c.json({ error: "unauthorized" }, 401);
    }
  }
  await next();
};
