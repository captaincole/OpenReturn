/*
 * HSA intake facts. Verbal answers, one scalar fact per question, so
 * Luca can record them one at a time. Form 8889 Part I and Part II read
 * them through getHsaCoverage().
 *
 * Convention:
 *   category: "hsa"
 *   keys:     see HSA_COVERAGE_KEYS
 *
 * Employer contributions are not here: they come from W-2 box 12 code W.
 * Form 5498-SA is not needed (document minimalism).
 */

import type { FactsView } from "../../types.js";

export type HsaCoverageType = "self-only" | "family";

export const HSA_COVERAGE_KEYS = {
  /* Form 8889 line 1: HDHP coverage type for the year. */
  coverageType: "hsa.coverage_type",
  /* Months of HDHP coverage (1–12). Drives the line 3 limit. */
  coverageMonths: "hsa.coverage_months",
  /* Contributions the taxpayer made directly, outside payroll (line 2). */
  ownContributions: "hsa.own_contributions",
  /* True when every HSA distribution paid qualified medical expenses (line 15). */
  distributionsAllQualified: "hsa.distributions_all_qualified",
} as const;

export interface HsaCoverage {
  coverageType?: HsaCoverageType;
  coverageMonths?: number;
  ownContributions?: number;
  distributionsAllQualified?: boolean;
  /* Fact keys that were present, for the derivation audit trail. */
  factKeys: string[];
}

/** Read the HSA intake answers. Absent answers stay undefined. */
export function getHsaCoverage(facts: FactsView): HsaCoverage {
  const out: HsaCoverage = { factKeys: [] };
  const read = (key: string): unknown => {
    const row = facts.get(key);
    if (row !== undefined) out.factKeys.push(key);
    return row?.value;
  };
  out.coverageType = read(HSA_COVERAGE_KEYS.coverageType) as HsaCoverageType | undefined;
  out.coverageMonths = read(HSA_COVERAGE_KEYS.coverageMonths) as number | undefined;
  out.ownContributions = read(HSA_COVERAGE_KEYS.ownContributions) as number | undefined;
  out.distributionsAllQualified = read(HSA_COVERAGE_KEYS.distributionsAllQualified) as
    boolean | undefined;
  return out;
}
