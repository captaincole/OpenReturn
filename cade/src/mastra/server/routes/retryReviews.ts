import { MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";
import { registerApiRoute } from "@mastra/core/server";
import { getMembership } from "../../db/filings";
import { retryUnreachedReviews } from "../../workflows/reviewDecision";

/* Re-runs every review that never reached Canon (review_unreached); answers with each verdict. */
export const retryReviewsRoute = registerApiRoute("/app/filings/:filingId/reviews/retry", {
  method: "POST",
  handler: async (c) => {
    const requestContext = c.get("requestContext");
    const callerId = requestContext?.get(MASTRA_RESOURCE_ID_KEY) as string | undefined;
    if (!callerId) return c.json({ error: "unauthorized" }, 401);

    const filingId = c.req.param("filingId");
    if (!filingId) return c.json({ error: "missing filingId" }, 400);
    const ownership = await getMembership(filingId, callerId, "owner");
    if (!ownership) return c.json({ error: "not found" }, 404);

    const reviews = await retryUnreachedReviews({ userId: callerId, filingId });
    return c.json({
      ok: true,
      retried: reviews.length,
      reviews: reviews.map((r) => ({ decisionId: r.decisionId, verdict: r.finalVerdict })),
    });
  },
});
