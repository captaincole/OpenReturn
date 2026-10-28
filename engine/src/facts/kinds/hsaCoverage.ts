/* Employer HSA contributions come from W-2 box 12 code W, not from here. */

import type { FactsView } from "../../types.js";

export type HsaCoverageType = "self-only" | "family";

export const HSA_COVERAGE_KEYS = {
  coverageType: "hsa.coverage_type",
  coverageMonths: "hsa.coverage_months",
  ownContributions: "hsa.own_contributions",
  distributionsAllQualified: "hsa.distributions_all_qualified",
} as const;

export interface HsaCoverage {
  coverageType?: HsaCoverageType;
  coverageMonths?: number;
  ownContributions?: number;
  distributionsAllQualified?: boolean;
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
  return out;
}
