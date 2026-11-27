import { z } from "zod";
import { jurisdictionSchema } from "../../canon/jurisdictions";
import {
  authorityCitationSchema,
  groundInputSchema,
  groundResultSchema,
} from "../../canon/schemas";

export const reviewInputSchema = z.object({
  decisionId: z.string(),
  userId: z.string(),
  filingId: z.string(),
});

export const reviewCarrierSchema = reviewInputSchema.extend({
  reviewRunId: z.string(),
  decisionKey: z.string(),
  decision: groundInputSchema.shape.decision,
  facts: groundInputSchema.shape.facts,
  /** The jurisdictions to search, from the decision key (jurisdictions.ts). */
  jurisdictions: z.array(jurisdictionSchema).min(1),
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
  /* The jurisdictions Canon searched. Unset when the review did not finish. */
  jurisdictions: z.array(jurisdictionSchema).optional(),
  /* openQuestionId: needs_more_facts and inaccurate only. whatsMissing: needs_more_facts only. */
  openQuestionId: z.string().optional(),
  whatsMissing: z.string().optional(),
  /* When two official texts disagree: one open question for a person to choose. */
  conflictQuestionId: z.string().optional(),
});
export type ReviewDecisionOutput = z.infer<typeof reviewDecisionOutputSchema>;
