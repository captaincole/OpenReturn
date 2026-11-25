/*
 * FTB 3805E arithmetic. "Generally, California law is the same as federal law
 * concerning installment sales. Get the instructions for federal Form 6252"
 * (ca-3805e-inst-2025::sec::purpose::b02), so each line's arithmetic is
 * federal/6252/lines.ts. This file holds what California adds: its own amounts
 * for lines 8, 9, 12 and 15, the test that they differ from the federal ones,
 * line 3's date, and the gain that goes to Schedule D (540) line 1.
 */

import type {
  InstallmentSaleCaliforniaAmounts,
  InstallmentSaleFactValue,
} from "../../../facts/index.js";
import { roundDollars, sum } from "../../../money.js";

/*
 * Line 3: "Was the property sold to a related party after December 31, 1980?"
 * (the form). A sale before this day answers "No".
 */
export const RELATED_PARTY_RULE_START = "1981-01-01";

/* The amounts of lines 8, 9, 12 and 15 for California; recaptureIncome is undefined while it waits. */
export interface CaliforniaPartIAmounts {
  costOrOtherBasis: number;
  depreciationAllowed?: number;
  recaptureIncome?: number;
  excludedGain?: number;
}

/*
 * Line 8 (California basis, ca-540-sched-d-inst-2025::sec::line-1::b02), line 9
 * ("Use California amounts", the form) and line 15 ("using California amounts",
 * ca-3805e-inst-2025::sec::line-15::b01): the stated California amount, else
 * the federal one. Line 12 for an earlier year's sale (line-12::b01): the stated
 * California recapture; the federal one when neither basis nor depreciation
 * differs; 0 with no California depreciation; else it waits (undefined).
 */
export function californiaPartIAmounts(sale: InstallmentSaleFactValue): CaliforniaPartIAmounts {
  const own: InstallmentSaleCaliforniaAmounts = sale.california ?? {};
  const depreciationAllowed = own.depreciationAllowed ?? sale.depreciationAllowed;
  const sameBasis = own.costOrOtherBasis === undefined && own.depreciationAllowed === undefined;
  const noDepreciation = (depreciationAllowed ?? 0) === 0;
  const recaptureIncome =
    own.recaptureIncome ??
    (sameBasis ? sale.recaptureIncome : undefined) ??
    (noDepreciation ? 0 : undefined);
  return {
    costOrOtherBasis: own.costOrOtherBasis ?? sale.costOrOtherBasis,
    depreciationAllowed,
    recaptureIncome,
    excludedGain: own.excludedGain ?? sale.excludedGain,
  };
}

const CALIFORNIA_FIELDS = [
  "costOrOtherBasis",
  "depreciationAllowed",
  "recaptureIncome",
  "excludedGain",
] as const;

/*
 * A stated California amount that is not the federal one, in whole dollars (an
 * absent federal amount is 0). Such a sale's California gain can differ from
 * its federal gain, so FTB 3805E files (resolveInfo.ts).
 */
export function californiaAmountsDiffer(sale: InstallmentSaleFactValue): boolean {
  const own = sale.california;
  if (own === undefined) return false;
  return CALIFORNIA_FIELDS.some(
    (field) =>
      own[field] !== undefined && roundDollars(own[field]) !== roundDollars(sale[field] ?? 0),
  );
}

/* Line 3 "Yes": a related-party buyer, in a sale after December 31, 1980. */
export function soldToRelatedParty(sale: InstallmentSaleFactValue): boolean {
  return sale.relatedParty !== undefined && sale.dateSold >= RELATED_PARTY_RULE_START;
}

/*
 * The gain one form sends to Schedule D (540) line 1: line 26, plus line 37
 * when Part III is completed ("Enter this amount on Schedule D (540 or 540NR),
 * line 1", ca-3805e-inst-2025::sec::line-26-and-line-37::b01).
 */
export function scheduleDGain(line26: number, line37: number | undefined): number {
  return sum(line26, line37);
}
