import type { Mastra } from "@mastra/core";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { hybridSearchRefDocs } from "../../../db/corpusSearch";
import { resolveJurisdictions, type Jurisdiction } from "../../../jurisdiction";
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
  type SettledRuleOutput,
} from "./schemas";
import { consultStatute, settleAfterStatute } from "./statute";
import { validateCitations, validateConflicts } from "./validateCitations";

/*
 * Each judge is one model call with the output schema as its response
 * format (judge.ts): no tools, no second structuring pass. Retrieval runs
 * in code, and so does the citation check (validateCitations.ts).
 */

const HITS_PER_QUERY = 6;

async function retrieveBlocks(
  queries: string[],
  jurisdictions: Jurisdiction[],
): Promise<EvidenceBundle["irsBlocks"]> {
  const blockMap = new Map<string, { docId: string; text: string; score: number }>();
  for (const query of queries) {
    const hits = await hybridSearchRefDocs({ query, limit: HITS_PER_QUERY, jurisdictions });
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
    {
      decisionKey: carrier.decision.decisionKey,
      iteration: carrier.iteration,
      jurisdictions: carrier.jurisdictions,
      queries,
    },
    async (): Promise<EvidenceBundle> => ({
      facts: carrier.facts,
      irsBlocks: await retrieveBlocks(queries, carrier.jurisdictions),
      statuteBlocks: carrier.evidence?.statuteBlocks ?? [],
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

function advanceAfterRule(carrier: LoopCarrier, ruleOutput: SettledRuleOutput): LoopCarrier {
  if (ruleOutput.kind !== "need_more_evidence") return { ...carrier, ruleOutput };
  return {
    ...carrier,
    ruleOutput,
    iteration: carrier.iteration + 1,
    queries: ruleOutput.suggestedQueries,
    needMoreReasons: [...carrier.needMoreReasons, ruleOutput.reason],
  };
}

/* One rule-judge call. Citations and conflicts may name instruction or statute blocks of this run. */
async function ruleCall(
  mastra: Mastra,
  carrier: LoopCarrier,
  steps: GroundStepLog[],
  note?: string,
): Promise<RuleOutput> {
  const { ruleOutput } = await timed(
    steps,
    carrier,
    "rule",
    {
      decision: decisionSummary(carrier),
      evidence: carrier.evidence,
      riskAssessment: carrier.riskAssessment,
      prevReasons: carrier.needMoreReasons,
      ...(note ? { note } : {}),
    },
    async () => {
      const { result } = await judge(
        mastra.getAgent("ruleAgent"),
        renderRulePrompt(carrier, note),
        ruleStructuredOutputSchema,
      );
      if (result.kind !== "verdict") return { ruleOutput: result, dropped: undefined };
      const blocks = [...carrier.evidence!.irsBlocks, ...carrier.evidence!.statuteBlocks];
      const { citations, dropped } = validateCitations(result.citations, blocks);
      const checked = validateConflicts(result.conflicts, blocks);
      return {
        ruleOutput: { ...result, citations, conflicts: checked.conflicts },
        dropped,
        droppedConflicts: checked.dropped,
      };
    },
    (result) => result,
  );
  return ruleOutput;
}

/* A consult_statute gets one statute round and one more call, in the same iteration. */
async function rule(
  mastra: Mastra,
  carrier: LoopCarrier,
  steps: GroundStepLog[],
): Promise<LoopCarrier> {
  const first = await ruleCall(mastra, carrier, steps);
  if (first.kind !== "consult_statute") return advanceAfterRule(carrier, first);
  const round = await consultStatute(carrier, first, steps, HITS_PER_QUERY);
  const second = await ruleCall(mastra, round.carrier, steps, round.note);
  return advanceAfterRule(round.carrier, settleAfterStatute(second));
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
      conflicts: ruleOutput.conflicts,
      statuteConsulted: carrier.statuteConsulted,
      jurisdictions: carrier.jurisdictions,
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
    conflicts: [],
    statuteConsulted: carrier.statuteConsulted,
    jurisdictions: carrier.jurisdictions,
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
    jurisdictions: resolveJurisdictions(input.jurisdictions),
    iteration: 1,
    queries: [],
    needMoreReasons: [],
    statuteConsulted: false,
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
    'Grounds one tax decision in the IRS/FTB reference library: the judges retrieve the governing passages, assess the risk, and rule accurate, inaccurate or needs_more_facts with citations. When the passages conflict, or name a rule of law without stating it, the rule judge may consult the statute (law.db) once; passages that disagree come back as conflicts, with both quotes. Pass the decision and the facts it cites; maxIterations (default 3) caps the retrieval rounds. Pass jurisdictions to search only some of the library: ["CA"] searches only California, and the federal statute is then not searched. The result carries each judge step for the caller\'s log.',
  inputSchema: groundInputSchema,
  outputSchema: groundRunResultSchema,
})
  .then(groundStep)
  .commit();
