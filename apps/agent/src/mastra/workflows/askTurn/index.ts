import type { Mastra } from "@mastra/core";
import type { Agent } from "@mastra/core/agent";
import type { z } from "zod";
import {
  completeAskTurn,
  failAskTurn,
  getAskThread,
  setAskTurnStage,
  type AskTurn,
} from "../../db/askThreads";
import { hybridSearchRefDocs } from "../../db/corpusSearch";
import { askAnswerSchema } from "./judges/askAnswerer";
import { askQueriesSchema } from "./judges/askQueryFormulator";
import { renderAnswerPrompt, renderFormulatePrompt, renderHistory } from "./prompts";
import { NOT_COVERED_ANSWER, validateAnswer, type Passage } from "./validate";

/*
 * The per-turn answer pipeline for tax-code Q&A. One run per question;
 * the earlier turns of the thread are the only context (no agent memory,
 * so Luca stays the one conversational agent). The routes in
 * server/routes/ask.ts fire it in the background and the page polls.
 *
 *   formulate (judge) → retrieve (per query) → answer (judge) → validate
 *
 * The judges are registered on the Mastra instance (index.ts), so their
 * calls show in Studio traces. Each step also lands in the turn row's
 * log_json with its input, output and timing — the query log.
 */

const HITS_PER_QUERY = 6;
const MAX_QUERIES = 3;
const MAX_PASSAGES = 10;

interface StepLog {
  kind: string;
  durationMs: number;
  [key: string]: unknown;
}

/* One structured-output judge call; the schema goes to the model as response_format. */
async function judge<S extends z.ZodTypeAny>(
  agent: Agent,
  prompt: string,
  schema: S,
): Promise<z.infer<S>> {
  const result = await agent.generate(prompt, {
    structuredOutput: { schema, errorStrategy: "strict" },
  });
  const obj = (result as { object?: unknown }).object;
  if (!obj) throw new Error(`${agent.name}: no structured output`);
  return schema.parse(obj) as z.infer<S>;
}

/* Runs every query, keeps each block's best score, returns the top passages. */
async function retrieve(queries: string[]): Promise<{ passages: Passage[]; log: unknown[] }> {
  const best = new Map<string, { passage: Passage; score: number }>();
  const log: unknown[] = [];
  for (const query of queries) {
    const hits = await hybridSearchRefDocs({ query, limit: HITS_PER_QUERY });
    log.push({ query, hits: hits.map((h) => ({ blockId: h.blockId, score: h.score })) });
    for (const h of hits) {
      if ((best.get(h.blockId)?.score ?? -Infinity) >= h.score) continue;
      best.set(h.blockId, { passage: h, score: h.score });
    }
  }
  const passages = [...best.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PASSAGES)
    .map(({ passage: p }) => ({
      blockId: p.blockId,
      docId: p.docId,
      documentTitle: p.documentTitle,
      sectionHeading: p.sectionHeading,
      pageNum: p.pageNum,
      text: p.text,
    }));
  return { passages, log };
}

async function timed<T>(
  steps: StepLog[],
  kind: string,
  fn: () => Promise<T>,
  log: (r: T) => object,
) {
  const t0 = Date.now();
  const result = await fn();
  steps.push({ kind, durationMs: Date.now() - t0, ...log(result) });
  return result;
}

async function answerTurn(mastra: Mastra, turn: AskTurn, earlier: AskTurn[], steps: StepLog[]) {
  const history = renderHistory(earlier);

  await setAskTurnStage(turn.id, "formulating");
  const formulatePrompt = renderFormulatePrompt(history, turn.question);
  const formulated = await timed(
    steps,
    "formulate",
    () => judge(mastra.getAgent("askQueryFormulator"), formulatePrompt, askQueriesSchema),
    (out) => ({ prompt: formulatePrompt, output: out }),
  );
  const queries = formulated.queries
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, MAX_QUERIES);

  await setAskTurnStage(turn.id, "retrieving");
  const { passages } = await timed(
    steps,
    "retrieve",
    () => retrieve(queries.length > 0 ? queries : [turn.question]),
    (r) => ({ queries: r.log }),
  );
  if (passages.length === 0) {
    const missing = formulated.namedDocuments;
    return {
      answer: NOT_COVERED_ANSWER,
      coverage: "not_covered" as const,
      citations: [],
      missingDocuments: missing,
    };
  }

  await setAskTurnStage(turn.id, "answering");
  const answerPrompt = renderAnswerPrompt(history, turn.question, passages);
  const raw = await timed(
    steps,
    "answer",
    () => judge(mastra.getAgent("askAnswerer"), answerPrompt, askAnswerSchema),
    (out) => ({ passages: passages.map((p) => p.blockId), output: out }),
  );

  const validated = validateAnswer(raw, passages);
  steps.push({ kind: "validate", durationMs: 0, dropped: validated.dropped });
  return validated;
}

export async function runAskTurn(
  mastra: Mastra,
  userId: string,
  threadId: string,
  turnId: string,
): Promise<void> {
  const started = Date.now();
  const steps: StepLog[] = [];
  try {
    const thread = await getAskThread(userId, threadId);
    const turn = thread?.turns.find((t) => t.id === turnId);
    if (!thread || !turn) throw new Error(`ask turn ${turnId} not found`);
    const earlier = thread.turns.filter((t) => t.index < turn.index);

    const result = await answerTurn(mastra, turn, earlier, steps);
    await completeAskTurn(turnId, {
      answer: result.answer,
      coverage: result.coverage,
      citations: result.citations,
      missingDocuments: result.missingDocuments,
      log: { steps },
      durationMs: Date.now() - started,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await failAskTurn(turnId, `The answer failed: ${reason}`, { steps }, Date.now() - started);
    throw err;
  }
}
