/*
 * Form 3468: the rates, bonus percentages and ratios every part shares. A copy
 * of the form is a set of cells keyed `<part>.<line>` (cells.ts); each part's
 * file figures its own lines from these helpers. Money is whole dollars,
 * rounded to the nearest dollar (money.ts); a percentage line prints the
 * number under its printed "%".
 */

import type {
  BonusAnswer,
  InvestmentCreditFacility,
  LowIncomeAllocation,
} from "../../facts/index.js";
import { roundDollars, roundToPlaces } from "../../money.js";

/* Lines 1b, 3b, 5g, 9d and the others: "If you checked ... line 7a or 8b, enter 30%. Otherwise, enter 6%" (irs-3468-face-2025::sec::face-part-v::b01). */
export const INCREASED_RATE = 0.3;
export const BASE_RATE = 0.06;
/* Lines 7b: "enter 10%. Otherwise, enter 2%" (microturbine, face-part-vi-2::b02). */
export const MICROTURBINE_INCREASED_RATE = 0.1;
export const MICROTURBINE_BASE_RATE = 0.02;
/* Lines 1d, 1f and the others: "enter 10%. If you checked ... 9b, enter 2%" (face-part-v::b01). */
export const FULL_BONUS_RATE = 0.1;
export const PARTIAL_BONUS_RATE = 0.02;
/* Line 1h and the others: 10% for 11a or 11b, 20% for 11c or 11d (face-part-v::b02). */
export const LOW_INCOME_COMMUNITY_RATE = 0.1;
export const LOW_INCOME_PROJECT_RATE = 0.2;
/* "Part I, line 12a(ii), 12b, or 12c(ii), is 5 MW ac or more ... you don't qualify" (face-part-v::b02), in kW. */
export const LOW_INCOME_CAPACITY_LIMIT_KW = 5_000;
/* Lines 6c and 28c: "Multiply line 5 by 15% (0.15)" (face-part-v-2::b02, face-part-vi-7::b03). */
export const FINANCING_REDUCTION_CAP = 0.15;
/*
 * DECISION (2026-11-27, by the author): the ratio lines keep every digit in
 * the arithmetic, and print 6 decimal places.
 * - The form: line 1k "divide line 1i by Part I, line 12a(i), 12b, or 12c(ii)"
 *   (irs-3468-face-2025::sec::face-part-v::b02); line 6a "Divide. Sum ... of
 *   all proceeds ... Aggregate amount of additions to the capital account"
 *   (::face-part-v-2::b02); lines 3g, 9b, 11j, 17g, 23g and 28a the same. No
 *   line gives a number of places, and the next line multiplies by it.
 * - The instructions: the credit "will be reduced by the amount that is the
 *   product of the amount of the credit ... and the lesser of ... 15%, or A
 *   fraction" (irs-3468-inst-2025::sec::section-c-totals-credit-reduction-for::b01,
 *   ::section-n-totals-and-credit-reduction-for::b01); the low-income increase
 *   "bears the same ratio" as the allocation to the capacity
 *   (::filers-completing-part-v::b03). Section 45(b)(3) says "a fraction" too.
 * The texts define the amount by the fraction itself and the form has no
 * rounding rule, so no digit is dropped, as row A9 decides for FTB 3800; the
 * printed ratio has 6 places, so the line after it agrees with it to the dollar.
 */
export const RATIO_PLACES = 6;
/* A percentage line prints 4 places of the percent: the ratio's 6 places. */
const PERCENT_PLACES = RATIO_PLACES - 2;
const PERCENT = 100;

/* The dates the 2025 rate tables turn on (irs-3468-inst-2025::sec::line-1b-4::b01, ::beginning-of-construction::b01). */
export const FIRST_DAY_2025 = "2025-01-01";
export const LAST_DAY_FIRST_RATE_2025 = "2025-06-15";
export const FIRST_DAY_2026 = "2026-01-01";
/* The Section N reduction applies to construction that began after August 16, 2022 (section-n-totals-and-credit-reduction-for::b01). */
export const BOND_REDUCTION_START = "2022-08-16";

/* A part waits while an answer it reads is missing; the fact is listed in missingInputs. */
export const WAITING = "waiting";
export type Waiting = typeof WAITING;

/* A rate as the box under "%" prints it: 0.3 → "30", 0.075 → "7.5", 0.012 → "1.2". */
export function percentText(rate: number | undefined): string | undefined {
  if (rate === undefined) return undefined;
  return String(roundToPlaces(rate * PERCENT, PERCENT_PLACES));
}

/* A ratio printed with 6 places, trailing zeros dropped: 0.5 → "0.5", 1/24 → "0.041667". */
export const printedRatio = (ratio: number): number => roundToPlaces(ratio, RATIO_PLACES);
export const ratioText = (ratio: number | undefined): string | undefined =>
  ratio === undefined ? undefined : String(printedRatio(ratio));

/* "Multiply line … by line …": whole dollars. */
export const times = (amount: number, rate: number): number => roundDollars(amount * rate);

/* "Divide …": the fraction, every digit kept (the DECISION above). */
export const ratioOf = (numerator: number, denominator: number): number => numerator / denominator;

/*
 * Line 7a or 8b checked: the increased credit amount, for "a maximum net output
 * of less than 1 megawatt", construction before January 29, 2023, or the PWA
 * requirements (irs-3468-inst-2025::sec::filers-completing-part-v-or-vi::b01).
 */
export const increasedAmount = (facility: InvestmentCreditFacility): boolean =>
  facility.netOutputUnder1Mw === "yes" || facility.prevailingWage === "yes_48_48e";

/* Lines 7 and 8 answered: the base percentage can be read. */
export const answersLines7And8 = (facility: InvestmentCreditFacility): boolean =>
  facility.netOutputUnder1Mw !== undefined && facility.prevailingWage !== undefined;

/* The base percentage: 30% with line 7a or 8b, else 6% (or the section's own pair). */
export function baseRate(
  facility: InvestmentCreditFacility,
  increased = INCREASED_RATE,
  base = BASE_RATE,
): number {
  return increasedAmount(facility) ? increased : base;
}

/* Lines 9 and 10: 10% for box a, 2% for box b, blank for No ("Otherwise, go to line …"). */
export function bonusRate(answer: BonusAnswer | undefined): number | undefined {
  if (answer === "ten_percent") return FULL_BONUS_RATE;
  if (answer === "two_percent") return PARTIAL_BONUS_RATE;
  return undefined;
}

/*
 * The low-income communities percentage (face-part-v::b02 and the Part VI
 * lines 3d, 11g, 17d, 23d): 10% for 11a or 11b, 20% for 11c or 11d; 0% for
 * 11g or an ac capacity of 5 MW or more.
 */
export function lowIncomeRate(
  lowIncome: LowIncomeAllocation | "no" | undefined,
  acCapacityKw: number | undefined,
): number {
  if (lowIncome === undefined || lowIncome === "no") return 0;
  if (acCapacityKw !== undefined && acCapacityKw >= LOW_INCOME_CAPACITY_LIMIT_KW) return 0;
  const community = lowIncome.category === "low_income_community";
  return community || lowIncome.category === "indian_land"
    ? LOW_INCOME_COMMUNITY_RATE
    : LOW_INCOME_PROJECT_RATE;
}

/* The low-income bonus lines (Part V 1h to 1n; Part VI 3d to 3j, 11g to 11m, 17d to 17j, 23d to 23j). */
export interface LowIncomeLines {
  rate: number;
  allocatedKw?: number;
  /* Capacity equal to (or under) the allocation: line j, the basis times the rate. */
  equal?: number;
  /* Capacity over the allocation: lines k (ratio), l (rate × ratio), m (basis × l). */
  ratio?: number;
  ratioRate?: number;
  ratioAmount?: number;
  /* Line n (or 3j, 11m, 17j, 23j): the bonus. */
  bonus: number;
}

/*
 * DECISION (2026-11-27, by the author): a capacity under the allocation takes
 * the full bonus on line j, as an equal one.
 * - The form: "If the entry on Part I, line 12a(i), 12b, or 12c(ii), equals the
 *   entry on line 1i, multiply line 1a by line 1h and go to line 1n. Otherwise,
 *   continue to line 1k"; line 1k only "is more than"; line 1n "Otherwise, enter
 *   the amount from line 1j" (irs-3468-face-2025::sec::face-part-v::b02). Read
 *   word for word, a smaller capacity fills neither line 1j nor 1k.
 * - The instructions: "The increase in the credit will not exceed the amount
 *   that bears the same ratio as the ... capacity limitation allocated to such
 *   facility bears to the total megawatt nameplate capacity"
 *   (irs-3468-inst-2025::sec::filers-completing-part-v::b03,
 *   ::filers-completing-part-vi::b04).
 * The limit only binds when the capacity is over the allocation, so a smaller
 * capacity takes the whole bonus; Part VI lines 3f, 11i, 17f and 23f the same.
 */
export function lowIncomeLines(
  basis: number,
  rate: number,
  capacityKw: number | undefined,
  allocatedKw: number | undefined,
): LowIncomeLines | Waiting {
  if (rate === 0) return { rate, bonus: 0 };
  if (capacityKw === undefined || allocatedKw === undefined) return WAITING;
  if (capacityKw <= allocatedKw) {
    const equal = times(basis, rate);
    return { rate, allocatedKw, equal, bonus: equal };
  }
  const ratio = ratioOf(allocatedKw, capacityKw);
  const ratioRate = rate * ratio;
  const ratioAmount = times(basis, ratioRate);
  return { rate, allocatedKw, ratio, ratioRate, ratioAmount, bonus: ratioAmount };
}

/*
 * The financing reduction (Part V lines 6a to 7, Part VI lines 28a to 29): the
 * credit times the smaller of 15% and proceeds over capital account additions.
 */
export interface FinancingLines {
  ratio: number;
  byRatio: number;
  byCap: number;
  reduction: number;
  reduced: number;
}

export function financingLines(
  credit: number,
  proceeds: number,
  additions: number,
): FinancingLines {
  const ratio = additions > 0 ? ratioOf(proceeds, additions) : 0;
  const byRatio = times(credit, ratio);
  const byCap = times(credit, FINANCING_REDUCTION_CAP);
  const reduction = Math.min(byRatio, byCap);
  return { ratio, byRatio, byCap, reduction, reduced: credit - reduction };
}

/* "placed in service during the tax year" (every Part II to VI basis line): the year of line 5. */
export const placedIn2025 = (facility: InvestmentCreditFacility): boolean =>
  facility.placedInService >= FIRST_DAY_2025 && facility.placedInService < FIRST_DAY_2026;
