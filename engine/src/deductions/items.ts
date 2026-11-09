/*
 * Item states: why a deduction line is blank, open or settled for this filer.
 * A form binding only knows "blank or number"; the catalog knows that nothing
 * is known yet, that medical bills under the floor cannot matter, and which
 * line-level fact Cade asks for next. A renter is closed the same way as any
 * other zero: Cade records mortgage interest of 0.
 */

import type { DeductionItem } from "./catalog.js";

export type ItemStatus =
  /** No fact for the item yet: Cade asks its amount. */
  | "unasked"
  /** An amount of 0, or a deduction no return of this filer takes: no question follows. */
  | "closed"
  /** Some of the item's facts are in, but its line still waits on others. */
  | "open"
  /** The amount rests on an assumption: enough for the comparison, not for filing. */
  | "assumed"
  /** The documents or the taxpayer gave the amount. */
  | "exact"
  /** An amount under its AGI floor on every return: it cannot change the result. */
  | "below_floor"
  /** The engine cannot compute the line (for example a mortgage over the debt limit): for the CPA. */
  | "for_cpa";

export interface ItemInputs {
  /** The amount the item's form line uses, from facts and the assumptions in use. */
  amount: number | undefined;
  /** At least one of the item's amount keys is filled by an assumption. */
  assumed: boolean;
  /** At least one of the item's amount keys is stated (a fact or an assumption). */
  anyStated: boolean;
  /** The engine waits on a line it cannot compute. */
  forCpa: boolean;
  /** For the CPA: the most the line can be (the Form 1098 interest). */
  upperBound?: number;
  /** The amount keys with no fact yet, and the ones an assumption fills. */
  missingAmountKeys: string[];
  /** On every return the item counts on, the form's net line is 0: the amount is under the AGI floor. */
  belowFloor: boolean;
  /** The filer has a California 540, so the item's California line counts too. */
  filesCa: boolean;
}

export interface ItemState {
  id: DeductionItem["id"];
  title: string;
  status: ItemStatus;
  /** The amount the item's form line uses; for the CPA, the upper bound. */
  amount?: number;
  /** The amount rests on an assumption. */
  assumed: boolean;
  /** What Cade asks next: the line-level facts not stated yet, or still assumed. */
  missing: string[];
  federalLine: string;
  caLine: string;
}

/* The returns the item counts on: federal, and California when the 540 files. */
export function countingLines(item: DeductionItem, filesCa: boolean) {
  const lines = [item.federal, ...(filesCa ? [item.ca] : [])];
  return lines.filter((line) => line.deducts);
}

function settled(item: DeductionItem, amount: number, inputs: ItemInputs): ItemStatus {
  // Nothing to deduct, or a deduction no return of this filer takes (CA fees without a 540).
  if (amount <= 0 || countingLines(item, inputs.filesCa).length === 0) return "closed";
  if (inputs.belowFloor) return "below_floor";
  return inputs.assumed ? "assumed" : "exact";
}

export function itemState(item: DeductionItem, inputs: ItemInputs): ItemState {
  const base = {
    id: item.id,
    title: item.title,
    federalLine: item.federal.line,
    caLine: item.ca.line,
  };
  if (inputs.forCpa) {
    return { ...base, status: "for_cpa", amount: inputs.upperBound, assumed: false, missing: [] };
  }
  if (inputs.amount !== undefined) {
    const status = settled(item, inputs.amount, inputs);
    // An assumption that cannot change the result (closed, under the floor) needs no follow-up here.
    const missing = status === "assumed" ? inputs.missingAmountKeys : [];
    return { ...base, status, amount: inputs.amount, assumed: inputs.assumed, missing };
  }
  const status = inputs.anyStated ? "open" : "unasked";
  return { ...base, status, assumed: inputs.assumed, missing: inputs.missingAmountKeys };
}
