/*
 * The tax on an FTB 3800 amount (lines 9, 15 and 17): "Use the California
 * tax table or tax rate schedules in the 2025 instructions for Form 540"
 * (ca-3800-inst-2025::sec::part-ii-tentative-tax-based-on-parent-s-tax-rate::b01,
 * ::part-iii-child-s-tax::b01, ::b03). The table covers $100,000 or less; above
 * it the rate schedules apply (ca-540-inst-2025::sec::line-31-tax::b01).
 */

import { lookupCaRateSchedule } from "../../../data/caRateSchedule.js";
import { lookupTax } from "../../../data/taxTable.js";
import { roundDollars } from "../../../money.js";
import type { FilingStatus } from "../../../values.js";

/* "If your taxable income on line 19 is $100,000 or less, use the tax table" (::line-31-tax::b01). */
export const TAX_TABLE_LIMIT = 100_000;

const TAX_YEAR = 2025;

/* The tax on a whole-dollar amount; 0 for an amount of 0 or less (the table starts at $1). */
export function californiaTaxOn(amount: number, filingStatus: FilingStatus): number {
  if (amount <= 0) return 0;
  if (amount > TAX_TABLE_LIMIT) {
    return roundDollars(lookupCaRateSchedule(TAX_YEAR, filingStatus, amount));
  }
  const lookup = lookupTax("ca-2025", amount, filingStatus);
  if (!lookup.ok) throw new Error(`California tax table: ${lookup.message}`);
  return lookup.tax;
}
