/* Employer HSA contributions come from W-2 box 12 code W, not from here. */

import type { FactsView } from "../../types.js";

export type HsaCoverageType = "self-only" | "family";

export const HSA_COVERAGE_KEYS = {
  coverageType: "hsa.coverage_type",
  coverageMonths: "hsa.coverage_months",
  ownContributions: "hsa.own_contributions",
  distributionsAllQualified: "hsa.distributions_all_qualified",
  /*
   * Form 8889 line 14b: distributions rolled over to another HSA, and excess
   * contributions (with their earnings) withdrawn by the return's due date
   * (irs-8889-inst-2025::sec::line-14b::b01). A number, recorded only when the
   * taxpayer states one.
   */
  rolledOverOrExcessWithdrawn: "hsa.distributions_rolled_over",
} as const;

export interface HsaCoverage {
  coverageType?: HsaCoverageType;
  coverageMonths?: number;
  ownContributions?: number;
  distributionsAllQualified?: boolean;
  rolledOverOrExcessWithdrawn?: number;
  factKeys: string[];
}

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
  out.rolledOverOrExcessWithdrawn = read(HSA_COVERAGE_KEYS.rolledOverOrExcessWithdrawn) as
    number | undefined;
  return out;
}
