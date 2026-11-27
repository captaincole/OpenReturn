/*
 * Form 8609-A's arithmetic, pure: every amount in whole dollars, every decimal
 * in ten-thousandths (813 is 0.0813, 10000 is 1.0000). The comment over each
 * rule names its block in irs-8609a-inst-2025.
 */

import type { LowIncomeFractions } from "../../facts/index.js";
import { roundDollars, roundToPlaces, sum } from "../../money.js";

/*
 * Lines 2, 5 and 9 and the decimals of the line 14 steps and the Line 11
 * Worksheet are "a decimal carried out to at least four places" (line-2::b01,
 * line-5::b01, line-9::b01, line-14::b01). See the DECISION over tenThousandthsOf.
 */
export const DECIMAL_PLACES = 4;
export const TEN_THOUSANDTHS = 10000;
/* "Add these percentages together and divide by 12" (proc-2014-49-2014-37-i-r-b-535-at-irs-gov-pub-irs-drop::b01). */
export const MONTHS_IN_YEAR = 12;
/* Line 9: "one-third of the amount shown on line 5" (line-9::b01). */
const ONE_THIRD = 1 / 3;
/* Line 11 Worksheet line 7: "two-thirds of the amount on line 5" (line-14::b04). */
const TWO_THIRDS = 2 / 3;
/* Line 5 minimums (line-5::b02, b03): 4% and 9%. */
export const MINIMUM_PERCENTAGES = { four_percent: 400, nine_percent: 900 } as const;

/*
 * DECISION (2026-11-27, by the author): lines 2, 5 and 9 are "a decimal carried
 * out to at least four places" (irs-8609a-inst-2025::sec::line-2::b01,
 * ::line-5::b01, ::line-9::b01), and lines 3, 6 and 10 multiply by those lines.
 * The engine keeps exactly 4 places, rounded to the nearest, and multiplies by
 * the printed value, as rows A1, A28 and A36 of docs/rule-decisions.md decide
 * for Forms 6252, 2555 and 8611. Reason: one rule for every decimal a form prints.
 */
export function tenThousandthsOf(decimal: number): number {
  return roundDollars(roundToPlaces(decimal, DECIMAL_PLACES) * TEN_THOUSANDTHS);
}

/* "Multiply line N by line M": an amount times a printed decimal, nearest dollar. */
export function timesDecimal(amount: number, tenThousandths: number): number {
  return roundDollars((amount * tenThousandths) / TEN_THOUSANDTHS);
}

/*
 * "The smaller of the fractional amount of low-income units to all residential
 * rental units ... or the fractional amount of floor space" (line-2::b01),
 * unrounded. A building with no residential units has no low-income portion.
 */
export function lowIncomeFraction(count: LowIncomeFractions): number {
  if (count.residentialUnits <= 0 || count.residentialFloorSpace <= 0) return 0;
  const unitFraction = count.lowIncomeUnits / count.residentialUnits;
  const floorSpaceFraction = count.lowIncomeFloorSpace / count.residentialFloorSpace;
  return Math.min(unitFraction, floorSpaceFraction);
}

/* Line 2 after the first year: the portion at the close of the year (line-2::b01). */
export function lowIncomePortion(count: LowIncomeFractions): number {
  return tenThousandthsOf(lowIncomeFraction(count));
}

/*
 * The average of month-end portions over 12 months: line 2 in the first year of
 * the credit period ("Figure the low-income portion as of the end of each full
 * month that the building was in service during the year. Add these percentages
 * together and divide by 12", proc-2014-49-2014-37-i-r-b-535-at-irs-gov-pub-irs-drop::b01, b02).
 * Each month's portion is a 4-place decimal like line 2; the average is rounded once.
 */
export function averagePortion(monthEnds: readonly number[]): number {
  return tenThousandthsOf(sum(...monthEnds) / MONTHS_IN_YEAR / TEN_THOUSANDTHS);
}

/*
 * Line 3: line 1 × line 2, "limited to the maximum qualified basis shown on Form
 * 8609, line 3a" when the agency figured line 3a with only the eligible basis
 * the credit needed (line-3-2::b01).
 */
export function qualifiedBasis(line1: number, line2: number, maximum?: number): number {
  const product = timesDecimal(line1, line2);
  return maximum === undefined ? product : Math.min(product, maximum);
}

/* Lines 4 and 8: line 3 or line 7 for the days owned in a 365-day year (line-4::b01, b02; line-8::b01). */
export function partYear(amount: number, daysOwned: number, daysInYear: number): number {
  return roundDollars((amount * daysOwned) / daysInYear);
}

/*
 * Line 5: Form 8609 line 2, or the 30% present value percentage after a later
 * federal subsidy (line-5::b01, b02), and never below the minimum that applies
 * ("don't enter less than 4%", "don't enter less than 9%", line-5::b03).
 */
export function creditPercentage(stated: number, minimum?: keyof typeof MINIMUM_PERCENTAGES) {
  const percentage = tenThousandthsOf(stated);
  return minimum === undefined ? percentage : Math.max(percentage, MINIMUM_PERCENTAGES[minimum]);
}

/* Line 9: "Enter on line 9 one-third of the amount shown on line 5" (line-9::b01). */
export function oneThirdOf(line5: number): number {
  return tenThousandthsOf((line5 / TEN_THOUSANDTHS) * ONE_THIRD);
}

/* Line 7: line 3 less Form 8609 line 8a; 0 or less claims no additions (line-7::b01). */
export function additionsToQualifiedBasis(line3: number, originalQualifiedBasis: number): number {
  return line3 - originalQualifiedBasis;
}

/* The Line 11 Worksheet (line-14::b02–b04); line 4 in ten-thousandths. */
export interface Line11Worksheet {
  line1: number;
  line2: number;
  line3: number;
  line4: number;
  line5: number;
  line6: number;
  line7: number;
}

export interface Line11Inputs {
  /* This year's Form 8609-A lines 1, 3, 5 and 7. */
  line1: number;
  line3: number;
  line5: number;
  line7: number;
  /* Form 8609 line 8a. */
  originalQualifiedBasis: number;
  /* The previous year's Form 8609-A lines 1 and 2 (line 2 in ten-thousandths). */
  priorYearLine1: number;
  priorYearLine2: number;
  /* Worksheet line 4: the portion each month must pass, in ten-thousandths. */
  baselinePortion: number;
  /* This year's month-end portions, in ten-thousandths. */
  monthEnds: readonly number[];
}

/* Worksheet line 3: line 1 less line 2, or line 7 when line 2 is above 0 but below Form 8609 line 8a. */
function increasedQualifiedBasis(inputs: Line11Inputs, worksheetLine2: number): number {
  if (worksheetLine2 > 0 && worksheetLine2 < inputs.originalQualifiedBasis) return inputs.line7;
  return inputs.line3 - worksheetLine2;
}

/*
 * DECISION (2026-11-27, by the author): "This adjustment is required if the
 * increase in qualified basis of the building exceeds the qualified basis
 * (including additions to qualified basis) of the building in any prior tax
 * year" (irs-8609a-inst-2025::sec::line-11::b01); the worksheet's line 3
 * subtracts only the previous year's qualified basis, and "If line 3 above is
 * zero or less ... Enter -0- on line 11" (::line-14::b02). The engine runs the
 * worksheet whenever lines 7 to 12 are used and lets its line 3 decide. Reason:
 * the form's arithmetic wins over a sentence that breaks it; the two differ
 * only when the basis fell one year and came back in a later one.
 *
 * The worksheet, or undefined when its line 3 is zero or less: "do not complete
 * the rest of this worksheet. Enter -0- on line 11" (line-14::b02). A month
 * below the baseline adds nothing ("the increase, if any", line-14::b03).
 */
export function line11Worksheet(inputs: Line11Inputs): Line11Worksheet | undefined {
  const line2 = timesDecimal(inputs.priorYearLine1, inputs.priorYearLine2);
  const line3 = increasedQualifiedBasis(inputs, line2);
  if (line3 <= 0) return undefined;
  const increases = inputs.monthEnds.map((portion) =>
    Math.max(0, portion - inputs.baselinePortion),
  );
  const line4 = averagePortion(increases);
  const line5 = timesDecimal(inputs.line1, line4);
  const line6 = line3 - line5;
  const twoThirds = tenThousandthsOf((inputs.line5 / TEN_THOUSANDTHS) * TWO_THIRDS);
  // Worksheet line 7 is never below 0: a negative line 6 has no increase left to adjust.
  const line7 = Math.max(0, timesDecimal(line6, twoThirds));
  return { line1: inputs.line3, line2, line3, line4, line5, line6, line7 };
}

/*
 * Line 14: step 1 divides the grants (raised by the Form 8609 line 3b
 * percentage, when it applies) by line 1, a 4-place decimal; step 2 multiplies
 * line 13 by it (line-14::b01, b02, b05).
 */
export function disallowedForGrants(
  line13: number,
  line1: number,
  grants: number,
  highCostPercentage?: number,
): number {
  if (grants <= 0 || line1 <= 0) return 0;
  const raised =
    highCostPercentage === undefined
      ? grants
      : timesDecimal(grants, tenThousandthsOf(highCostPercentage));
  return timesDecimal(line13, tenThousandthsOf(raised / line1));
}

/* Line 15: line 13 less line 14, "but do not enter more than ... Form 8609, Part I, line 1b". */
export function creditAllowed(line13: number, line14: number, maximumCreditAmount: number): number {
  return Math.min(line13 - line14, maximumCreditAmount);
}

/*
 * Line 17 in the 11th year: the deferred balance of the first year's credit, the
 * first year's qualified basis at its close less the qualified basis its modified
 * percentage gave, times line 5 (line-17::b01; see the DECISION in copies.ts).
 * Both bases are limited to Form 8609 line 3a when line 3 is (line-3-2::b01):
 * the first year's credit, with or without the modified percentage, never used
 * more than line 3a.
 */
export function deferredFirstYearCredit(
  line1: number,
  line5: number,
  firstYear: { modifiedPortion: number; yearEndPortion: number },
  maximumQualifiedBasis?: number,
): number {
  const basisAt = (portion: number) => {
    const basis = (line1 * portion) / TEN_THOUSANDTHS;
    return maximumQualifiedBasis === undefined ? basis : Math.min(basis, maximumQualifiedBasis);
  };
  const deferredBasis = Math.max(
    0,
    basisAt(firstYear.yearEndPortion) - basisAt(firstYear.modifiedPortion),
  );
  return roundDollars((deferredBasis * line5) / TEN_THOUSANDTHS);
}

/* A decimal in ten-thousandths as the form prints it around its point: "", "1250"; "1", "0000". */
export function decimalDigits(tenThousandths: number): { whole: string; decimal: string } {
  const remainder = tenThousandths % TEN_THOUSANDTHS;
  const whole = (tenThousandths - remainder) / TEN_THOUSANDTHS;
  return {
    whole: whole === 0 ? "" : String(whole),
    decimal: String(remainder).padStart(DECIMAL_PLACES, "0"),
  };
}
