import { z } from "zod";
import {
  authorityCitationSchema,
  groundInputSchema,
  groundResultSchema,
} from "../../canon/schemas";

/*
 * The review-decision workflow's shapes. The judges' contract (what Canon
 * takes and returns) lives in canon/schemas.ts; this is Cade's side: which
 * decision, which filing, which review_runs row.
 */

export const reviewInputSchema = z.object({
  decisionId: z.string(),
  userId: z.string(),
  filingId: z.string(),
});

/* What init loads and ground fills in; finalize reads it. */
export const reviewCarrierSchema = reviewInputSchema.extend({
  reviewRunId: z.string(),
  decisionKey: z.string(),
  decision: groundInputSchema.shape.decision,
  facts: groundInputSchema.shape.facts,
  ground: groundResultSchema.optional(),
});
export type ReviewCarrier = z.infer<typeof reviewCarrierSchema>;

export const reviewVerdictSchema = z.enum([
  "accurate",
  "inaccurate",
  "needs_more_facts",
  "review_failed",
  "review_unreached",
]);
export type ReviewVerdict = z.infer<typeof reviewVerdictSchema>;

export const reviewDecisionOutputSchema = z.object({
  decisionId: z.string(),
  reviewRunId: z.string(),
  iterationCount: z.number().int().min(0),
  riskTier: z.enum(["low", "medium", "high"]).nullable(),
  finalVerdict: reviewVerdictSchema,
  reason: z.string(),
  citations: z.array(authorityCitationSchema),
  /*
   * openQuestionId is set for needs_more_facts and inaccurate verdicts.
   * whatsMissing is set only for needs_more_facts.
   */
  openQuestionId: z.string().optional(),
  whatsMissing: z.string().optional(),
});
export type ReviewDecisionOutput = z.infer<typeof reviewDecisionOutputSchema>;
