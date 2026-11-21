/*
 * Form 8853 arithmetic, tax year 2025: pure functions on whole-dollar lines.
 * The resolvers (sectionA.ts, sectionB.ts, sectionC.ts) gather the facts.
 */

import type { ArcherMsaCoverage, ArcherMsaCoveragePeriod } from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";

/*
 * Line 3 chart: 65% of a self-only deductible, 75% of a family deductible,
 * -0- for a month in Medicare or not eligible; the total over 12
 * (irs-8853-inst-2025::sec::start-here::b01, ::enter-0-on::b01).
 */
export const SELF_ONLY_LIMIT_RATE = 0.65;
export const FAMILY_LIMIT_RATE = 0.75;
export const MONTHS_IN_YEAR = 12;
/* Married filing separately with family coverage: 37.5%, one-half of 75% (::enter-0-on::b02). */
export const MFS_FAMILY_DEFAULT_SHARE = 0.5;

/* 2025 HDHP annual deductible limits (irs-8853-inst-2025::sec::high-deductible-health-plan-hdhp::b01). */
export const HDHP_DEDUCTIBLE_RANGE: Readonly<
  Record<ArcherMsaCoverage, { minimum: number; maximum: number }>
> = {
  "self-only": { minimum: 2850, maximum: 4300 },
  family: { minimum: 5700, maximum: 8550 },
};

/* Line 9b: 20% (irs-8853-inst-2025::sec::lines-9a-and-9b::b01). Line 13b: 50% (::lines-13a-and-13b::b01). */
export const ARCHER_ADDITIONAL_TAX_RATE = 0.2;
export const MEDICARE_ADVANTAGE_ADDITIONAL_TAX_RATE = 0.5;
/* Additional 50% Tax Worksheet line 4: 60% of the deductible (::additional-50-tax-worksheet-line-13b::b01). */
export const MEDICARE_ADVANTAGE_DEDUCTIBLE_SHARE = 0.6;

/* Line 21: the 2025 per diem limit (irs-8853-inst-2025::sec::line-amount::b01, Rev. Proc. 2024-40). */
export const PER_DIEM_LIMIT_PER_DAY = 420;

/*
 * One month's chart amount. A plan whose deductible is outside the range is not
 * an HDHP, so the holder is not an eligible individual that month: -0-.
 * familyShare is the married-filing-separately share of the 75% amount.
 */
export function monthlyLimitation(period: ArcherMsaCoveragePeriod, familyShare = 1): number {
  const range = HDHP_DEDUCTIBLE_RANGE[period.coverage];
  const deductible = period.annualDeductible;
  if (deductible < range.minimum || deductible > range.maximum) return 0;
  if (period.coverage === "self-only") return deductible * SELF_ONLY_LIMIT_RATE;
  return deductible * FAMILY_LIMIT_RATE * familyShare;
}

/* Line 3: "Total for all months ... Divide the total by 12", nearest dollar. */
export function line3Limitation(
  periods: ReadonlyArray<ArcherMsaCoveragePeriod>,
  familyShare?: number,
): number {
  const total = sum(
    ...periods.map((period) => period.months * monthlyLimitation(period, familyShare)),
  );
  return roundDollars(total / MONTHS_IN_YEAR);
}

export interface PartIResult {
  line1?: number;
  line2?: number;
  line3?: number;
  line4?: number;
  line5?: number;
}

/*
 * Part I. Employer contributions bar a deduction: lines 1 and 2, skip 3 and 4,
 * -0- on line 5 (irs-8853-inst-2025::sec::how-to-complete-part-i::b01, case 1;
 * ::employer-contributions-to-an-archer-msa::b01). Else line 5 is the smallest
 * of lines 2, 3 and 4 (the form). Line 1 is blank when no W-2 shows code R; a
 * line whose answer is missing is blank, and so is line 5.
 */
export function partI(input: {
  employerContributions?: number;
  ownContributions?: number;
  limitation?: number;
  compensation?: number;
}): PartIResult {
  const line1 = roundDollars(input.employerContributions);
  const line2 = roundDollars(input.ownContributions);
  if ((line1 ?? 0) > 0) return { line1, line2, line5: 0 };
  const line3 = roundDollars(input.limitation);
  const line4 = roundDollars(input.compensation);
  const known = line2 !== undefined && line3 !== undefined && line4 !== undefined;
  return { line1, line2, line3, line4, line5: known ? Math.min(line2, line3, line4) : undefined };
}

export interface DistributionLines {
  gross: number;
  rolledOver?: number;
  net: number;
}

/* Lines 6a–6c (and 10): the 1099-SA box 1 total, the rollovers, the difference. */
export function distributionLines(
  boxes: ReadonlyArray<number>,
  rolledOver?: number,
): DistributionLines {
  const gross = roundDollars(sum(...boxes));
  const rolled = roundDollars(rolledOver);
  return { gross, rolledOver: rolled, net: gross - sum(rolled) };
}

/* Lines 8 and 12: "Subtract line 7 from line 6c. If zero or less, enter -0-". */
export function taxableDistributions(net: number, medicalExpenses: number): number {
  return atLeast(0, net - roundDollars(medicalExpenses));
}

/*
 * Lines 9a/9b (and 13a): check the box when any part of the taxable amount meets
 * an exception; the tax is the rate times the part that does not
 * (irs-8853-inst-2025::sec::exceptions-to-the-additional-20-tax::b01).
 */
export function additionalTaxBase(
  taxable: number,
  excepted: number,
): { exceptionBox: true | undefined; subject: number } {
  const exceptedPart = Math.min(taxable, atLeast(0, roundDollars(excepted)));
  return {
    exceptionBox: exceptedPart > 0 ? true : undefined,
    subject: taxable - exceptedPart,
  };
}

/* Line 9b: 20% of the part of line 8 subject to the tax, nearest dollar. */
export function additional20Tax(subject: number): number {
  return roundDollars(subject * ARCHER_ADDITIONAL_TAX_RATE);
}

export interface Additional50Worksheet {
  line1: number;
  line2?: number;
  line3?: number;
  line4?: number;
  line5?: number;
  line6?: number;
  line7: number;
}

const half = (amount: number): number =>
  roundDollars(amount * MEDICARE_ADVANTAGE_ADDITIONAL_TAX_RATE);

/*
 * Additional 50% Tax Worksheet—Line 13b (::additional-50-tax-worksheet-line-13b::b01, b02).
 * Line 1 is the part of line 12 that meets no exception. With no account on
 * December 31, 2024 (a value of 0), line 13b is one-half of line 1.
 * Returns undefined while an answer the worksheet needs is missing.
 */
export function additional50TaxWorksheet(input: {
  subject: number;
  valueEndOf2024?: number;
  annualDeductible?: number;
}): Additional50Worksheet | undefined {
  const line1 = input.subject;
  if (line1 === 0) return { line1, line7: 0 };
  if (input.valueEndOf2024 === undefined) return undefined;
  const line2 = roundDollars(input.valueEndOf2024);
  if (line2 <= 0) return { line1, line7: half(line1) };
  if (input.annualDeductible === undefined) return undefined;
  const line3 = roundDollars(input.annualDeductible);
  const line4 = roundDollars(line3 * MEDICARE_ADVANTAGE_DEDUCTIBLE_SHARE);
  const line5 = atLeast(0, line2 - line4);
  const line6 = atLeast(0, line1 - line5);
  return { line1, line2, line3, line4, line5, line6, line7: half(line6) };
}

export interface PerDiemLines {
  line20: number;
  line21: number;
  line22: number;
  line23: number;
  line24: number;
  line25: number;
  line26: number;
}

/*
 * Lines 20–26 for one LTC period (the form; irs-8853-inst-2025::sec::line-amount::b01
 * Example 1). Line 25 "Subtract line 24 from line 23" is floored at 0: a limitation
 * below zero would tax more than was paid (QUESTIONS.md).
 */
export function perDiemLines(input: {
  line20: number;
  periodDays: number;
  serviceCosts: number;
  reimbursements: number;
}): PerDiemLines {
  const line20 = roundDollars(input.line20);
  const line21 = roundDollars(PER_DIEM_LIMIT_PER_DAY * input.periodDays);
  const line22 = roundDollars(input.serviceCosts);
  const line23 = Math.max(line21, line22);
  const line24 = roundDollars(input.reimbursements);
  const line25 = atLeast(0, line23 - line24);
  return { line20, line21, line22, line23, line24, line25, line26: atLeast(0, line20 - line25) };
}
