/*
 * Form 7218 arithmetic: the 2025 applicable amounts, the emissions factor of
 * column (e), the qualified gallons of column (f), each row's credit (column
 * (h)), line 25 and Part II. Pure functions with the 2025 amounts.
 */

import type { CleanFuelSale } from "../../facts/index.js";
import { atLeast, roundDollars, roundToPlaces, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";

/* Column (c): "Enter the four-digit calendar year when the fuel was sold" (part-iii-clean-aviation-and::b01); the return's year. */
export const YEAR_SOLD = 2025;

/*
 * "Base Amount Table for Fuel Produced and Sold During Calendar Year 2025
 * (Without Inflation Adjustment)" (irs-7218-inst-2025::sec::applicable-amount::b01).
 */
export const BASE_AMOUNTS = {
  nonSaf: { withoutWageRules: 0.2, withWageRules: 1.0 },
  saf: { withoutWageRules: 0.35, withWageRules: 1.75 },
} as const;

/* "In 2025 the inflation adjustment factor is 1.0611" (irs-7218-inst-2025::sec::applicable-amount::b01). */
export const INFLATION_ADJUSTMENT_FACTOR_2025 = 1.0611;

/* The 50 kg of CO2e per mmBTU baseline of column (e) (part-iii-clean-aviation-and::b01, ::b02). */
export const BASELINE_EMISSIONS_RATE = 50;

/* Column (e): "round to the nearest multiple of 0.1" (part-iii-clean-aviation-and::b01). */
const FACTOR_PLACES = 1;
/* "rounded to the nearest multiple of 1 cent" (applicable-amount::b01; usc-26-2025::sec::s45z::a-5). */
const CENT_PLACES = 2;

/* Part III prints 24 rows (irs-7218-face-2025::sec::face-part-iii::b01). */
export const PART_III_ROWS = 24;

/*
 * Column (g): "The applicable amount is adjusted by multiplying the base
 * amount by the inflation adjustment factor ... If an inflation adjusted
 * applicable amount isn't a multiple of 1 cent, the amount must be rounded to
 * the nearest multiple of 1 cent" (irs-7218-inst-2025::sec::applicable-amount::b01).
 * The instructions' example: 21 cents, $1.06, 37 cents and $1.86 (::b02).
 */
export function applicableAmountOf(saf: boolean, meetsWageRules: boolean): number {
  const amounts = saf ? BASE_AMOUNTS.saf : BASE_AMOUNTS.nonSaf;
  const base = meetsWageRules ? amounts.withWageRules : amounts.withoutWageRules;
  return roundToPlaces(base * INFLATION_ADJUSTMENT_FACTOR_2025, CENT_PLACES);
}

/*
 * Column (e): "Subtract the emissions rate or PER value ... from 50 kilograms
 * of CO2e. Divide the result by 50 kilograms of CO2e, then round to the
 * nearest multiple of 0.1" (irs-7218-inst-2025::sec::part-iii-clean-aviation-and::b01).
 * The zero floor on the rate is for fuel produced after 2025 only
 * (emissions-factor::b01), so a 2025 rate below zero gives a factor above 1
 * (QUESTIONS.md item 2).
 */
export function emissionsFactorOf(emissionsRate: number): number {
  const factor = (BASELINE_EMISSIONS_RATE - emissionsRate) / BASELINE_EMISSIONS_RATE;
  return roundToPlaces(factor, FACTOR_PLACES);
}

/*
 * Transportation fuel "Has an emissions rate which isn't greater than 50
 * kilograms of CO2e per mmBTU" (irs-7218-inst-2025::sec::transportation-fuel::b01):
 * a fuel above it earns no credit and takes no row.
 */
export const isTransportationFuel = (emissionsRate: number) =>
  emissionsRate <= BASELINE_EMISSIONS_RATE;

/* The first day a registration letter can cover: fuel must be produced after 2024 (how-to-claim-the-credit::b01). */
const FIRST_PRODUCTION_DAY = "2025-01-01";
const LAST_DAY_OF_YEAR = "2025-12-31";

const BEFORE_REGISTRATION_GAP =
  "The gallons produced before the registration letter are more than the gallons sold (irs-7218-inst-2025::sec::line-5b::b01).";

/*
 * Column (f): the gallons that earn the credit. "No clean fuel production
 * credit can be claimed for any transportation fuel unless the taxpayer is
 * registered ... at the time of production. For example, if a taxpayer
 * receives a letter of registration dated June 30, 2025, the taxpayer cannot
 * claim the section 45Z credit for any transportation fuel produced and sold
 * by the taxpayer before June 30, 2025" (irs-7218-inst-2025::sec::line-5b::b01).
 * A letter dated on or before January 1, 2025 covers every gallon produced
 * after 2024; one dated after 2025 covers none of the year's (0: the sale
 * takes no row, partIII.ts); one between needs the gallons produced before
 * it (undefined: the row waits).
 *
 * DECISION (2026-11-27, by the author): which gallons does column (f) hold?
 * Text A: "Enter the number of gallons or gallon equivalents of fuel sold in
 * the calendar year" (irs-7218-inst-2025::sec::part-iii-clean-aviation-and::b03),
 * every gallon sold. Text B: the taxpayer "cannot claim the section 45Z credit
 * for any transportation fuel produced and sold by the taxpayer before June
 * 30, 2025" when the letter is dated June 30, 2025 (line-5b::b01; the statute
 * agrees, usc-26-2025::sec::s45z::f-1-A). The engine enters only the gallons
 * registered at production, because column (h) multiplies column (f) and the
 * form has no other line that takes the unregistered gallons out.
 * QUESTIONS.md item 1; docs/rule-decisions.md row A110.
 */
export function qualifiedGallonsOf(
  sale: CleanFuelSale,
  approvalDate: string,
): number | Unsupported | undefined {
  if (approvalDate <= FIRST_PRODUCTION_DAY) return sale.gallons;
  if (approvalDate > LAST_DAY_OF_YEAR) return 0;
  const before = sale.gallonsProducedBeforeRegistration;
  if (before === undefined) return undefined;
  if (before > sale.gallons) return unsupported(BEFORE_REGISTRATION_GAP);
  return atLeast(0, sale.gallons - before);
}

/*
 * SAF "unrelated party certification is required" (irs-7218-inst-2025::sec::sustainable-aviation-fuel-saf::b01):
 * an uncertified SAF row earns no credit; undefined while the answer waits.
 */
export function certifiedOf(sale: CleanFuelSale): boolean | undefined {
  if (!sale.sustainableAviationFuel) return true;
  return sale.unrelatedPartyCertification;
}

/*
 * Column (h): "multiply column (e) x column (f) x column (g)"
 * (irs-7218-inst-2025::sec::part-iii-clean-aviation-and::b03), kept to the
 * cent: "If any amount determined under paragraph (1) is not a multiple of 1
 * cent, such amount shall be rounded to the nearest cent" (usc-26-2025::sec::s45z::a-5).
 * The row prints in whole dollars; line 25 adds the cents and rounds once.
 */
export function rowCreditOf(factor: number, gallons: number, applicableAmount: number): number {
  return roundToPlaces(factor * gallons * applicableAmount, CENT_PLACES);
}

/* Line 25: "add all the column (h) amounts" (part-iii-clean-aviation-and::b03), rounded once (whole-dollar rule). */
export function line25Of(rowCredits: ReadonlyArray<number>): number {
  return roundDollars(sum(...rowCredits));
}

/* Part II line 3: "Add lines 1 and 2" (irs-7218-face-2025::sec::face-part-ii::b01). */
export function line3Of(line1: number, line2: number): number {
  return sum(line1, line2);
}
