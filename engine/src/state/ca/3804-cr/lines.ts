/*
 * FTB 3804-CR, Pass-Through Entity Elective Tax Credit: the arithmetic, pure.
 * Written by hand from ca-3804cr-inst-2025; no published example with numbers
 * exists (QUESTIONS.md).
 */

import { atLeast, roundDollars, sum } from "../../../money.js";

/* Part I has ten rows, a to j (the blank form). */
export const PART_I_ROWS = 10;
/* "Use credit code 242 when you claim this credit" (ca-3804cr-inst-2025::sec::line-4-credit-claimed::b01). */
export const PTE_CREDIT_CODE = "242";
/*
 * The Credit Table's name for code 242 is "Pass-Through Entity Elective Tax"
 * (ca-540-sched-p-inst-2025::sec::credit-table::b01). Form 540 line 43 has a
 * short box, so the name uses the instructions' own abbreviation; the code
 * names the credit.
 */
export const PTE_CREDIT_NAME = "PTE Elective Tax";

/*
 * "If additional space is necessary, use additional forms FTB 3804-CR"
 * (ca-3804cr-inst-2025::sec::line-1-column-c-pte-elective-tax-credit-s::b01):
 * the rows in groups of ten, one group per form. At least one form.
 */
export function rowsByForm<T>(rows: readonly T[]): T[][] {
  const forms: T[][] = [];
  for (let start = 0; start < rows.length; start += PART_I_ROWS) {
    forms.push(rows.slice(start, start + PART_I_ROWS));
  }
  return forms.length > 0 ? forms : [[]];
}

/* Column (c): the stated credit in whole dollars. */
export const columnC = (credit: number): number => roundDollars(credit);

/* Part I line 2: "Add the amounts in column (c)" (the form), each already whole dollars. */
export const partILine2 = (credits: readonly number[]): number => sum(...credits.map(columnC));

/*
 * Part II line 1: "the total credit ... from all form(s) FTB 3804-CR, Part I,
 * line 2" (ca-3804cr-inst-2025::sec::line-1-total-credit-from-electing-qualified-ptes::b01).
 */
export const partIILine1 = (credits: readonly number[]): number =>
  sum(...rowsByForm(credits).map(partILine2));

/* Line 2: last year's line 5 in whole dollars. */
export const partIILine2 = (carryover: number): number => roundDollars(carryover);

/* Line 3: "Add line 1 and line 2" (the form). */
export const partIILine3 = (line1: number, carryover: number): number =>
  line1 + partIILine2(carryover);

/*
 * The tax this credit may offset: the tax less the credits applied before it,
 * not less than 0. "The PTE elective tax credit should be applied against the
 * net tax after the other state tax credit"
 * (ca-540-sched-p-inst-2025::sec::pass-through-entity-pte-elective-tax-credit::b01).
 */
export const taxLeftForCredit = (tax: number, creditsBefore: readonly number[]): number =>
  atLeast(0, tax - sum(...creditsBefore));

/*
 * Line 4: "may be less than the amount on line 3 if your credit is limited by
 * your tax liability" (ca-3804cr-inst-2025::sec::line-4-credit-claimed::b01).
 */
export const creditClaimed = (line3: number, taxLeft: number): number =>
  Math.min(line3, atLeast(0, taxLeft));

/* Line 5: "Subtract line 4 from line 3" (the form). */
export const creditCarryover = (line3: number, line4: number): number => line3 - line4;

export interface CreditRow {
  /* Column (a): the credit available. */
  available: number;
  /* Column (b): the smaller of column (a) and the balance before the row. */
  used: number;
  /* Column (c): the balance less column (b). */
  balance: number;
  /* Column (d): column (a) less column (b). */
  carryover: number;
}

/*
 * Schedule P (540) Part III, Section B4 line 21
 * (ca-540-sched-p-inst-2025::sec::section-b4-instructions::b01), by the
 * column rules of ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01.
 * The credit is not a business credit, so no part is elected refundable on FTB 3870
 * (ca-540-sched-p-inst-2025::sec::how-to-compute-the-limitation::b01).
 */
export function scheduleCreditRow(available: number, balanceBefore: number): CreditRow {
  const used = creditClaimed(available, balanceBefore);
  return {
    available,
    used,
    balance: atLeast(0, balanceBefore) - used,
    carryover: available - used,
  };
}
