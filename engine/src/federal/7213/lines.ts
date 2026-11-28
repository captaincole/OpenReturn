/*
 * The arithmetic of Form 7213, Section 2 of Part I (section 45J) and Section
 * 2 of Part II (section 45U), as pure functions on stated amounts. No published
 * example with numbers exists for the form (QUESTIONS.md), so each rule cites
 * the line it applies.
 */

import { roundDollars, roundToPlaces } from "../../money.js";

/* Part I line 5b: "Multiply kWh on line 5a by $0.018" (irs-7213-face-2025::sec::face-part-i::b02). */
export const ADVANCED_NUCLEAR_RATE = 0.018;
/* Part I line 6a: "Divide line 1 by 1,000" (face-part-i::b02). */
export const MEGAWATTS_PER_LIMIT_STEP = 1000;
/* Part I line 6b: "Multiply line 6a by $125,000,000" (face-part-i::b02; credit-amount::b01). */
export const ANNUAL_LIMIT_PER_1000_MW = 125_000_000;
/*
 * Part I line 3: the credit percentage, kept to 4 decimal places of the ratio
 * (2 of the percent), and line 5a multiplies by that printed value: the rule
 * row A1 of docs/rule-decisions.md applies to a ratio a form prints
 * (QUESTIONS.md item 3).
 */
export const CREDIT_RATIO_PLACES = 4;
/* Lines 4 and 5a print whole kilowatt hours (QUESTIONS.md item 4). */
export const WHOLE_UNITS = 0;

/*
 * Part II line 2, the rate: "$0.003" (irs-7213-face-2025::sec::face-part-ii::b02).
 * Section 45U(c)(1) adjusts the 0.3 cent amount for inflation and rounds it to
 * a multiple of 0.05 cent; the 2025 factor (Notice 2025-37, 1.0242) gives
 * 0.307 cents, which rounds back to 0.3 cents.
 */
export const ZERO_EMISSION_RATE = 0.003;

/*
 * DECISION (2026-11-27, by the author): Part II line 7 multiplies line 1 by
 * $0.026 for electricity sold in 2025, not the $0.025 the form prints. The
 * form face (Rev. December 2024): "7 Multiply line 1 by $0.025"
 * (irs-7213-face-2025::sec::face-part-ii::b02). The instructions define the
 * reduction amount with "the product of 2.5 cents (adjusted for inflation)
 * multiplied by the kilowatt hours" (irs-7213-inst-2025::sec::credit-for-zero-emission-nuclear::b02),
 * and the IRS page "Section 45U, zero-emission nuclear power production credit
 * reduction amount rate has been updated by the inflation adjustment" (irs.gov,
 * citing Notice 2025-37) says to "use the rate $0.026" for 2025. The engine
 * follows the instructions: the printed $0.025 is the 2024 amount, and the
 * statute (usc-26-2025::sec::s45u::c-1) adjusts it for the calendar year of
 * the sale. docs/rule-decisions.md, "Decided by the author".
 */
export const ZEC_THRESHOLD_RATE = 0.026;
/* Part II line 9: "the smaller of line 3 or 16% (0.16) of line 8" (face-part-ii::b02). */
export const REDUCTION_SHARE_OF_EXCESS = 0.16;
/* Part II line 11: "multiply the amount on line 10 by 5.0" with the prevailing wage requirements (line-11::b01). */
export const PREVAILING_WAGE_MULTIPLIER = 5;

export interface AdvancedNuclearInputs {
  /* Line 1, MW. */
  facilityLimitationMw: number;
  /* Line 2, MW. */
  nameplateCapacityMw: number;
  /* Line 4, kWh. */
  kwhProducedAndSold: number;
}

export interface AdvancedNuclearLines {
  line1: number;
  line2: number;
  /* The ratio as a decimal (0.8 for 80%), to CREDIT_RATIO_PLACES. */
  line3: number;
  line4: number;
  line5a: number;
  line5b: number;
  line6a: number;
  line6b: number;
  line7: number;
}

/* Part I Section 2 lines 1 to 7 (irs-7213-face-2025::sec::face-part-i::b02). */
export function advancedNuclearLines(inputs: AdvancedNuclearInputs): AdvancedNuclearLines {
  const line1 = inputs.facilityLimitationMw;
  const line2 = inputs.nameplateCapacityMw;
  // Line 3: "Divide line 1 by line 2".
  const line3 = line2 > 0 ? roundToPlaces(line1 / line2, CREDIT_RATIO_PLACES) : 0;
  const line4 = roundToPlaces(inputs.kwhProducedAndSold, WHOLE_UNITS);
  // Line 5a: "Multiply line 3 by line 4" (kWh).
  const line5a = roundToPlaces(line3 * line4, WHOLE_UNITS);
  // Line 5b: "Multiply kWh on line 5a by $0.018".
  const line5b = roundDollars(line5a * ADVANCED_NUCLEAR_RATE);
  // Line 6a: "Divide line 1 by 1,000" (MW, not rounded).
  const line6a = line1 / MEGAWATTS_PER_LIMIT_STEP;
  // Line 6b: "Multiply line 6a by $125,000,000".
  const line6b = roundDollars(line6a * ANNUAL_LIMIT_PER_1000_MW);
  // Line 7: "Smaller of line 5b or 6b".
  const line7 = Math.min(line5b, line6b);
  return { line1, line2, line3, line4, line5a, line5b, line6a, line6b, line7 };
}

export interface ZeroEmissionInputs {
  /* Line 1, kWh. */
  kwhProducedAndSold: number;
  /* Line 4. */
  grossReceipts: number;
  /* Line 5; 0 when none. */
  zecPayments: number;
  /* Line 6: the full credit reduces the ZEC program payments. */
  zecPaymentsReducedByFullCredit: boolean;
  /* Line 11. */
  prevailingWage: boolean;
}

export interface ZeroEmissionLines {
  line1: number;
  line3: number;
  line4: number;
  line5: number;
  line6: number;
  line7: number;
  line8: number;
  line9: number;
  line10: number;
  line11: number;
}

/* Part II Section 2 lines 1 to 11 (irs-7213-face-2025::sec::face-part-ii::b02). */
export function zeroEmissionLines(inputs: ZeroEmissionInputs): ZeroEmissionLines {
  const line1 = roundToPlaces(inputs.kwhProducedAndSold, WHOLE_UNITS);
  // Line 3: "Multiply line 1 by line 2" ($0.003).
  const line3 = roundDollars(line1 * ZERO_EMISSION_RATE);
  const line4 = roundDollars(inputs.grossReceipts);
  const line5 = roundDollars(inputs.zecPayments);
  // Line 6: line 4 less line 5 when the full credit reduces the ZEC payments; otherwise line 4.
  const line6 = inputs.zecPaymentsReducedByFullCredit ? line4 - line5 : line4;
  // Line 7: "Multiply line 1 by $0.025", at the 2025 rate (the DECISION above).
  const line7 = roundDollars(line1 * ZEC_THRESHOLD_RATE);
  // Line 8: "Subtract line 7 from line 6. If zero or less, enter -0-".
  const line8 = Math.max(0, line6 - line7);
  // Line 9: "Enter the smaller of line 3 or 16% (0.16) of line 8".
  const line9 = Math.min(line3, roundDollars(line8 * REDUCTION_SHARE_OF_EXCESS));
  // Line 10: "Subtract line 9 from line 3".
  const line10 = line3 - line9;
  // Line 11: line 10 × 5.0 with the prevailing wage requirements, else line 10.
  const line11 = inputs.prevailingWage ? line10 * PREVAILING_WAGE_MULTIPLIER : line10;
  return { line1, line3, line4, line5, line6, line7, line8, line9, line10, line11 };
}

/* Line 3 as the form prints it: a percent ("80", "33.33"). */
export const percentText = (ratio: number): string =>
  String(roundToPlaces(ratio * 100, CREDIT_RATIO_PLACES - 2));
