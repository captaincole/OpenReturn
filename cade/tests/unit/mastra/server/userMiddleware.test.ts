import { MASTRA_RESOURCE_ID_KEY, RequestContext } from "@mastra/core/request-context";
import { Hono } from "hono";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const dir = mkdtempSync(path.join(tmpdir(), "openreturn-user-middleware-test-"));
process.env.APP_DB_PATH = path.join(dir, "app.db");

const db = await import("../../../../src/mastra/db/appDb");
const { REQUEST_CONTEXT_KEYS } = await import("../../../../src/mastra/server/requestContext");
const { USER_ID_HEADER, userMiddleware } =
  await import("../../../../src/mastra/server/userMiddleware");

const TOKEN = "test-token";
const ALEX = { id: "user-alex", email: "alex@example.com" };
const MADISON = { id: "user-madison", email: "madison@example.com" };

type Variables = { requestContext: RequestContext };

/* The route answers with the user the middleware put on the request context. */
function app() {
  const hono = new Hono<{ Variables: Variables }>();
  hono.use("*", async (ctx, next) => {
    ctx.set("requestContext", new RequestContext());
    await next();
  });
  hono.use("*", userMiddleware);
  const whoAmI = (ctx: { get: (key: "requestContext") => RequestContext }) => ({
    resource: ctx.get("requestContext").get(MASTRA_RESOURCE_ID_KEY),
    userId: ctx.get("requestContext").get(REQUEST_CONTEXT_KEYS.userId),
    userEmail: ctx.get("requestContext").get(REQUEST_CONTEXT_KEYS.userEmail),
  });
  hono.get("/app/state", (ctx) => ctx.json(whoAmI(ctx)));
  hono.get("/api/agents", (ctx) => ctx.json(whoAmI(ctx)));
  hono.get("/health", (ctx) => ctx.json({ ok: true }));
  return hono;
}

const get = (url: string, headers: Record<string, string> = {}) =>
  app().request(`http://127.0.0.1:4111${url}`, { headers });

const withToken = (userId?: string): Record<string, string> => ({
  Authorization: `Bearer ${TOKEN}`,
  ...(userId ? { [USER_ID_HEADER]: userId } : {}),
});

async function addUser(user: { id: string; email: string }) {
  await db.getAppDb().execute({
    sql: `INSERT INTO users (id, email, display_name) VALUES (?, ?, ?)`,
    args: [user.id, user.email, user.id],
  });
}

beforeEach(async () => {
  await db.ensureAppSchema();
  await db.getAppDb().execute(`DELETE FROM users`);
});

afterEach(() => {
  delete process.env.AGENT_API_TOKEN;
});

describe("userMiddleware with no AGENT_API_TOKEN (the local default)", () => {
  it("answers 401 before setup, when there is no user", async () => {
    expect((await get("/app/state")).status).toBe(401);
    expect((await get("/api/agents")).status).toBe(401);
  });

  it("uses the instance's one user", async () => {
    await addUser(ALEX);
    const res = await get("/app/state");
    expect(await res.json()).toEqual({ resource: ALEX.id, userId: ALEX.id, userEmail: ALEX.email });
  });

  it("ignores the user header: any local process can send it", async () => {
    await addUser(ALEX);
    const res = await get("/app/state", { [USER_ID_HEADER]: MADISON.id });
    expect(((await res.json()) as { userId: string }).userId).toBe(ALEX.id);
  });

  it("answers 401 when there are two users: it cannot tell which one calls", async () => {
    await addUser(ALEX);
    await addUser(MADISON);
    expect((await get("/app/state", { [USER_ID_HEADER]: ALEX.id })).status).toBe(401);
  });

  it("leaves a route outside /api and /app alone", async () => {
    expect((await get("/health")).status).toBe(200);
  });
});

describe("userMiddleware with AGENT_API_TOKEN", () => {
  beforeEach(async () => {
    process.env.AGENT_API_TOKEN = TOKEN;
    await addUser(ALEX);
    await addUser(MADISON);
  });

  it("answers 401 without the token, also with a user header", async () => {
    expect((await get("/app/state", { [USER_ID_HEADER]: ALEX.id })).status).toBe(401);
    expect(
      (await get("/app/state", { Authorization: "Bearer wrong", [USER_ID_HEADER]: ALEX.id }))
        .status,
    ).toBe(401);
  });

  it("uses the user the web app names", async () => {
    for (const user of [ALEX, MADISON]) {
      const res = await get("/api/agents", withToken(user.id));
      expect(await res.json()).toEqual({
        resource: user.id,
        userId: user.id,
        userEmail: user.email,
      });
    }
  });

  it("answers 401 for a user id that is not in the table", async () => {
    expect((await get("/app/state", withToken("user-nobody"))).status).toBe(401);
  });

  it("answers 401 with no user header when there are two users", async () => {
    expect((await get("/app/state", withToken())).status).toBe(401);
  });

  it("answers 401 with no user header when there is one user: the web app always names one", async () => {
    await db.getAppDb().execute({ sql: `DELETE FROM users WHERE id = ?`, args: [MADISON.id] });
    expect((await get("/app/state", withToken())).status).toBe(401);
  });
});
