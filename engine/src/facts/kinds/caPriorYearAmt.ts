/*
 * FTB 3510, the credit for prior year alternative minimum tax: the taxpayer
 * states figures from last year's (2024) California Schedule P, read off the
 * filed return. Who qualifies (ca-3510-inst-2025::sec::b-who-must-file::b01):
 * an AMT credit carryover from 2024, or 2024 AMT paid with adjustments and
 * tax preference items other than exclusions. The common case is a person who
 * exercised incentive stock options in 2024 and kept the shares.
 */

import type { FilingStatus } from "../../values.js";

export const CA_PRIOR_YEAR_AMT_KEYS = {
  /*
   * FTB 3510 line 28: the AMT on the 2024 Schedule P (540) Part II line 26, or
   * Schedule P (540NR) Part II line 45. A number; 0 when none.
   */
  amt: "prior_year.ca_amt",
  /*
   * FTB 3510 line 31: the unused AMT credit carried from 2024, 2024 Schedule P
   * (540 or 540NR) Part III line 10, column (d)
   * (ca-3510-inst-2025::sec::specific-line-instructions::b04). A number; 0 when none.
   */
  creditCarryover: "prior_year.ca_amt_credit_carryover",
  /*
   * FTB 3510 Part I, the 2024 figures that split the AMT into exclusions and
   * deferral items (CaPriorYearAmtExclusionsFactValue). Asked when the 2024 AMT is above 0.
   */
  exclusions: "prior_year.ca_amt_exclusions",
} as const;

/*
 * The exclusion lines of 2024 Schedule P (540 or 540NR) Part I, as printed
 * (FTB 3510 line 2, ca-3510-inst-2025::sec::specific-line-instructions::b01).
 * Each is optional: absent means blank. Line 6 is printed in parentheses and is
 * stated as the positive amount inside them; line 7, 13b and 13i keep their sign.
 */
export interface CaPriorYearAmtExclusionItems {
  /* Line 1: the standard deduction (a filer who did not itemize). */
  standardDeduction?: number;
  /* Line 2: medical and dental expenses. */
  medicalAndDental?: number;
  /* Line 3: personal and real property taxes. */
  propertyTaxes?: number;
  /* Line 4: home mortgage interest not used to buy, build or improve the home. */
  homeMortgageInterest?: number;
  /* Line 5: miscellaneous itemized deductions. */
  miscellaneousDeductions?: number;
  /* Line 6: refund of property taxes, the amount inside the parentheses. */
  propertyTaxRefund?: number;
  /* Line 7: investment interest expense adjustment, negative when printed so. */
  investmentInterest?: number;
  /* Line 13b: depletion. */
  depletion?: number;
  /* Line 13i: pollution control facilities. */
  pollutionControl?: number;
}

/* FTB 3510 Section B: the 2024 Schedule P (540NR) Part II figures. */
export interface CaPriorYearAmtNonresidentLines {
  /* Did the 2024 return itemize deductions? No: FTB 3510 lines 21 and 22 are skipped (line 20). */
  itemized: boolean;
  /* FTB 3510 line 15: 2024 Schedule P (540NR) Part II line 35, total AMT itemized deductions (0 with none). */
  totalAmtItemizedDeductions: number;
  /* FTB 3510 line 17: 2024 Schedule P (540NR) Part II line 28. */
  line28: number;
  /* FTB 3510 line 18: Part II line 29a (investment interest expense) and line 29h (depletion). */
  investmentInterest?: number;
  depletion?: number;
  /* FTB 3510 line 18: exclusion items from 2024 Schedule K-1 (541) line 12e, column (e). */
  otherExclusions?: number;
  /* FTB 3510 line 26: 2024 Schedule P (540NR) Part II line 44, regular tax. */
  regularTax: number;
}

export interface CaPriorYearAmtExclusionsFactValue {
  /* The 2024 return: Form 540 (Section A), or Form 540NR (Sections A and B). */
  returnForm: "540" | "540nr";
  /* The 2024 filing status: FTB 3510 lines 5 and 6, and the separate-return rule on line 4. */
  filingStatus: FilingStatus;
  /* FTB 3510 line 1: 2024 Schedule P Part I line 15, taxable income (negative when printed so). */
  taxableIncome: number;
  /* Line 16: NOL deductions, entered as a positive amount. */
  nolDeductions?: number;
  /* Line 17: AMTI exclusion, the amount inside the parentheses. */
  amtiExclusion?: number;
  /* Line 18: itemized deductions limitation, the amount inside the parentheses. */
  itemizedDeductionsLimitation?: number;
  exclusionItems: CaPriorYearAmtExclusionItems;
  /*
   * FTB 3510 line 2: exclusion items from 2024 Schedule K-1 (541) line 12e,
   * column (d), and exclusions included on another line of Schedule P
   * (ca-3510-inst-2025::sec::specific-line-instructions::b02). Signed.
   */
  otherExclusions?: number;
  /* FTB 3510 line 3: the AMT credit net operating loss deduction, the amount inside the parentheses. */
  amtCreditNolDeduction?: number;
  /* FTB 3510 line 12: 2024 Schedule P (540) Part II line 25. Needed for a 2024 Form 540. */
  regularTax?: number;
  /*
   * FTB 3510 line 9: the filer's 2024 earned income when the filer was a
   * certain child under age 24 in 2024 (ca-3510-inst-2025::sec::specific-line-instructions::b03).
   * Absent: the filer was not such a child.
   */
  childEarnedIncome?: number;
  /* Needed for a 2024 Form 540NR. */
  nonresident?: CaPriorYearAmtNonresidentLines;
}

/* The answers are complete: a 2024 Form 540 needs its regular tax, a 2024 Form 540NR its Part II figures. */
export function isCompleteCaPriorYearAmtExclusions(
  value: CaPriorYearAmtExclusionsFactValue | undefined,
): value is CaPriorYearAmtExclusionsFactValue {
  if (value === undefined) return false;
  return value.returnForm === "540nr"
    ? value.nonresident !== undefined
    : value.regularTax !== undefined;
}
