/*
 * Item states: why a deduction line is blank, open or settled for this filer.
 * A form binding only knows "blank or number"; the catalog knows that nothing
 * is known yet, that medical bills under the floor cannot matter, and which
 * line-level fact Cade asks for next. A renter is closed the same way as any
 * other zero: Cade records mortgage interest of 0.
 */

import { roundDollars } from "../money.js";
import type { DeductionItem } from "./catalog.js";

export type ItemStatus =
  /** No fact for the item yet: Cade asks its amount. */
  | "unasked"
  /** An amount of 0, or a deduction no return of this filer takes: no question follows. */
  | "closed"
  /** Some of the item's facts are in, but its line still waits on others. */
  | "open"
  /** An estimate only: enough for the comparison, not for the return. */
  | "estimate"
  /** The documents or the taxpayer gave the amount. */
  | "exact"
  /** An amount under its AGI floor on every return: it cannot change the result. */
  | "below_floor"
  /** The engine cannot compute the line (for example a mortgage over the debt limit): for the CPA. */
  | "for_cpa";

export interface ItemInputs {
  /** The amount from exact facts, as the form will use it. */
  exact: number | undefined;
  estimate: number | undefined;
  /** At least one of the item's amount facts is stated. */
  anyStated: boolean;
  /** The engine waits on a line it cannot compute. */
  forCpa: boolean;
  /** The amount facts not stated yet. */
  missingAmountKeys: string[];
  agi: number | undefined;
  /** The filer has a California 540, so the item's California line counts too. */
  filesCa: boolean;
}

export interface ItemState {
  id: DeductionItem["id"];
  title: string;
  status: ItemStatus;
  /** The amount the comparison uses: exact, else the estimate. */
  amount?: number;
  /** The amount is an estimate (or an upper bound, for the CPA), not the forms' amount. */
  estimated: boolean;
  /** What Cade asks next: the line-level facts not stated yet. */
  missing: string[];
  federalLine: string;
  caLine: string;
}

/* The returns the item counts on: federal, and California when the 540 files. */
function countingLines(item: DeductionItem, inputs: ItemInputs) {
  const lines = [item.federal, ...(inputs.filesCa ? [item.ca] : [])];
  return lines.filter((line) => line.rule !== "none");
}

/* Under its AGI floor on every return it counts on. */
function belowFloor(item: DeductionItem, amount: number, inputs: ItemInputs): boolean {
  const agi = inputs.agi;
  if (agi === undefined) return false;
  return countingLines(item, inputs).every(
    (line) => line.rule === "agi_floor" && amount <= roundDollars(agi * (line.floorRate ?? 0)),
  );
}

function settled(
  item: DeductionItem,
  amount: number,
  exact: boolean,
  inputs: ItemInputs,
): ItemStatus {
  // Nothing to deduct, or a deduction no return of this filer takes (CA fees without a 540).
  if (amount <= 0 || countingLines(item, inputs).length === 0) return "closed";
  if (belowFloor(item, amount, inputs)) return "below_floor";
  return exact ? "exact" : "estimate";
}

export function itemState(item: DeductionItem, inputs: ItemInputs): ItemState {
  const base = {
    id: item.id,
    title: item.title,
    federalLine: item.federal.line,
    caLine: item.ca.line,
  };
  if (inputs.forCpa) {
    return { ...base, status: "for_cpa", amount: inputs.estimate, estimated: true, missing: [] };
  }
  if (inputs.exact !== undefined) {
    return {
      ...base,
      status: settled(item, inputs.exact, true, inputs),
      amount: inputs.exact,
      estimated: false,
      missing: [],
    };
  }
  if (inputs.estimate !== undefined) {
    const status = settled(item, inputs.estimate, false, inputs);
    const missing = status === "estimate" ? inputs.missingAmountKeys : [];
    return { ...base, status, amount: inputs.estimate, estimated: true, missing };
  }
  const status = inputs.anyStated ? "open" : "unasked";
  return { ...base, status, estimated: false, missing: inputs.missingAmountKeys };
}
