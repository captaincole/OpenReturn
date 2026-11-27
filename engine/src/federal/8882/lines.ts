/*
 * Form 8882 (Rev. December 2017), lines 1 to 7 for tax year 2025: pure
 * arithmetic. Each line rounds once to the nearest dollar (the 1040 rule);
 * the amounts of a line keep their cents while adding.
 */

import { prorateDollars, roundDollars, sum } from "../../money.js";

/*
 * DECISION (2026-11-27, by the author): tax year 2025 takes the rates and the
 * limit printed on the form, 25%, 10% and $150,000.
 * - Text A, the form and its instructions: "The credit is 25% of the qualified
 *   childcare facility expenditures plus 10% of the qualified childcare
 *   resource and referral expenditures ... The credit is limited to $150,000
 *   per tax year" (irs-8882-form-2025::sec::how-to-figure-the-credit::b01),
 *   and the 2025 Form 3800 instructions: "don't enter more than $150,000"
 *   (irs-3800-inst-2025::sec::line-1k::b01).
 * - Text B, the statute in the law library, as amended in 2025: "40 percent
 *   (50 percent in the case of an eligible small business) of the qualified
 *   child care expenditures" (usc-26-2025::sec::s45f::a) and "shall not exceed
 *   $500,000 ($600,000 in the case of an eligible small business)"
 *   (usc-26-2025::sec::s45f::b).
 * The engine follows text A: the 2025 instructions apply it to 2025, and the
 * IRS page "Employer-provided child care credit: tax year 2025 and earlier"
 * keeps 25%, 10% and $150,000 "For amounts paid or incurred before January 1,
 * 2026" (not in the corpus; the amendment's effective-date note is not a block
 * of the library; QUESTIONS.md).
 */
/* Line 2: "Enter 25% (0.25) of line 1" (irs-8882-form-2025::sec::face-page-1::b01). */
export const FACILITY_RATE = 0.25;
/* Line 4: "Enter 10% (0.10) of line 3" (irs-8882-form-2025::sec::face-page-1::b01). */
export const RESOURCE_AND_REFERRAL_RATE = 0.1;
/* Line 7: "Enter the smaller of line 6 or $150,000" (irs-8882-form-2025::sec::face-page-1::b01). */
export const CREDIT_LIMIT = 150_000;

/* The two kinds of expenditure the form takes: lines 1 and 3. */
export type ExpenditureLine = "facility" | "resource_and_referral";

/* Line 2 or line 4's rate for an expenditure of that line. */
export const rateOf = (line: ExpenditureLine): number =>
  line === "facility" ? FACILITY_RATE : RESOURCE_AND_REFERRAL_RATE;

/* Lines 1 to 4 of the taxpayer's own expenditures; a line with no expenditure is blank. */
export interface OwnLines {
  line1?: number;
  line2?: number;
  line3?: number;
  line4?: number;
}

/*
 * Lines 1 to 4: line 1 the qualified childcare facility expenditures, line 3
 * the qualified childcare resource and referral expenditures, each added with
 * cents and rounded; lines 2 and 4 their 25% and 10%
 * (irs-8882-form-2025::sec::face-page-1::b01).
 */
export function ownLines(facility: readonly number[], referral: readonly number[]): OwnLines {
  const line1 = facility.length > 0 ? roundDollars(sum(...facility)) : undefined;
  const line3 = referral.length > 0 ? roundDollars(sum(...referral)) : undefined;
  return {
    line1,
    line2: line1 === undefined ? undefined : roundDollars(line1 * FACILITY_RATE),
    line3,
    line4: line3 === undefined ? undefined : roundDollars(line3 * RESOURCE_AND_REFERRAL_RATE),
  };
}

/* The credit of the taxpayer's own expenditures: lines 2 and 4. */
export const ownCreditOf = (lines: OwnLines): number => sum(lines.line2, lines.line4);

/* Line 6: "Add lines 2, 4, and 5" (irs-8882-form-2025::sec::face-page-1::b01). */
export const line6Of = (lines: OwnLines, line5: number | undefined): number =>
  sum(lines.line2, lines.line4, line5);

/* Line 7: "Enter the smaller of line 6 or $150,000" (irs-8882-form-2025::sec::face-page-1::b01). */
export const line7Of = (line6: number): number => Math.min(line6, CREDIT_LIMIT);

/*
 * The part of line 7 that each of the taxpayer's own expenditures gave rise
 * to, in whole dollars: "the amount of the credit on line 7 allocable to"
 * the facility's capital expenditures and to the deductions
 * (irs-8882-form-2025::sec::form-8882-rev-12-2017-page-2::b01). With no
 * line 5, line 7 is the own credit up to $150,000, and above the limit "the
 * limited amount allowed is allocated pro rata"
 * (irs-3800-inst-2025::sec::limitation-on-certain-credits-reported-in-part-iii::b01).
 * Each expenditure's share follows its rate times its amount; the shares add
 * to line 7 exactly.
 */
export function line7Shares(
  lines: OwnLines,
  expenditures: ReadonlyArray<{ line: ExpenditureLine; amount: number }>,
): number[] {
  const line7 = line7Of(ownCreditOf(lines));
  return prorateDollars(
    line7,
    expenditures.map((each) => each.amount * rateOf(each.line)),
  );
}
