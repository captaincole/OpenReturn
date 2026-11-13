/*
 * Schedule C amounts that come from Form 4562: line 13 (depreciation) and the
 * Part V amortization row. The business fact's `depreciation` answers feed
 * Form 4562 (federal/4562/lines.ts); without them, line 13 is the stated
 * expenses.depreciation.
 */

import type { BusinessFactValue, BusinessOtherExpense } from "../../facts/index.js";
import { activityDepreciation, line44 } from "../4562/lines.js";

/* irs-4562-inst-2025::sec::line-44::b01: total amortization goes on the "Other Expenses" line (Part V). */
export const AMORTIZATION_DESCRIPTION = "Amortization";

/*
 * Line 13 (irs-1040sc-inst-2025::sec::line-13): the business's stated
 * expenses.depreciation and its Form 4562 answers. Lines 28–31 wait or carry
 * the gap with it.
 */
export const line13Depreciation = (business: BusinessFactValue) =>
  activityDepreciation(business.expenses?.depreciation, business.depreciation);

/* Part V: the stated other expenses, then the amortization (Form 4562 line 44) when there is any. */
export function partVEntries(business: BusinessFactValue): BusinessOtherExpense[] {
  const amortization = line44(business.depreciation);
  const stated = business.otherExpenses ?? [];
  return amortization === undefined || amortization === 0
    ? stated
    : [...stated, { description: AMORTIZATION_DESCRIPTION, amount: amortization }];
}
