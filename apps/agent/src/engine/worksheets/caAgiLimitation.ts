/*
 * California AGI Limitation Worksheet (2025 Form 540 booklet, line 32
 * instructions; corpus: ca-540-booklet-2025::sec::agi-limitation-worksheet).
 * Phases out exemption credits when federal AGI (540 line 13) exceeds
 * the filing-status threshold: $6 per credit for each $2,500 ($1,250 MFS)
 * or part of it over the threshold. Whole dollars only.
 */

import type { FilingStatus } from "../values.js";

const THRESHOLDS_2025: Record<FilingStatus, number> = {
  single: 252203,
  married_filing_separately: 252203,
  married_filing_jointly: 504411,
  qualifying_surviving_spouse: 504411,
  head_of_household: 378310,
};

export interface CaAgiLimitationInputs {
  filingStatus: FilingStatus;
  /** Line a: Form 540 line 13 (federal AGI). */
  federalAgi: number;
  /** Line f: number of exemptions in the boxes on lines 7, 8, 9. */
  personalCount: number;
  /** Line h: dollar total of lines 7, 8, 9. */
  personalAmount: number;
  /** Line j: number of dependents on line 10. */
  dependentCount: number;
  /** Line l: dollar amount on line 10. */
  dependentAmount: number;
}

/** Line n: exemption credits after the limitation (Form 540 line 32). */
export function caExemptionCreditsAfterLimit(inputs: CaAgiLimitationInputs): number {
  const total = inputs.personalAmount + inputs.dependentAmount;
  const excess = inputs.federalAgi - THRESHOLDS_2025[inputs.filingStatus]; // line c
  if (excess <= 0) return total; // not over the threshold: line 32 = line 11
  const step = inputs.filingStatus === "married_filing_separately" ? 1250 : 2500;
  const e = Math.ceil(excess / step) * 6; // lines d, e
  const i = Math.max(0, inputs.personalAmount - e * inputs.personalCount); // lines g, i
  const m = Math.max(0, inputs.dependentAmount - e * inputs.dependentCount); // lines k, m
  return i + m; // line n
}
