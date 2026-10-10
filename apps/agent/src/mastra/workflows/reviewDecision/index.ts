import { createWorkflow } from "@mastra/core/workflows";
import { RequestContext, MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";
import { z } from "zod";
import {
  loopCarrierSchema,
  reviewDecisionOutputSchema,
  type ReviewDecisionOutput,
} from "./schemas";
import { initStep, gatherStep, assessRiskStep, ruleStep, finalizeStep } from "./steps";
import { completeReviewRun } from "../../db/reviewRuns";
import { setDecisionVerdict } from "../../db/aiDecisions";
import type { Scope } from "../../db/appDb";

/*
 * ---------------------------------------------------------------------------
 * Loop body — gather → assess → rule. Wrapped as a child workflow so the
 * parent can `.dountil()` it. Each iteration takes the previous iteration's
 * output as input (LoopCarrier in, LoopCarrier out).
 * ---------------------------------------------------------------------------
 */

export const reviewLoopWorkflow = createWorkflow({
  id: "review-decision-loop",
  inputSchema: loopCarrierSchema,
  outputSchema: loopCarrierSchema,
})
  .then(gatherStep)
  .then(assessRiskStep)
  .then(ruleStep)
  .commit();

/*
 * ---------------------------------------------------------------------------
 * Parent workflow — init → loop (max 3 iterations) → finalize.
 * ---------------------------------------------------------------------------
 */

export const reviewDecisionWorkflow = createWorkflow({
  id: "review-decision",
  inputSchema: z.object({
    decisionId: z.string(),
    userId: z.string(),
    filingId: z.string(),
  }),
  outputSchema: reviewDecisionOutputSchema,
})
  .then(initStep)
  .dountil(reviewLoopWorkflow, async ({ inputData, iterationCount }) => {
    /*
     * Stop when rule committed to a verdict OR after 3 iterations.
     * ruleStep bumps `iteration` to N+1 only when it returned need_more, so
     * the Mastra-supplied `iterationCount` checked against 3 is the
     * canonical hard stop.
     */
    return inputData.ruleOutput?.kind === "verdict" || iterationCount >= 3;
  })
  .then(finalizeStep)
  .commit();

/*
 * ---------------------------------------------------------------------------
 * Public wrapper. Runs the workflow and returns the terminal output. It
 * catches errors and marks the failed review row 'failed' on the way out,
 * so Luca always sees a definitive state for every record-ai-decision call.
 * ---------------------------------------------------------------------------
 */

export type { ReviewDecisionOutput };

export async function reviewDecision(
  scope: Scope,
  decisionId: string,
): Promise<ReviewDecisionOutput> {
  const requestContext = new RequestContext();
  requestContext.set(MASTRA_RESOURCE_ID_KEY, scope.userId);

  const run = await reviewDecisionWorkflow.createRun({
    resourceId: scope.userId,
  });

  try {
    const result = await run.start({
      inputData: {
        decisionId,
        userId: scope.userId,
        filingId: scope.filingId,
      },
      requestContext,
    });
    if (result.status === "success") {
      return result.result;
    }
    if (result.status === "failed") {
      throw result.error;
    }
    throw new Error(`review-decision: unexpected workflow status '${result.status}'`);
  } catch (err) {
    /*
     * Best-effort failure recording: stamp the decision row and the
     * review_runs row so Luca (and the trace log) see why the run failed.
     * init may have failed, so the reviewRunId is not reliably available
     * here; in that case we stamp only the ai_decisions row.
     */
    const reason = err instanceof Error ? err.message : String(err);
    try {
      await setDecisionVerdict(scope, decisionId, "review_failed", reason, null);
    } catch {
      /* swallow — the original error is what matters */
    }
    /*
     * If the error carries a runId, mark that run failed too. Best effort;
     * most error paths do not attach one.
     */
    const runId = (err as { reviewRunId?: string }).reviewRunId;
    if (runId) {
      try {
        await completeReviewRun(scope, {
          id: runId,
          status: "failed",
          finalVerdict: "review_failed",
          iterationCount: 0,
          durationMs: 0,
          error: reason,
        });
      } catch {
        /* swallow */
      }
    }
    return {
      decisionId,
      reviewRunId: runId ?? "",
      iterationCount: 1,
      riskTier: null,
      finalVerdict: "review_failed",
      reason,
      citations: [],
    };
  }
}
