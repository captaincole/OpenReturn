/*
 * FTB 3803's arithmetic as pure functions: the lines of one child's form from
 * the child's amounts and one year's printed amounts.
 */

import type { ChildInvestmentIncomeFactValue } from "../../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../../money.js";

/* The amounts the form prints for a year; a test can pass another year's. */
export interface Form3803Amounts {
  /* Line 5, the base amount; line 4 at or under it skips lines 5 and 6. */
  baseAmount: number;
  /* Line 7, the amount not taxed; line 9 also asks whether line 8 is less than it. */
  amountNotTaxed: number;
  /* Line 9 "No": the tax entered ($14.00). */
  maximumTax: number;
  /* Line 9 "Yes": the rate on line 8 (1%). */
  rate: number;
  /* Line 4: at or over this total, the form is not filed and the child files a return. */
  grossIncomeLimit: number;
}

/* The 2025 form (sources/2025/forms/state/ca/3803/blank.pdf, lines 4, 5, 7 and 9). */
export const FORM_3803_AMOUNTS_2025: Form3803Amounts = {
  baseAmount: 2700,
  amountNotTaxed: 1350,
  maximumTax: 14,
  rate: 0.01,
  grossIncomeLimit: 13500,
};

/* Lines 1a–3 in whole dollars. Line 2 prints 0 when there are no dividends ("If none, enter -0-"). */
export interface Form3803Inputs {
  line1a?: number;
  line1b?: number;
  line2: number;
  line3?: number;
}

/* Lines 5 and 6, figured only when line 4 is over the base amount. */
export interface Form3803PartI {
  line5: number;
  line6: number;
}

export interface Form3803Lines extends Form3803Inputs {
  line4: number;
  /* Undefined when line 4 is at or under the base amount: "skip line 5 and line 6". */
  partI?: Form3803PartI;
  line7: number;
  line8: number;
  line9: number;
}

/* A sum of document amounts as a whole-dollar line: cents kept while adding, blank unless above zero. */
function wholeDollarsOrBlank(...amounts: Array<number | undefined>): number | undefined {
  const dollars = roundDollars(sum(...amounts));
  return dollars > 0 ? dollars : undefined;
}

/*
 * Lines 1a–3 from the child's fact.
 * Line 1a (ca-3803-inst-2025::sec::line-1a::b01): interest taxable by California,
 * so the federal taxable interest less U.S. obligation interest, plus the
 * tax-exempt interest California taxes.
 * Line 1b (::line-1b::b01): interest California exempts, U.S. savings bonds and
 * California bonds included, kept off line 1a.
 * Line 2 (::line-2::b01): ordinary dividends, 1099-DIV box 1a.
 * Line 3 (::line-3::b01): capital gain distributions, 1099-DIV box 2a.
 */
export function form3803InputsOf(income: ChildInvestmentIncomeFactValue): Form3803Inputs {
  const usObligations = income.usObligationInterest ?? 0;
  const taxedByCalifornia = income.taxExemptInterestTaxedByCalifornia ?? 0;
  return {
    line1a: wholeDollarsOrBlank(income.taxableInterest, -usObligations, taxedByCalifornia),
    line1b: wholeDollarsOrBlank(income.taxExemptInterest, -taxedByCalifornia, usObligations),
    line2: wholeDollarsOrBlank(income.ordinaryDividends) ?? 0,
    line3: wholeDollarsOrBlank(income.capitalGainDistributions),
  };
}

/* Line 9: "Is the amount on line 8 less than $1,350? No. Enter $14.00. Yes. Multiply line 8 by 1%." */
export function line9Tax(line8: number, amounts: Form3803Amounts = FORM_3803_AMOUNTS_2025): number {
  return line8 < amounts.amountNotTaxed ? roundDollars(line8 * amounts.rate) : amounts.maximumTax;
}

/* One child's FTB 3803, lines 4–9, from lines 1a–3 and the year's amounts (the blank form). */
export function form3803Lines(
  inputs: Form3803Inputs,
  amounts: Form3803Amounts = FORM_3803_AMOUNTS_2025,
): Form3803Lines {
  // Line 4: "Add line 1a, line 2, and line 3." Line 1b is not added.
  const line4 = sum(inputs.line1a, inputs.line2, inputs.line3);
  const partI =
    line4 > amounts.baseAmount
      ? { line5: amounts.baseAmount, line6: line4 - amounts.baseAmount }
      : undefined;
  // Line 8: "Subtract line 7 from line 4. If zero or less, enter -0-."
  const line8 = atLeast(0, line4 - amounts.amountNotTaxed);
  return {
    ...inputs,
    line4,
    partI,
    line7: amounts.amountNotTaxed,
    line8,
    line9: line9Tax(line8, amounts),
  };
}

/* Line 6, or 0 when lines 5 and 6 are skipped. */
export const line6Of = (lines: Form3803Lines): number => lines.partI?.line6 ?? 0;

/*
 * Schedule CA (540) line 8z (ca-3803-inst-2025::sec::line-6::b01): the FTB 3803
 * line 6 total against the federal Form 8814 line 6 total. Less goes in column
 * B, more in column C; equal totals print nothing. With no Form 8814 the
 * federal total is 0, so all of line 6 goes in column C.
 */
export function scheduleCaLine8zColumns(
  californiaLine6Total: number,
  federalLine6Total: number,
): { subtraction?: number; addition?: number } {
  if (californiaLine6Total < federalLine6Total) {
    return { subtraction: federalLine6Total - californiaLine6Total };
  }
  if (californiaLine6Total > federalLine6Total) {
    return { addition: californiaLine6Total - federalLine6Total };
  }
  return {};
}
