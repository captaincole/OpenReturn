/*
 * The federal itemized total, as Schedule A line 17 adds it: the state and
 * local taxes under the SALT cap, medical bills over the 7.5% floor, the rest
 * as stated.
 */

import { saltCap } from "../federal/schedule-a/saltCap.js";
import { sum } from "../money.js";
import { DEDUCTION_ITEMS } from "./catalog.js";
import { amountOf, counted, type ItemizedInput } from "./rules.js";

export function federalItemized(input: ItemizedInput): number {
  const salt = DEDUCTION_ITEMS.filter((item) => item.federal.rule === "salt");
  const pool = sum(...salt.map((item) => amountOf(input.amounts, item.id)));
  const others = DEDUCTION_ITEMS.filter((item) => item.federal.rule !== "salt").map((item) =>
    counted(item.federal, amountOf(input.amounts, item.id), input.agi),
  );
  return sum(Math.min(pool, saltCap(input.agi, input.filingStatus)), ...others);
}
