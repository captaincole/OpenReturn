/*
 * More properties than the paper holds: "If you have more than 4 transactions
 * to report, use additional forms" (ca-540-sched-d1-inst-2025::sec::part-iii::b01).
 * The paper has three rows on line 2, three on line 10 and four property columns
 * in Part III. Each part counts on its own: copy n prints rows 3n to 3n + 2 of
 * lines 2 and 10 and the properties 4n to 4n + 3 of Part III. As on federal Form
 * 4797 (federal/4797/copies.ts), the totals print on the first copy only and add
 * every property.
 */

import type { Form4797Lines } from "../../../federal/4797/lines.js";

export const ROWS_PER_COPY = 3;
export const COLUMNS_PER_COPY = 4;

/* The copies a part needs for `count` entries, at least one. */
function copiesFor(count: number, perCopy: number): number {
  let copies = 1;
  while (copies * perCopy < count) copies += 1;
  return copies;
}

/* The copies the schedule needs: enough for the part with the most entries. */
export function scheduleD1CopyCount(lines: Form4797Lines | undefined): number {
  if (lines === undefined) return 1;
  return Math.max(
    copiesFor(lines.partIRows.length, ROWS_PER_COPY),
    copiesFor(lines.partIIRows.length, ROWS_PER_COPY),
    copiesFor(lines.partIIIColumns.length, COLUMNS_PER_COPY),
  );
}

/* The entry of a part that a copy prints in its place `slot`. */
export const entryOnCopy = (copyIndex: number, slot: number, perCopy: number): number =>
  copyIndex * perCopy + slot;
