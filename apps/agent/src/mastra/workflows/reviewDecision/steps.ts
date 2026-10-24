import { createStep } from "@mastra/core/workflows";
import { groundCanon } from "../../canon/client";
import { getDecisionById, setDecisionVerdict } from "../../db/aiDecisions";
import {
  completeReviewRun,
  insertReviewRun,
  recordReviewStep,
  setDecisionLatestRunId,
} from "../../db/reviewRuns";
import { listFactsByKeys, noteQuestion } from "../../db/taxFacts";
import {
  reviewCarrierSchema,
  reviewDecisionOutputSchema,
  reviewInputSchema,
  type ReviewCarrier,
  type ReviewVerdict,
} from "./schemas";

/*
 * init → ground → finalize. Cade's side of a review is the bookkeeping:
 * load the decision and its facts, open the review_runs row, hand the
 * decision to Canon, write the verdict back. The judges run in Canon
 * (workflows/ground); their step log comes back with the verdict and is
 * written to review_run_steps here, one row per judge step.
 */

type Scope = { userId: string; filingId: string };

/*
 * ---------------------------------------------------------------------------
 * init — load the decision and the facts it cites, allocate the review_runs
 * row, seed the carrier.
 * ---------------------------------------------------------------------------
 */

export const initStep = createStep({
  id: "init",
  inputSchema: reviewInputSchema,
  outputSchema: reviewCarrierSchema,
  execute: async ({ inputData }) => {
    const t0 = Date.now();
    const { userId, filingId } = inputData;
    const scope = { userId, filingId };

    const decision = await getDecisionById(scope, inputData.decisionId);
    if (!decision) {
      throw new Error(`init: no ai_decision with id ${inputData.decisionId}`);
    }

    const reviewRunId = crypto.randomUUID();
    await insertReviewRun(scope, { id: reviewRunId, decisionId: decision.id, userId, filingId });
    await setDecisionLatestRunId(scope, decision.id, reviewRunId);

    /* The table is append-only; listFactsByKeys collapses to the latest row per key. */
    const facts = await listFactsByKeys(scope, decision.taxYear, decision.supportingFactKeys);

    const carrier: ReviewCarrier = {
      ...inputData,
      reviewRunId,
      decisionKey: decision.decisionKey,
      decision: {
        taxYear: decision.taxYear,
        decisionKey: decision.decisionKey,
        decision: decision.decision,
        rationale: decision.rationale,
        confidence: decision.confidence,
        dissentingConsiderations: decision.dissentingConsiderations,
        supportingFactKeys: decision.supportingFactKeys,
      },
      facts: facts.map((f) => ({
        key: f.key,
        category: f.category,
        value: f.value,
        sourceNote: f.sourceNote,
      })),
    };

    await recordReviewStep(scope, {
      id: crypto.randomUUID(),
      runId: reviewRunId,
      userId,
      filingId,
      iteration: 0, // init runs before the first iteration
      stepKind: "init",
      input: inputData,
      output: { decision: carrier.decision, facts: carrier.facts },
      durationMs: Date.now() - t0,
    });

    return carrier;
  },
});

/*
 * ---------------------------------------------------------------------------
 * ground — one call to Canon. Its step log lands in review_run_steps as if
 * the judges had run here. A transport failure is rethrown with the run id
 * attached, so the wrapper can mark the run and stamp review_unreached.
 * ---------------------------------------------------------------------------
 */

export const groundStep = createStep({
  id: "ground",
  inputSchema: reviewCarrierSchema,
  outputSchema: reviewCarrierSchema,
  execute: async ({ inputData: carrier }) => {
    const scope = { userId: carrier.userId, filingId: carrier.filingId };
    let ground: ReviewCarrier["ground"];
    try {
      ground = await groundCanon({
        decision: { ...carrier.decision, decision: carrier.decision.decision },
        facts: carrier.facts.map((f) => ({ ...f, value: f.value })),
      });
    } catch (err) {
      throw Object.assign(err instanceof Error ? err : new Error(String(err)), {
        reviewRunId: carrier.reviewRunId,
      });
    }
    for (const step of ground.log.steps) {
      await recordReviewStep(scope, {
        id: crypto.randomUUID(),
        runId: carrier.reviewRunId,
        userId: carrier.userId,
        filingId: carrier.filingId,
        iteration: step.iteration,
        stepKind: step.kind,
        input: step.input,
        output: step.output,
        durationMs: step.durationMs,
      });
    }
    return { ...carrier, ground };
  },
});

/*
 * ---------------------------------------------------------------------------
 * finalize — persist the verdict to ai_decisions, optionally write an
 * open_questions row, complete the review_runs row, return the output.
 * ---------------------------------------------------------------------------
 */

/*
 * Surface non-accurate outcomes to Cade via an open_questions row, so he
 * circles back with the user. Otherwise the verdict sits unread in the
 * ledger. Returns the open question's id, or undefined when the verdict
 * needs no follow-up.
 */
async function noteFollowUpQuestion(
  scope: Scope,
  carrier: ReviewCarrier,
  ground: NonNullable<ReviewCarrier["ground"]>,
): Promise<string | undefined> {
  const prompts: Partial<Record<ReviewVerdict, { question: string; context: string | undefined }>> =
    {
      needs_more_facts: {
        question: `Confirm the basis for decision \`${carrier.decisionKey}\` — review couldn't ground it.`,
        context: ground.whatsMissing,
      },
      inaccurate: {
        question: `Revisit decision \`${carrier.decisionKey}\` with the user — review found it conflicts with the evidence.`,
        context: ground.reason,
      },
    };
  const followUp = prompts[ground.verdict];
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
  inputSchema: reviewCarrierSchema,
  outputSchema: reviewDecisionOutputSchema,
  execute: async ({ inputData: carrier }) => {
    const t0 = Date.now();
    const scope = { userId: carrier.userId, filingId: carrier.filingId };
    const ground = carrier.ground;
    if (!ground) throw new Error("finalize: no ground result — the ground step did not run");

    await setDecisionVerdict(
      scope,
      carrier.decisionId,
      ground.verdict,
      ground.reason,
      ground.citations.length > 0 ? ground.citations : null,
    );

    const openQuestionId = await noteFollowUpQuestion(scope, carrier, ground);

    await completeReviewRun(scope, {
      id: carrier.reviewRunId,
      status: "completed",
      finalVerdict: ground.verdict,
      iterationCount: ground.iterationCount,
      durationMs: Date.now() - t0, // finalize-step time only; per-step durations are in review_run_steps
    });

    const output = {
      decisionId: carrier.decisionId,
      reviewRunId: carrier.reviewRunId,
      iterationCount: ground.iterationCount,
      riskTier: ground.riskTier,
      finalVerdict: ground.verdict,
      reason: ground.reason,
      citations: ground.citations,
      ...(openQuestionId ? { openQuestionId } : {}),
      ...(ground.whatsMissing ? { whatsMissing: ground.whatsMissing } : {}),
    };

    await recordReviewStep(scope, {
      id: crypto.randomUUID(),
      runId: carrier.reviewRunId,
      userId: carrier.userId,
      filingId: carrier.filingId,
      iteration: ground.iterationCount,
      stepKind: "finalize",
      input: { decisionId: carrier.decisionId, decisionKey: carrier.decisionKey },
      output,
      durationMs: Date.now() - t0,
    });

    return output;
  },
});
