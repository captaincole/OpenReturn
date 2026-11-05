import { atLeast } from "../../money.js";

export interface QbiLimits {
  threshold: number;
  range: number;
}

/*
 * 2025 QBI threshold and phase-in range (8995-A lines 21 and 23). The range ends at
 * threshold + range: $247,300, or $494,600 if married filing jointly
 * (irs-8995a-inst-2025::sec::schedule-a-form-8995-a-specified-service::b01).
 */
export const QBI_LIMITS: Record<string, QbiLimits> = {
  single: { threshold: 197300, range: 50000 },
  married_filing_separately: { threshold: 197300, range: 50000 },
  head_of_household: { threshold: 197300, range: 50000 },
  qualifying_surviving_spouse: { threshold: 197300, range: 50000 },
  married_filing_jointly: { threshold: 394600, range: 100000 },
};

/*
 * Line 34 net capital gain: the smaller of Schedule D lines 15 and 16, if
 * both are gains. Without Schedule D, 1040 line 7a.
 */
export function netCapitalGain(
  scheduleDLine15: number | undefined,
  scheduleDLine16: number | undefined,
  form1040Line7a: number | undefined,
): number {
  if (scheduleDLine16 === undefined) return atLeast(0, form1040Line7a);
  if (scheduleDLine15 === undefined) return 0;
  return atLeast(0, Math.min(scheduleDLine15, scheduleDLine16));
}

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
