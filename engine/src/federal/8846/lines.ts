/*
 * Form 8846 (2025), lines 1 to 6: pure arithmetic. Cents are kept while
 * adding the payroll amounts, and each line rounds once (the 1040 rule).
 */

import { atLeast, roundDollars, sum } from "../../money.js";

/*
 * Line 2's rates. "Food or beverage employers ... the federal minimum wage rate
 * in effect on January 1, 2007, of $5.15 an hour"; "Beauty service employers
 * ... the federal minimum wage rate currently in effect, of $7.25 an hour"
 * (irs-8846-form-2025::sec::how-the-credit-is-figured::b01).
 */
export const FOOD_OR_BEVERAGE_RATE = 5.15;
export const BEAUTY_SERVICE_RATE = 7.25;

/* Line 4: "Multiply line 3 by 7.65% (0.0765)" (irs-8846-form-2025::sec::face-page-1::b01). */
export const SOCIAL_SECURITY_AND_MEDICARE_RATE = 0.0765;
/* Line 4: "multiply the tips subject only to the Medicare tax by 0.0145" (irs-8846-form-2025::sec::line-4::b01). */
export const MEDICARE_ONLY_RATE = 0.0145;
/* Line 4: "the 2025 social security tax wage base of $176,100" (irs-8846-form-2025::sec::line-4::b01). */
export const SOCIAL_SECURITY_WAGE_BASE = 176_100;

export interface PayrollMonth {
  hoursWorked: number;
  wagesExcludingTips: number;
  tips: number;
}

/*
 * One employee's month: "the total amount that would be payable to the
 * employee at $5.15 or $7.25 an hour reduced by the wages (excluding tips)
 * actually paid to the employee during the month"
 * (irs-8846-form-2025::sec::line-2::b01). Zero when the wages reach the rate.
 * The amount never passes the month's tips: only the month's tips are reduced
 * ("the amount of tips for any month ... must be reduced", how-the-credit-is-figured::b01;
 * QUESTIONS.md). Cents kept.
 */
export function nonCreditableTipsOfMonth(month: PayrollMonth, rate: number): number {
  const shortfall = atLeast(0, month.hoursWorked * rate - month.wagesExcludingTips);
  return Math.min(month.tips, shortfall);
}

/* Lines 1 to 4 of one Form 8846, whole dollars. */
export interface CreditLines {
  line1: number;
  line2: number;
  line3: number;
  /* The tips of line 3 subject only to the Medicare tax (the attached computation); 0 with the box unchecked. */
  medicareOnlyTips: number;
  line4: number;
}

/*
 * Line 4: "Subtract these tips from the line 3 tips, and multiply the
 * difference by 0.0765. Then, multiply the tips subject only to the Medicare
 * tax by 0.0145. Enter the sum of these amounts on line 4"
 * (irs-8846-form-2025::sec::line-4::b01). With no such tips it is line 3 ×
 * 7.65%. Cents kept until the sum.
 */
export function line4Unrounded(line3: number, medicareOnlyTips: number): number {
  return (
    (line3 - medicareOnlyTips) * SOCIAL_SECURITY_AND_MEDICARE_RATE +
    medicareOnlyTips * MEDICARE_ONLY_RATE
  );
}

/*
 * Lines 1 to 4 from the payroll totals: line 1 the tips, line 2 the
 * non-creditable tips (each employee month, added with cents), line 3 "Subtract
 * line 2 from line 1" (irs-8846-form-2025::sec::face-page-1::b01).
 */
export function creditLines(
  tipsReceived: number,
  nonCreditableTips: number,
  medicareOnlyTips: number,
): CreditLines {
  const line1 = roundDollars(tipsReceived);
  const line2 = roundDollars(nonCreditableTips);
  const line3 = atLeast(0, line1 - line2);
  const medicareOnly = roundDollars(medicareOnlyTips);
  return {
    line1,
    line2,
    line3,
    medicareOnlyTips: medicareOnly,
    line4: roundDollars(line4Unrounded(line3, medicareOnly)),
  };
}

/* Line 6: "Add lines 4 and 5" (irs-8846-form-2025::sec::face-page-1::b01). */
export function line6Of(line4: number | undefined, line5: number | undefined): number {
  return sum(line4, line5);
}
