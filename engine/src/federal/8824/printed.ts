/*
 * Which exchange and which Part IV sale each copy of Form 8824 prints. Copy n
 * prints the nth exchange in Parts I–III and the nth Part IV sale, so the
 * return has one form for each exchange (and for each Part IV sale beyond the
 * exchanges). Schedule D and Form 4797 take the total of every copy
 * (totals.ts amounts), never a copy's own lines.
 *
 * DECISION (2026-11-25): "If you made more than one like-kind exchange, you can
 * file a summary on one Form 8824 and attach your own statement showing all the
 * information requested on Form 8824 for each exchange ... On the summary Form
 * 8824, enter only your name and identifying number ..., 'Summary' on line 1,
 * the total recognized gain from all exchanges on line 23, and the total basis
 * of all like-kind property received on line 25"
 * (irs-8824-inst-2025::sec::purpose-of-form::b02). The other way is a separate
 * Form 8824 for each exchange ("Use Parts I, II, and III of Form 8824 to report
 * each exchange", purpose-of-form::b01). The engine prints one form for each
 * exchange, because the summary route needs an attached statement and the
 * engine writes no statements. No dollar amount changes.
 *
 * DECISION (2026-11-25): Part IV has room for one conflict-of-interest sale,
 * and the instructions do not say what to do with a second one: "Complete
 * Part IV of Form 8824 only if the cost of the replacement property is more
 * than the basis of the divested property and you elect to defer the gain"
 * (irs-8824-inst-2025::sec::section-1043-conflict-of-interest::b02). The other
 * way is a gap for the second sale. The engine prints each sale in Part IV of
 * its own form, the same way as the exchanges. No dollar amount changes.
 */

import type { DivestitureForm } from "./divestiture.js";
import type { ExchangeForm } from "./exchange.js";
import type { CopyEntry, Form8824Totals } from "./totals.js";

/* What a copy prints in one part: nothing, a gap, or a figured form. */
export type Printed<T> = { kind: "blank" } | CopyEntry<T>;
export type PrintedExchange = Printed<ExchangeForm>;
export type PrintedDivestiture = Printed<DivestitureForm>;

/* One copy for each exchange or Part IV sale, whichever is more; one with a whole-form gap. */
export function form8824CopyCount(totals: Form8824Totals | undefined): number {
  if (totals === undefined || totals.formGap) return 1;
  return Math.max(1, totals.exchangeCopies.length, totals.divestitureCopies.length);
}

function printedOf<T>(
  totals: Form8824Totals,
  entries: ReadonlyArray<CopyEntry<T>>,
  copyIndex: number,
): Printed<T> {
  if (totals.formGap) return { kind: "gap", reason: totals.formGap };
  return entries[copyIndex] ?? { kind: "blank" };
}

/* The exchange copy `copyIndex` prints in Parts I–III. */
export const printedExchange = (totals: Form8824Totals, copyIndex = 0): PrintedExchange =>
  printedOf(totals, totals.exchangeCopies, copyIndex);

/* The conflict-of-interest sale copy `copyIndex` prints in Part IV. */
export const printedDivestiture = (totals: Form8824Totals, copyIndex = 0): PrintedDivestiture =>
  printedOf(totals, totals.divestitureCopies, copyIndex);
