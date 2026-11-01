/*
 * CA AGI Limitation Worksheet (540 instructions, line 32): $6 per credit for each $2,500
 * ($1,250 MFS) or part of it over the threshold.
 */

import { atLeast, stepsOf } from "../money.js";
import type { FilingStatus } from "../values.js";

const REDUCTION_PER_STEP = 6;

const THRESHOLDS_2025: Record<FilingStatus, number> = {
  single: 252203,
  married_filing_separately: 252203,
  married_filing_jointly: 504411,
  qualifying_surviving_spouse: 504411,
  head_of_household: 378310,
};

export interface CaAgiLimitationInputs {
  filingStatus: FilingStatus;
  /** Line a: Form 540 line 13. */
  federalAgi: number;
  /** Line f: exemption count on lines 7, 8, 9. */
  personalCount: number;
  /** Line h: dollar total of lines 7, 8, 9. */
  personalAmount: number;
  /** Line j: dependent count on line 10. */
  dependentCount: number;
  /** Line l: line 10 amount. */
  dependentAmount: number;
}

export function caExemptionCreditsAfterLimit(inputs: CaAgiLimitationInputs): number {
  const total = inputs.personalAmount + inputs.dependentAmount;
  const excess = inputs.federalAgi - THRESHOLDS_2025[inputs.filingStatus]; // line c
  if (excess <= 0) return total; // not over the threshold: line 32 = line 11
  const step = inputs.filingStatus === "married_filing_separately" ? 1250 : 2500;
  const reductionPerCredit = stepsOf(excess, step) * REDUCTION_PER_STEP; // lines d, e
  const personalAfterLimit = atLeast(
    0,
    inputs.personalAmount - reductionPerCredit * inputs.personalCount,
  ); // lines g, i
  const dependentAfterLimit = atLeast(
    0,
    inputs.dependentAmount - reductionPerCredit * inputs.dependentCount,
  ); // lines k, m
  return personalAfterLimit + dependentAfterLimit; // line n
}
