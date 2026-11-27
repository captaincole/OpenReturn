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
 * Line 3: each pass-through credit in whole dollars, then the sum (the rule of
 * docs/rule-decisions.md row A96: Form 3800 Part V keeps one whole-dollar
 * amount for each entity, so line 4 equals Form 3800 line 4c).
 */
export const line3Of = (credits: ReadonlyArray<number>): number =>
  sum(...credits.map((credit) => roundDollars(credit)));

/* Line 4: "Add lines 2 and 3"; blank while both are blank. */
export const line4Of = (line2: number | undefined, line3: number | undefined): number | undefined =>
  sumOrBlank(line2, line3);
