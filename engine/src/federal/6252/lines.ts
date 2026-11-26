/*
 * Form 6252 arithmetic, one sale at a time: Part I (lines 5–18), Part II
 * (lines 19–26) and Part III (lines 30–37). Every money line is whole dollars:
 * each stated amount is rounded, and each line that the form defines from other
 * lines uses their rounded values (CLAUDE.md, whole-dollar rounding).
 */

import { atLeast, roundDollars, roundToPlaces } from "../../money.js";

/*
 * DECISION (2026-11-24, by the author, not reviewed by a person): line 19 has
 * exactly 4 decimal places, and lines 24 and 35 multiply by the printed value.
 * Text A: "Enter it as a decimal rounded to at least 4 digits, and include all
 * zeros (for example, 25% = 0.2500, 35.25% = 0.3525, or 100% = 1.0000)"
 * (irs-6252-form-2025::sec::part-ii-installment-sale-income::b01): more digits
 * are allowed. Text B: line 24 "Multiply line 22 by line 19" and line 35
 * "Multiply line 34 by the gross profit percentage on line 19"
 * (irs-6252-form-2025::sec::face-part-ii::b01, ::face-part-iii::b02). The engine follows
 * the form's arithmetic on the printed line, with one precision for every sale,
 * so the return reads the same from line to line.
 */
export const GROSS_PROFIT_PERCENTAGE_PLACES = 4;

/* The stated amounts of Part I, in dollars and cents. */
export interface PartIInputs {
  sellingPrice: number;
  liabilitiesAssumed?: number;
  costOrOtherBasis: number;
  depreciationAllowed?: number;
  expensesOfSale?: number;
  recaptureIncome?: number;
  excludedGain?: number;
}

export interface PartILines {
  line5: number;
  line6: number;
  line7: number;
  line8: number;
  line9: number;
  line10: number;
  line11: number;
  line12: number;
  line13: number;
  line14: number;
  /* Lines 15–18 are blank when line 14 is zero or less: "don't complete the rest of this form". */
  line15?: number;
  line16?: number;
  line17?: number;
  line18?: number;
}

/*
 * Part I (the form's lines 5–18). Line 15 is never more than line 14: the
 * excluded gain is part of the gain (irs-6252-form-2025::sec::line-15::b01).
 * Line 17 is the debt over the installment sale basis, "If zero or less, enter -0-".
 */
export function partI(inputs: PartIInputs): PartILines {
  const line5 = roundDollars(inputs.sellingPrice);
  const line6 = roundDollars(inputs.liabilitiesAssumed ?? 0);
  const line8 = roundDollars(inputs.costOrOtherBasis);
  const line9 = roundDollars(inputs.depreciationAllowed ?? 0);
  const line10 = line8 - line9;
  const line11 = roundDollars(inputs.expensesOfSale ?? 0);
  const line12 = roundDollars(inputs.recaptureIncome ?? 0);
  const line13 = line10 + line11 + line12;
  const line14 = line5 - line13;
  const stated = { line5, line6, line7: line5 - line6, line8, line9, line10, line11, line12 };
  if (line14 <= 0) return { ...stated, line13, line14 };
  const line15 = Math.min(roundDollars(inputs.excludedGain ?? 0), line14);
  const line17 = atLeast(0, line6 - line13);
  return {
    ...stated,
    line13,
    line14,
    line15,
    line16: line14 - line15,
    line17,
    line18: line5 - line6 + line17,
  };
}

/*
 * Line 19: line 16 ÷ line 18, rounded to 4 places. Line 18 is at least line 14
 * whenever line 14 is a gain, so the division is defined and the percentage is
 * at most 1.
 */
export function grossProfitPercentage(line16: number, line18: number): number {
  return roundToPlaces(line16 / line18, GROSS_PROFIT_PERCENTAGE_PLACES);
}

const PERCENTAGE_SCALE = 10 ** GROSS_PROFIT_PERCENTAGE_PLACES;

/* Line 19 as printed: "0.2500", "1.0000". */
export function printedPercentage(percentage: number): string {
  const digits = String(roundToPlaces(percentage * PERCENTAGE_SCALE, 0)).padStart(
    GROSS_PROFIT_PERCENTAGE_PLACES + 1,
    "0",
  );
  const whole = digits.slice(0, digits.length - GROSS_PROFIT_PERCENTAGE_PLACES);
  return `${whole}.${digits.slice(digits.length - GROSS_PROFIT_PERCENTAGE_PLACES)}`;
}

export interface PartIIInputs {
  yearOfSale: boolean;
  line17: number;
  line19: number;
  paymentsThisYear: number;
  paymentsTreatedAsReceivedEarlier?: number;
  /* Required after the year of sale; ignored in it. */
  paymentsPriorYears?: number;
  remainingRecapture?: number;
}

export interface PartIILines {
  line20: number;
  line21: number;
  line22: number;
  /* Blank in the year of sale: nothing was received before it. */
  line23?: number;
  line24: number;
  line25: number;
  line26: number;
}

/*
 * Part II. Line 20 is line 17 in the year of sale, else 0. Line 21 leaves out a
 * payment an earlier line 34 already counted (irs-6252-form-2025::sec::line-21::b01).
 * Line 24 is line 22 × line 19, never less than 0 (line-24::b01). Line 25 is the
 * recapture not yet reported, "Don't enter on line 25 more than the amount
 * shown on line 24" (line-25::b01).
 */
export function partII(inputs: PartIIInputs): PartIILines {
  const line20 = inputs.yearOfSale ? inputs.line17 : 0;
  const line21 = atLeast(
    0,
    roundDollars(inputs.paymentsThisYear) -
      roundDollars(inputs.paymentsTreatedAsReceivedEarlier ?? 0),
  );
  const line22 = line20 + line21;
  const line24 = atLeast(0, roundDollars(line22 * inputs.line19));
  const line25 = Math.min(roundDollars(inputs.remainingRecapture ?? 0), line24);
  return {
    line20,
    line21,
    line22,
    line23: inputs.yearOfSale ? undefined : roundDollars(inputs.paymentsPriorYears ?? 0),
    line24,
    line25,
    line26: line24 - line25,
  };
}

/*
 * The final payment this tax year: everything received by the end of the year
 * (line 22 + line 23) reaches the contract price (line 18), with a payment this
 * year. Part III is then not completed (the form's Part III heading).
 */
export function receivedFinalPayment(partIILines: PartIILines, line18: number): boolean {
  return partIILines.line21 > 0 && partIILines.line22 + (partIILines.line23 ?? 0) >= line18;
}

export interface PartIIIInputs {
  amountRealized: number;
  /* Line 18 for the year of the first sale. */
  line18: number;
  line19: number;
  line22: number;
  line23?: number;
  /* The recapture of line 25's input that line 25 did not use. */
  recaptureLeft: number;
}

export interface PartIIILines {
  line30: number;
  line31: number;
  line32: number;
  line33: number;
  line34: number;
  line35: number;
  line36: number;
  line37: number;
}

/*
 * Lines 30–37 (the form; irs-6252-form-2025::sec::line-30::b01, line-33::b01,
 * line-36::b01). Line 33 is "the sum of lines 22 and 23". Line 36 takes the
 * recapture that line 25 left, up to line 35.
 */
export function partIII(inputs: PartIIIInputs): PartIIILines {
  const line30 = roundDollars(inputs.amountRealized);
  const line32 = Math.min(line30, inputs.line18);
  const line33 = inputs.line22 + (inputs.line23 ?? 0);
  const line34 = atLeast(0, line32 - line33);
  const line35 = roundDollars(line34 * inputs.line19);
  const line36 = Math.min(atLeast(0, roundDollars(inputs.recaptureLeft)), line35);
  return {
    line30,
    line31: inputs.line18,
    line32,
    line33,
    line34,
    line35,
    line36,
    line37: line35 - line36,
  };
}

/*
 * The unrecaptured section 1250 gain in this year's lines 26 and 37 (Schedule D
 * instructions, irs-1040sd-inst-2025::sec::line-4::b01–b02 and line-12::b01–b02).
 * Step 1: the smaller of the depreciation (line 9) and the total gain (Form 4797
 * line 24: line 14 + line 12). Step 2: less the section 1250 recapture (line 12).
 * Step 3: this year's gain up to the part not yet reported; the gain reported in
 * earlier years is line 23 × line 19.
 */
export function unrecapturedSection1250(inputs: {
  line9: number;
  line12: number;
  line14: number;
  line19: number;
  line23?: number;
  gainThisYear: number;
}): number {
  const total = atLeast(0, Math.min(inputs.line9, inputs.line14 + inputs.line12) - inputs.line12);
  const reportedEarlier = roundDollars((inputs.line23 ?? 0) * inputs.line19);
  return Math.min(atLeast(0, inputs.gainThisYear), atLeast(0, total - reportedEarlier));
}
