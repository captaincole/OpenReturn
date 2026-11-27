/*
 * One copy of Form 3468 as cells: `<part>.<line>` → the value its field
 * prints ("part6.3b" → "30"). A line with more than one widget (a Yes/No pair,
 * the two parts of line 9b, the three entries of line 1k) is keyed by the
 * widget's full name after the part ("part7.1a_prior_170h_deduction_yes").
 * bindings.ts reads every catalog field from these keys.
 */

import type { Unsupported } from "../../types.js";

export type CellValue = number | string | boolean | Unsupported | undefined;
export type Cells = Record<string, CellValue>;

/* The lines of one part, keyed by line, with the part's prefix added. */
export function inPart(part: string, lines: Record<string, CellValue>): Cells {
  const out: Cells = {};
  for (const [line, value] of Object.entries(lines)) {
    if (value !== undefined) out[`${part}.${line}`] = value;
  }
  return out;
}

/* A Yes/No pair: the box that applies is checked, the other left blank. */
export function yesNo(prefix: string, answer: boolean | undefined): Record<string, CellValue> {
  if (answer === undefined) return {};
  return answer ? { [`${prefix}_yes`]: true } : { [`${prefix}_no`]: true };
}

/* A whole number of kilowatts or dollars as a text entry ("250"). */
export const textOf = (value: number | undefined): string | undefined =>
  value === undefined ? undefined : String(value);
