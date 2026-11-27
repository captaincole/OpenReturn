/*
 * Schedule J (Form 1040): the election to average farming or fishing income
 * over the 3 base years 2022, 2023 and 2024
 * (irs-1040sj-inst-2025::sec::what-s-new::b01, "General Instructions"). Two
 * kinds of fact:
 *
 * - farm_income_averaging: the election and its line 2a to 2c answers. The
 *   amount to elect is the taxpayer's choice ("You don't have to include all
 *   of your taxable income from farming or fishing on line 2a",
 *   specific-instructions::b04), so it is stated, never figured.
 * - farm_averaging_base_year.<year>: what Schedule J reads from the return of
 *   one base year, and from that year's own Schedule J when its tax used one.
 *   The product does not read last year's return yet (#79), so each value is
 *   an answer the taxpayer states from that return ("You may need copies of
 *   your original or amended income tax returns for 2022, 2023, and 2024",
 *   prior-year-tax-returns::b01).
 */

import type { FilingStatus } from "../../values.js";

export const FARM_INCOME_AVERAGING_KEY = "farm_income_averaging";
export const FARM_INCOME_AVERAGING_CATEGORY = "other";

export interface FarmIncomeAveragingFactValue {
  /*
   * Line 2a: the elected farm income, the part of the taxable income from
   * farming or fishing that the taxpayer elects to average
   * (specific-instructions::b01 to b04). The engine enters no more than line 1.
   */
  electedFarmIncome: number;
  /*
   * Line 2b: "the portion of your elected farm income on line 2a treated as a
   * net capital gain" (line-2b::b01). The engine enters no more than the
   * return's net capital gain or line 2a. Absent: none.
   */
  netCapitalGain?: number;
  /*
   * Line 2c: the unrecaptured section 1250 gain attributable to the farming or
   * fishing business (line-2c::b01); line 2c is the smaller of it and line 2b.
   * Absent: none.
   */
  unrecapturedSection1250Gain?: number;
}

/* That year's own Schedule J, when its tax used one: the lines the 2025 form reads. */
export interface EarlierScheduleJLines {
  /* Line 3: that year's taxable income less its elected farm income (2025 lines 5, 9, 13). */
  line3: number;
  /* Line 4: the tax on line 3 (2025 lines 19, 20, 21). */
  line4: number;
  /* 2023 and 2024 only. Line 15: that year's last base year with its share (2025 lines 5, 9). */
  line15?: number;
  /* 2023 and 2024 only. Line 16: the tax on line 15 (2025 lines 19, 20). */
  line16?: number;
  /* 2024 only. Line 11: 2022 with 2024's share (2025 line 5). */
  line11?: number;
  /* 2024 only. Line 12: the tax on line 11 (2025 line 19). */
  line12?: number;
}

/*
 * The year's Taxable Income Worksheet, for a taxable income of zero or less
 * (irs-1040sj-inst-2025::sec::2022-taxable-income-worksheet-line-5::b01, and
 * the 2023 and 2024 worksheets). Each amount is positive.
 */
export interface BelowZeroTaxableIncome {
  /*
   * Worksheet line 1: how far below zero the year's taxable income was,
   * "without limiting it to zero", leaving out NOL carryovers and carrybacks
   * to the year when the year had an NOL. 0: exactly zero.
   */
  belowZero: number;
  /* Worksheet line 2: the year's Schedule D line 21 loss. Absent: none. */
  scheduleDLine21Loss?: number;
  /* Worksheet line 2: the capital loss carryover to the next year (short and long term). */
  capitalLossCarryover?: number;
  /* Worksheet line 2: the year's Schedule D line 16 loss. */
  scheduleDLine16Loss?: number;
  /*
   * Worksheet line 3: the year's NOL (Form 1045, Schedule A, line 24), or the
   * NOL carryovers and carrybacks to the year that it did not use and carried
   * on to later years. Absent: none.
   */
  netOperatingLoss?: number;
}

/* That year's Form 2555, for its Foreign Earned Income Tax Worksheet (lines 8, 12, 16). */
export interface BaseYearForeignExclusion {
  /* Worksheet line 2a: Form 2555 lines 45 and 50, both spouses on a joint return. */
  excluded: number;
  /* Worksheet line 2b: itemized deductions or exclusions not claimed because of the excluded income. */
  deductionsNotClaimed?: number;
}

export interface FarmAveragingBaseYearFactValue {
  /* That year's filing status picks its Tax Rate Schedule (lines 8, 12, 16). */
  filingStatus: FilingStatus;
  /*
   * Lines 5, 9, 13: the taxable income from that year's Form 1040 line 15, "or
   * as previously adjusted by the IRS, or corrected on an amended return", or
   * the amount it would have been with no return (line-5::b01). Needed when no
   * later Schedule J replaces it.
   */
  taxableIncome?: number;
  /* Needed when taxableIncome is zero or less: the Taxable Income Worksheet. */
  belowZero?: BelowZeroTaxableIncome;
  /*
   * Lines 19, 20, 21: the tax on that year's Form 1040 line 16, only the tax
   * imposed by section 1: not Form 8814 or 4972 tax, an education credit
   * recapture or a health coverage credit repayment
   * (lines-19-20-and-21::b01). Corrected amounts after an amendment.
   */
  sectionOneTax?: number;
  /* QDCG worksheet line 2: that year's Form 1040 line 3a. Absent: none. */
  qualifiedDividends?: number;
  /*
   * QDCG worksheet line 3: the smaller of that year's Schedule D lines 15 and
   * 16 (not below 0), or its Form 1040 line 7 with no Schedule D. Absent: none.
   */
  capitalGain?: number;
  /* QDCG worksheet line 5: that year's Form 4952 line 4g. Absent: none. */
  investmentIncomeElection?: number;
  /*
   * That year had a 28% rate gain or unrecaptured section 1250 gain (its
   * Schedule D line 20 answered "No"), so its tax used the Schedule D Tax
   * Worksheet. Absent: no.
   */
  usedScheduleDTaxWorksheet?: boolean;
  /* That year's Form 2555 exclusions. Absent: no Form 2555 that year. */
  foreignExclusion?: BaseYearForeignExclusion;
  /* That year's own Schedule J, when its tax used one. Absent: none. */
  scheduleJ?: EarlierScheduleJLines;
}

/* The base years, in the form's order: 2022 (lines 5–8), 2023 (9–12), 2024 (13–16). */
export const FARM_AVERAGING_BASE_YEARS = [2022, 2023, 2024] as const;
export type FarmAveragingBaseYear = (typeof FARM_AVERAGING_BASE_YEARS)[number];

const BASE_YEAR_PREFIX = "farm_averaging_base_year.";
export const FARM_AVERAGING_BASE_YEAR_CATEGORY = "other";

/* "farm_averaging_base_year.2022". */
export function makeFarmAveragingBaseYearFactKey(year: number): string {
  return `${BASE_YEAR_PREFIX}${year}`;
}

export function isFarmAveragingBaseYearFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === BASE_YEAR_PREFIX && parts[1] !== "";
}
