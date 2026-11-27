/*
 * Form 540NR and Schedule CA (540NR) Part IV arithmetic, 2025: the tax on
 * total taxable income "multiplied by the California ratio"
 * (ca-540nr-booklet-2025::sec::how-nonresidents-and-part-year-residents-are-taxed::b01).
 * Pure functions on whole dollars; the bindings read the lines and call them.
 */

import { atLeast, roundDollars, roundToPlaces, wholePart } from "../../../money.js";

/*
 * DECISION (2026-11-26, by the author): lines 36 and 38 and Schedule CA
 * (540NR) Part IV line 3 are rounded to four places, the half up. Text A,
 * Part IV line 3: "Carry the decimal to four places"
 * (ca-540nr-sched-ca-inst-2025::sec::line-3-deduction-percentage::b01), which
 * can be read as cutting off the other digits; line 38 gives no rule. Text B:
 * "In this computation, the FTB rounds the tax rate to four digits after the
 * decimal" (ca-540nr-booklet-2025::sec::line-36-ca-tax-rate::b01), and FTB
 * Pub. 1100 Example 1 rounds its rate, 2,260 ÷ 60,000 = .0377
 * (ftb-pub-1100-2025::sec::page-4-ftb-pub-1100-2025::b01). The engine follows
 * Text B for all three ratios: one rule for the three four-box ratios of the
 * same return, and the one the FTB applies when it checks the return.
 */
export const RATIO_PLACES = 4;

/* Lines 38 and Part IV line 3: "If more than 1, enter 1.0000" (::line-38-ca-exemption-credit-percentage::b01). */
const RATIO_CAP = 1;

/* Line 72: "If your taxable income or nonresident California source taxable income is more than $1,000,000" (::line-72-behavioral-health-services-tax::b01). */
export const BEHAVIORAL_HEALTH_TAX_FLOOR = 1_000_000;
export const BEHAVIORAL_HEALTH_TAX_RATE = 0.01;

/*
 * Line 36: line 31 divided by line 19, four places. With no total taxable
 * income there is no tax to divide: 0.
 */
export function caTaxRate(taxOnTotal: number, totalTaxableIncome: number): number {
  if (totalTaxableIncome <= 0) return 0;
  return roundToPlaces(taxOnTotal / totalTaxableIncome, RATIO_PLACES);
}

/*
 * A California share, four places, from 0 to 1. Line 38 divides line 35 by
 * line 19; Part IV line 3 divides line 27 column E by column D: "If the
 * result is greater than 1.0000, enter 1.0000. If less than zero, enter -0-"
 * (the Schedule CA (540NR) form, Part IV line 3). Line 35 and line 19 are
 * never less than 0, so line 38 meets the same floor. With nothing to divide
 * by, all of a California amount above 0 is California's (QUESTIONS.md).
 */
export function caShare(californiaAmount: number, totalAmount: number): number {
  if (totalAmount <= 0) return californiaAmount > 0 ? RATIO_CAP : 0;
  const share = roundToPlaces(californiaAmount / totalAmount, RATIO_PLACES);
  return Math.min(RATIO_CAP, atLeast(0, share));
}

/* Line 37, Part IV line 4, line 39: an amount times a four-place ratio, whole dollars. */
export function prorated(amount: number, ratio: number): number {
  return roundDollars(amount * ratio);
}

/* Line 40: "Subtract line 39 from line 37. If less than zero, enter 0" (the form). */
export function regularTaxBeforeCredits(
  taxBeforeCredits: number,
  exemptionCredits: number,
): number {
  return atLeast(0, taxBeforeCredits - exemptionCredits);
}

/* Part IV line 5: "Subtract line 4 from line 1. If less than zero, enter -0-" (::line-5-california-taxable-income::b01). */
export function californiaTaxableIncome(
  californiaAgi: number,
  californiaDeductions: number,
): number {
  return atLeast(0, californiaAgi - californiaDeductions);
}

/*
 * Line 72: 1% of line 35 over $1,000,000, whole dollars (the booklet's
 * worksheet, lines 1 to 5). Undefined when line 35 is not over the floor.
 */
export function behavioralHealthServicesTax(californiaTaxableIncome: number): number | undefined {
  if (californiaTaxableIncome <= BEHAVIORAL_HEALTH_TAX_FLOOR) return undefined;
  return roundDollars(
    (californiaTaxableIncome - BEHAVIORAL_HEALTH_TAX_FLOOR) * BEHAVIORAL_HEALTH_TAX_RATE,
  );
}

/* The two boxes of a four-place ratio on the form: the digit before the decimal point, and the four after it. */
export function ratioDigits(ratio: number): { whole: string; decimals: string } {
  const whole = wholePart(ratio);
  const decimals = roundToPlaces((ratio - whole) * 10 ** RATIO_PLACES, 0);
  return { whole: String(whole), decimals: String(decimals).padStart(RATIO_PLACES, "0") };
}

/*
 * Schedule CA (540NR) column D: "Subtract the amounts in column B from the
 * amounts in column A. Add the amounts in column C to the result"
 * (ca-540nr-sched-ca-inst-2025::sec::column-d-total-amounts-using-california-law::b01).
 */
export function columnD(federal: number, subtractions: number, additions: number): number {
  return federal - subtractions + additions;
}
