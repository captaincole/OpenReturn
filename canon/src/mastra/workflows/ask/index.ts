import type { Mastra } from "@mastra/core";
import type { Agent } from "@mastra/core/agent";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import type { z } from "zod";
import { hybridSearchRefDocs, type SearchHit } from "../../../db/corpusSearch";
import { askAnswerSchema, type AskAnswerOutput } from "./judges/askAnswerer";
import { askQueriesSchema } from "./judges/askQueryFormulator";
import { mergeByRank } from "./mergeHits";
import { renderAnswerPrompt, renderFormulatePrompt, renderHistory } from "./prompts";
import {
  askInputSchema,
  askRunResultSchema,
  type AskHistoryTurn,
  type AskResult,
  type AskRunResult,
  type AskStage,
} from "./types";
import { NOT_COVERED_ANSWER, validateAnswer, type Passage } from "./validate";

/*
 * The answer pipeline for tax-code Q&A. One run per question; the earlier
 * turns of the conversation are the only context (no agent memory, so
 * there is still exactly one conversational agent, and it is not Canon).
 *
 *   formulate (judge) → retrieve (per query) → answer (judge) → validate
 *
 * A "partial" answer names its gaps as search queries. The pipeline then
 * runs one more round: retrieve for the gaps, add the new passages after
 * the first ones (their numbers stay the same) and answer again.
 *
 * `answerQuestion` is the function; `askWorkflow` wraps it as a Mastra
 * workflow so the MCP server exposes it (run_ask) and Studio can run it.
 * The judges come from the Mastra instance (mastra.getAgent), so their
 * calls show in that instance's traces. Each step also lands in the
 * result's log with its input, output and timing — the query log.
 */

const HITS_PER_QUERY = 6;
const MAX_QUERIES = 3;
const MAX_PASSAGES = 10;
/* The gap round adds at most this many passages to the first round's. */
const MAX_GAP_PASSAGES = 6;

/** One entry of the query log: a pipeline step, how long it took, and what it did. */
export interface AskStepLog {
  kind: string;
  durationMs: number;
  [key: string]: unknown;
}
type StepLog = AskStepLog;

export interface AnswerQuestionInput {
  question: string;
  history?: AskHistoryTurn[];
  /** Called as each stage starts, for callers that show progress. */
  onStage?: (stage: AskStage) => Promise<void> | void;
  /**
   * The query log, when the caller owns it: each step is pushed as it
   * finishes, so a judge that throws still leaves the steps that ran
   * with the caller. Otherwise the log comes back in the result only.
   */
  steps?: AskStepLog[];
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
  input: AnswerQuestionInput,
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
    await input.onStage?.("retrieving");
    const skip = new Set(passages.map((p) => p.blockId));
    const found = await timed(
      steps,
      "retrieve-gaps",
      () => retrieve(gaps, MAX_GAP_PASSAGES, skip),
      (r) => ({ queries: r.log }),
    );
    if (found.passages.length === 0) return { raw, passages };

    await input.onStage?.("answering");
    const all = [...passages, ...found.passages];
    return {
      raw: await answer(mastra, history, input.question, all, steps, "answer-gaps"),
      passages: all,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    steps.push({ kind: "gaps-failed", durationMs: 0, error: reason });
    mastra.getLogger().warn("ask gap round failed; keeping the first answer", { err: reason });
    return { raw, passages };
  }
}

/* Answers one question. Throws when a judge fails; the caller records that. */
export async function answerQuestion(
  mastra: Mastra,
  input: AnswerQuestionInput,
): Promise<AskResult> {
  const steps: StepLog[] = input.steps ?? [];
  const history = renderHistory(input.history ?? []);

  await input.onStage?.("formulating");
  const formulatePrompt = renderFormulatePrompt(history, input.question);
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

  await input.onStage?.("retrieving");
  const { passages } = await timed(
    steps,
    "retrieve",
    () => retrieve(queries.length > 0 ? queries : [input.question]),
    (r) => ({ queries: r.log }),
  );
  if (passages.length === 0) {
    return {
      answer: NOT_COVERED_ANSWER,
      coverage: "not_covered",
      citations: [],
      missingDocuments: formulated.namedDocuments,
      log: { steps },
    };
  }

  await input.onStage?.("answering");
  const first = await answer(mastra, history, input.question, passages, steps, "answer");
  const final = await fillGaps(mastra, input, history, passages, first, steps);

  const validated = validateAnswer(final.raw, final.passages);
  steps.push({ kind: "validate", durationMs: 0, dropped: validated.dropped });
  return {
    answer: validated.answer,
    coverage: validated.coverage,
    citations: validated.citations,
    missingDocuments: validated.missingDocuments,
    log: { steps },
  };
}

const answerStep = createStep({
  id: "answer",
  inputSchema: askInputSchema,
  outputSchema: askRunResultSchema,
  /* The MCP-facing step: a judge failure comes back with the query log, not as a thrown error. */
  execute: async ({ inputData, mastra }): Promise<AskRunResult> => {
    const steps: AskStepLog[] = [];
    try {
      return { status: "ok", ...(await answerQuestion(mastra, { ...inputData, steps })) };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return { status: "failed", error, log: { steps } };
    }
  },
});

export const askWorkflow = createWorkflow({
  id: "ask",
  description:
    "Ask The Tax Code: answers one question about US federal or California tax from the IRS/FTB reference library, with numbered citations to the passages it relied on. Pass completed earlier turns as history for a follow-up. Says when the library does not cover the question.",
  inputSchema: askInputSchema,
  outputSchema: askRunResultSchema,
})
  .then(answerStep)
  .commit();
