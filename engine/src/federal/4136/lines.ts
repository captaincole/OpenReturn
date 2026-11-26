/*
 * Form 4136 arithmetic, pure. "Amount of credit. Generally, multiply the rate by
 * the number of gallons ... Enter the result (or the combined result, as
 * indicated by the brackets) in the Amount of credit column"
 * (irs-4136-inst-2025::sec::part-ii-credits::b01). Line 17: "Add lines 1
 * through 16, column (e)" (irs-4136-face-2025::sec::face-part-ii-4::b01).
 */

import { roundDollars, roundToPlaces, sum, wholePart } from "../../money.js";
import { BUS_USE, LINE_13C_RATE_TAXED_AT_244, type FuelRow } from "./rows.js";

const CENT_PLACES = 2;
const WHOLE_UNITS = 0;
const CENTS_PER_DOLLAR = 100;

/*
 * Gallon equivalents from the measure the records keep: "10,000 gallons of LPG
 * ÷ 1.353 = 7,391 GGE" (irs-4136-inst-2025::sec::line-11::b02). The example
 * rounds to the whole equivalent; the engine does the same (QUESTIONS.md).
 */
export function gallonEquivalents(quantity: number, unitsPerEquivalent: number): number {
  return roundToPlaces(quantity / unitsPerEquivalent, WHOLE_UNITS);
}

/*
 * Column (b) for one claim: the printed rate; the type of use 5 rate on a line
 * that has one (lines 11a-11h, 14a); $.243 on line 13c for kerosene taxed at
 * $.244 (irs-4136-inst-2025::sec::line-13::b02).
 */
export function claimRate(
  row: FuelRow,
  typeOfUse: number | undefined,
  taxedAt244: boolean,
): number {
  if (typeOfUse === BUS_USE && row.busRate !== undefined) return row.busRate;
  if (row.line === "13c" && taxedAt244) return LINE_13C_RATE_TAXED_AT_244;
  return row.rate;
}

/* One claim's credit before rounding: rate × gallons. */
export const claimCredit = (rate: number, gallons: number): number => rate * gallons;

/*
 * Column (e) of a row, or of a bracket of rows: the claims' credits added, then
 * kept to the cent. The form has a cents box, and the instructions' example
 * keeps the cents ("$805.62 claim amount", irs-4136-inst-2025::sec::line-11::b02).
 */
export function amountOfCredit(credits: readonly number[]): number {
  return roundToPlaces(sum(...credits), CENT_PLACES);
}

/* Column (d): the actual fuel costs of the row (or bracket), to the cent. */
export function actualFuelCost(costs: readonly number[]): number {
  return roundToPlaces(sum(...costs), CENT_PLACES);
}

/* Line 17: column (e) of lines 1 through 16, with cents; blank when no row has an amount. */
export function line17(amounts: readonly number[]): number | undefined {
  return amounts.length === 0 ? undefined : roundToPlaces(sum(...amounts), CENT_PLACES);
}

/*
 * Schedule 3 line 12 takes line 17 in whole dollars: Schedule 3 has no cents
 * box, and the return rounds to the nearest dollar
 * (irs-1040-inst-2025::sec::rounding-off-to-whole::b01). See the DECISION in
 * receivers.ts.
 */
export const schedule3Line12 = (total: number): number => roundDollars(total);

/* An amount with cents as the form's two boxes: the dollars, and the cents as two digits. */
export function dollarsAndCents(amount: number): { dollars: number; cents: string } {
  const dollars = wholePart(amount);
  const cents = roundToPlaces((amount - dollars) * CENTS_PER_DOLLAR, WHOLE_UNITS);
  return { dollars, cents: String(cents).padStart(CENT_PLACES, "0") };
}
