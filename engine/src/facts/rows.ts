/* Engine input rows. Defined here, not in the db layer, so the dependency points one way. */

export type Confidence = "low" | "medium" | "high";

/*
 * `ungroundable` stays for rows from the legacy reviewer.
 * `review_unreached`: Canon never ran (down or timed out); retried later.
 * `review_failed`: the review ran and broke.
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
