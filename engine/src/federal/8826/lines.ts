/*
 * Form 8826 (Rev. September 2017), lines 1 to 8, and the eligible small
 * business test: pure arithmetic. Line 1 adds the expenditures with their
 * cents and rounds the total; every other line is whole dollars (the 1040
 * rule, irs-1040-inst-2025::sec::rounding-off-to-whole::b01).
 */

import { atLeast, roundDollars, sum } from "../../money.js";

/* Line 2: "Minimum amount", printed $250 (irs-8826-form-2025::sec::face-page-1::b01). */
export const MINIMUM_AMOUNT = 250;
/* Line 4: "Maximum amount", printed $10,000 (irs-8826-form-2025::sec::face-page-1::b01). */
export const MAXIMUM_AMOUNT = 10_000;
/* Line 6: "Multiply line 5 by 50% (0.50)" (irs-8826-form-2025::sec::face-page-1::b01). */
export const CREDIT_RATE = 0.5;
/*
 * Line 8: "Add lines 6 and 7, but do not enter more than $5,000"
 * (irs-8826-form-2025::sec::face-page-1::b01); Form 3800 line 1e, "don't enter
 * more than $5,000" (irs-3800-inst-2025::sec::line-1e::b01).
 */
export const CREDIT_LIMIT = 5_000;

/*
 * The eligible small business: "Had gross receipts (including that of any
 * predecessor) for the preceding tax year that did not exceed $1 million or had
 * no more than 30 full-time employees during the preceding tax year"
 * (irs-8826-form-2025::sec::purpose-of-form::b01).
 */
export const GROSS_RECEIPTS_LIMIT = 1_000_000;
export const FULL_TIME_EMPLOYEE_LIMIT = 30;

/* Lines 1 to 6 of one Form 8826, whole dollars. */
export interface CreditLines {
  line1: number;
  line3: number;
  line5: number;
  line6: number;
}

/* Line 1: "Total eligible access expenditures", cents kept until the total (irs-8826-form-2025::sec::specific-instructions::b01). */
export const line1Of = (expenditures: number[]): number => roundDollars(sum(...expenditures));

/* Line 3: "Subtract line 2 from line 1. If zero or less, enter -0-". */
export const line3Of = (line1: number): number => atLeast(0, line1 - MINIMUM_AMOUNT);

/* Line 5: "Enter the smaller of line 3 or line 4". */
export const line5Of = (line3: number): number => Math.min(line3, MAXIMUM_AMOUNT);

/* Line 6: "Multiply line 5 by 50% (0.50)", to the nearest dollar. */
export const line6Of = (line5: number): number => roundDollars(line5 * CREDIT_RATE);

/* Lines 1 to 6 from the expenditures of every business on the return. */
export function creditLines(expenditures: number[]): CreditLines {
  const line1 = line1Of(expenditures);
  const line3 = line3Of(line1);
  const line5 = line5Of(line3);
  return { line1, line3, line5, line6: line6Of(line5) };
}

/* Line 8: "Add lines 6 and 7, but do not enter more than $5,000"; a blank line counts 0. */
export const line8Of = (line6: number | undefined, line7: number | undefined): number =>
  Math.min(sum(line6, line7), CREDIT_LIMIT);

/*
 * The test: true or false, or the answer it waits on. The employees are read
 * only when the gross receipts are above the limit (the test is "or").
 */
export type EligibilityAnswer = "grossReceipts" | "fullTimeEmployees";

export function eligibleSmallBusiness(answers: {
  grossReceipts?: number;
  fullTimeEmployees?: number;
}): boolean | { waitsOn: EligibilityAnswer } {
  if (answers.grossReceipts === undefined) return { waitsOn: "grossReceipts" };
  if (answers.grossReceipts <= GROSS_RECEIPTS_LIMIT) return true;
  if (answers.fullTimeEmployees === undefined) return { waitsOn: "fullTimeEmployees" };
  return answers.fullTimeEmployees <= FULL_TIME_EMPLOYEE_LIMIT;
}
