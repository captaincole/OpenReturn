import { createStep } from "@mastra/core/workflows";
import {
  decisionSummary,
  formulateQueries,
  hybridSearchRefDocs,
  loopCarrierSchema,
  renderAssessPrompt,
  renderRulePrompt,
  reviewDecisionOutputSchema,
  riskAssessmentSchema,
  ruleStructuredOutputSchema,
  type EvidenceBundle,
  type LoopCarrier,
  type RuleOutput,
} from "@openreturn/canon";
import { z } from "zod";
import { getDecisionById, setDecisionVerdict } from "../../db/aiDecisions";
import {
  completeReviewRun,
  insertReviewRun,
  recordReviewStep,
  setDecisionLatestRunId,
} from "../../db/reviewRuns";
import { listFactsByKeys, noteQuestion } from "../../db/taxFacts";
import { modelFor } from "../../models";

/*
 * ---------------------------------------------------------------------------
 * Step constants — the review_run_steps.step_kind values. They live here
 * instead of an enum so the workflow definition stays readable.
 * ---------------------------------------------------------------------------
 */

const KIND = {
  init: "init",
  gather: "gather",
  assess: "assess",
  rule: "rule",
  finalize: "finalize",
} as const;

type Scope = { userId: string; filingId: string };

/*
 * ---------------------------------------------------------------------------
 * init — load the decision, allocate the review_runs row, seed the loop
 * carrier. First step of the parent workflow; not part of the loop.
 * ---------------------------------------------------------------------------
 */

export const initStep = createStep({
  id: "init",
  /*
   * Scope arrives in the workflow input. The caller (record-ai-decision via
   * the reviewDecision wrapper) already knows the filing. A re-resolve here
   * would re-impose a one-filing-per-year assumption the workflow does not
   * need.
   */
  inputSchema: z.object({
    decisionId: z.string(),
    userId: z.string(),
    filingId: z.string(),
  }),
  outputSchema: loopCarrierSchema,
  execute: async ({ inputData }) => {
    const t0 = Date.now();
    const { userId, filingId } = inputData;
    const scope = { userId, filingId };

    const decision = await getDecisionById(scope, inputData.decisionId);
    if (!decision) {
      throw new Error(`init: no ai_decision with id ${inputData.decisionId}`);
    }

    const reviewRunId = crypto.randomUUID();
    await insertReviewRun(scope, {
      id: reviewRunId,
      decisionId: decision.id,
      userId,
      filingId,
    });
    await setDecisionLatestRunId(scope, decision.id, reviewRunId);

    const carrier: LoopCarrier = {
      decisionId: decision.id,
      reviewRunId,
      userId,
      filingId,
      taxYear: decision.taxYear,
      decisionKey: decision.decisionKey,
      decisionValue: decision.decision,
      rationale: decision.rationale,
      confidence: decision.confidence,
      dissentingConsiderationsInput: decision.dissentingConsiderations,
      supportingFactKeys: decision.supportingFactKeys,
      iteration: 1,
      queries: [],
      needMoreReasons: [],
    };

    await recordReviewStep(scope, {
      id: crypto.randomUUID(),
      runId: reviewRunId,
      userId,
      filingId,
      iteration: 0, // init runs before the first iteration
      stepKind: KIND.init,
      input: inputData,
      output: { carrier },
      durationMs: Date.now() - t0,
    });

    return carrier;
  },
});

/*
 * ---------------------------------------------------------------------------
 * gather — deterministic. Loads supporting facts from tax_facts, derives
 * queries (the queryFormulator judge on iteration 1, rule's suggestedQueries
 * on iterations 2/3), runs hybrid retrieval, builds the evidence bundle.
 * ---------------------------------------------------------------------------
 */

/*
 * Run each query and dedupe blocks across queries by blockId, keeping the
 * higher score when queries overlap.
 */
async function retrieveBlocks(queries: string[]): Promise<EvidenceBundle["irsBlocks"]> {
  const blockMap = new Map<string, { docId: string; text: string; score: number }>();
  for (const q of queries) {
    const hits = await hybridSearchRefDocs({ query: q, limit: 6 });
    for (const h of hits) {
      const prev = blockMap.get(h.blockId);
      if (prev && prev.score >= h.score) continue;
      blockMap.set(h.blockId, { docId: h.docId, text: h.text, score: h.score });
    }
  }
  return Array.from(blockMap.entries()).map(([blockId, b]) => ({
    blockId,
    docId: b.docId,
    text: b.text,
    score: b.score,
  }));
}

export const gatherStep = createStep({
  id: "gather",
  inputSchema: loopCarrierSchema,
  outputSchema: loopCarrierSchema,
  execute: async ({ inputData, mastra }) => {
    const t0 = Date.now();
    const carrier = inputData;
    /*
     * Scope comes from the carrier. init already resolved and verified the
     * filing; a re-derive here would repeat the lookup on every iteration.
     */
    const scope = { userId: carrier.userId, filingId: carrier.filingId };

    /*
     * Iteration 1 → derive queries from the decision via the formulator.
     * Iterations 2/3 → use the queries the rule step put on the carrier.
     */
    let queries = carrier.queries;
    if (queries.length === 0) {
      queries = await formulateQueries(mastra.getAgent("queryFormulator"), carrier);
    }

    /*
     * Pull the facts the decision cites. The table is append-only;
     * listFactsByKeys collapses to the latest row per key.
     */
    const facts = await listFactsByKeys(scope, carrier.taxYear, carrier.supportingFactKeys);

    const evidence: EvidenceBundle = {
      facts: facts.map((f) => ({
        key: f.key,
        category: f.category,
        value: f.value,
        sourceNote: f.sourceNote,
      })),
      irsBlocks: await retrieveBlocks(queries),
      queriesUsed: queries,
      iteration: carrier.iteration,
    };

    const out: LoopCarrier = { ...carrier, queries, evidence };

    await recordReviewStep(scope, {
      id: crypto.randomUUID(),
      runId: carrier.reviewRunId,
      userId: carrier.userId,
      filingId: carrier.filingId,
      iteration: carrier.iteration,
      stepKind: KIND.gather,
      input: { carrier: stripHeavyFields(carrier) },
      output: { evidence },
      durationMs: Date.now() - t0,
    });

    return out;
  },
});

/*
 * ---------------------------------------------------------------------------
 * assess — LLM. Reads decision + evidence, emits a risk tier.
 * ---------------------------------------------------------------------------
 */

export const assessRiskStep = createStep({
  id: "assess",
  inputSchema: loopCarrierSchema,
  outputSchema: loopCarrierSchema,
  execute: async ({ inputData, mastra }) => {
    const t0 = Date.now();
    const carrier = inputData;
    const scope = { userId: carrier.userId, filingId: carrier.filingId };
    if (!carrier.evidence) {
      throw new Error("assess: evidence missing — gather did not run");
    }

    const prompt = renderAssessPrompt(carrier);
    const result = await mastra.getAgent("assessRiskAgent").generate(prompt, {
      structuredOutput: {
        schema: riskAssessmentSchema,
        model: modelFor("judge"),
        errorStrategy: "strict",
      },
    });
    const riskAssessment = (result as { object?: unknown }).object;
    if (!riskAssessment) {
      throw new Error("assess: no structured output — check model/schema compatibility");
    }
    const parsed = riskAssessmentSchema.parse(riskAssessment);

    const out: LoopCarrier = { ...carrier, riskAssessment: parsed };

    await recordReviewStep(scope, {
      id: crypto.randomUUID(),
      runId: carrier.reviewRunId,
      userId: carrier.userId,
      filingId: carrier.filingId,
      iteration: carrier.iteration,
      stepKind: KIND.assess,
      input: { decision: decisionSummary(carrier), evidence: carrier.evidence },
      output: { riskAssessment: parsed },
      durationMs: Date.now() - t0,
    });

    return out;
  },
});

/*
 * ---------------------------------------------------------------------------
 * rule — LLM. Reads decision + evidence + risk, emits verdict OR a
 * need_more_evidence request that drives the next iteration.
 * ---------------------------------------------------------------------------
 */

/*
 * Advance the carrier after a rule output. When rule emits
 * need_more_evidence, bump the iteration and swap in its suggested
 * queries; the loop condition enforces the cap. Otherwise keep the
 * carrier as-is so finalize can read the verdict.
 */
function advanceAfterRule(carrier: LoopCarrier, ruleOutput: RuleOutput): LoopCarrier {
  if (ruleOutput.kind !== "need_more_evidence") {
    return { ...carrier, ruleOutput };
  }
  return {
    ...carrier,
    ruleOutput,
    iteration: carrier.iteration + 1,
    queries: ruleOutput.suggestedQueries,
    needMoreReasons: [...carrier.needMoreReasons, ruleOutput.reason],
  };
}

export const ruleStep = createStep({
  id: "rule",
  inputSchema: loopCarrierSchema,
  outputSchema: loopCarrierSchema,
  execute: async ({ inputData, mastra }) => {
    const t0 = Date.now();
    const carrier = inputData;
    const scope = { userId: carrier.userId, filingId: carrier.filingId };
    if (!carrier.evidence || !carrier.riskAssessment) {
      throw new Error("rule: missing evidence or riskAssessment");
    }

    const prompt = renderRulePrompt(carrier);
    const result = await mastra.getAgent("ruleAgent").generate(prompt, {
      // Allow up to 4 internal turns so cite-ref-docs verification has room.
      maxSteps: 4,
      structuredOutput: {
        schema: ruleStructuredOutputSchema,
        model: modelFor("judge"),
        errorStrategy: "strict",
      },
    });
    const ruleOutput = (result as { object?: unknown }).object;
    if (!ruleOutput) {
      throw new Error("rule: no structured output — check model/schema compatibility");
    }
    const parsed = ruleStructuredOutputSchema.parse(ruleOutput).result;

    const out = advanceAfterRule(carrier, parsed);

    await recordReviewStep(scope, {
      id: crypto.randomUUID(),
      runId: carrier.reviewRunId,
      userId: carrier.userId,
      filingId: carrier.filingId,
      iteration: carrier.iteration,
      stepKind: KIND.rule,
      input: {
        decision: decisionSummary(carrier),
        evidence: carrier.evidence,
        riskAssessment: carrier.riskAssessment,
        prevReasons: carrier.needMoreReasons,
      },
      output: { ruleOutput: parsed },
      durationMs: Date.now() - t0,
    });

    return out;
  },
});

/*
 * ---------------------------------------------------------------------------
 * finalize — reads the carrier after the loop terminates, persists verdict
 * to ai_decisions, optionally writes an open_questions row, completes the
 * review_runs row, returns the workflow output.
 * ---------------------------------------------------------------------------
 */

/* The reviewable subset of Verdict — the output schema excludes "pending". */
type FinalVerdict = z.infer<typeof reviewDecisionOutputSchema>["finalVerdict"];

interface FinalRuling {
  finalVerdict: FinalVerdict;
  reason: string;
  citations: { blockId: string; quote?: string }[];
  whatsMissing?: string;
}

/*
 * Determine the final verdict. If rule still wanted more evidence after
 * the loop exhausted its iterations, collapse to needs_more_facts and
 * synthesize a whatsMissing summary from the accumulated reasons (the
 * last one included).
 */
function resolveFinalVerdict(carrier: LoopCarrier): FinalRuling {
  const ruleOutput = carrier.ruleOutput!;
  if (ruleOutput.kind === "verdict") {
    return {
      finalVerdict: ruleOutput.verdict,
      reason: ruleOutput.reason,
      citations: ruleOutput.citations,
    };
  }
  const allReasons = [...carrier.needMoreReasons];
  const whatsMissing = allReasons.length ? allReasons.join(" → ") : ruleOutput.reason;
  return {
    finalVerdict: "needs_more_facts",
    reason: `Reviewer could not ground the decision after ${carrier.iteration - 1} iterations: ${whatsMissing}`,
    citations: [],
    whatsMissing,
  };
}

/*
 * Surface non-accurate outcomes to Cade via an open_questions row, so he
 * circles back with the user. Otherwise the verdict sits unread in the
 * ledger. Returns the open question's id, or undefined when the verdict
 * needs no follow-up.
 */
async function noteFollowUpQuestion(
  scope: Scope,
  carrier: LoopCarrier,
  ruling: FinalRuling,
): Promise<string | undefined> {
  const prompts: Partial<Record<FinalVerdict, { question: string; context: string | undefined }>> =
    {
      needs_more_facts: {
        question: `Confirm the basis for decision \`${carrier.decisionKey}\` — review couldn't ground it.`,
        context: ruling.whatsMissing,
      },
      inaccurate: {
        question: `Revisit decision \`${carrier.decisionKey}\` with the user — review found it conflicts with the evidence.`,
        context: ruling.reason,
      },
    };
  const followUp = prompts[ruling.finalVerdict];
  if (!followUp) return undefined;

  const openQuestionId = crypto.randomUUID();
  await noteQuestion(scope, {
    id: openQuestionId,
    userId: carrier.userId,
    filingId: carrier.filingId,
    question: followUp.question,
    context: followUp.context,
    decisionId: carrier.decisionId,
  });
  return openQuestionId;
}

export const finalizeStep = createStep({
  id: "finalize",
  inputSchema: loopCarrierSchema,
  outputSchema: reviewDecisionOutputSchema,
  execute: async ({ inputData }) => {
    const t0 = Date.now();
    const carrier = inputData;
    const scope = { userId: carrier.userId, filingId: carrier.filingId };
    if (!carrier.ruleOutput) {
      throw new Error("finalize: ruleOutput missing — loop did not run");
    }

    const ruling = resolveFinalVerdict(carrier);
    const { finalVerdict, reason, citations, whatsMissing } = ruling;

    await setDecisionVerdict(
      scope,
      carrier.decisionId,
      finalVerdict,
      reason,
      citations.length > 0 ? citations : null,
    );

    const openQuestionId = await noteFollowUpQuestion(scope, carrier, ruling);

    /*
     * Iteration count: a verdict on iteration N reports N. When we
     * exhausted iterations (rule returned need_more on iteration 3),
     * ruleStep bumped the carrier to 4 — clamp to 3 for reporting.
     */
    const iterationCount = Math.min(carrier.iteration, 3) as 1 | 2 | 3;

    await completeReviewRun(scope, {
      id: carrier.reviewRunId,
      status: "completed",
      finalVerdict,
      iterationCount,
      durationMs: Date.now() - t0, // finalize-step time only; per-step durations are in review_run_steps
    });

    const output = {
      decisionId: carrier.decisionId,
      reviewRunId: carrier.reviewRunId,
      iterationCount,
      riskTier: carrier.riskAssessment?.riskTier ?? null,
      finalVerdict,
      reason,
      citations,
      ...(openQuestionId ? { openQuestionId } : {}),
      ...(whatsMissing ? { whatsMissing } : {}),
    };

    await recordReviewStep(scope, {
      id: crypto.randomUUID(),
      runId: carrier.reviewRunId,
      userId: carrier.userId,
      filingId: carrier.filingId,
      iteration: iterationCount,
      stepKind: KIND.finalize,
      input: { carrier: stripHeavyFields(carrier) },
      output,
      durationMs: Date.now() - t0,
    });

    return output;
  },
});

/*
 * review_run_steps.input_json carries only the relevant inputs. The gather
 * and finalize steps log the carrier through this strip — the evidence
 * bundle already lives on gather's output_json for the same iteration.
 */
function stripHeavyFields(c: LoopCarrier) {
  return {
    decisionId: c.decisionId,
    decisionKey: c.decisionKey,
    iteration: c.iteration,
    queries: c.queries,
    needMoreReasons: c.needMoreReasons,
  };
}
