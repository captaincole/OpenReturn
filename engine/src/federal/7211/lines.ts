/*
 * Form 7211 Part II: the arithmetic of one facility, from its kilowatt hours
 * to line 9. Money is whole dollars, rounded to the nearest dollar (money.ts).
 * The bond reduction (lines 6a to 6d) is Form 3468's: the two forms state the
 * same rule, "the lesser of 15% or a fraction" of proceeds over capital account
 * additions (irs-7211-inst-2025::sec::credit-reduced-for-tax-exempt::b01), so
 * this form reads 3468/lines.ts.
 */

import { roundDollars, roundToPlaces, sum } from "../../money.js";
import { financingLines, ratioText, times } from "../3468/lines.js";

/*
 * The applicable amounts before the inflation adjustment, in cents: "the
 * applicable amount will be 0.3 cents"; for the alternative amount "1.5
 * cents" (irs-7211-inst-2025::sec::applicable-amount::b01).
 */
export const BASE_AMOUNT_CENTS = 0.3;
export const ALTERNATIVE_AMOUNT_CENTS = 1.5;
/* "rounded to the nearest multiple of 0.05 cent" and "of 0.1 cent" (applicable-amount::b01, ::b02). */
export const BASE_ROUNDING_CENTS = 0.05;
export const ALTERNATIVE_ROUNDING_CENTS = 0.1;
/*
 * The inflation adjustment factor for calendar year 2025: "published in the
 * Federal Register (FR). For more information, see 90 FR 41477"
 * (applicable-amount::b02). That notice (FR Doc. 2025-16249, August 25, 2025):
 * "the inflation adjustment factor for calendar year 2025 for purposes of the
 * section 45Y credit is 1.9971", which gives 0.6 cents and 3 cents.
 */
export const INFLATION_FACTOR_2025 = 1.9971;
export const CALENDAR_YEAR = 2025;
/* Line 5a: "multiply the amount on line 3 by 10% (0.10)" (irs-7211-face-2025::sec::face-part-ii::b01). */
export const ENERGY_COMMUNITY_RATE = 0.1;
/*
 * Line 8a: "multiply the amount on line 7 by 0.0909091" with the energy
 * community bonus on line 5a, "by 10% (0.10)" without it
 * (irs-7211-face-2025::sec::face-part-ii-2::b01).
 */
export const DOMESTIC_CONTENT_RATE_AFTER_ENERGY_COMMUNITY = 0.0909091;
export const DOMESTIC_CONTENT_RATE = 0.1;
/* Line 7b: "the facility's construction began before January 29, 2023" (face-part-i::b01). */
export const ALTERNATIVE_CONSTRUCTION_BEFORE = "2023-01-29";
/* "placed in service after 2024" (irs-7211-inst-2025::sec::applicable-amount::b04). */
export const FIRST_DAY_2025 = "2025-01-01";
export const FIRST_DAY_2026 = "2026-01-01";

const CENTS_PER_DOLLAR = 100;
/* A rate in dollars keeps 5 places: $0.006 and $0.03 exactly, with no float residue. */
const RATE_PLACES = 5;

/* An amount in cents times the factor, rounded to the nearest multiple of the step, in dollars. */
export function adjustedAmount(cents: number, factor: number, stepCents: number): number {
  const steps = roundToPlaces((cents * factor) / stepCents, 0);
  return roundToPlaces((steps * stepCents) / CENTS_PER_DOLLAR, RATE_PLACES);
}

/* Part I line 7: the boxes that apply ("a", "b", "c"); none means 7d, No. */
export interface AlternativeAnswers {
  netOutputUnder1Mw: boolean;
  constructionBegan: string;
  prevailingWageAndApprenticeship: boolean;
}

export function alternativeBoxes(answers: AlternativeAnswers): Array<"a" | "b" | "c"> {
  const boxes: Array<"a" | "b" | "c"> = [];
  if (answers.netOutputUnder1Mw) boxes.push("a");
  if (answers.constructionBegan < ALTERNATIVE_CONSTRUCTION_BEFORE) boxes.push("b");
  if (answers.prevailingWageAndApprenticeship) boxes.push("c");
  return boxes;
}

/*
 * Column (b): the alternative amount for a facility that checks 7a, 7b or 7c,
 * else the base amount; "it would not use both amounts in a single
 * calculation" (irs-7211-inst-2025::sec::part-ii-clean-electricity-production::b01).
 *
 * DECISION (2026-11-27, by the author): column (b) holds the amount in dollars
 * per kWh ($0.03), not in cents (3).
 * - The instructions: "Multiply the alternative amount of 1.5 cents by the
 *   inflation adjustment factor ... round to the nearest multiple of 0.1 cent.
 *   Enter this amount in column (b)" (irs-7211-inst-2025::sec::part-ii-clean-electricity-production::b01).
 * - The form: column (c) is "Column (a) x Column (b)", and line 3 adds the
 *   column (c) amounts as the dollar credit (irs-7211-face-2025::sec::face-part-ii::b01).
 * The form's arithmetic wins: only an amount in dollars makes column (c) the
 * credit in dollars; the notice states both ("3 cents (or $0.03)").
 */
export function applicableAmount(alternative: boolean, factor = INFLATION_FACTOR_2025): number {
  return alternative
    ? adjustedAmount(ALTERNATIVE_AMOUNT_CENTS, factor, ALTERNATIVE_ROUNDING_CENTS)
    : adjustedAmount(BASE_AMOUNT_CENTS, factor, BASE_ROUNDING_CENTS);
}

export interface PartIIInputs {
  kilowattHours: number;
  alternative: boolean;
  energyCommunity: boolean;
  domesticContent: boolean;
  financing?: { proceeds: number; capitalAccountAdditions: number };
}

/* Lines 1 to 9 of one facility; the bond lines are blank with no tax-exempt bond. */
export interface PartIILines {
  line1a: number;
  line1b: number;
  line1c: number;
  line3: number;
  line5a: number;
  line5b: number;
  line6a?: string;
  line6b?: number;
  line6c?: number;
  line6d?: number;
  line7: number;
  line8a: number;
  line8b: number;
  line9: number;
}

/* Lines 6a to 7: "If you used proceeds of tax-exempt bonds ... continue to line 6a; otherwise, enter the amount from line 5b on line 7" (face-part-ii-2::b01). */
function bondLines(line5b: number, financing: PartIIInputs["financing"]) {
  if (financing === undefined) return { line7: line5b };
  const reduced = financingLines(line5b, financing.proceeds, financing.capitalAccountAdditions);
  return {
    line6a: ratioText(reduced.ratio),
    line6b: reduced.byRatio,
    line6c: reduced.byCap,
    line6d: reduced.reduction,
    line7: reduced.reduced,
  };
}

/*
 * Line 8a: the domestic content bonus, by whether line 5a claimed the energy community bonus.
 *
 * DECISION (2026-11-27, by the author): line 8a multiplies line 7 by
 * 0.0909091 after the energy community bonus, as the form prints.
 * - The instructions: "An additional bonus credit equal to 10% of the amount is
 *   provided for projects that meet a domestic content requirement"
 *   (irs-7211-inst-2025::sec::increased-credit-in-energy::b03).
 * - The form: "You qualify for the domestic content bonus credit and claimed
 *   the energy community bonus credit on line 5a, multiply the amount on line 7
 *   by 0.0909091" (irs-7211-face-2025::sec::face-part-ii-2::b01).
 * The form's arithmetic wins: 0.0909091 is 0.1 / 1.1, so the bonus is 10% of
 * the amount before the energy community bonus, one reading of "the amount".
 */
export function domesticContentBonus(line7: number, domestic: boolean, energy: boolean): number {
  if (!domestic) return 0;
  return times(
    line7,
    energy ? DOMESTIC_CONTENT_RATE_AFTER_ENERGY_COMMUNITY : DOMESTIC_CONTENT_RATE,
  );
}

/*
 * Lines 1 to 9 (irs-7211-face-2025::sec::face-part-ii::b01, face-part-ii-2::b01,
 * ::b02). Line 9 is line 8b: the elective payment phaseout is for an applicable
 * entity's election, and an individual cannot make one for this credit
 * (irs-3800-inst-2025::sec::elective-payment-of-certain-business-credits::b03).
 *
 * DECISION (2026-11-27, by the author): line 5a is 10% of line 3.
 * - The instructions: "If you checked 'Yes' on Part I, line 8, multiply the
 *   amount on Part II, line 5a, by 10% (0.10)" (irs-7211-inst-2025::sec::line-5a::b01).
 * - The form: "If you qualify, multiply the amount on line 3 by 10% (0.10)"
 *   (irs-7211-face-2025::sec::face-part-ii::b01).
 * Line 5a cannot be figured from itself, so the form's arithmetic wins.
 */
export function partIILines(inputs: PartIIInputs): PartIILines {
  const line1b = applicableAmount(inputs.alternative);
  const line1c = roundDollars(inputs.kilowattHours * line1b);
  const line3 = line1c;
  const line5a = inputs.energyCommunity ? times(line3, ENERGY_COMMUNITY_RATE) : 0;
  const line5b = sum(line3, line5a);
  const bonds = bondLines(line5b, inputs.financing);
  const line8a = domesticContentBonus(bonds.line7, inputs.domesticContent, inputs.energyCommunity);
  const line8b = sum(bonds.line7, line8a);
  return {
    line1a: inputs.kilowattHours,
    line1b,
    line1c,
    line3,
    line5a,
    line5b,
    ...bonds,
    line8a,
    line8b,
    line9: line8b,
  };
}
