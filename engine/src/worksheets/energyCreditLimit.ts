/* Form 5695 instructions, Credit Limit Worksheet—Line 31. Blank Schedule 3 amounts count as 0. */

import { atLeast, sum } from "../money.js";

export interface EnergyCreditLimitInputs {
  /** Line 1: Form 1040 line 18. */
  tax: number;
  /* Line 2 sums the Schedule 3 lines below. */
  /** Schedule 3 line 6l (Form 8978 line 14). */
  form8978Amount?: number;
  /** Schedule 3 line 1. */
  foreignTaxCredit?: number;
  /** Schedule 3 line 2. */
  dependentCareCredit?: number;
  /** Schedule 3 line 6d. */
  elderlyOrDisabledCredit?: number;
  /** Schedule 3 line 3. */
  educationCredits?: number;
  /** Schedule 3 line 4. */
  retirementSavingsCredit?: number;
}

export interface EnergyCreditLimitResult {
  line1: number;
  line2: number;
  line3: number;
}

export function computeEnergyCreditLimit(inputs: EnergyCreditLimitInputs): EnergyCreditLimitResult {
  const line1 = inputs.tax;
  const line2 = sum(
    inputs.form8978Amount,
    inputs.foreignTaxCredit,
    inputs.dependentCareCredit,
    inputs.elderlyOrDisabledCredit,
    inputs.educationCredits,
    inputs.retirementSavingsCredit,
  );
  return { line1, line2, line3: atLeast(0, line1 - line2) };
}
