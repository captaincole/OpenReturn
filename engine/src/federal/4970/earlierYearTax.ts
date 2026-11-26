/*
 * Form 4970 line 17: "Figure the income tax (excluding any alternative minimum
 * tax (AMT)) on the income on line 16 using the tax rates in effect for your
 * particular earlier tax year shown in each of the three columns. Use the Tax
 * Rate Schedules, etc., as applicable" (irs-4970-form-2025::sec::line-17::b01).
 *
 * The ordinary tax comes from that year's Tax Rate Schedule (data/earlierYearRates.ts).
 * With qualified dividends or net capital gain that year, the "etc." is that
 * year's Qualified Dividends and Capital Gain Tax Worksheet: the preferential
 * part stacks on top of the ordinary part (the 2025 worksheet, engine/src/worksheets/qdcg.ts,
 * with the year's ceilings). The distribution itself is ordinary income ("the
 * distribution loses its character upon distribution", who-must-file::b02).
 */

import {
  earlierYearRates,
  ORDINARY_RATES,
  type EarlierYearRates,
} from "../../data/earlierYearRates.js";
import { atLeast, roundDollars } from "../../money.js";
import type { FilingStatus } from "../../values.js";

const FIFTEEN_PERCENT = 0.15;
const TWENTY_PERCENT = 0.2;

/* The Tax Rate Schedule: each bracket's rate on the part of the amount inside it. Un-rounded. */
export function rateScheduleTax(amount: number, rates: EarlierYearRates): number {
  const tops = [...rates.bracketTops, Infinity];
  let below = 0;
  let tax = 0;
  for (const [index, top] of tops.entries()) {
    if (amount <= below) break;
    tax += (Math.min(amount, top) - below) * ORDINARY_RATES[index];
    below = top;
  }
  return tax;
}

/*
 * The year's QDCG worksheet, lines 1 to 25, on the Tax Rate Schedule: the
 * smaller of the stacked tax (line 23) and the tax on all of it at ordinary
 * rates (line 24). Whole dollars.
 */
function stackedTax(taxableIncome: number, preferential: number, rates: EarlierYearRates): number {
  const ordinaryPart = atLeast(0, taxableIncome - preferential); // line 5
  const zeroBand = Math.min(taxableIncome, rates.zeroRateCeiling); // line 7
  const atZero = zeroBand - Math.min(ordinaryPart, zeroBand); // line 9
  const fifteenTop = Math.min(taxableIncome, rates.fifteenRateCeiling); // line 14
  const atFifteen = Math.min(preferential - atZero, atLeast(0, fifteenTop - ordinaryPart - atZero)); // line 17
  const atTwenty = atLeast(0, preferential - atZero - atFifteen); // line 20
  const stacked =
    roundDollars(atFifteen * FIFTEEN_PERCENT) +
    roundDollars(atTwenty * TWENTY_PERCENT) +
    roundDollars(rateScheduleTax(ordinaryPart, rates)); // line 23
  return Math.min(stacked, roundDollars(rateScheduleTax(taxableIncome, rates))); // line 25
}

/*
 * Line 17 for one column: whole dollars, or undefined for a year or status the
 * table does not hold. preferentialIncome is capped at the income it is part of.
 */
export function earlierYearIncomeTax(
  year: number,
  status: FilingStatus,
  taxableIncome: number,
  preferentialIncome = 0,
): number | undefined {
  const rates = earlierYearRates(year, status);
  if (rates === undefined) return undefined;
  const income = atLeast(0, taxableIncome);
  const preferential = Math.min(income, atLeast(0, preferentialIncome));
  return preferential > 0
    ? stackedTax(income, preferential, rates)
    : roundDollars(rateScheduleTax(income, rates));
}
