import { MASTRA_RESOURCE_ID_KEY, RequestContext } from "@mastra/core/request-context";
import { Hono } from "hono";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * The Ask routes around a fake ask-turn workflow: what a request may name as
 * its jurisdictions, and what each turn stores. app.db is a throwaway file.
 */

const dir = mkdtempSync(path.join(tmpdir(), "openreturn-ask-routes-test-"));
process.env.APP_DB_PATH = path.join(dir, "app.db");

const started: unknown[] = [];
vi.mock("../../../../src/mastra/workflows/askTurn", () => ({
  askTurnWorkflow: {
    createRun: async () => ({
      startAsync: async ({ inputData }: { inputData: unknown }) => {
        started.push(inputData);
      },
    }),
  },
}));

const { addAskTurnRoute, createAskRoute } =
  await import("../../../../src/mastra/server/routes/ask");
const threads = await import("../../../../src/mastra/db/askThreads");
const db = await import("../../../../src/mastra/db/appDb");

const userId = "owner";

type Route = { path: string; handler: (ctx: never) => unknown };

function app(): Hono {
  const hono = new Hono();
  hono.use("*", async (ctx, next) => {
    const requestContext = new RequestContext();
    requestContext.set(MASTRA_RESOURCE_ID_KEY, userId);
    ctx.set("requestContext" as never, requestContext as never);
    await next();
  });
  for (const route of [createAskRoute, addAskTurnRoute] as unknown as Route[]) {
    hono.post(route.path, (ctx) => route.handler(ctx as never) as Response);
  }
  return hono;
}

async function post(url: string, body: unknown) {
  const res = await app().request(`http://127.0.0.1:4111${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: (await res.json()) as Record<string, string> };
}

const turnOf = async (threadId: string, turnId: string) =>
  (await threads.getAskThread(userId, threadId))?.turns.find((turn) => turn.id === turnId);

/* The background run is a fake: finish a turn by hand so the next one is not refused as busy. */
async function finish(turnId: string): Promise<void> {
  await db.getAppDb().execute({
    sql: "UPDATE ask_turns SET status = 'completed' WHERE id = ?",
    args: [turnId],
  });
}

beforeEach(() => {
  started.length = 0;
});

describe("POST /app/ask", () => {
  it("stores the jurisdictions that are on with the first turn", async () => {
    const { status, json } = await post("/app/ask", { question: "Q?", jurisdictions: ["CA"] });
    expect(status).toBe(200);
    expect((await turnOf(json.threadId, json.turnId))?.jurisdictions).toEqual(["CA"]);
    expect(started).toEqual([{ userId, threadId: json.threadId, turnId: json.turnId }]);
  });

  it("searches every jurisdiction when the request names none", async () => {
    const { json } = await post("/app/ask", { question: "Q?" });
    expect((await turnOf(json.threadId, json.turnId))?.jurisdictions).toEqual(["federal", "CA"]);
  });

  it("refuses an empty list and an unknown jurisdiction with a 400", async () => {
    const empty = await post("/app/ask", { question: "Q?", jurisdictions: [] });
    expect(empty.status).toBe(400);
    expect(empty.json.error).toContain("Name at least one jurisdiction");
    const unknown = await post("/app/ask", { question: "Q?", jurisdictions: ["both"] });
    expect(unknown.status).toBe(400);
    expect(unknown.json.error).toBe('Unknown jurisdiction "both". Use one of: "federal", "CA".');
    expect(started).toEqual([]);
  });
});

describe("POST /app/ask/:threadId/turns", () => {
  it("uses the thread's last list when a follow-up names none, and a new list when it does", async () => {
    const first = (await post("/app/ask", { question: "Q?", jurisdictions: ["CA"] })).json;
    await finish(first.turnId);
    const inherit = await post(`/app/ask/${first.threadId}/turns`, { question: "And?" });
    expect(inherit.status).toBe(200);
    expect((await turnOf(first.threadId, inherit.json.turnId))?.jurisdictions).toEqual(["CA"]);

    await finish(inherit.json.turnId);
    const narrowed = await post(`/app/ask/${first.threadId}/turns`, {
      question: "Federal?",
      jurisdictions: ["federal"],
    });
    expect((await turnOf(first.threadId, narrowed.json.turnId))?.jurisdictions).toEqual([
      "federal",
    ]);
  });

  it("refuses an unknown jurisdiction before it adds a turn", async () => {
    const first = (await post("/app/ask", { question: "Q?" })).json;
    await finish(first.turnId);
    const res = await post(`/app/ask/${first.threadId}/turns`, {
      question: "And?",
      jurisdictions: ["NY"],
    });
    expect(res.status).toBe(400);
    expect((await threads.getAskThread(userId, first.threadId))?.turns).toHaveLength(1);
  });
});
