/*
 * Line 34 of every farm on the return, added, for the forms that take it:
 * Schedule 1 line 6 ("Individuals. Enter your net profit or loss on line 34 and
 * on Schedule 1 (Form 1040), line 6 and; Schedule SE (Form 1040), line 1a",
 * irs-1040sf-inst-2025::sec::line-34::b02), Form 461 line 6 and the QBI forms.
 */

import type { FarmFactValue } from "../../facts/index.js";
import { sum } from "../../money.js";
import { netFarmProfit, type FarmResult } from "./lines.js";

type Farm = { key: string; value: FarmFactValue };

/* Each farm's line 34 added: a gap if any farm is one, waiting if any waits; undefined with no farm. */
export function farmsTotal(farms: ReadonlyArray<Farm>): FarmResult | undefined {
  if (farms.length === 0) return undefined;
  const results = farms.map((farm) => netFarmProfit(farm.value, farm.key));
  const gap = results.find((result) => result.kind === "gap");
  if (gap) return gap;
  if (results.some((result) => result.kind === "waits")) return { kind: "waits" };
  return {
    kind: "amount",
    amount: sum(...results.map((result) => (result.kind === "amount" ? result.amount : 0))),
  };
}

/* Each farm's line 34 loss, positive, by fact key; undefined while a line 34 is not known. */
export function farmLosses(
  farms: ReadonlyArray<Farm>,
): Array<{ key: string; loss: number }> | undefined {
  const results = farms.map((farm) => ({
    key: farm.key,
    result: netFarmProfit(farm.value, farm.key),
  }));
  if (results.some(({ result }) => result.kind !== "amount")) return undefined;
  return results.flatMap(({ key, result }) =>
    result.kind === "amount" && result.amount < 0 ? [{ key, loss: 0 - result.amount }] : [],
  );
}
