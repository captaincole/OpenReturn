/*
 * Form 8978 arithmetic: one column of Part I (lines 1a to 13), its penalty
 * (line 15) and interest (line 17), and the totals of lines 14, 16 and 18.
 * "Each column, (a) through (d), is figured separately for lines 1 through 13"
 * (irs-8978-inst-2025::sec::specific-instructions-for-form-8978::b01). Whole
 * dollars: each stated amount rounds, then the lines that combine them use
 * the rounded values.
 */

import type { PartnerAdjustmentSource, PartnerCorrectedYear } from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import { compoundedInterest, returnDueDate } from "../8621/interest.js";
import type { ScheduleAColumn } from "./scheduleA.js";

/* The partner's reporting year: the tax year of this return. */
export const REPORTING_YEAR = 2025;

/* One form has four columns (irs-8978-inst-2025::sec::what-s-new::b02). */
export const COLUMNS_PER_FORM = 4;

/*
 * Line 17: the underpayment rate of section 6621(a)(2) "substituting 'five
 * percentage points' for 'three percentage points'" for a Form 8986 from an
 * audit; "For additional reporting year tax reported as a result of a Form
 * 8986 from an AAR, this substitution is not made"
 * (irs-8978-inst-2025::sec::line-17::b01). The rate table holds the rate
 * with three points, so an audit adds two.
 */
export const AUDIT_ADDED_RATE = 0.02;

/* An extended individual return is due October 15 (month index 9) of the next year. */
const EXTENDED_DUE_MONTH = 9;
const EXTENDED_DUE_DAY = 15;

/* The amounts "per original return or as previously adjusted": lines 1a, 3a, 9a and 12. */
export interface PreviousAmounts {
  income: number;
  deductions: number;
  credits: number;
  incomeTax: number;
}

export interface ColumnInputs {
  taxYear: number;
  source: PartnerAdjustmentSource;
  previous: PreviousAmounts;
  /* Schedule A lines 2, 4 and 6 for the column. */
  adjustments: ScheduleAColumn;
  statement: PartnerCorrectedYear;
  returnExtended?: boolean;
}

export interface ColumnLines {
  taxYear: number;
  line1a: number;
  line1b: number;
  line2: number;
  line3a: number;
  line3b: number;
  line4: number;
  line5: number;
  line6: number;
  line7: number;
  line8: number;
  line9a: number;
  line9b: number;
  line10: number;
  line11: number;
  line12: number;
  line13: number;
  line15: number;
}

/* Lines 1a to 5. Block ids are in irs-8978-inst-2025::sec. */
function incomeLines(inputs: ColumnInputs) {
  // ::line-1a-total-income-per-original-return-or-as::b01 (1a and 1b, Schedule A line 2).
  const line1a = roundDollars(inputs.previous.income);
  const line1b = roundDollars(inputs.adjustments.income);
  // ::line-2-corrected-income-enter-the-total-of-lines-1a-and::b01.
  const line2 = line1a + line1b;
  // ::line-3a-total-deductions-per-return-or-as-previously::b01; ::line-3b-adjustments-to-deductions-enter-the-amount::b01.
  const line3a = roundDollars(inputs.previous.deductions);
  const line3b = roundDollars(inputs.adjustments.deductions);
  // ::line-4-corrected-deductions-combine-the-amount-on::b01.
  const line4 = line3a + line3b;
  /*
   * ::line-5-corrected-taxable-income-subtract-line-4-from::b01: line 2 less
   * line 4, or the statement's corrected taxable income when tax attributes change it.
   */
  const stated = inputs.statement.taxableIncome;
  const line5 = stated === undefined ? line2 - line4 : roundDollars(stated);
  return { line1a, line1b, line2, line3a, line3b, line4, line5 };
}

/* Lines 6 to 13. Block ids are in irs-8978-inst-2025::sec. */
function taxLines(inputs: ColumnInputs) {
  // ::line-6-income-tax-include-a-separate-statement-showing::b01: the statement's corrected tax.
  const line6 = roundDollars(inputs.statement.incomeTax);
  // ::line-7-alternative-minimum-tax-amt-if-amt-applies::b01: "If AMT applies"; none on the statement, 0.
  const line7 = roundDollars(inputs.statement.alternativeMinimumTax ?? 0);
  // ::line-8-total-corrected-income-tax-enter-the-sum-of-lines::b01.
  const line8 = line6 + line7;
  // ::line-9a-total-credits-per-return-or-as-previously::b01; ::line-9b-adjustments-to-credits-enter-the-amount-from::b01.
  const line9a = roundDollars(inputs.previous.credits);
  const line9b = roundDollars(inputs.adjustments.credits);
  // ::line-10-total-corrected-credits-combine-the-amounts-on::b01.
  const line10 = line9a + line9b;
  /*
   * ::line-11-total-corrected-income-tax-liability-subtract::b01: line 8 less
   * line 10, or the statement's corrected liability when another change makes it differ.
   */
  const stated = inputs.statement.taxLiability;
  const line11 = stated === undefined ? line8 - line10 : roundDollars(stated);
  // ::line-12-total-tax-shown-on-return-or-as-previously::b01.
  const line12 = roundDollars(inputs.previous.incomeTax);
  // ::line-13-increase-decrease-to-tax-subtract-the-amount::b01.
  const line13 = line11 - line12;
  return { line6, line7, line8, line9a, line9b, line10, line11, line12, line13 };
}

/* One column's lines 1a to 13 and 15. Line 15 is the penalty statement's amount; 0 with none. */
export function columnLines(inputs: ColumnInputs): ColumnLines {
  return {
    taxYear: inputs.taxYear,
    ...incomeLines(inputs),
    ...taxLines(inputs),
    line15: roundDollars(inputs.statement.penalties ?? 0),
  };
}

/*
 * The column's corrected amounts, which a later Form 8978 for the same year
 * takes as "previously reported": the AAR form is completed first, and the
 * audit form "includes the amounts from the AAR-related Form 8978 in the
 * 'previously reported' amounts on lines 1a, 3a, 9a, and 12"
 * (::example-3-completing-forms-8978-and-schedules-a-for::b01).
 */
export const correctedAmounts = (lines: ColumnLines): PreviousAmounts => ({
  income: lines.line2,
  deductions: lines.line4,
  credits: lines.line10,
  incomeTax: lines.line11,
});

/* The due date of a year's return including a valid extension: October 15 of the next year. */
export const extendedDueDate = (taxYear: number): Date =>
  new Date(Date.UTC(taxYear + 1, EXTENDED_DUE_MONTH, EXTENDED_DUE_DAY));

/*
 * Line 17 of one column, cents kept: interest on an increase in tax (line 13
 * above 0) from the original due date of that year's return, and interest on
 * the penalty (line 15) from the due date "including any valid extensions",
 * both up to the due date of the 2025 return (QUESTIONS.md). "Interest should
 * not be calculated on any decreases in tax on line 13"
 * (irs-8978-inst-2025::sec::line-17::b01). Undefined past the rate table.
 */
export function columnInterest(
  lines: ColumnLines,
  source: PartnerAdjustmentSource,
  returnExtended: boolean | undefined,
): number | undefined {
  const addedRate = source === "bba_audit" ? AUDIT_ADDED_RATE : 0;
  const end = returnDueDate(REPORTING_YEAR);
  const onTax =
    lines.line13 > 0
      ? compoundedInterest(lines.line13, returnDueDate(lines.taxYear), end, addedRate)
      : 0;
  const penaltyFrom =
    returnExtended === true ? extendedDueDate(lines.taxYear) : returnDueDate(lines.taxYear);
  const onPenalty =
    lines.line15 > 0 ? compoundedInterest(lines.line15, penaltyFrom, end, addedRate) : 0;
  if (onTax === undefined || onPenalty === undefined) return undefined;
  return onTax + onPenalty;
}

/* A column with its interest rounded to whole dollars. */
export interface FiguredColumn extends ColumnLines {
  line17: number;
}

export interface FormTotals {
  line14: number;
  line16: number;
  line18: number;
}

/* Lines 14, 16 and 18: the sum of lines 13, 15 and 17 over the columns. */
export function formTotals(columns: ReadonlyArray<FiguredColumn>): FormTotals {
  return {
    line14: sum(...columns.map((column) => column.line13)),
    line16: sum(...columns.map((column) => column.line15)),
    line18: sum(...columns.map((column) => column.line17)),
  };
}
