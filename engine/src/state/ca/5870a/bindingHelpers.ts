/*
 * The shared shape of FTB 5870A's bindings: which copy prints, the gap or the
 * wait that every line shows, and one column line of a recomputation year.
 */

import type { FormSpec } from "../../../defineForm.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { Column, Form5870ACopy, Form5870AFilingInfo, Form5870ALines } from "./filingInfo.js";
import type { YearColumn } from "./lines.js";
import type { Form5870A } from "./types.js";

export type Bindings = FormSpec<Form5870A, Form5870AFilingInfo>["bindings"];
type Value = number | string | boolean;
export type Result<T extends Value = Value> = T | Unsupported | undefined;
export type Binding<T extends Value = Value> = (
  form: unknown,
  info: Form5870AFilingInfo,
) => Result<T>;
export type Figured = Extract<Form5870ACopy["result"], { kind: "figured" }>;

/* The printed copy, or why its fields are unsupported; undefined while none prints. */
function copyOf(info: Form5870AFilingInfo): Form5870ACopy | Unsupported | undefined {
  if (info.form5870AGap !== undefined) return unsupported(info.form5870AGap);
  return info.form5870A;
}

export const isUnsupported = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && "unsupported" in value;

/* A header field from the trust's answers, whatever the state of its lines. */
export const answerOf =
  <T extends Value>(
    pick: (copy: Form5870ACopy, info: Form5870AFilingInfo) => Result<T>,
  ): Binding<T> =>
  (_, info) => {
    const copy = copyOf(info);
    return copy === undefined || isUnsupported(copy) ? copy : pick(copy, info);
  };

/* A line of the printed form: unsupported with a gap, blank while it waits. */
export const lineOf =
  <T extends Value>(pick: (lines: Form5870ALines, figured: Figured) => Result<T>): Binding<T> =>
  (_, info) => {
    const copy = copyOf(info);
    if (copy === undefined || isUnsupported(copy)) return copy;
    const { result } = copy;
    if (result.kind === "gap") return unsupported(result.reason);
    return result.kind === "waits" ? undefined : pick(result.lines, result);
  };

/* A total: its value, or the gap that keeps it unknown. */
export const totalOf = (value: number | undefined, gap: string | undefined): Result<number> =>
  value === undefined && gap !== undefined ? unsupported(gap) : value;

/* The rows each column holds; the figured ones are unsupported with the column's gap. */
export type StatedRow =
  | "taxableIncome"
  | "share"
  | "recomputed"
  | "taxBeforeCredits"
  | "creditAdjustment"
  | "minimumTaxChange";
export type FiguredRow = "tax" | "additionalTax" | "afterCredits" | "total";
const FIGURED_ROWS: readonly string[] = ["tax", "additionalTax", "afterCredits", "total"];

/* One row of one column: blank for a column the form leaves empty. */
export function columnRow(entry: Column | undefined, row: StatedRow | FiguredRow): Result<number> {
  if (entry === undefined) return undefined;
  const value = entry.lines?.[row as keyof YearColumn];
  if (typeof value === "number") return value;
  return FIGURED_ROWS.includes(row) && entry.gap !== undefined ? unsupported(entry.gap) : undefined;
}
