import type { Mastra } from "@mastra/core";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { hybridSearchRefDocs } from "../../../db/corpusSearch";
import { judge } from "../../judge";
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
import { validateCitations } from "./validateCitations";

/*
 * Each judge is one model call with the output schema as its response
 * format (judge.ts): no tools, no second structuring pass. Retrieval runs
 * in code, and so does the citation check (validateCitations.ts).
 */

const HITS_PER_QUERY = 6;

async function retrieveBlocks(queries: string[]): Promise<EvidenceBundle["irsBlocks"]> {
  const blockMap = new Map<string, { docId: string; text: string; score: number }>();
  for (const query of queries) {
    const hits = await hybridSearchRefDocs({ query: query, limit: HITS_PER_QUERY });
    for (const hit of hits) {
      const prev = blockMap.get(hit.blockId);
      if (prev && prev.score >= hit.score) continue;
      blockMap.set(hit.blockId, { docId: hit.docId, text: hit.text, score: hit.score });
    }
  }
  return Array.from(blockMap.entries()).map(([blockId, block]) => ({ blockId, ...block }));
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
    () =>
      judge(mastra.getAgent("assessRiskAgent"), renderAssessPrompt(carrier), riskAssessmentSchema),
    (riskAssessment) => ({ riskAssessment }),
  );
  return { ...carrier, riskAssessment };
}

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
  const { ruleOutput } = await timed(
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
      const { result } = await judge(
        mastra.getAgent("ruleAgent"),
        renderRulePrompt(carrier),
        ruleStructuredOutputSchema,
      );
      if (result.kind !== "verdict") return { ruleOutput: result, dropped: undefined };
      const { citations, dropped } = validateCitations(
        result.citations,
        carrier.evidence!.irsBlocks,
      );
      return { ruleOutput: { ...result, citations }, dropped };
    },
    (result) => result,
  );
  return advanceAfterRule(carrier, ruleOutput);
}

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
  /** Steps are pushed as they finish, so a judge that throws keeps the steps that ran. */
  steps?: GroundStepLog[];
}

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
