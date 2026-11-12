/* Form 8995-A only: the Part I business list above the phase-in range. */

import type { QbiLimits } from "../qbi/lines.js";

/*
 * The businesses in Part I's columns. Above the phase-in range an SSTB is not a
 * qualified trade or business, and Part I lists only those
 * (irs-8995a-inst-2025::sec::determining-your-qbi-deduction::b05). Undefined while
 * that test needs taxable income, or a specified-service answer, that is missing.
 */
export function qualifiedBusinesses<T extends { specifiedService?: boolean }>(
  businesses: T[],
  taxableIncome: number | undefined,
  limits: QbiLimits | undefined,
): T[] | undefined {
  if (businesses.every((business) => business.specifiedService === false)) return businesses;
  if (taxableIncome === undefined || !limits) return undefined;
  if (taxableIncome <= limits.threshold + limits.range) return businesses;
  if (businesses.some((business) => business.specifiedService === undefined)) return undefined;
  return businesses.filter((business) => !business.specifiedService);
}
