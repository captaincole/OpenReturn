/*
 * Lines 7 through 12 and the Credit Limit Worksheet, from the columns and the
 * return. Every function reads cross-form fields by their full id, so Schedule 3
 * can call the gap test with its own accessor.
 */

import { numberOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form8880FilingInfo } from "./filingInfo.js";
import {
  columnLines,
  creditLimit,
  line10,
  line7,
  line9Digit,
  type ColumnLines,
  type CreditLimitLines,
} from "./lines.js";

/* Any form's accessor: these functions read fields by their full id only. */
export type Accessor = { readonly [fieldId: string]: unknown };
type Value = number | Unsupported | undefined;

export const LINE_7_ID = "form-8880.0.line.7_total_line_6";
export const LINE_10_ID = "form-8880.0.line.10_line_7_times_line_9";
export const LINE_12_ID = "form-8880.0.line.12_retirement_savings_credit";

const FOREIGN_INCOME_GAP =
  "Line 8 must add back a foreign earned income or housing exclusion (Form 2555), and Form 2555 has no rules in the engine (Pub. 590-A, irs-pub-590a-2025::sec::retirement-savings::b03).";

/*
 * The Schedule 3 credits worksheet line 2 adds, each with the form the engine
 * does not compute. Lines 2 (Form 2441) and 6d (Schedule R) are computed.
 */
function creditsGap(info: Form8880FilingInfo): string | undefined {
  const files = (formId: string) => info.mustFile?.[formId]?.value === true;
  if (info.form8880ForeignTaxPaid === true || files("form-1116")) {
    return "Credit Limit Worksheet line 2 adds Schedule 3 line 1, the foreign tax credit, which the engine does not compute; a 1099 shows foreign tax paid.";
  }
  if (files("form-8863")) {
    return "Credit Limit Worksheet line 2 adds Schedule 3 line 3, the education credits (Form 8863), which the engine does not compute.";
  }
  if (files("form-8978")) {
    return "Credit Limit Worksheet line 2 adds Schedule 3 line 6l (Form 8978), which the engine does not compute.";
  }
  return undefined;
}

export function columnOf(
  info: Form8880FilingInfo,
  column: "you" | "spouse",
): ColumnLines | undefined {
  const found = info.form8880Columns?.[column];
  return found?.kind === "counts" ? columnLines(found.inputs) : undefined;
}

/* Line 7; undefined while a column waits. Both columns blank (the explicit decision) gives 0. */
export function line7Of(info: Form8880FilingInfo): number | undefined {
  const columns = info.form8880Columns;
  if (columns === undefined) return undefined;
  if (columns.you.kind === "waits" || columns.spouse.kind === "waits") return undefined;
  return line7(columnOf(info, "you")?.line6, columnOf(info, "spouse")?.line6);
}

/* Line 8: Form 1040 line 11a. Blank when line 7 is zero ("stop; you can't take this credit"). */
export function line8Of(form: Accessor, info: Form8880FilingInfo): Value {
  const total = line7Of(info);
  if (total === undefined || total === 0) return undefined;
  if (info.mustFile?.["form-2555"]?.value === true) return unsupported(FOREIGN_INCOME_GAP);
  return numberOrBlank(form["form-1040.line.11a"]);
}

/* Line 9: the digit after "0." from the table; blank while the filing status waits. */
export function line9Of(form: Accessor, info: Form8880FilingInfo): Value {
  const line8 = line8Of(form, info);
  if (typeof line8 !== "number") return line8;
  if (info.filingStatus === undefined) return undefined;
  return line9Digit(line8, info.filingStatus);
}

/* Line 10: blank when line 9 is zero ("stop; you can't take this credit"). */
export function line10Of(form: Accessor, info: Form8880FilingInfo): Value {
  const digit = line9Of(form, info);
  if (typeof digit !== "number") return digit;
  if (digit === 0) return undefined;
  return line10(line7Of(info) ?? 0, digit);
}

/* The Credit Limit Worksheet, once line 10 is figured. */
export function worksheetOf(
  form: Accessor,
  info: Form8880FilingInfo,
): CreditLimitLines | Unsupported | undefined {
  const tentative = line10Of(form, info);
  if (typeof tentative !== "number") return tentative;
  const gap = creditsGap(info);
  if (gap !== undefined) return unsupported(gap);
  const line18 = numberOrBlank(form["form-1040.line.18"]);
  if (line18 === undefined) return undefined;
  return creditLimit(line18, [
    form["schedule-3.0.line.1"],
    form["schedule-3.0.line.2"],
    form["schedule-3.0.line.3"],
    form["schedule-3.0.line.6d"],
    form["schedule-3.0.line.6l"],
  ] as Array<number | undefined>);
}

/*
 * Schedule 3 line 4 when Form 8880 line 12 is not a number: the gap that kept it
 * blank, so a gap is never read as "no credit". Line 7 above 0 with a Form 2555
 * is the line 8 gap; line 10 above 0 is a worksheet gap.
 */
export function creditGap(form: Accessor, info: Form8880FilingInfo): Unsupported | undefined {
  if (info.mustFile?.["form-8880"]?.value !== true) return undefined;
  const files2555 = info.mustFile?.["form-2555"]?.value === true;
  if (files2555 && (numberOrBlank(form[LINE_7_ID]) ?? 0) > 0) {
    return unsupported(FOREIGN_INCOME_GAP);
  }
  const gap = (numberOrBlank(form[LINE_10_ID]) ?? 0) > 0 ? creditsGap(info) : undefined;
  return gap === undefined ? undefined : unsupported(gap);
}
