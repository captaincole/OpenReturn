/*
 * Schedule C net profit from a business fact, for the forms that need it before
 * Schedule C is evaluated (Schedule SE must-file, Schedule 1 line 3). It follows
 * the form's lines with each line rounded. The home office (line 30) has no
 * facts yet, so it is zero. Cost of goods sold (line 4, Part III) is not
 * modeled: a business that sells goods, or has not said, has no line 5 yet.
 */

import type { BusinessExpenses, BusinessFactValue } from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";

export function totalExpenses(expenses: BusinessExpenses | undefined): number {
  return sum(...Object.values(expenses ?? {}).map((amount) => roundDollars(amount)));
}

/* Line 3: line 1 less line 2. */
export function netReceipts(business: BusinessFactValue): number {
  return roundDollars(business.grossReceipts) - roundDollars(business.returnsAndAllowances ?? 0);
}

/* Line 5: line 3 less line 4. Only a business that sells no goods has no line 4. */
export function grossProfit(business: BusinessFactValue): number | undefined {
  return business.sellsGoods === false ? netReceipts(business) : undefined;
}

/* Line 7: line 5 plus line 6. */
export function grossIncome(business: BusinessFactValue): number | undefined {
  const line5 = grossProfit(business);
  return line5 === undefined ? undefined : line5 + roundDollars(business.otherIncome ?? 0);
}

/* Line 29: line 7 (gross income) less line 28 (total expenses). */
export function tentativeProfit(business: BusinessFactValue): number | undefined {
  const line7 = grossIncome(business);
  return line7 === undefined ? undefined : line7 - totalExpenses(business.expenses);
}

/*
 * Line 31: line 29 less line 30 (zero, no home-office facts). irs-1040sc-inst-2025::sec::line-31::b01–b02:
 * a loss waits for the at-risk and passive loss rules, and a business with line G
 * "No" (or unanswered) may carry prior-year passive losses (Form 8582). Neither is
 * modeled, so line 31 is blank in those cases. Schedule SE line 2 and Schedule 1
 * line 3 take this amount.
 */
export function netProfit(business: BusinessFactValue): number | undefined {
  const line29 = tentativeProfit(business);
  if (line29 === undefined || line29 < 0 || business.materiallyParticipated !== true) {
    return undefined;
  }
  return line29;
}
