import type { Mastra } from "@mastra/core";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { hybridSearchRefDocs } from "../../../db/corpusSearch";
import { modelFor } from "../../models";
import { decisionSummary, formulateQueries, renderAssessPrompt, renderRulePrompt } from "./prompts";
import {
  groundInputSchema,
  groundRunResultSchema,
  riskAssessmentSchema,
  ruleStructuredOutputSchema,
  type EvidenceBundle,
  type GroundInput,
  type GroundResult,
  type GroundRunResult,
  type GroundStepLog,
  type LoopCarrier,
  type RuleOutput,
} from "./schemas";

/*
 * Grounding one decision: (gather → assess → rule) × up to maxIterations.
 *
 *   gather  deterministic — queries from the queryFormulator judge on the
 *           first iteration, from rule's suggestedQueries after; hybrid
 *           retrieval; the evidence bundle.
 *   assess  LLM — a risk tier for the decision.
 *   rule    LLM — a verdict with citations, or a request for another
 *           retrieval round.
 *
 * Canon never sees app.db: the facts arrive with the decision, and the
 * verdict goes back with the step log for the caller to persist (Cade
 * writes it to review_run_steps, the fine-tuning substrate). Exposed as
 * the `ground` workflow, so MCP clients call it as run_ground.
 */

const HITS_PER_QUERY = 6;

/*
 * Run each query and dedupe blocks across queries by blockId, keeping the
 * higher score when queries overlap.
 */
async function retrieveBlocks(queries: string[]): Promise<EvidenceBundle["irsBlocks"]> {
  const blockMap = new Map<string, { docId: string; text: string; score: number }>();
  for (const q of queries) {
    const hits = await hybridSearchRefDocs({ query: q, limit: HITS_PER_QUERY });
    for (const h of hits) {
      const prev = blockMap.get(h.blockId);
      if (prev && prev.score >= h.score) continue;
      blockMap.set(h.blockId, { docId: h.docId, text: h.text, score: h.score });
    }
  }
  return Array.from(blockMap.entries()).map(([blockId, b]) => ({ blockId, ...b }));
}

async function timed<T>(
  steps: GroundStepLog[],
  carrier: LoopCarrier,
  kind: GroundStepLog["kind"],
  input: unknown,
  fn: () => Promise<T>,
  output: (r: T) => unknown,
): Promise<T> {
  const t0 = Date.now();
  const result = await fn();
  steps.push({
    iteration: carrier.iteration,
    kind,
    durationMs: Date.now() - t0,
    input,
    output: output(result),
  });
  return result;
}

async function gather(
  mastra: Mastra,
  carrier: LoopCarrier,
  steps: GroundStepLog[],
): Promise<LoopCarrier> {
  const queries =
    carrier.queries.length > 0
      ? carrier.queries
      : await formulateQueries(mastra.getAgent("queryFormulator"), carrier);
  const evidence = await timed(
    steps,
    carrier,
    "gather",
    { decisionKey: carrier.decision.decisionKey, iteration: carrier.iteration, queries },
    async (): Promise<EvidenceBundle> => ({
      facts: carrier.facts,
      irsBlocks: await retrieveBlocks(queries),
      queriesUsed: queries,
      iteration: carrier.iteration,
    }),
    (evidence) => ({ evidence }),
  );
  return { ...carrier, queries, evidence };
}

async function assess(
  mastra: Mastra,
  carrier: LoopCarrier,
  steps: GroundStepLog[],
): Promise<LoopCarrier> {
  const riskAssessment = await timed(
    steps,
    carrier,
    "assess",
    { decision: decisionSummary(carrier), evidence: carrier.evidence },
    async () => {
      const result = await mastra
        .getAgent("assessRiskAgent")
        .generate(renderAssessPrompt(carrier), {
          structuredOutput: {
            schema: riskAssessmentSchema,
            model: modelFor("judge"),
            errorStrategy: "strict",
          },
        });
      const obj = (result as { object?: unknown }).object;
      if (!obj) throw new Error("assess: no structured output — check model/schema compatibility");
      return riskAssessmentSchema.parse(obj);
    },
    (riskAssessment) => ({ riskAssessment }),
  );
  return { ...carrier, riskAssessment };
}

/*
 * After a rule output: on need_more_evidence, bump the iteration and swap
 * in its suggested queries; the loop checks the cap. Otherwise keep the
 * carrier as is so the verdict can be read.
 */
function advanceAfterRule(carrier: LoopCarrier, ruleOutput: RuleOutput): LoopCarrier {
  if (ruleOutput.kind !== "need_more_evidence") return { ...carrier, ruleOutput };
  return {
    ...carrier,
    ruleOutput,
    iteration: carrier.iteration + 1,
    queries: ruleOutput.suggestedQueries,
    needMoreReasons: [...carrier.needMoreReasons, ruleOutput.reason],
  };
}

async function rule(
  mastra: Mastra,
  carrier: LoopCarrier,
  steps: GroundStepLog[],
): Promise<LoopCarrier> {
  const ruleOutput = await timed(
    steps,
    carrier,
    "rule",
    {
      decision: decisionSummary(carrier),
      evidence: carrier.evidence,
      riskAssessment: carrier.riskAssessment,
      prevReasons: carrier.needMoreReasons,
    },
    async () => {
      const result = await mastra.getAgent("ruleAgent").generate(renderRulePrompt(carrier), {
        // Allow up to 4 internal turns so cite-ref-docs verification has room.
        maxSteps: 4,
        structuredOutput: {
          schema: ruleStructuredOutputSchema,
          model: modelFor("judge"),
          errorStrategy: "strict",
        },
      });
      const obj = (result as { object?: unknown }).object;
      if (!obj) throw new Error("rule: no structured output — check model/schema compatibility");
      return ruleStructuredOutputSchema.parse(obj).result;
    },
    (ruleOutput) => ({ ruleOutput }),
  );
  return advanceAfterRule(carrier, ruleOutput);
}

/*
 * The final ruling. If rule still wanted more evidence after the last
 * iteration, collapse to needs_more_facts and summarize the accumulated
 * reasons as whatsMissing.
 */
function resolve(carrier: LoopCarrier): Omit<GroundResult, "log"> {
  const ruleOutput = carrier.ruleOutput!;
  const riskTier = carrier.riskAssessment?.riskTier ?? null;
  const iterationCount = Math.min(carrier.iteration, carrier.maxIterations);
  if (ruleOutput.kind === "verdict") {
    return {
      verdict: ruleOutput.verdict,
      reason: ruleOutput.reason,
      citations: ruleOutput.citations,
      riskTier,
      iterationCount,
    };
  }
  const whatsMissing = carrier.needMoreReasons.length
    ? carrier.needMoreReasons.join(" → ")
    : ruleOutput.reason;
  return {
    verdict: "needs_more_facts",
    reason: `Reviewer could not ground the decision after ${iterationCount} iterations: ${whatsMissing}`,
    citations: [],
    riskTier,
    iterationCount,
    whatsMissing,
  };
}

export interface GroundDecisionOptions {
  /**
   * The step log, when the caller owns it: each judge step is pushed as it
   * finishes, so a judge that throws still leaves the steps that ran with
   * the caller. Otherwise the log comes back in the result only.
   */
  steps?: GroundStepLog[];
}

/* Grounds one decision. Throws when a judge fails; the caller records that. */
export async function groundDecision(
  mastra: Mastra,
  rawInput: GroundInput,
  options: GroundDecisionOptions = {},
): Promise<GroundResult> {
  const input = groundInputSchema.parse(rawInput);
  const steps = options.steps ?? [];
  let carrier: LoopCarrier = {
    decision: input.decision,
    facts: input.facts,
    maxIterations: input.maxIterations,
    iteration: 1,
    queries: [],
    needMoreReasons: [],
  };
  for (;;) {
    carrier = await gather(mastra, carrier, steps);
    carrier = await assess(mastra, carrier, steps);
    carrier = await rule(mastra, carrier, steps);
    if (carrier.ruleOutput?.kind === "verdict" || carrier.iteration > carrier.maxIterations) break;
  }
  return { ...resolve(carrier), log: { steps } };
}

/* The MCP-facing step: a judge failure comes back with the steps that ran, not as a thrown error. */
const groundStep = createStep({
  id: "ground",
  inputSchema: groundInputSchema,
  outputSchema: groundRunResultSchema,
  execute: async ({ inputData, mastra }): Promise<GroundRunResult> => {
    const steps: GroundStepLog[] = [];
    try {
      return { status: "ok", ...(await groundDecision(mastra, inputData, { steps })) };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return { status: "failed", error, log: { steps } };
    }
  },
});

export const groundWorkflow = createWorkflow({
  id: "ground",
  description:
    "Grounds one tax decision in the IRS/FTB reference library: the judges retrieve the governing passages, assess the risk, and rule accurate, inaccurate or needs_more_facts with citations. Pass the decision and the facts it cites; maxIterations (default 3) caps the retrieval rounds. The result carries each judge step for the caller's log.",
  inputSchema: groundInputSchema,
  outputSchema: groundRunResultSchema,
})
  .then(groundStep)
  .commit();
