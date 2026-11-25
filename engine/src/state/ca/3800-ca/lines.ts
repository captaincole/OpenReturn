/*
 * FTB 3800 arithmetic: pure functions on whole-dollar amounts. The tax on an
 * amount is figured in tax.ts; the return's lines are read in form.ts.
 */

import { atLeast, roundDollars, roundToPlaces } from "../../../money.js";

/*
 * Line 1's stop and line 2 for a child who does not itemize: $2,700
 * (ca-3800-inst-2025::sec::purpose::b01, the blank form lines 1 and 2).
 */
export const BASE_AMOUNT = 2_700;

/*
 * Line 2 for a child who itemizes: $1,350 plus the part of Form 540 line 18
 * directly connected with the unearned income
 * (ca-3800-inst-2025::sec::part-i-child-s-net-unearned-income::b02).
 */
export const ITEMIZED_BASE = 1_350;

/* Line 12b: "Enter the result as a decimal (rounded to four places)" (the blank form). */
export const LINE_12B_PLACES = 4;

/* The largest line 12b the form's four boxes hold: .9999 (QUESTIONS.md). */
const LARGEST_LINE_12B = 0.9999;

/*
 * Line 1 (::part-i-child-s-net-unearned-income::b02): the child's adjusted
 * gross income (Form 540 line 17) less the child's earned income. With no
 * earned income the worksheet gives line 17 itself.
 */
export function line1(californiaAgi: number, earnedIncome: number): number {
  return californiaAgi - earnedIncome;
}

/*
 * Line 2: $2,700; for a child who itemizes, the greater of $2,700 and $1,350
 * plus the directly connected deductions (::part-i-child-s-net-unearned-income::b02).
 */
export function line2(itemizes: boolean, directlyConnected: number): number {
  if (!itemizes) return BASE_AMOUNT;
  return Math.max(BASE_AMOUNT, ITEMIZED_BASE + directlyConnected);
}

/* Line 6: the parent's taxable income; "If zero or less, enter -0-" (::part-ii-...::b01). */
export function line6(parentTaxableIncome: number): number {
  return atLeast(0, parentTaxableIncome);
}

export interface Lines12And13 {
  /* Blank when line 7 is blank. */
  line12a?: number;
  line12b?: number;
  line13: number;
}

/* Line 12b: line 5 over line 12a, four places, kept under 1 (QUESTIONS.md). */
export function line12bRatio(line5: number, line12a: number): number {
  return Math.min(LARGEST_LINE_12B, roundToPlaces(line5 / line12a, LINE_12B_PLACES));
}

/*
 * Lines 12a, 12b and 13 (the blank form, line 11): with line 7 blank, line 13
 * is line 11 and lines 12a and 12b are skipped. Otherwise line 13 is line 11
 * times line 12b, a calculated line rounded to the dollar.
 */
export function lines12And13(
  line5: number,
  line7: number | undefined,
  line11: number,
): Lines12And13 {
  if (line7 === undefined) return { line13: line11 };
  const line12a = line5 + line7;
  const line12b = line12bRatio(line5, line12a);
  return { line12a, line12b, line13: roundDollars(line11 * line12b) };
}

/* Line 12b prints in the form's four boxes after the "." */
export function line12bDigits(line12b: number): string {
  const digits = roundToPlaces(line12b * 10 ** LINE_12B_PLACES, 0);
  return String(digits).padStart(LINE_12B_PLACES, "0");
}

/* Line 18: "Compare the amounts on line 16 and line 17. Enter the larger" (::part-iii-child-s-tax::b03). */
export function line18(line16: number, line17: number): number {
  return Math.max(line16, line17);
}

/* The tax on an amount by a filing status: tax.ts in the form, a stand-in in tests. */
export type TaxOn = (amount: number) => number;

/* What the line 9 worksheet for a parent who files Form 540NR reads. */
export interface Line9Form540NRInputs {
  /* Line A: the part of line 5 in the child's California AGI (all of it for a resident child). */
  childCaliforniaNetUnearnedIncome: number;
  /* Line D: FTB 3800 line 5. */
  line5: number;
  /* Line B: the parent's Form 540NR line 32. */
  parentCaliforniaAgi: number;
  /* Line E: the parent's Form 540NR line 17. */
  parentAgi: number;
  /* Line H: the parent's Form 540NR line 18. */
  parentDeductions: number;
  /* Lines B and E: the other children's California-sourced and total net unearned income. */
  otherChildrenCaliforniaNetUnearnedIncome: number;
  otherChildrenNetUnearnedIncome: number;
}

/*
 * Line 9 for a parent who files Form 540NR, worksheet lines A to N
 * (::part-ii-tentative-tax-based-on-parent-s-tax-rate::b02, ::b03). The
 * ratios G and M are kept whole; lines I and N are calculated lines, rounded
 * to the dollar. "If zero or less, enter -0-".
 *
 * DECISION (2026-11-24, by the author, not reviewed by a person): the
 * worksheet ratios (here and line 10's line E) keep every digit. The FTB 3800
 * worksheets say only "M. Divide line L by line K" and "E. Divide line C by
 * line D" (ca-3800-inst-2025::sec::part-ii-tentative-tax-based-on-parent-s-tax-rate::b03,
 * ::b04). The Form 540NR booklet says of its own line 36 rate: "the FTB rounds
 * the tax rate to four digits after the decimal"
 * (ca-540nr-booklet-2025::sec::line-36-ca-tax-rate::b01). The engine follows
 * the FTB 3800 text, because a form's own instructions decide how that form is
 * filled.
 */
export function line9Form540NR(inputs: Line9Form540NRInputs, taxOn: TaxOn): number {
  const lineC =
    inputs.childCaliforniaNetUnearnedIncome +
    inputs.parentCaliforniaAgi +
    inputs.otherChildrenCaliforniaNetUnearnedIncome;
  const lineF = inputs.line5 + inputs.parentAgi + inputs.otherChildrenNetUnearnedIncome;
  if (lineF <= 0) return 0;
  const lineG = Math.min(1, lineC / lineF);
  const lineI = roundDollars(inputs.parentDeductions * lineG);
  const lineJ = lineC - lineI;
  const lineK = lineF - inputs.parentDeductions;
  if (lineK <= 0) return 0;
  const lineM = taxOn(lineK) / lineK;
  return atLeast(0, roundDollars(lineJ * lineM));
}

/* What line 10 reads from the parent's return. */
export interface Line10Inputs {
  /* Form 540 line 31, or Form 540NR line 37. */
  tax: number;
  /* The FTB 3803 tax in it; 0 when none. */
  ftb3803Tax: number;
  /* Form 540NR line 31, line 19 and line 35; absent for a Form 540. */
  form540NR?: {
    taxOnTotalTaxableIncome: number;
    totalTaxableIncome: number;
    californiaTaxableIncome: number;
  };
}

/*
 * Line 10 (::part-ii-tentative-tax-based-on-parent-s-tax-rate::b04): Form 540
 * line 31 without the FTB 3803 tax (the blank form: "Do not include any tax
 * from form FTB 3803"). For Form 540NR: line 37 when it has no FTB 3803 tax,
 * else worksheet lines A to G, line G a calculated line.
 */
export function line10(inputs: Line10Inputs): number {
  const nonresident = inputs.form540NR;
  if (nonresident === undefined) return inputs.tax - inputs.ftb3803Tax;
  if (inputs.ftb3803Tax <= 0) return inputs.tax;
  const lineC = nonresident.taxOnTotalTaxableIncome - inputs.ftb3803Tax;
  if (nonresident.totalTaxableIncome <= 0) return 0;
  const lineE = lineC / nonresident.totalTaxableIncome;
  return roundDollars(nonresident.californiaTaxableIncome * lineE);
}
