/*
 * Schedule C net profit from a business fact, for the forms that need it before
 * Schedule C is evaluated (Schedule SE must-file, Schedule 1 line 3). It follows
 * the form's lines with each line rounded. Cost of goods sold (line 4) and the
 * home office (line 30) have no facts yet, so both are zero.
 */

import type { BusinessExpenses, BusinessFactValue } from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";

export function totalExpenses(expenses: BusinessExpenses | undefined): number {
  return sum(...Object.values(expenses ?? {}).map((amount) => roundDollars(amount)));
}

/* Line 31: line 7 (gross income) less line 28 (total expenses). */
export function netProfit(business: BusinessFactValue): number {
  const line3 =
    roundDollars(business.grossReceipts) - roundDollars(business.returnsAndAllowances ?? 0);
  const line7 = line3 + roundDollars(business.otherIncome ?? 0);
  return line7 - totalExpenses(business.expenses);
}
