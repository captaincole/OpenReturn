/*
 * Form 8820 (Rev. September 2018), Part I: pure arithmetic. The expenses keep
 * their cents while adding, and each line rounds once (the 1040 rule).
 */

import { atLeast, roundDollars, sum } from "../../money.js";

/* Line 2a: "If 'No,' multiply line 1 by 25% (0.25)" (irs-8820-form-2025::sec::face-part-i::b01). */
export const FULL_CREDIT_RATE = 0.25;
/*
 * Line 2a: "If 'Yes,' multiply line 1 by 19.75% (0.1975)" (irs-8820-form-2025::sec::face-part-i::b01):
 * 25% less 25% times the 21% maximum corporate rate (section 280C(b)(3)(B)).
 */
export const REDUCED_CREDIT_RATE = 0.1975;

export interface ExpenseAmounts {
  wages?: number;
  supplies?: number;
  computerRental?: number;
  contractTesting?: number;
}

/*
 * Line 1: "Qualified clinical testing expenses paid or incurred during the tax
 * year" (irs-8820-form-2025::sec::face-part-i::b01), every kind added with
 * cents, contract testing in full (purpose-of-form::b01).
 */
export function line1Of(expenses: ExpenseAmounts): number {
  return roundDollars(
    sum(expenses.wages, expenses.supplies, expenses.computerRental, expenses.contractTesting),
  );
}

/* Line 2a: line 1 at 19.75% with the election, else 25%. */
export function line2aOf(line1: number, reducedCreditElection: boolean): number {
  return roundDollars(line1 * (reducedCreditElection ? REDUCED_CREDIT_RATE : FULL_CREDIT_RATE));
}

/* Line 2c: "Subtract line 2b from line 2a. If zero or less, enter -0-" (face-part-i::b01). */
export function line2cOf(line2a: number, line2b: number | undefined): number {
  return atLeast(0, line2a - (line2b ?? 0));
}

/* Line 4: "Add lines 2c and 3" (face-part-i::b01). */
export function line4Of(line2c: number | undefined, line3: number | undefined): number {
  return sum(line2c, line3);
}

/* Part I lines 1 to 2c, whole dollars. */
export interface CreditLines {
  line1: number;
  line2a: number;
  /* Blank with no Form 8932 credit on the same wages. */
  line2b?: number;
  line2c: number;
}

export function creditLines(
  expenses: ExpenseAmounts,
  reducedCreditElection: boolean,
  differentialWageCredit: number | undefined,
): CreditLines {
  const line1 = line1Of(expenses);
  const line2a = line2aOf(line1, reducedCreditElection);
  // A line 2b of 0 (no Form 8932 credit on the same wages) stays blank.
  const line2b = differentialWageCredit ? roundDollars(differentialWageCredit) : undefined;
  return { line1, line2a, line2b, line2c: line2cOf(line2a, line2b) };
}

/*
 * The deduction the credit takes off: none with the election ("paragraphs (1)
 * and (2) shall not apply", section 280C(b)(3)(A)); else line 2a (reduction.ts).
 *
 * DECISION (2026-11-27, by the author): the deduction goes down by line 2a,
 * not line 2c.
 * Text A, the form's instructions for line 2a: "If you do not elect the
 * reduced credit, you must reduce your otherwise allowable deduction for
 * qualified clinical testing expenses by the amount of the credit on this
 * line" (irs-8820-form-2025::sec::line-2a::b02).
 * Text B, the statute: "No deduction shall be allowed for that portion of the
 * qualified clinical testing expenses ... which is equal to the amount of the
 * credit allowable for the taxable year under section 45C"
 * (usc-26-2025::sec::s280c::b-1), and section 45P(c) reduces the credit
 * otherwise allowable by the Form 8932 credit on the same wages
 * (usc-26-2025::sec::s45p::c), which line 2b takes off.
 * The engine follows text A: a form's own instructions decide how its lines
 * and their reductions are figured. The two differ only when line 2b holds
 * an amount (QUESTIONS.md; docs/rule-decisions.md).
 */
export function deductionReductionOf(lines: CreditLines, reducedCreditElection: boolean): number {
  return reducedCreditElection ? 0 : lines.line2a;
}
