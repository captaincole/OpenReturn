/*
 * The beneficiary's own California returns of the five years before this one,
 * as FTB 5870A reads them: Part I lines 11, 16, 18 and 20, Part II Section A
 * lines 3, 4, 8, 10 and 12 (Section B lines 5, 6, 10, 12 and 14), and Part III
 * line 4. One fact per year (2020 to 2024). The product does not read last
 * year's return yet (#79), so each value is an answer the taxpayer states from
 * that return. The federal amounts are earlier_year_return.<year> (Form 4970).
 */

import type { FilingStatus } from "../../values.js";

/* Part II Section A line 3: "Check 'Yes' ... resident or part-year resident. Check 'No' for ... a nonresident." */
export type CaEarlierYearResidency = "resident" | "part_year" | "nonresident";

export interface CaEarlierYearReturnFactValue {
  /*
   * Part II line 3 and Part I's nonresident rule
   * (ca-5870a-inst-2025::sec::part-i-tax-on-accumulation-distribution::b01,
   * ::section-a::b02). A year with a temporary absence that the instructions
   * presume resident is "resident".
   */
  residency: CaEarlierYearResidency;
  /*
   * Part I line 11, Part II line 4: taxable income "as originally reported,
   * amended, or as changed by the Franchise Tax Board", including "amounts
   * considered distributed as a result of prior accumulation distributions"
   * (part-i-tax-on-accumulation-distribution::b04). Form 540 line 19.
   */
  taxableIncome?: number;
  /* Part I line 15, Part II line 7: the year's filing status picks its rate schedule. */
  filingStatus?: FilingStatus;
  /*
   * Part I line 16, Part II line 8: "your tax (not including any AMT) as
   * originally reported, amended, or as changed by the FTB before reduction for
   * any credits" (::b05). Form 540 line 31.
   */
  taxBeforeCredits?: number;
  /*
   * Part I line 18, Part II line 10: "only the net change in nonrefundable
   * credits, such as exemption credit" that the distribution causes (::b05).
   * Above 0: allowable credits go up; below 0: they go down. Absent: none.
   */
  creditChange?: number;
  /*
   * Part I line 20, Part II line 12: the change in the year's AMT, refigured on
   * a separate Schedule P (540) (::b06); below 0 for a decrease. Absent: none.
   */
  minimumTaxChange?: number;
  /*
   * Part III line 4: the year's Behavioral Health Services Tax (Mental Health
   * Services Tax) "as originally reported, amended, or as changed by the FTB"
   * (ca-5870a-inst-2025::sec::section-a-2::b01). Absent: none, which only a
   * taxable income of $1,000,000 or less allows.
   */
  behavioralHealthTaxPaid?: number;
  /*
   * Part II line 4: the distribution changes the year's net operating loss or
   * its carryover, so the taxable income must be refigured
   * (ca-5870a-inst-2025::sec::section-a::b02). Absent: no.
   */
  netOperatingLossChanges?: boolean;
}

const CA_EARLIER_YEAR_PREFIX = "ca_earlier_year_return.";
export const CA_EARLIER_YEAR_RETURN_CATEGORY = "other";

/* "ca_earlier_year_return.2022". */
export function makeCaEarlierYearReturnFactKey(year: number): string {
  return `${CA_EARLIER_YEAR_PREFIX}${year}`;
}

export function isCaEarlierYearReturnFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === CA_EARLIER_YEAR_PREFIX && parts[1] !== "";
}
