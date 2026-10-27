import { MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";
import type { MiddlewareHandler } from "hono";
import { getOwner } from "../db/appDb";

/*
 * Single-user auth model: identity = the instance. The agent binds to
 * 127.0.0.1 (index.ts, server.host). The web app fronts it, authenticates the browser with its
 * own session cookie, and proxies agent calls server-side. This
 * middleware does two things:
 *
 *   1. Optional shared-token gate: when AGENT_API_TOKEN is set, require
 *      `Authorization: Bearer <token>` on /api/* and /app/* — defense in
 *      depth for deployments where the agent port is reachable beyond
 *      localhost. When unset (the localhost default), everything is
 *      allowed.
 *   2. Resolve the instance owner from app.db and stash their id/email
 *      on requestContext. MASTRA_RESOURCE_ID_KEY scopes Mastra memory;
 *      userEmail feeds the engine's authEmail enrichment. Before
 *      first-run setup (no owner row) requests still flow; tools that
 *      need a filing throw their own "no owner filing" error.
 */

export const REQUEST_CONTEXT_KEYS = {
  userEmail: "userEmail",
} as const;

const PROTECTED_PREFIXES = ["/api/", "/app/"];

export const ownerMiddleware: MiddlewareHandler = async (c, next) => {
  const token = process.env.AGENT_API_TOKEN;
  if (token && PROTECTED_PREFIXES.some((p) => c.req.path.startsWith(p))) {
    const auth = c.req.header("Authorization");
    if (auth !== `Bearer ${token}`) {
      return c.json({ error: "unauthorized" }, 401);
    }
  }

  const requestContext = c.get("requestContext");
  if (requestContext && typeof requestContext.set === "function") {
    const owner = await getOwner();
    if (owner) {
      requestContext.set(MASTRA_RESOURCE_ID_KEY, owner.id);
      requestContext.set(REQUEST_CONTEXT_KEYS.userEmail, owner.email);
    }
  }
  await next();
};
