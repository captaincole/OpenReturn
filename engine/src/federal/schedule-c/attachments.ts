/*
 * Schedule C amounts that come from Form 4562: line 13 (depreciation) and the
 * Part V amortization row. The business fact's `depreciation` answers feed
 * Form 4562 (federal/4562/lines.ts); without them, line 13 is the stated
 * expenses.depreciation.
 */

import type { BusinessFactValue, BusinessOtherExpense } from "../../facts/index.js";
import {
  activityDepreciationGap,
  activityDepreciationLine,
  depreciationPending,
  line44,
} from "../4562/lines.js";

/* irs-4562-inst-2025::sec::line-44::b01: total amortization goes on the "Other Expenses" line (Part V). */
export const AMORTIZATION_DESCRIPTION = "Amortization";

/*
 * Line 13 (irs-1040sc-inst-2025::sec::line-13): Form 4562 line 22, or the
 * depreciation of older assets when no Form 4562 is required.
 */
export const depreciationLine = (business: BusinessFactValue) =>
  activityDepreciationLine(business.expenses?.depreciation, business.depreciation);

/* Why line 13 is a case the engine does not handle, or undefined. */
export const depreciationGap = (business: BusinessFactValue) =>
  activityDepreciationGap(business.expenses?.depreciation, business.depreciation);

/*
 * Line 13 is not known yet: Form 4562 waits for an answer or has a gap. Lines
 * 28–31 wait with it. A business with nothing to depreciate is not pending.
 */
export function depreciationBlocks(business: BusinessFactValue): boolean {
  return depreciationGap(business) !== undefined || depreciationPending(business.depreciation);
}

/* Part V: the stated other expenses, then the amortization (Form 4562 line 44) when there is any. */
export function partVEntries(business: BusinessFactValue): BusinessOtherExpense[] {
  const amortization = line44(business.depreciation);
  const stated = business.otherExpenses ?? [];
  return amortization === undefined || amortization === 0
    ? stated
    : [...stated, { description: AMORTIZATION_DESCRIPTION, amount: amortization }];
}
