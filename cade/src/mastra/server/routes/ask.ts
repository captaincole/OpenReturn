import { MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";
import { registerApiRoute } from "@mastra/core/server";
import type { Context } from "hono";
import {
  ALL_JURISDICTIONS,
  readRequestedJurisdictions,
  type Jurisdiction,
} from "../../canon/jurisdictions";
import { addAskTurn, createAskThread, getAskThread } from "../../db/askThreads";
import { askTurnWorkflow } from "../../workflows/askTurn";

const MAX_QUESTION_CHARS = 2000;

function callerOf(ctx: Context): string | undefined {
  return ctx.get("requestContext")?.get(MASTRA_RESOURCE_ID_KEY) as string | undefined;
}

type AskRequest =
  { question: string; jurisdictions: Jurisdiction[] | undefined } | { error: string };

/* The question and the jurisdictions that are on; no list means the caller's default. */
async function readAskRequest(ctx: Context): Promise<AskRequest> {
  const body = (await ctx.req.json().catch(() => ({}))) as {
    question?: unknown;
    jurisdictions?: unknown;
  };
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question || question.length > MAX_QUESTION_CHARS) return { error: "question required" };
  const requested = readRequestedJurisdictions(body.jurisdictions);
  if (!requested.ok) return { error: requested.error };
  return { question, jurisdictions: requested.jurisdictions };
}

/* Start the run and return; the workflow's onError marks the turn failed if it dies. */
async function startTurn(userId: string, threadId: string, turnId: string): Promise<void> {
  const run = await askTurnWorkflow.createRun({ resourceId: userId });
  await run.startAsync({ inputData: { userId, threadId, turnId } });
}

export const createAskRoute = registerApiRoute("/app/ask", {
  method: "POST",
  handler: async (ctx) => {
    const userId = callerOf(ctx);
    if (!userId) return ctx.json({ error: "unauthorized" }, 401);
    const request = await readAskRequest(ctx);
    if ("error" in request) return ctx.json({ error: request.error }, 400);

    // A new thread with no list searches every jurisdiction.
    const { threadId, turnId } = await createAskThread(
      userId,
      request.question,
      request.jurisdictions ?? ALL_JURISDICTIONS,
    );
    await startTurn(userId, threadId, turnId);
    return ctx.json({ threadId, turnId });
  },
});

export const addAskTurnRoute = registerApiRoute("/app/ask/:threadId/turns", {
  method: "POST",
  handler: async (ctx) => {
    const userId = callerOf(ctx);
    if (!userId) return ctx.json({ error: "unauthorized" }, 401);
    const request = await readAskRequest(ctx);
    if ("error" in request) return ctx.json({ error: request.error }, 400);

    // A follow-up with no list searches what the thread's last turn searched.
    const threadId = ctx.req.param("threadId");
    const result = await addAskTurn(userId, threadId, request.question, request.jurisdictions);
    if ("error" in result) {
      return result.error === "busy"
        ? ctx.json({ error: "a question is still being answered" }, 409)
        : ctx.json({ error: "not found" }, 404);
    }
    await startTurn(userId, threadId, result.turnId);
    return ctx.json({ threadId, turnId: result.turnId });
  },
});

export const getAskThreadRoute = registerApiRoute("/app/ask/:threadId", {
  method: "GET",
  handler: async (ctx) => {
    const userId = callerOf(ctx);
    if (!userId) return ctx.json({ error: "unauthorized" }, 401);
    const thread = await getAskThread(userId, ctx.req.param("threadId"));
    if (!thread) return ctx.json({ error: "not found" }, 404);
    return ctx.json(thread);
  },
});
