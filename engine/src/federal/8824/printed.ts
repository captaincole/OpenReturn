/*
 * Which Form 8824 the engine prints. One exchange prints its own Parts I–III.
 * More than one prints the summary form.
 *
 * DECISION (2026-11-24, by the author, not reviewed by a person): "If you made
 * more than one like-kind exchange, you can file a summary on one Form 8824 and
 * attach your own statement ... On the summary Form 8824, enter only your name
 * and identifying number ..., 'Summary' on line 1, the total recognized gain from
 * all exchanges on line 23, and the total basis of all like-kind property
 * received on line 25" (irs-8824-inst-2025::sec::purpose-of-form::b02). The other
 * way is a separate Form 8824 for each exchange ("use Parts I, II, and III of
 * Form 8824 to report each exchange", purpose-of-form::b01). The engine always
 * prints the summary: it prints one copy of the form, and one rule applies every
 * time. No dollar amount changes.
 */

import { sum } from "../../money.js";
import type { DivestitureForm } from "./divestiture.js";
import type { ExchangeForm } from "./exchange.js";
import type { Form8824Totals } from "./totals.js";

export type PrintedExchange =
  | { kind: "blank" }
  | { kind: "gap"; reason: string }
  | { kind: "one"; form: ExchangeForm }
  | { kind: "summary"; line23: number | undefined; line25: number | undefined; gap?: string };

export const SUMMARY = "Summary";

const SUMMARY_GAP = "An exchange in the summary has a line that cannot be figured: ";

/* Lines 23 and 25 of the summary form: the totals of each exchange's Part III. */
function summaryOf(totals: Form8824Totals): PrintedExchange {
  const gap =
    totals.exchangeGaps[0]?.reason ?? totals.exchanges.find((each) => each.line21Gap)?.line21Gap;
  const completed = totals.exchanges.flatMap((each) => (each.recognized ? [each.recognized] : []));
  return {
    kind: "summary",
    line23: completed.length > 0 ? sum(...completed.map((each) => each.line23)) : undefined,
    line25: completed.length > 0 ? sum(...completed.map((each) => each.line25)) : undefined,
    gap: gap === undefined ? undefined : `${SUMMARY_GAP}${gap}`,
  };
}

export function printedExchange(totals: Form8824Totals): PrintedExchange {
  if (totals.formGap) return { kind: "gap", reason: totals.formGap };
  const count = totals.exchanges.length + totals.exchangeGaps.length;
  if (count === 0) return { kind: "blank" };
  if (count > 1) return summaryOf(totals);
  const gap = totals.exchangeGaps[0];
  if (gap) return { kind: "gap", reason: gap.reason };
  const form = totals.exchanges[0];
  return form === undefined ? { kind: "blank" } : { kind: "one", form };
}

export type PrintedDivestiture =
  { kind: "blank" } | { kind: "gap"; reason: string } | { kind: "one"; form: DivestitureForm };

const ONE_PART_IV =
  "More than one conflict-of-interest sale: the engine prints one Form 8824, which has one Part IV.";

export function printedDivestiture(totals: Form8824Totals): PrintedDivestiture {
  if (totals.formGap) return { kind: "gap", reason: totals.formGap };
  const count = totals.divestitures.length + totals.divestitureGaps.length;
  if (count === 0) return { kind: "blank" };
  if (count > 1) return { kind: "gap", reason: ONE_PART_IV };
  const gap = totals.divestitureGaps[0];
  if (gap) return { kind: "gap", reason: gap.reason };
  const form = totals.divestitures[0];
  return form === undefined ? { kind: "blank" } : { kind: "one", form };
}
