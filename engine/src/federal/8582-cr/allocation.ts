/*
 * Worksheets 5 to 9: the allowed and the unallowed part of each credit
 * (irs-8582cr-inst-2025::sec::instructions-for-worksheet-5::b01 to
 * instructions-for-worksheet-9::b01).
 *
 * - Worksheets 5, 6 and 7 share line 16, line 30 and line 36 among the
 *   credits of Worksheets 1, 2 and 3 by their ratios; column (d) is the rest.
 * - Worksheet 8 shares the unallowed credit, line 5 less line 37, among the
 *   Worksheet 4 credits and those column (d) amounts by their ratios.
 * - Worksheet 9: each credit less its Worksheet 8 share is allowed.
 *
 * The shares are whole dollars from running totals (prorateDollars), so each
 * worksheet's column adds to its line exactly. With one credit the worksheets
 * give line 37 itself (line-37::b01: "If you have only one type of credit,
 * the amount on line 37 is the credit allowed").
 */

import { atLeast, prorateDollars, sum } from "../../money.js";
import { valueOf, type Cell } from "../3800/cells.js";
import type { Form8582CRLines } from "./lines.js";
import {
  totalOfEntry,
  type PassiveSource,
  type Worksheet,
  type WorksheetEntry,
} from "./worksheets.js";

/* The special allowance line each of Worksheets 5, 6 and 7 shares (column (c)). */
const SPECIAL_ALLOWANCE_LINE: Record<Exclude<Worksheet, 4>, keyof Form8582CRLines> = {
  1: "line16",
  2: "line30",
  3: "line36",
};

export interface Allocation {
  /* Worksheet 9 column (c): the credit allowed this year, by source. */
  allowed: Map<PassiveSource, number>;
  /* Worksheet 9 column (b): the credit carried to next year. */
  unallowed: Map<PassiveSource, number>;
}

/* Worksheets 5 to 7 column (d): what the special allowance leaves of each credit. */
function afterSpecialAllowance(
  entries: ReadonlyArray<WorksheetEntry>,
  lines: Form8582CRLines,
): Map<WorksheetEntry, number> {
  const left = new Map<WorksheetEntry, number>();
  for (const worksheet of [1, 2, 3] as const) {
    const onSheet = entries.filter((entry) => entry.worksheet === worksheet);
    const allowance = valueOf(lines[SPECIAL_ALLOWANCE_LINE[worksheet]]);
    const shares = prorateDollars(allowance, onSheet.map(totalOfEntry));
    onSheet.forEach((entry, index) => left.set(entry, totalOfEntry(entry) - shares[index]));
  }
  return left;
}

/* Every credit's allowed part; lines 5 and 37 are numbers here (form.ts checks). */
export function allocate(
  entries: ReadonlyArray<WorksheetEntry>,
  lines: Form8582CRLines,
): Allocation {
  const left = afterSpecialAllowance(entries, lines);
  // Worksheet 8 column (a): Worksheet 4 column (c) and Worksheets 5 to 7 column (d).
  const pool = entries.map((entry) =>
    entry.worksheet === 4 ? totalOfEntry(entry) : (left.get(entry) ?? 0),
  );
  // Column (c): line C, line 5 less line 37, by the ratios of column (b).
  const lineC = valueOf(lines.line5 as Cell) - valueOf(lines.line37 as Cell);
  const unallowedShares = prorateDollars(atLeast(0, lineC), pool);
  const allowed = new Map<PassiveSource, number>();
  const unallowed = new Map<PassiveSource, number>();
  entries.forEach((entry, index) => {
    unallowed.set(entry.source, unallowedShares[index]);
    allowed.set(entry.source, totalOfEntry(entry) - unallowedShares[index]);
  });
  return { allowed, unallowed };
}

/* The allowed credit of a set of sources, whole dollars. */
export const allowedOfSources = (allocation: Allocation, sources: ReadonlyArray<PassiveSource>) =>
  sum(...sources.map((source) => allocation.allowed.get(source) ?? 0));
