/*
 * More than four properties in a part: "If you have more than four properties
 * to report, use additional forms" (irs-4797-inst-2025::sec::part-iii::b01).
 * The paper has four rows on line 2, four on line 10 and four property columns
 * in Part III. Each part counts on its own: copy n prints rows 4n to 4n + 3 of
 * lines 2 and 10 and the properties 4n to 4n + 3 in columns A to D. The
 * instructions give no rule for the totals on an additional form, so the
 * totals (lines 1a to 1c, 6 to 18b, 30 to 35) print on the first copy only and
 * add every property: line 30 is "Total gains for all properties".
 */

import type { Form4797Lines } from "./lines.js";

export const ROWS_PER_COPY = 4;

/* The copies the form needs: enough for the part with the most rows, at least one. */
export function form4797CopyCount(lines: Form4797Lines | undefined): number {
  if (lines === undefined) return 1;
  const most = Math.max(
    lines.partIRows.length,
    lines.partIIRows.length,
    lines.partIIIColumns.length,
  );
  let copies = 1;
  while (copies * ROWS_PER_COPY < most) copies += 1;
  return copies;
}

/* The row of a part that a copy prints in its place `slot` (0 to 3). */
export const rowOnCopy = (copyIndex: number, slot: number): number =>
  copyIndex * ROWS_PER_COPY + slot;
