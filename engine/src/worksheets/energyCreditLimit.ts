/*
 * Energy Efficient Home Improvement Credit Limit Worksheet—Line 31
 * (2025 Form 5695 instructions; corpus: irs-5695-inst-2025). Limits the
 * Part II credit to the tax left after the Schedule 3 credits that come
 * before it. Line 3 goes on Form 5695 line 31.
 */

import { atLeast, sum } from "../money.js";

export interface EnergyCreditLimitInputs {
  /** Line 1: Form 1040 line 18. */
  tax: number;
  /*
   * Line 2: the Schedule 3 amounts taken on the return. Blank counts
   * as 0.
   */
  /** Schedule 3 line 6l: amount on Form 8978, line 14. */
  form8978Amount?: number;
  /** Schedule 3 line 1: foreign tax credit. */
  foreignTaxCredit?: number;
  /** Schedule 3 line 2: credit for child and dependent care expenses. */
  dependentCareCredit?: number;
  /** Schedule 3 line 6d: credit for the elderly or the disabled. */
  elderlyOrDisabledCredit?: number;
  /** Schedule 3 line 3: nonrefundable education credits. */
  educationCredits?: number;
  /** Schedule 3 line 4: retirement savings contributions credit. */
  retirementSavingsCredit?: number;
}

export interface EnergyCreditLimitResult {
  line1: number;
  line2: number;
  /** Line 1 minus line 2, at least 0. Form 5695 line 31. */
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
