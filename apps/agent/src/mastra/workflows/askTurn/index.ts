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
import { hybridSearchRefDocs, type SearchHit } from "../../db/corpusSearch";
import { askAnswerSchema, type AskAnswerOutput } from "./judges/askAnswerer";
import { askQueriesSchema } from "./judges/askQueryFormulator";
import { mergeByRank } from "./mergeHits";
import { renderAnswerPrompt, renderFormulatePrompt, renderHistory } from "./prompts";
import { NOT_COVERED_ANSWER, validateAnswer, type Passage } from "./validate";

/*
 * The per-turn answer pipeline for tax-code Q&A. One run per question;
 * the earlier turns of the thread are the only context (no agent memory,
 * so Cade stays the one conversational agent). The routes in
 * server/routes/ask.ts fire it in the background and the page polls.
 *
 *   formulate (judge) → retrieve (per query) → answer (judge) → validate
 *
 * A "partial" answer names its gaps as search queries. The pipeline then
 * runs one more round: retrieve for the gaps, add the new passages after
 * the first ones (their numbers stay the same) and answer again.
 *
 * The judges are registered on the Mastra instance (index.ts), so their
 * calls show in Studio traces. Each step also lands in the turn row's
 * log_json with its input, output and timing — the query log.
 */

const HITS_PER_QUERY = 6;
const MAX_QUERIES = 3;
const MAX_PASSAGES = 10;
/* The gap round adds at most this many passages to the first round's. */
const MAX_GAP_PASSAGES = 6;

interface StepLog {
  kind: string;
  durationMs: number;
  [key: string]: unknown;
}

/*
 * One structured-output judge call; the schema goes to the model as
 * response_format. The Anthropic provider bundled with Mastra uses native
 * structured output only for the Claude models it knows; for newer ones
 * it falls back to a JSON tool call, where Claude sometimes sends an
 * array as a string. "outputFormat" forces the native mode. Other
 * providers ignore the option.
 */
async function judge<S extends z.ZodTypeAny>(
  agent: Agent,
  prompt: string,
  schema: S,
): Promise<z.infer<S>> {
  const result = await agent.generate(prompt, {
    structuredOutput: { schema, errorStrategy: "strict" },
    providerOptions: { anthropic: { structuredOutputMode: "outputFormat" } },
  });
  const obj = (result as { object?: unknown }).object;
  if (!obj) throw new Error(`${agent.name}: no structured output`);
  return schema.parse(obj) as z.infer<S>;
}

/*
 * Runs every query, merges the hit lists by rank (mergeHits.ts), returns
 * the top passages. Blocks in `skip` (already passages) are left out.
 */
async function retrieve(
  queries: string[],
  max = MAX_PASSAGES,
  skip = new Set<string>(),
): Promise<{ passages: Passage[]; log: unknown[] }> {
  const lists: SearchHit[][] = [];
  const log: unknown[] = [];
  for (const query of queries) {
    const hits = await hybridSearchRefDocs({ query, limit: HITS_PER_QUERY });
    log.push({ query, hits: hits.map((h) => ({ blockId: h.blockId, score: h.score })) });
    lists.push(hits.filter((h) => !skip.has(h.blockId)));
  }
  const passages = mergeByRank(lists, max).map((p) => ({
    blockId: p.blockId,
    docId: p.docId,
    documentTitle: p.documentTitle,
    format: p.format,
    published: p.published,
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
  const first = await answer(mastra, history, turn.question, passages, steps, "answer");
  const final = await fillGaps(mastra, turn, history, passages, first, steps);

  const validated = validateAnswer(final.raw, final.passages);
  steps.push({ kind: "validate", durationMs: 0, dropped: validated.dropped });
  return validated;
}

async function answer(
  mastra: Mastra,
  history: string,
  question: string,
  passages: Passage[],
  steps: StepLog[],
  kind: string,
): Promise<AskAnswerOutput> {
  const prompt = renderAnswerPrompt(history, question, passages);
  return timed(
    steps,
    kind,
    () => judge(mastra.getAgent("askAnswerer"), prompt, askAnswerSchema),
    (out) => ({ passages: passages.map((p) => p.blockId), output: out }),
  );
}

/*
 * The gap round: when the answer is "partial" and names its gaps, search
 * for them and answer again with the new passages added. One round only.
 * It is best effort: if it fails, the first answer stands.
 */
async function fillGaps(
  mastra: Mastra,
  turn: AskTurn,
  history: string,
  passages: Passage[],
  raw: AskAnswerOutput,
  steps: StepLog[],
): Promise<{ raw: AskAnswerOutput; passages: Passage[] }> {
  const gaps = raw.gaps
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, MAX_QUERIES);
  if (raw.coverage !== "partial" || gaps.length === 0) return { raw, passages };

  try {
    await setAskTurnStage(turn.id, "retrieving");
    const skip = new Set(passages.map((p) => p.blockId));
    const found = await timed(
      steps,
      "retrieve-gaps",
      () => retrieve(gaps, MAX_GAP_PASSAGES, skip),
      (r) => ({ queries: r.log }),
    );
    if (found.passages.length === 0) return { raw, passages };

    await setAskTurnStage(turn.id, "answering");
    const all = [...passages, ...found.passages];
    return {
      raw: await answer(mastra, history, turn.question, all, steps, "answer-gaps"),
      passages: all,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    steps.push({ kind: "gaps-failed", durationMs: 0, error: reason });
    mastra.getLogger().warn("ask gap round failed; keeping the first answer", {
      turnId: turn.id,
      err: reason,
    });
    return { raw, passages };
  }
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
