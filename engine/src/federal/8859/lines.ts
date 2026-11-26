/*
 * Form 8859 (2025), the arithmetic of its four lines and of the Tax Liability
 * Limit Worksheet—Line 2. The form has no dollar thresholds of its own: the
 * original credit's $5,000 limit and its phase-out ended with homes bought
 * before 2012 (irs-8859-form-2025::sec::omb-no-1545-0074::b01, b02).
 */

import { atLeast, roundDollars } from "../../money.js";

/*
 * Line 1: "Enter the amount from line 4 of your 2024 Form 8859"
 * (irs-8859-form-2025::sec::face-page-1::b01), in whole dollars.
 */
export const carryforwardFrom2024 = (stated: number): number => atLeast(0, roundDollars(stated));

/*
 * The Tax Liability Limit Worksheet—Line 2
 * (irs-8859-form-2025::sec::tax-liability-limit-worksheet-line-2::b01, b02):
 * line 1 is Form 1040 line 18, line 2 the listed credits taken on the return,
 * line 3 their difference; "If zero or less, enter -0-".
 */
export interface TaxLiabilityLimit {
  line1: number;
  line2: number;
  line3: number;
}

export function taxLiabilityLimit(form1040Line18: number, otherCredits: number): TaxLiabilityLimit {
  return {
    line1: form1040Line18,
    line2: otherCredits,
    line3: atLeast(0, form1040Line18 - otherCredits),
  };
}

/* Lines 1 to 4 of the form. */
export interface Form8859Lines {
  line1: number;
  line2: number;
  line3: number;
  line4: number;
}

/*
 * Line 2 is worksheet line 3. Line 3: "Enter the smaller of line 1 or line 2".
 * Line 4: "Subtract line 3 from line 1" (irs-8859-form-2025::sec::face-page-1::b01);
 * it carries forward "until you have used all of it" (line-4::b01).
 */
export function form8859Lines(line1: number, limit: TaxLiabilityLimit): Form8859Lines {
  const line2 = limit.line3;
  const line3 = Math.min(line1, line2);
  return { line1, line2, line3, line4: line1 - line3 };
}
