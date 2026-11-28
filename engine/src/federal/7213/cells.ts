/*
 * One copy of Form 7213 as cells: a field's short key in catalog.json
 * ("0.part1_sec2.7_smaller_of_5b_or_6b") → the value it prints. bindings.ts
 * reads every field from these keys; a key with no cell is blank.
 */

import type { Unsupported } from "../../types.js";

export type CellValue = number | string | boolean | Unsupported | undefined;
export type Cells = Record<string, CellValue>;

export interface Form7213Copy {
  /* The facility fact, or the pass-through copy's key (passThrough.ts). */
  key: string;
  cells: Cells;
  /* An answer inside the facility fact is missing: the fact is listed again. */
  waiting: boolean;
}

/* The cells with the section's prefix added, blank ones dropped. */
export function withPrefix(prefix: string, cells: Cells): Cells {
  const out: Cells = {};
  for (const [key, value] of Object.entries(cells)) {
    if (value !== undefined) out[`${prefix}${key}`] = value;
  }
  return out;
}
