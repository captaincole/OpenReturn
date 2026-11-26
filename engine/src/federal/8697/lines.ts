/*
 * Form 8697 arithmetic, one column at a time, then the totals. Whole dollars:
 * the stated amounts round to the nearest dollar, each column's interest keeps
 * its cents until it prints, and the totals keep the columns' cents and round
 * once (CLAUDE.md, whole-dollar rounding: a total of computed rows).
 */

import { roundDollars, sum } from "../../money.js";

/* The filing year: the 2025 return (irs-8697-inst-2025::sec::filing-year::b01). */
export const FILING_YEAR = 2025;

/* Prior-year columns on one form: Part I (a) and (b), Part II (a) to (c) (::part-i-regular-method::b01, ::part-ii-simplified-marginal-impact::b02). */
export const PART_I_COLUMNS_PER_FORM = 2;
export const PART_II_COLUMNS_PER_FORM = 3;

/* Part I lines 1–6 of one prior-year column. */
export interface RegularColumnLines {
  line1: number;
  line2: number;
  line3: number;
  line4: number;
  line5: number;
  line6: number;
}

export interface RegularColumnInputs {
  taxableIncome: number;
  incomeAdjustment: number;
  taxOnAdjustedIncome: number;
  taxAsReported: number;
}

/*
 * Line 1 (irs-8697-inst-2025::sec::line-1::b01) and line 2 (::line-2::b01) as
 * stated; line 3 "Combine lines 1 and 2"; lines 4 and 5 as stated
 * (::lines-4-and-5::b01); line 6 "Subtract line 5 from line 4".
 */
export function regularColumnLines(inputs: RegularColumnInputs): RegularColumnLines {
  const line1 = roundDollars(inputs.taxableIncome);
  const line2 = roundDollars(inputs.incomeAdjustment);
  const line4 = roundDollars(inputs.taxOnAdjustedIncome);
  const line5 = roundDollars(inputs.taxAsReported);
  return { line1, line2, line3: line1 + line2, line4, line5, line6: line4 - line5 };
}

/* Part II lines 1–7 of one prior-year column; line 6 is blank unless line 5 is negative. */
export interface SimplifiedColumnLines {
  line1: number;
  line2: number;
  line3: number;
  line4: number;
  line5: number;
  line6?: number;
  line7: number;
}

export interface SimplifiedColumnInputs {
  incomeAdjustment: number;
  amtiAdjustment: number;
  totalTaxLiability: number;
  regularRate: number;
  amtRate: number;
}

/*
 * Line 5: "Enter the larger of line 2 or line 4." "If both lines 2 and 4 are
 * negative, enter whichever amount is greater. Treat both numbers as positive
 * when making this comparison, but enter the amount as a negative number. (If
 * the amount on one line is negative, but the amount on the other line is
 * positive, enter the positive amount.)" (irs-8697-inst-2025::sec::line-5::b01)
 */
export function largerOfLine2OrLine4(line2: number, line4: number): number {
  if (line2 < 0 && line4 < 0) return Math.min(line2, line4);
  return Math.max(line2, line4);
}

/*
 * Line 2: line 1 × the regular rate (::line-2-2::b01). Line 4: line 3 × the AMT
 * rate (::line-4::b01). Line 6, the overpayment ceiling: the year's total tax
 * liability, only where line 5 is negative. Line 7: the smaller of lines 5
 * and 6 "Treat both numbers as positive ... but enter the amount as a negative
 * number"; line 5 itself when line 6 is blank (the form's line 6 text).
 */
export function simplifiedColumnLines(inputs: SimplifiedColumnInputs): SimplifiedColumnLines {
  const line1 = roundDollars(inputs.incomeAdjustment);
  const line2 = roundDollars(line1 * inputs.regularRate);
  const line3 = roundDollars(inputs.amtiAdjustment);
  const line4 = roundDollars(line3 * inputs.amtRate);
  const line5 = largerOfLine2OrLine4(line2, line4);
  if (line5 >= 0) return { line1, line2, line3, line4, line5, line7: line5 };
  const line6 = roundDollars(inputs.totalTaxLiability);
  const line7 = 0 - Math.min(0 - line5, Math.abs(line6));
  return { line1, line2, line3, line4, line5, line6, line7 };
}

/* One column's interest: on the line for an increase or the line for a decrease, cents kept; neither for no change. */
export interface ColumnInterest {
  due?: number;
  refunded?: number;
}

export function columnInterest(change: number, interestOnChange: number): ColumnInterest {
  if (change > 0) return { due: interestOnChange };
  if (change < 0) return { refunded: interestOnChange };
  return {};
}

/* Part I line 2(c), Part I lines 7(c) and 8(c), Part II lines 8(d) and 9(d): blank when no column has an amount. */
export function columnTotal(values: ReadonlyArray<number | undefined>): number | undefined {
  const amounts = values.filter((value): value is number => value !== undefined);
  return amounts.length === 0 ? undefined : roundDollars(sum(...amounts));
}

/*
 * Part I line 9a / Part II line 10a: "If line 8, column (c), is greater than
 * line 7, column (c), enter the excess". Part I line 10 / Part II line 11: "If
 * line 7, column (c), is greater than line 8, column (c), enter the excess"
 * (the form face). Equal totals leave both blank.
 */
export interface NetInterest {
  refund?: number;
  owed?: number;
}

export function netInterest(
  dueTotal: number | undefined,
  refundTotal: number | undefined,
): NetInterest {
  const due = dueTotal ?? 0;
  const refunded = refundTotal ?? 0;
  if (refunded > due) return { refund: refunded - due };
  if (due > refunded) return { owed: due - refunded };
  return {};
}
