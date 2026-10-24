/*
 * The engine's input vocabulary: the shapes of the fact and decision rows
 * that evaluateScenario consumes. Defined HERE, not in the db layer, so
 * the dependency arrow points one way. The engine says what a fact IS;
 * the mastra/db modules only persist and load that shape. They import
 * these types and re-export them for their own callers.
 *
 * Boundary rule: nothing in src/ imports from outside src/
 * (see ../README.md). These definitions make that possible.
 */

export type Confidence = "low" | "medium" | "high";

/*
 * Verdicts come from two paths:
 *   - the legacy single-agent reviewer (pre-workflow): accurate |
 *     inaccurate | ungroundable | review_failed
 *   - the multi-step review-decision workflow: accurate | inaccurate |
 *     needs_more_facts | review_failed
 * `ungroundable` stays for backward compatibility with rows the old
 * reviewer wrote. New runs write `needs_more_facts` instead.
 *
 * `pending` is the initial state. record-ai-decision sets it when it
 * starts the review as a background task. The workflow's finalizeStep
 * re-stamps the row on completion, typically within seconds to a minute.
 * `review_unreached` means the review never reached Canon (the grounding
 * service was down or timed out): the judges did not run, and the review
 * is retried later. `review_failed` means it ran and broke.
 */
export type Verdict =
  | "pending"
  | "accurate"
  | "inaccurate"
  | "ungroundable"
  | "needs_more_facts"
  | "review_failed"
  | "review_unreached";

export interface AuthorityCitation {
  blockId: string;
  quote?: string;
}

export interface TaxFactRow {
  id: string;
  userId: string;
  taxYear: number;
  category: string;
  key: string;
  value: unknown;
  sourceNote: string | null;
  createdAt: string;
}

export interface AIDecisionRow {
  id: string;
  userId: string;
  taxYear: number;
  decisionKey: string;
  decision: unknown;
  rationale: string;
  supportingFactKeys: string[];
  confidence: Confidence;
  dissentingConsiderations: string | null;
  authorityCitations: AuthorityCitation[] | null;
  sourceNote: string | null;
  createdAt: string;
  verdict: Verdict | null;
  verdictReason: string | null;
  verdictAt: string | null;
}
