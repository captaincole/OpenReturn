/*
 * Form 6478 (Rev. January 2020), Biofuel Producer Credit, for tax year 2025:
 * pure rules. Only lines 3 and 4 can hold an amount on a 2025 return.
 */

import { roundDollars, sum, sumOrBlank } from "../../money.js";

/*
 * Line 1 column (b): "Multiply by the rate of $1.01 per gallon"
 * (irs-6478-inst-2025::sec::specific-instructions::b01).
 */
export const RATE_PER_GALLON = 1.01;

/*
 * The last calendar year of a sale or use that earns the credit: "The biofuel
 * producer credit is extended for fuel sold or used before 2025. Don't claim
 * the credit for fuel sold or used after 2024 unless the credit is extended
 * again" (irs-6478-inst-2025::sec::what-s-new::b01); section 40(b)(6)(J)(i),
 * "before January 1, 2025" (usc-26-2025::sec::s40::b-6-J). "You claim the
 * credit for the tax year in which the sale or use occurs"
 * (general-instructions::b01).
 */
export const LAST_YEAR_OF_SALE_OR_USE = 2024;

/* The tax year of this engine: an individual's 2025 return, a tax year that begins in 2025. */
export const TAX_YEAR = 2025;

/*
 * Line 1 has an amount only for a tax year that can hold a qualifying sale or
 * use. A tax year that begins in 2025 holds none: "lines 1 and 2 of Form 6478
 * cannot be used for 2025 and subsequent tax years" (irs.gov, "Completing Form
 * 6478 for tax years beginning after 2024").
 */
export const ownProductionCanQualify = (taxYearBegins: number): boolean =>
  taxYearBegins <= LAST_YEAR_OF_SALE_OR_USE;

/* Line 1 column (c): column (a) × $1.01, whole dollars (the 1040 rule). */
export const line1ColumnCOf = (gallons: number): number => roundDollars(gallons * RATE_PER_GALLON);

/*
 * Line 3: each pass-through credit in whole dollars, then the sum.
 *
 * DECISION (2026-11-27, by the author): each K-1 rounds before line 3 adds.
 * Text A, the Form 1040 instructions: "If you have to add two or more amounts
 * to figure the amount to enter on a line, include cents when adding the
 * amounts and round off only the total" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01).
 * Text B, line 4: "report this amount on the appropriate line of Form 3800"
 * (irs-6478-face-2025::sec::face-page-1::b01), where an aggregate "from more
 * than one pass-through entity" is broken down "by the EIN of the pass-through
 * entity ... in Part V" (irs-3800-inst-2025::sec::part-v-3::b01), one
 * whole-dollar amount for each K-1. The engine follows text B, as Forms 8846
 * and 8586 do (docs/rule-decisions.md row A96), so line 4 equals Form 3800 line 4c.
 */
export const line3Of = (credits: ReadonlyArray<number>): number =>
  sum(...credits.map((credit) => roundDollars(credit)));

/* Line 4: "Add lines 2 and 3"; blank while both are blank. */
export const line4Of = (line2: number | undefined, line3: number | undefined): number | undefined =>
  sumOrBlank(line2, line3);
