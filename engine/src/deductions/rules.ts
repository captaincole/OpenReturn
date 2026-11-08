/*
 * How one item counts on one return, shared by the federal and California
 * totals: its amount as stated, the part over an AGI floor, or nothing.
 */

import { atLeast, roundDollars } from "../money.js";
import type { FilingStatus } from "../values.js";
import type { ItemId, ReturnLine } from "./catalog.js";

export type Amounts = Partial<Record<ItemId, number>>;

export interface ItemizedInput {
  /** Each item's amount as stated (a fact or an assumption); the total applies the floors and caps. */
  amounts: Amounts;
  /** Federal AGI (Form 1040 line 11b): the floors, the SALT cap and the CA worksheet read it. */
  agi: number;
  filingStatus: FilingStatus;
}

export const amountOf = (amounts: Amounts, id: ItemId): number => amounts[id] ?? 0;

/* What one item adds on one return: its amount, or the part over the AGI floor. */
export function counted(line: ReturnLine, amount: number, agi: number): number {
  if (line.rule === "none") return 0;
  if (line.rule === "agi_floor")
    return atLeast(0, amount - roundDollars(agi * (line.floorRate ?? 0)));
  return amount;
}
