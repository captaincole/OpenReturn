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

/*
 * ---------------------------------------------------------------------------
 * init → ground → finalize. The judges and their retrieval loop run in
 * Canon (one MCP call in the ground step); this workflow is the app.db
 * side: the review_runs row, the verdict, the open question.
 * ---------------------------------------------------------------------------
 */

export const reviewDecisionWorkflow = createWorkflow({
  id: "review-decision",
  inputSchema: reviewInputSchema,
  outputSchema: reviewDecisionOutputSchema,
})
  .then(initStep)
  .then(groundStep)
  .then(finalizeStep)
  .commit();

/*
 * ---------------------------------------------------------------------------
 * Public wrapper. Runs the workflow and returns the terminal output. It
 * catches errors and stamps the decision row on the way out, so Cade
 * always sees a definitive state for every record-ai-decision call:
 *
 *   review_unreached  Canon never got the call (down, timed out). The
 *                     judges did not run; retryUnreachedReviews re-runs it.
 *   review_failed     the review ran and broke (a judge threw, a schema
 *                     did not match). A retry would likely break again.
 * ---------------------------------------------------------------------------
 */

export type { ReviewDecisionOutput };

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

/*
 * ---------------------------------------------------------------------------
 * The review queue. Reviews run one at a time: the judges share one model
 * (one GPU, locally), so parallel reviews only slow each other down and
 * time out together. A decision already waiting is not queued twice.
 * ---------------------------------------------------------------------------
 */

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
 * Re-queue every review that never reached Canon. No scheduler: this runs
 * after each record-ai-decision's own review and on
 * POST /app/filings/:filingId/reviews/retry. Decisions already in the
 * queue are skipped, so overlapping sweeps do not pile up, and `except`
 * leaves out the decision whose review just ran: a timed-out call may
 * still be running in Canon, and re-sending it at once would put two
 * grounds on the judges' GPU, the very thing the queue prevents.
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

/*
 * The tool's follow-up: sweep only when this review reached Canon. A
 * review that did not is no evidence Canon is back, so its sweep would
 * only queue more calls to time out; the next decision tries again.
 */
export function retryAfter(scope: Scope, out: ReviewDecisionOutput): Promise<unknown> {
  if (out.finalVerdict === "review_unreached") return Promise.resolve();
  return retryUnreachedReviews(scope, out.decisionId);
}

/*
 * Best-effort failure recording: stamp the decision row and the
 * review_runs row so Cade (and the trace log) see why the run failed.
 * init may have failed, so the reviewRunId is not reliably available
 * here; in that case we stamp only the ai_decisions row.
 */
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
    /* swallow — the original error is what matters */
  }
  /*
   * If the error carries a runId, mark that run failed too. Best effort;
   * the ground step attaches one, init failures do not.
   */
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
      /* swallow */
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
