/*
 * The rates of Form 8697 for an individual: the interest rate of each accrual
 * period (Part I lines 7 and 8, Part II lines 8 and 9), and the assumed
 * marginal rates of the simplified marginal impact method (Part II lines 2 and 4).
 */

import { underpaymentRateOn } from "../../data/underpaymentRates.js";

/*
 * Part II line 2: "the applicable regular tax rate" for individuals and
 * pass-through entities held more than 50% by individuals, by the year the
 * tax year begins (irs-8697-inst-2025::sec::line-2-2::b01, items 1a–1j).
 * Each row applies from its first year until the next row's first year.
 */
export const SMIM_REGULAR_RATES_INDIVIDUAL: ReadonlyArray<{ fromYear: number; rate: number }> = [
  { fromYear: 1987, rate: 0.385 },
  { fromYear: 1988, rate: 0.28 },
  { fromYear: 1991, rate: 0.31 },
  { fromYear: 1993, rate: 0.396 },
  { fromYear: 2001, rate: 0.391 },
  { fromYear: 2002, rate: 0.386 },
  { fromYear: 2003, rate: 0.35 },
  { fromYear: 2013, rate: 0.396 },
  { fromYear: 2018, rate: 0.37 },
];

/* Item 1a: "Tax years beginning before 1987 . . . 50%". */
export const SMIM_REGULAR_RATE_BEFORE_1987 = 0.5;

/*
 * Part II line 4: "the applicable AMT rate" for individuals (irs-8697-inst-2025::sec::line-4::b01,
 * items 1a–1c). The text names no rate for a year before 1987.
 */
export const SMIM_AMT_RATES_INDIVIDUAL: ReadonlyArray<{ fromYear: number; rate: number }> = [
  { fromYear: 1987, rate: 0.21 },
  { fromYear: 1991, rate: 0.24 },
  { fromYear: 1993, rate: 0.28 },
];

function rateFromTable(
  table: ReadonlyArray<{ fromYear: number; rate: number }>,
  taxYear: number,
): number | undefined {
  return [...table].reverse().find((row) => taxYear >= row.fromYear)?.rate;
}

/* Part II line 2's rate for a calendar tax year. */
export function smimRegularRate(taxYear: number): number {
  return rateFromTable(SMIM_REGULAR_RATES_INDIVIDUAL, taxYear) ?? SMIM_REGULAR_RATE_BEFORE_1987;
}

/* Part II line 4's rate for a calendar tax year; undefined before 1987. */
export function smimAmtRate(taxYear: number): number | undefined {
  return rateFromTable(SMIM_AMT_RATES_INDIVIDUAL, taxYear);
}

/*
 * The first day an individual's overpayment rate equals the underpayment rate
 * of data/underpaymentRates.ts: both are the short-term rate plus 3 points from
 * 1999 (the noncorporate table of Rev. Rul. 2024-18; Form 8611 reads the table
 * the same way, federal/8611/interest.ts). Before it, the table has the
 * underpayment rate only.
 */
export const FIRST_DAY_OF_EQUAL_RATES = new Date(Date.UTC(1999, 0, 1));

/*
 * The interest rate of one accrual period: "the overpayment rate determined
 * under section 6621(a)(1) applicable on the first day of the interest accrual
 * period", for "both hypothetical overpayments and underpayments"
 * (irs-8697-inst-2025::sec::applicable-interest-rates::b01). Undefined before
 * 1999 or past the table.
 *
 * DECISION (2026-11-26, by the author): Table 1 of the instructions and the
 * IRS quarterly rate releases differ on two quarters.
 * - Table 1 (irs-8697-inst-2025::sec::line-11::b02): "1/1/19 6/30/19 5%", and
 *   no row for April 1 to June 30, 2022.
 * - The rule the table summarizes (::applicable-interest-rates::b01): the
 *   section 6621(a)(1) rate, "published quarterly in revenue rulings". IR-2019-21:
 *   6% for individuals for the quarter beginning April 1, 2019; IR-2022-42
 *   (Rev. Rul. 2022-5): 4% for the quarter beginning April 1, 2022.
 * The engine follows the quarterly rulings (data/underpaymentRates.ts): Table 1's
 * 2019 row repeats the corporate row of Table 2, and its 2022 gap has no rate.
 */
export function lookBackRateOn(firstDay: Date): number | undefined {
  if (firstDay.getTime() < FIRST_DAY_OF_EQUAL_RATES.getTime()) return undefined;
  return underpaymentRateOn(firstDay);
}
