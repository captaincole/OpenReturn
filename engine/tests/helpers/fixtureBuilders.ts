import type { AIDecisionRow, TaxFactRow } from "../../src/facts/rows.js";

const DEFAULT_CREATED_AT = "2026-04-29T00:00:00Z";

export function identityFact(opts: {
  userId: string;
  taxYear: number;
  suffix: string;
  value: string;
  sourceNote?: string;
}): TaxFactRow {
  return {
    id: `f-id-${opts.suffix.replace(/\./g, "-")}`,
    userId: opts.userId,
    taxYear: opts.taxYear,
    category: "identity",
    key: `identity.${opts.suffix}`,
    value: opts.value,
    sourceNote: opts.sourceNote ?? "verbal",
    createdAt: DEFAULT_CREATED_AT,
  };
}

export function decisionRow(opts: {
  userId: string;
  taxYear: number;
  key: string;
  decision: unknown;
  rationale: string;
  supportingFactKeys?: string[];
}): AIDecisionRow {
  return {
    id: `dec-${opts.key}`,
    userId: opts.userId,
    taxYear: opts.taxYear,
    decisionKey: opts.key,
    decision: opts.decision,
    rationale: opts.rationale,
    supportingFactKeys: opts.supportingFactKeys ?? [],
    confidence: "high",
    dissentingConsiderations: null,
    authorityCitations: null,
    sourceNote: null,
    createdAt: DEFAULT_CREATED_AT,
    verdict: "accurate",
    verdictReason: null,
    verdictAt: DEFAULT_CREATED_AT,
  };
}
