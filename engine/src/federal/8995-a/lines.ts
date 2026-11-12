import type { BaseFilingInfo } from "../../filingInfo.js";
import { atLeast, numberOrBlank, sum } from "../../money.js";
import type { Form8995AFilingInfo, QbiBusiness } from "./filingInfo.js";

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
 * Form 8995 line 12 (irs-8995-inst-2025::sec::line-12::b01) and Form 8995-A
 * line 34: 1040 line 3a plus the net capital gain.
 */
export function qualifiedDividendsPlusNetCapitalGain(form: Record<string, unknown>): number {
  const gain = netCapitalGain(
    numberOrBlank(form["schedule-d.0.line.15_net_long_term_gain_loss"]),
    numberOrBlank(form["schedule-d.1.line.16_combined_gain_loss"]),
    numberOrBlank(form["form-1040.line.7a"]),
  );
  return sum(form["form-1040.line.3a"], gain);
}

/*
 * Form 8995 line 11 and Form 8995-A lines 20 and 33: 1040 line 11a minus lines
 * 12e and 13b (irs-8995a-inst-2025::sec::specific-instructions::b01,
 * irs-8995-inst-2025::sec::line-11::b01). It waits for 12e, and for 13b while
 * Schedule 1-A must be filed, as 1040 line 14 does (awaitsSchedule1A); a blank
 * is not a zero.
 */
export function taxableIncomeBeforeQbi(
  form: Record<string, unknown>,
  info: BaseFilingInfo,
): number | undefined {
  const line11a = numberOrBlank(form["form-1040.line.11a"]);
  const line12e = numberOrBlank(form["form-1040.line.12e"]);
  const line13b = numberOrBlank(form["form-1040.line.13b"]);
  const awaits13b = info.mustFile?.["schedule-1-a"]?.value === true && line13b === undefined;
  if (line11a === undefined || line12e === undefined || awaits13b) return undefined;
  return line11a - line12e - (line13b ?? 0);
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

type QbiInfo = Pick<Form8995AFilingInfo, "qbiScheduleSEFiled" | "taxpayerSSN" | "spouseSSN">;

/*
 * The deductible part of SE tax attributable to the business (QBI, irs-8995a-inst-2025::sec::determining-your-qbi-deduction::b15).
 * A spouse's Schedule SE is not modeled, and no corpus rule splits line 13 among several businesses.
 */
function selfEmploymentDeduction(
  form: Record<string, unknown>,
  info: QbiInfo,
  business: QbiBusiness,
): number | undefined {
  if (business.owner === "spouse") return undefined;
  if (info.qbiScheduleSEFiled === false) return 0;
  if (!business.ownersOnlyBusiness || info.qbiScheduleSEFiled !== true) return undefined;
  const line13 = form["schedule-se.0.line.13"];
  return typeof line13 === "number" ? line13 : undefined;
}

/*
 * One business's QBI, for Form 8995 line 1(c) and Form 8995-A line 2: Schedule C
 * line 31 less the deductible part of SE tax. No facts give SE health insurance or
 * SE retirement contributions; it counts neither. Unrounded.
 */
export function businessQbi(
  form: Record<string, unknown>,
  info: QbiInfo,
  business: QbiBusiness,
): number | undefined {
  if (business.netProfit === undefined) return undefined;
  const deduction = selfEmploymentDeduction(form, info, business);
  return deduction === undefined ? undefined : business.netProfit - deduction;
}

// The business's TIN: the EIN, else the owner's SSN (Form 8995 line 1(b), Form 8995-A line 1(d)).
export function businessTin(info: QbiInfo, business: QbiBusiness): string | undefined {
  return business.ein ?? (business.owner === "spouse" ? info.spouseSSN : info.taxpayerSSN);
}
