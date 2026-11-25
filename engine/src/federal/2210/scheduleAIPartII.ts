/* Form 2210 Schedule AI Part II, Annualized Self-Employment Tax (lines 28–36). */

import { atLeast, roundDollars } from "../../money.js";

/*
 * Line 28: "multiply your net profit from all trades or businesses for each
 * period by 92.35% (0.9235). If your self-employment income for the applicable
 * periods is less than $400, enter zero" (irs-2210-inst-2025::sec::line-28::b01).
 */
export const NET_EARNINGS_SHARE = 0.9235;
export const NET_EARNINGS_FLOOR = 400;
/* Line 29: the prorated social security tax limit ($176,100 for 2025) by column. */
export const PRORATED_SOCIAL_SECURITY_LIMITS = [44_025, 73_375, 117_400, 176_100] as const;
/* Line 32: 12.4% times the annualization amount. */
export const SOCIAL_SECURITY_FACTORS = [0.496, 0.2976, 0.186, 0.124] as const;
/* Line 34: 2.9% times the annualization amount. */
export const MEDICARE_FACTORS = [0.116, 0.0696, 0.0435, 0.029] as const;

export interface SelfEmploymentColumn {
  /* Line 28. */
  netEarnings: number;
  /* Line 30: wages for the period subject to social security tax. */
  socialSecurityWages: number;
}

export interface SelfEmploymentLines {
  line28: number;
  line30: number;
  line31: number;
  line33: number;
  line35: number;
  line36: number;
}

/* Line 28 for a period from its net profit (columns (a)–(c)). */
export function netEarningsFromProfit(profit: number): number {
  const earnings = roundDollars(profit * NET_EARNINGS_SHARE);
  return earnings < NET_EARNINGS_FLOOR ? 0 : earnings;
}

/* Lines 28–36 of one column (the blank form, page 3). */
export function annualizedSelfEmploymentTax(
  column: SelfEmploymentColumn,
  index: number,
): SelfEmploymentLines {
  const line28 = roundDollars(column.netEarnings);
  const line30 = roundDollars(column.socialSecurityWages);
  const line31 = atLeast(0, PRORATED_SOCIAL_SECURITY_LIMITS[index] - line30);
  const line33 = roundDollars(SOCIAL_SECURITY_FACTORS[index] * Math.min(line28, line31));
  const line35 = roundDollars(line28 * MEDICARE_FACTORS[index]);
  return { line28, line30, line31, line33, line35, line36: line33 + line35 };
}
