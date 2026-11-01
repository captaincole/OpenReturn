import type { MiddlewareHandler } from "hono";
import { bearerMatches } from "./requestGuard";

/*
 * Defense in depth for a port reachable beyond localhost; the web app's
 * proxy attaches the token server-side. Unset allows everything.
 */

const PROTECTED_PREFIXES = ["/api/", "/app/"];

export const tokenGate: MiddlewareHandler = async (ctx, next) => {
  const token = process.env.CANON_API_TOKEN;
  if (token && PROTECTED_PREFIXES.some((prefix) => ctx.req.path.startsWith(prefix))) {
    if (!bearerMatches(ctx.req.header("Authorization"), token)) {
      return ctx.json({ error: "unauthorized" }, 401);
    }
  }
  await next();
};
