import { MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";
import type { MiddlewareHandler } from "hono";
import { ensureAppSchema } from "../db/appDb";
import { getOnlyUser, getUserById, type User } from "../db/users";
import { REQUEST_CONTEXT_KEYS } from "./requestContext";
import { bearerMatches } from "./requestGuard";

/*
 * Decides which user a request is for. Cade has no login: the web app checks
 * the session and names the user in USER_ID_HEADER.
 *
 * - With AGENT_API_TOKEN set, a caller with the token is the web app, so Cade
 *   believes the header. The header is required: a call that names no user is
 *   for no user, also on an instance with one user.
 * - Without a token (the local default), any local process can call, so Cade
 *   ignores the header. The request is for the instance's one user.
 *
 * A request with no user stops here with a 401. Mastra lets a request body fill
 * each context key that the server left empty, so a request that went on
 * without a user could name one.
 *
 * MASTRA_RESOURCE_ID_KEY is the key Mastra's own routes obey: with it set, they
 * use this user's memory and answer 403 for a thread of another user.
 */

export const USER_ID_HEADER = "x-openreturn-user-id";

const PROTECTED_PREFIXES = ["/api/", "/app/"];

const isProtected = (path: string): boolean =>
  PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));

async function requestUser(
  namedUserId: string | undefined,
  callerHasToken: boolean,
): Promise<User | null> {
  if (!callerHasToken) return getOnlyUser();
  return namedUserId ? getUserById(namedUserId) : null;
}

export const userMiddleware: MiddlewareHandler = async (ctx, next) => {
  /* The server made the tables at start (index.ts); this is for a test that mounts the middleware alone. */
  await ensureAppSchema();
  if (!isProtected(ctx.req.path)) return next();

  /* Env is read per request: dotenv may load after this module. */
  const token = process.env.AGENT_API_TOKEN;
  if (token && !bearerMatches(ctx.req.header("Authorization"), token)) {
    return ctx.json({ error: "unauthorized" }, 401);
  }

  const user = await requestUser(ctx.req.header(USER_ID_HEADER), Boolean(token));
  if (!user) return ctx.json({ error: "no user" }, 401);

  const requestContext = ctx.get("requestContext");
  requestContext.set(MASTRA_RESOURCE_ID_KEY, user.id);
  requestContext.set(REQUEST_CONTEXT_KEYS.userId, user.id);
  requestContext.set(REQUEST_CONTEXT_KEYS.userEmail, user.email);
  await next();
};
