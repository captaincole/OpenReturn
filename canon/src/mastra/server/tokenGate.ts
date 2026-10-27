import type { MiddlewareHandler } from "hono";
import { bearerMatches } from "./requestGuard";

/*
 * Optional shared-token gate, the same shape as Cade's: when
 * CANON_API_TOKEN is set, /api/* (the MCP endpoint, the Ask workflow,
 * Mastra's agent routes) and /app/* (the reference library) require
 * `Authorization: Bearer <token>`. Defense in depth for a Canon port
 * that is reachable beyond localhost; the web app's /api/canon proxy
 * attaches the token server-side. Unset (the localhost default) allows
 * everything. Canon has no user auth: corpus data is not user data.
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
