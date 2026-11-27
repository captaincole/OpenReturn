import type { Mastra } from "@mastra/core";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { hybridSearchRefDocs, type SearchHit } from "../../../db/corpusSearch";
import { corpusFormat } from "../../../db/corpusStore";
import { parseJurisdictions, type Jurisdiction } from "../../../jurisdiction";
import { judge } from "../../judge";
import { askAnswerSchema, type AskAnswerOutput } from "./judges/askAnswerer";
import { askQueriesSchema } from "./judges/askQueryFormulator";
import { mergeByRank } from "./mergeHits";
import {
  renderAnswerPrompt,
  renderFormulatePrompt,
  renderHistory,
  type PromptContext,
} from "./prompts";
import { statuteRound } from "./statute";
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
 * No agent memory: the earlier turns are the only context, so Cade stays
 * the one conversational agent.
 * Steps get judges with mastra.getAgent, not an import, so their calls get
 * the app logger and traces.
 */

const HITS_PER_QUERY = 6;
const MAX_QUERIES = 3;
const MAX_PASSAGES = 10;
const MAX_GAP_PASSAGES = 6;

export interface AskStepLog {
  kind: string;
  durationMs: number;
  [key: string]: unknown;
}
type StepLog = AskStepLog;

export interface AnswerQuestionInput {
  question: string;
  history?: AskHistoryTurn[];
  /** The jurisdictions to search; every one when unset. */
  jurisdictions?: Jurisdiction[];
  onStage?: (stage: AskStage) => Promise<void> | void;
  /** Steps are pushed as they finish, so a judge that throws keeps the steps that ran. */
  steps?: AskStepLog[];
}

async function retrieve(
  queries: string[],
  jurisdictions: readonly Jurisdiction[],
  max = MAX_PASSAGES,
  skip = new Set<string>(),
): Promise<{ passages: Passage[]; log: unknown[] }> {
  const lists: SearchHit[][] = [];
  const log: unknown[] = [];
  for (const query of queries) {
    const hits = await hybridSearchRefDocs({ query, limit: HITS_PER_QUERY, jurisdictions });
    log.push({ query, hits: hits.map((hit) => ({ blockId: hit.blockId, score: hit.score })) });
    lists.push(hits.filter((hit) => !skip.has(hit.blockId)));
  }
  const passages = mergeByRank(lists, max).map((hit) => ({
    blockId: hit.blockId,
    docId: hit.docId,
    documentTitle: hit.documentTitle,
    format: corpusFormat(hit.format),
    published: hit.published,
    sectionHeading: hit.sectionHeading,
    pageNum: hit.pageNum,
    text: hit.text,
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
  context: PromptContext,
  question: string,
  passages: Passage[],
  steps: StepLog[],
  kind: string,
): Promise<AskAnswerOutput> {
  const prompt = renderAnswerPrompt(context, question, passages);
  return timed(
    steps,
    kind,
    () => judge(mastra.getAgent("askAnswerer"), prompt, askAnswerSchema),
    (out) => ({ passages: passages.map((passage) => passage.blockId), output: out }),
  );
}

/*
 * New passages go after the first ones, so their numbers stay the same.
 * Best effort: if the round fails, the first answer stands.
 */
async function fillGaps(
  mastra: Mastra,
  input: AnswerQuestionInput,
  context: PromptContext,
  passages: Passage[],
  raw: AskAnswerOutput,
  steps: StepLog[],
): Promise<{ raw: AskAnswerOutput; passages: Passage[] }> {
  const gaps = raw.gaps
    .map((gap) => gap.trim())
    .filter(Boolean)
    .slice(0, MAX_QUERIES);
  if (raw.coverage !== "partial" || gaps.length === 0) return { raw, passages };

  try {
    await input.onStage?.("retrieving");
    const skip = new Set(passages.map((passage) => passage.blockId));
    const found = await timed(
      steps,
      "retrieve-gaps",
      () => retrieve(gaps, context.jurisdictions, MAX_GAP_PASSAGES, skip),
      (result) => ({ jurisdictions: context.jurisdictions, queries: result.log }),
    );
    if (found.passages.length === 0) return { raw, passages };

    await input.onStage?.("answering");
    const all = [...passages, ...found.passages];
    return {
      raw: await answer(mastra, context, input.question, all, steps, "answer-gaps"),
      passages: all,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    steps.push({ kind: "gaps-failed", durationMs: 0, error: reason });
    mastra.getLogger().warn("ask gap round failed; keeping the first answer", { err: reason });
    return { raw, passages };
  }
}

const notCovered = (
  missingDocuments: string[],
  jurisdictions: Jurisdiction[],
  steps: StepLog[],
): AskResult => ({
  answer: NOT_COVERED_ANSWER,
  coverage: "not_covered",
  citations: [],
  missingDocuments,
  statutePassages: [],
  statuteConsulted: false,
  conflicts: [],
  jurisdictions,
  log: { steps },
});

/* The first answer, then the instruction gap round, then the statute round: each at most once. */
async function answerRounds(
  mastra: Mastra,
  input: AnswerQuestionInput,
  context: PromptContext,
  passages: Passage[],
  steps: StepLog[],
) {
  const first = await answer(mastra, context, input.question, passages, steps, "answer");
  const afterGaps = await fillGaps(mastra, input, context, passages, first, steps);
  return statuteRound(
    afterGaps,
    {
      onStage: input.onStage,
      reanswer: (all) => answer(mastra, context, input.question, all, steps, "answer-statute"),
      steps,
      warn: (message, err) => mastra.getLogger().warn(message, { err }),
    },
    { hitsPerQuery: HITS_PER_QUERY, max: MAX_GAP_PASSAGES, jurisdictions: context.jurisdictions },
  );
}

export async function answerQuestion(
  mastra: Mastra,
  input: AnswerQuestionInput,
): Promise<AskResult> {
  const steps: StepLog[] = input.steps ?? [];
  const jurisdictions = parseJurisdictions(input.jurisdictions);
  const context: PromptContext = { history: renderHistory(input.history ?? []), jurisdictions };

  await input.onStage?.("formulating");
  const formulatePrompt = renderFormulatePrompt(context, input.question);
  const formulated = await timed(
    steps,
    "formulate",
    () => judge(mastra.getAgent("askQueryFormulator"), formulatePrompt, askQueriesSchema),
    (out) => ({ prompt: formulatePrompt, output: out }),
  );
  const queries = formulated.queries
    .map((query) => query.trim())
    .filter(Boolean)
    .slice(0, MAX_QUERIES);

  await input.onStage?.("retrieving");
  const { passages } = await timed(
    steps,
    "retrieve",
    () => retrieve(queries.length > 0 ? queries : [input.question], jurisdictions),
    (result) => ({ jurisdictions, queries: result.log }),
  );
  if (passages.length === 0) return notCovered(formulated.namedDocuments, jurisdictions, steps);

  await input.onStage?.("answering");
  const final = await answerRounds(mastra, input, context, passages, steps);

  const validated = validateAnswer(final.raw, final.passages);
  steps.push({ kind: "validate", durationMs: 0, dropped: validated.dropped });
  return {
    answer: validated.answer,
    coverage: validated.coverage,
    citations: validated.citations,
    missingDocuments: validated.missingDocuments,
    statutePassages: final.statutePassages,
    statuteConsulted: final.statuteConsulted,
    conflicts: validated.conflicts,
    jurisdictions,
    log: { steps },
  };
}

const answerStep = createStep({
  id: "answer",
  inputSchema: askInputSchema,
  outputSchema: askRunResultSchema,
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
    'Ask The Tax Code: answers one question about US federal or California tax from the IRS/FTB reference library, with numbered citations to the passages it relied on. Pass completed earlier turns as history for a follow-up. Pass jurisdictions to search only some of the library: ["CA"] searches only California, and a statute search then reads California\'s code, not the Internal Revenue Code. Says when the library does not cover the question. When the passages conflict, or name a rule of law without stating it, the answer may also search the statute (law.db) once; passages that disagree come back as conflicts, with both quotes.',
  inputSchema: askInputSchema,
  outputSchema: askRunResultSchema,
})
  .then(answerStep)
  .commit();
