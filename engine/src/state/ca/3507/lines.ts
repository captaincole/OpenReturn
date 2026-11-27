/*
 * FTB 3507, Prison Inmate Labor Credit: the arithmetic, pure. Written by hand
 * from ca-3507-form-2025; no published example with numbers exists
 * (QUESTIONS.md).
 */

import { atLeast, roundDollars, sum } from "../../../money.js";

/* "California allows a credit equal to 10% of the wages paid to each prisoner" (ca-3507-form-2025::sec::b-qualifications::b01). */
export const CREDIT_RATE = 0.1;

/*
 * "The total of all business credits including the carryover of any business
 * credit for the taxable year may not reduce the 'net tax' ... by more than
 * $5,000,000" for taxable years 2024 to 2026 (ca-3507-form-2025::sec::credit-limitation::b01).
 */
export const BUSINESS_CREDIT_LIMIT = 5_000_000;

/* "Use credit code 162 when you claim this credit" (ca-3507-form-2025::sec::line-6a::b01). */
export const PRISON_LABOR_CREDIT_CODE = "162";
/* The Credit Table's name for code 162 (ca-540-sched-p-inst-2025::sec::credit-table::b02). */
export const PRISON_LABOR_CREDIT_NAME = "Prison Inmate Labor";

/* Line 6b: "If you are not a corporation, enter -0-" (the form). The engine figures individual returns only. */
export const ASSIGNED_CREDIT_OF_AN_INDIVIDUAL = 0;

/* Line 1: the qualifying wages in whole dollars (ca-3507-form-2025::sec::line-1::b01). */
export const line1 = (wages: number): number => roundDollars(wages);

/* Line 2: "Multiply line 1 by 10% (.10)" (the form). */
export const line2 = (wages: number): number => roundDollars(line1(wages) * CREDIT_RATE);

/*
 * Line 3: "add the amounts and enter the total" (ca-3507-form-2025::sec::line-3::b01).
 * The cents are kept while adding and only the total is rounded (CLAUDE.md, document sums).
 */
export const line3 = (credits: readonly number[]): number => roundDollars(sum(...credits));

/* Line 4: last year's line 7 in whole dollars (ca-3507-form-2025::sec::line-4::b01). */
export const line4 = (carryover: number): number => roundDollars(carryover);

/* Line 5: "Add line 2, line 3, and line 4" (the form). */
export const line5 = (wages: number, passThrough: readonly number[], carryover: number): number =>
  line2(wages) + line3(passThrough) + line4(carryover);

/*
 * The credit used this year (line 6a, Schedule P (540) line 4 column (b)): the
 * smaller of the credit available and the excess tax, which is the tax above
 * tentative minimum tax: "This credit cannot reduce regular tax below the
 * tentative minimum tax (TMT)" (ca-3507-form-2025::sec::c-limitations::b02), and
 * column (b) is "the smaller of the amount in column (a) or the amount in column
 * (c) from the previous line", here Schedule P line 3
 * (ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01).
 * Code 162 is the first credit of Schedule P Part III, so no other business
 * credit has used the $5,000,000 limit before it.
 */
export const creditUsed = (available: number, excessTax: number): number =>
  Math.min(available, atLeast(0, excessTax), BUSINESS_CREDIT_LIMIT);

/*
 * The part the $5,000,000 limit disallows: "the amount of credit that would
 * have otherwise been available to reduce tax in this tax year but for the
 * $5,000,000 credit limitation. Do not include credit limited by your tax"
 * (ca-3507-form-2025::sec::line-6c::b01).
 */
export const disallowedByLimit = (available: number, excessTax: number): number =>
  Math.min(available, atLeast(0, excessTax)) - creditUsed(available, excessTax);

/*
 * Line 6c: the disallowed part when the taxpayer elects it refundable on FTB
 * 3870; "You may not elect to have a partial amount of your disallowed credit
 * be refundable" (ca-3507-form-2025::sec::line-6c::b01), so all of it or 0.
 */
export const line6c = (disallowed: number, electsRefundable: boolean): number =>
  electsRefundable ? disallowed : 0;

/*
 * Line 7: the part the $5,000,000 limit disallowed, less the part elected
 * refundable on line 6c. The credit the tax could not use does not carry
 * over (the DECISION above line 7 in bindings.ts), so it is not here.
 */
export const line7 = (disallowed: number, refundable: number): number =>
  atLeast(0, disallowed - refundable);

export interface ScheduleARow {
  /* Column (a): the credit available. */
  available: number;
  /* Column (b): the credit used this year. */
  used: number;
  /* Column (c): the excess tax less column (b). */
  balance: number;
}

/*
 * Schedule P (540) Section A1 line 4, columns (a) to (c); Section A1 has no
 * column (d) (ca-540-sched-p-inst-2025::sec::section-a1-instructions::b01).
 */
export function scheduleARow(available: number, excessTax: number): ScheduleARow {
  const used = creditUsed(available, excessTax);
  return { available, used, balance: atLeast(0, excessTax) - used };
}
