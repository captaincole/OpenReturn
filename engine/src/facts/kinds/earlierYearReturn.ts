/*
 * The beneficiary's own returns of the five years before this one, as Form 4970
 * reads them: line 13 for each year, and lines 17, 18, 20 and 22 for the three
 * computation years Part II keeps. One fact per year (2020 to 2024). The
 * product does not read last year's return yet (#79), so each value is an
 * answer the taxpayer states from that return.
 */

import type { FilingStatus } from "../../values.js";

/* The rate method of an earlier year that the Tax Rate Schedules alone cannot redo. */
export type EarlierYearTaxMethod =
  "schedule_d_tax_worksheet" | "form_8615" | "form_2555" | "schedule_j_farm_income";

export interface EarlierYearReturnFactValue {
  /*
   * Line 13: taxable income "as reported by you or as changed by the IRS",
   * including "amounts considered distributed in that year as a result of prior
   * accumulation distributions" (irs-4970-form-2025::sec::line-13::b01). Below
   * zero as stated; the form enters zero.
   */
  taxableIncome: number;
  /* Line 17: the year's filing status picks its Tax Rate Schedule. */
  filingStatus?: FilingStatus;
  /*
   * Line 17: qualified dividends and net capital gain taxed at the capital gain
   * rates that year (the year's Qualified Dividends and Capital Gain Tax
   * Worksheet, line 4). Absent: none.
   */
  preferentialIncome?: number;
  /* Line 17: the year's tax used one of these instead of the rate schedules. Absent: none. */
  otherTaxMethod?: EarlierYearTaxMethod;
  /*
   * Line 18: "income tax (excluding any AMT) as originally reported, corrected,
   * or amended, before reduction for any credits" (line-18::b01).
   */
  taxBeforeCredits?: number;
  /*
   * Line 20: the increase in that year's nonrefundable credits limited to tax
   * that the distribution allows, refigured on the credit's own form
   * (line-20::b01). Absent: no increase.
   */
  creditIncrease?: number;
  /*
   * Line 22: the change in that year's alternative minimum tax, refigured on
   * that year's Form 6251 (line-22::b01); below zero for a decrease. Absent: none.
   */
  minimumTaxChange?: number;
}

const EARLIER_YEAR_PREFIX = "earlier_year_return.";
export const EARLIER_YEAR_RETURN_CATEGORY = "other";

/* "earlier_year_return.2022". */
export function makeEarlierYearReturnFactKey(year: number): string {
  return `${EARLIER_YEAR_PREFIX}${year}`;
}

export function isEarlierYearReturnFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === EARLIER_YEAR_PREFIX && parts[1] !== "";
}
