import { MASTRA_RESOURCE_ID_KEY, RequestContext } from "@mastra/core/request-context";
import { createWorkflow } from "@mastra/core/workflows";
import { errorMessage, isCanonUnreachable } from "../../canon/client";
import { listDecisions, setDecisionVerdict } from "../../db/aiDecisions";
import type { Scope } from "../../db/appDb";
import { completeReviewRun } from "../../db/reviewRuns";
import {
  reviewDecisionOutputSchema,
  reviewInputSchema,
  type ReviewDecisionOutput,
} from "./schemas";
import { finalizeStep, groundStep, initStep } from "./steps";

export const reviewDecisionWorkflow = createWorkflow({
  id: "review-decision",
  inputSchema: reviewInputSchema,
  outputSchema: reviewDecisionOutputSchema,
})
  .then(initStep)
  .then(groundStep)
  .then(finalizeStep)
  .commit();

export type { ReviewDecisionOutput };

/*
 * Never throws: a failure stamps review_unreached (Canon never got the call; retried later)
 * or review_failed (the review ran and broke; a retry would likely break again).
 */
export async function reviewDecision(
  scope: Scope,
  decisionId: string,
): Promise<ReviewDecisionOutput> {
  const requestContext = new RequestContext();
  requestContext.set(MASTRA_RESOURCE_ID_KEY, scope.userId);

  const run = await reviewDecisionWorkflow.createRun({ resourceId: scope.userId });

  try {
    const result = await run.start({
      inputData: { decisionId, userId: scope.userId, filingId: scope.filingId },
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
    return recordReviewFailure(scope, decisionId, err);
  }
}

/* One at a time: the judges share one model, so parallel reviews time out together. */

let queue: Promise<unknown> = Promise.resolve();
const queued = new Set<string>();

export function enqueueReview(scope: Scope, decisionId: string): Promise<ReviewDecisionOutput> {
  if (queued.has(decisionId)) {
    return Promise.reject(new Error(`review-decision: ${decisionId} is already queued`));
  }
  queued.add(decisionId);
  const run = queue.then(
    () => reviewDecision(scope, decisionId),
    () => reviewDecision(scope, decisionId),
  );
  queue = run.finally(() => queued.delete(decisionId));
  return run;
}

/*
 * `except` leaves out the review that just ran: a timed-out call may still run in Canon,
 * and a resend would put two grounds on the judges' model at once.
 */
export async function retryUnreachedReviews(
  scope: Scope,
  except?: string,
): Promise<ReviewDecisionOutput[]> {
  const unreached = await listDecisions(scope, { verdict: "review_unreached" });
  const runs = unreached
    .filter((d) => d.id !== except && !queued.has(d.id))
    .map((d) => enqueueReview(scope, d.id));
  return Promise.all(runs);
}

/* An unreached review is no evidence Canon is back, so it starts no sweep. */
export function retryAfter(scope: Scope, out: ReviewDecisionOutput): Promise<unknown> {
  if (out.finalVerdict === "review_unreached") return Promise.resolve();
  return retryUnreachedReviews(scope, out.decisionId);
}

async function recordReviewFailure(
  scope: Scope,
  decisionId: string,
  err: unknown,
): Promise<ReviewDecisionOutput> {
  const reason = errorMessage(err);
  const finalVerdict = isCanonUnreachable(err) ? "review_unreached" : "review_failed";
  try {
    await setDecisionVerdict(scope, decisionId, finalVerdict, reason, null);
  } catch {
    /* The original error is what matters. */
  }
  /* The ground step attaches a run id; an init failure has none. */
  const runId = findRunId(err);
  if (runId) {
    try {
      await completeReviewRun(scope, {
        id: runId,
        status: "failed",
        finalVerdict,
        iterationCount: 0,
        durationMs: 0,
        error: reason,
      });
    } catch {
      /* Best-effort. */
    }
  }
  return {
    decisionId,
    reviewRunId: runId ?? "",
    iterationCount: 0,
    riskTier: null,
    finalVerdict,
    reason,
    citations: [],
  };
}

/* Mastra may wrap a step's error; look for the run id along the cause chain. */
function findRunId(err: unknown): string | undefined {
  for (let e = err; e; e = (e as { cause?: unknown }).cause) {
    const id = (e as { reviewRunId?: string }).reviewRunId;
    if (id) return id;
  }
  return undefined;
}
