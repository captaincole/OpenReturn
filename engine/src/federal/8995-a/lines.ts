/* Form 8995-A only (with its Schedule C): the Part I list and the threshold tests. */

import type { QbiBusiness, QbiFilingInfo } from "../qbi/filingInfo.js";
import { QBI_LIMITS, taxableIncomeBeforeQbi, type QbiLimits } from "../qbi/lines.js";

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

type PartIInfo = Pick<QbiFilingInfo, "filingStatus" | "mustFile" | "qbiBusinesses">;

export function qbiLimits(info: Pick<QbiFilingInfo, "filingStatus">) {
  return info.filingStatus ? QBI_LIMITS[info.filingStatus] : undefined;
}

// MANUAL EDIT: an SSTB above the phase-in range is left off Part I (qualifiedBusinesses).
export function partIBusinesses(
  form: Record<string, unknown>,
  info: PartIInfo,
): QbiBusiness[] | undefined {
  const income = taxableIncomeBeforeQbi(form, info);
  return qualifiedBusinesses(info.qbiBusinesses ?? [], income, qbiLimits(info));
}

// Undefined while 1040 line 11a is blank.
export function aboveThreshold(
  form: Record<string, unknown>,
  info: PartIInfo,
): boolean | undefined {
  const limits = qbiLimits(info);
  const income = taxableIncomeBeforeQbi(form, info);
  if (!limits || income === undefined) return undefined;
  return income > limits.threshold;
}

// MANUAL EDIT: an SSTB in the phase-in range needs Schedule A (Form 8995-A), not modeled.
export function needsScheduleA(
  form: Record<string, unknown>,
  info: PartIInfo,
  business: QbiBusiness,
): boolean {
  return business.specifiedService !== false && aboveThreshold(form, info) !== false;
}
