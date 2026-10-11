import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { getDecisionById, setDecisionVerdict, type Verdict } from "../../db/aiDecisions";
import { hybridSearchRefDocs } from "../../db/refDocs";
import {
  completeReviewRun,
  insertReviewRun,
  recordReviewStep,
  setDecisionLatestRunId,
} from "../../db/reviewRuns";
import { listFactsByKeys, noteQuestion } from "../../db/taxFacts";
import { modelFor } from "../../models";
import { assessRiskAgent } from "./judges/assessRiskAgent";
import { queryFormulator } from "./judges/queryFormulator";
import { ruleAgent } from "./judges/ruleAgent";
import {
  loopCarrierSchema,
  reviewDecisionOutputSchema,
  riskAssessmentSchema,
  ruleOutputSchema,
  type EvidenceBundle,
  type LoopCarrier,
} from "./schemas";

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

export const gatherStep = createStep({
  id: "gather",
  inputSchema: loopCarrierSchema,
  outputSchema: loopCarrierSchema,
  execute: async ({ inputData, requestContext }) => {
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
      queries = await formulateQueries(carrier);
    }

    /*
     * Pull the facts the decision cites. The table is append-only;
     * listFactsByKeys collapses to the latest row per key.
     */
    const facts = await listFactsByKeys(scope, carrier.taxYear, carrier.supportingFactKeys);

    // Run each query and dedupe blocks across queries by blockId.
    const blockMap = new Map<string, { docId: string; text: string; score: number }>();
    for (const q of queries) {
      const hits = await hybridSearchRefDocs({ query: q, limit: 6 });
      for (const h of hits) {
        if (blockMap.has(h.blockId)) {
          // Keep the higher score across queries.
          const prev = blockMap.get(h.blockId)!;
          if (h.score > prev.score) {
            blockMap.set(h.blockId, { docId: h.docId, text: h.text, score: h.score });
          }
          continue;
        }
        blockMap.set(h.blockId, {
          docId: h.docId,
          text: h.text,
          score: h.score,
        });
      }
    }
    const irsBlocks = Array.from(blockMap.entries()).map(([blockId, b]) => ({
      blockId,
      docId: b.docId,
      text: b.text,
      score: b.score,
    }));

    const evidence: EvidenceBundle = {
      facts: facts.map((f) => ({
        key: f.key,
        category: f.category,
        value: f.value,
        sourceNote: f.sourceNote,
      })),
      irsBlocks,
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
  execute: async ({ inputData, requestContext }) => {
    const t0 = Date.now();
    const carrier = inputData;
    const scope = { userId: carrier.userId, filingId: carrier.filingId };
    if (!carrier.evidence) {
      throw new Error("assess: evidence missing — gather did not run");
    }

    const prompt = renderAssessPrompt(carrier);
    const result = await assessRiskAgent.generate(prompt, {
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

export const ruleStep = createStep({
  id: "rule",
  inputSchema: loopCarrierSchema,
  outputSchema: loopCarrierSchema,
  execute: async ({ inputData, requestContext }) => {
    const t0 = Date.now();
    const carrier = inputData;
    const scope = { userId: carrier.userId, filingId: carrier.filingId };
    if (!carrier.evidence || !carrier.riskAssessment) {
      throw new Error("rule: missing evidence or riskAssessment");
    }

    const prompt = renderRulePrompt(carrier);
    const result = await ruleAgent.generate(prompt, {
      // Allow up to 4 internal turns so cite-ref-docs verification has room.
      maxSteps: 4,
      structuredOutput: {
        schema: ruleOutputSchema,
        model: modelFor("judge"),
        errorStrategy: "strict",
      },
    });
    const ruleOutput = (result as { object?: unknown }).object;
    if (!ruleOutput) {
      throw new Error("rule: no structured output — check model/schema compatibility");
    }
    const parsed = ruleOutputSchema.parse(ruleOutput);

    /*
     * Update the carrier. When rule emits need_more_evidence, advance the
     * iteration and swap in its suggested queries; the loop condition
     * enforces the cap. Otherwise keep the carrier as-is so finalize can
     * read the verdict.
     */
    let nextIteration = carrier.iteration;
    let nextQueries = carrier.queries;
    let nextReasons = carrier.needMoreReasons;
    if (parsed.kind === "need_more_evidence") {
      nextIteration = carrier.iteration + 1;
      nextQueries = parsed.suggestedQueries;
      nextReasons = [...carrier.needMoreReasons, parsed.reason];
    }

    const out: LoopCarrier = {
      ...carrier,
      ruleOutput: parsed,
      iteration: nextIteration,
      queries: nextQueries,
      needMoreReasons: nextReasons,
    };

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

export const finalizeStep = createStep({
  id: "finalize",
  inputSchema: loopCarrierSchema,
  outputSchema: reviewDecisionOutputSchema,
  execute: async ({ inputData, requestContext }) => {
    const t0 = Date.now();
    const carrier = inputData;
    const scope = { userId: carrier.userId, filingId: carrier.filingId };
    if (!carrier.ruleOutput) {
      throw new Error("finalize: ruleOutput missing — loop did not run");
    }

    /*
     * Determine the final verdict. If rule still wanted more evidence after
     * the loop exhausted its iterations, collapse to needs_more_facts and
     * synthesize a whatsMissing summary from the accumulated reasons.
     */
    let finalVerdict: Verdict;
    let reason: string;
    let citations: { blockId: string; quote?: string }[] = [];
    let whatsMissing: string | undefined;
    let openQuestionId: string | undefined;

    if (carrier.ruleOutput.kind === "verdict") {
      finalVerdict = carrier.ruleOutput.verdict;
      reason = carrier.ruleOutput.reason;
      citations = carrier.ruleOutput.citations;
    } else {
      /*
       * need_more_evidence with no iterations left → collapse to
       * needs_more_facts. The accumulated reasons (the last one included)
       * describe the gap; whatsMissing joins them in order.
       */
      finalVerdict = "needs_more_facts";
      const allReasons = [...carrier.needMoreReasons];
      whatsMissing = allReasons.length ? allReasons.join(" → ") : carrier.ruleOutput.reason;
      reason = `Reviewer could not ground the decision after ${carrier.iteration - 1} iterations: ${whatsMissing}`;
    }

    await setDecisionVerdict(
      scope,
      carrier.decisionId,
      finalVerdict,
      reason,
      citations.length > 0 ? citations : null,
    );

    /*
     * Surface non-accurate outcomes to Luca via an open_questions row, so
     * he circles back with the user. Otherwise the verdict sits unread in
     * the ledger.
     */
    if (finalVerdict === "needs_more_facts") {
      openQuestionId = crypto.randomUUID();
      await noteQuestion(scope, {
        id: openQuestionId,
        userId: carrier.userId,
        filingId: carrier.filingId,
        question: `Confirm the basis for decision \`${carrier.decisionKey}\` — review couldn't ground it.`,
        context: whatsMissing,
        decisionId: carrier.decisionId,
      });
    } else if (finalVerdict === "inaccurate") {
      openQuestionId = crypto.randomUUID();
      await noteQuestion(scope, {
        id: openQuestionId,
        userId: carrier.userId,
        filingId: carrier.filingId,
        question: `Revisit decision \`${carrier.decisionKey}\` with the user — review found it conflicts with the evidence.`,
        context: reason,
        decisionId: carrier.decisionId,
      });
    }

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
 * ---------------------------------------------------------------------------
 * Prompt rendering and small helpers
 * ---------------------------------------------------------------------------
 */

function decisionSummary(carrier: LoopCarrier) {
  return {
    decisionKey: carrier.decisionKey,
    decision: carrier.decisionValue,
    rationale: carrier.rationale,
    confidence: carrier.confidence,
    dissentingConsiderations: carrier.dissentingConsiderationsInput,
    supportingFactKeys: carrier.supportingFactKeys,
  };
}

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

async function formulateQueries(c: LoopCarrier): Promise<string[]> {
  const prompt = [
    `Decision to ground:`,
    `  decisionKey: ${c.decisionKey}`,
    `  value: ${JSON.stringify(c.decisionValue)}`,
    `  rationale: ${c.rationale}`,
    `  supportingFactKeys: ${c.supportingFactKeys.join(", ") || "(none)"}`,
    ``,
    `Emit 1–2 search queries that would surface the IRS guidance governing this kind of decision.`,
  ].join("\n");

  const result = await queryFormulator.generate(prompt, {
    structuredOutput: {
      /*
       * Anthropic's native structured-output endpoint rejects `maxItems` on
       * array properties. The 1–2 cap therefore lives in the prompt and the
       * slice below, not in the schema.
       */
      schema: z.object({ queries: z.array(z.string()).min(1) }),
      model: modelFor("judge"),
      errorStrategy: "strict",
    },
  });
  const obj = (result as { object?: { queries?: string[] } }).object;
  if (!obj?.queries || obj.queries.length === 0) {
    /*
     * Fallback: synthesize a query from the decisionKey itself. Better
     * than a throw — the workflow stays alive, and the step log still
     * records which queries ran.
     */
    return [c.decisionKey.replace(/^decisions\./, "").replace(/_/g, " ")];
  }
  return obj.queries.slice(0, 2);
}

function renderAssessPrompt(c: LoopCarrier): string {
  return [
    `Decision under review:`,
    JSON.stringify(decisionSummary(c), null, 2),
    ``,
    `Supporting facts (from tax_facts):`,
    factLines(c.evidence!.facts),
    ``,
    `Retrieved IRS passages (top hits across ${c.evidence!.queriesUsed.length} query/queries):`,
    blockLines(c.evidence!.irsBlocks),
    ``,
    `Assess the risk tier of this decision per your instructions.`,
  ].join("\n");
}

function renderRulePrompt(c: LoopCarrier): string {
  const evidence = c.evidence!;
  const risk = c.riskAssessment!;
  return [
    `Decision under review:`,
    JSON.stringify(decisionSummary(c), null, 2),
    ``,
    `Risk tier: ${risk.riskTier}`,
    `  rationale: ${risk.rationale}`,
    `  consequence: ${risk.consequenceNotes}`,
    risk.dissentingConsiderations.length
      ? `  dissenting: ${risk.dissentingConsiderations.join("; ")}`
      : "",
    ``,
    `Supporting facts (from tax_facts):`,
    factLines(evidence.facts),
    ``,
    `Retrieved IRS passages (this iteration: ${c.iteration}, queries: ${evidence.queriesUsed.join(" | ")}):`,
    blockLines(evidence.irsBlocks),
    ``,
    c.needMoreReasons.length
      ? `Previous iterations asked for more evidence with these reasons:\n${c.needMoreReasons.map((r, i) => `  ${i + 1}. ${r}`).join("\n")}\n`
      : "",
    `You are on iteration ${c.iteration} of 3. Decide: commit to a verdict, or request more evidence (with suggested queries).`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function factLines(facts: EvidenceBundle["facts"]): string {
  if (!facts.length) return "  (none)";
  return facts
    .map(
      (f) =>
        `  - ${f.key} (${f.category}): ${JSON.stringify(f.value)}` +
        (f.sourceNote ? ` [source: ${f.sourceNote}]` : ""),
    )
    .join("\n");
}

function blockLines(blocks: EvidenceBundle["irsBlocks"]): string {
  if (!blocks.length) return "  (no IRS passages retrieved)";
  return blocks
    .map(
      (b) =>
        `  [${b.blockId}] ${b.text.replace(/\s+/g, " ").slice(0, 600)}${b.text.length > 600 ? "…" : ""}`,
    )
    .join("\n");
}
