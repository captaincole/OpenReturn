/*
 * Schedule C amounts that come from Form 4562: line 13 (depreciation) and the
 * Part V amortization row. The business fact's `depreciation` answers feed
 * Form 4562 (federal/4562/lines.ts); without them, line 13 is the stated
 * expenses.depreciation.
 */

import type { BusinessFactValue, BusinessOtherExpense } from "../../facts/index.js";
import { activityDepreciationDeduction, form4562Figures, line44 } from "../4562/lines.js";

/* irs-4562-inst-2025::sec::line-44::b01: total amortization goes on the "Other Expenses" line (Part V). */
export const AMORTIZATION_DESCRIPTION = "Amortization";

export const BOTH_DEPRECIATION_ANSWERS =
  "The business states both a line 13 amount and Form 4562 answers; the engine cannot tell whether one includes the other.";

/*
 * Line 13 (irs-1040sc-inst-2025::sec::line-13): Form 4562 line 22, or the
 * depreciation of older assets when no Form 4562 is required. Undefined while
 * Form 4562 waits for an answer or has a gap (depreciationGap says why).
 */
export function depreciationLine(business: BusinessFactValue): number | undefined {
  if (!business.depreciation) return business.expenses?.depreciation;
  if (business.expenses?.depreciation !== undefined) return undefined;
  return activityDepreciationDeduction(business.depreciation);
}

/* Why line 13 is a case the engine does not handle, or undefined. */
export function depreciationGap(business: BusinessFactValue): string | undefined {
  if (!business.depreciation) return undefined;
  if (business.expenses?.depreciation !== undefined) return BOTH_DEPRECIATION_ANSWERS;
  return form4562Figures(business.depreciation).gap;
}

/* Part V: the stated other expenses, then the amortization (Form 4562 line 44) when there is any. */
export function partVEntries(business: BusinessFactValue): BusinessOtherExpense[] {
  const amortization = line44(business.depreciation);
  const stated = business.otherExpenses ?? [];
  return amortization === undefined || amortization === 0
    ? stated
    : [...stated, { description: AMORTIZATION_DESCRIPTION, amount: amortization }];
}
