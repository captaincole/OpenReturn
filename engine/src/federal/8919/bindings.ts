/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import type { Form8919FilingInfo, WageFiler } from "./filingInfo.js";
import {
  form8919Lines,
  LINE_1_ROW_COUNT,
  rowColumns,
  type FirmRow,
  type Form8919Lines,
  type RowColumns,
} from "./lines.js";
import type { Form8919 } from "./types.js";

type Fn = BindingFn<Form8919, Form8919FilingInfo, keyof Form8919>;
type Bindings = Partial<{ [K in keyof Form8919]: BindingFn<Form8919, Form8919FilingInfo, K> }>;

const ROW_NUMBERS = [1, 2, 3, 4, 5] as const;

const OVERFLOW = unsupported(
  "Lines 1 through 5 hold five firms; a sixth goes on lines 1 through 5 of another Form 8919 (irs-8919-form-2025::sec::lines-1-through-5::b01), which the engine does not print. Line 6 still counts every firm.",
);

/* The person this copy is for (renderCopies sets the index). */
export function filerOf(info: Form8919FilingInfo): WageFiler | undefined {
  return info.form8919Filers?.[info.form8919CopyIndex ?? 0];
}

/* A row of lines 1 through 5, or the overflow reason when the person has more firms than rows. */
function rowOf(info: Form8919FilingInfo, index: number): FirmRow | Unsupported | undefined {
  const rows = filerOf(info)?.rows ?? [];
  return rows.length > LINE_1_ROW_COUNT ? OVERFLOW : rows[index];
}

/*
 * MANUAL EDIT: lines 1 through 5 (irs-8919-form-2025::sec::lines-1-through-5::b01
 * to b03): one row per firm. Column (a) the name and (b) the number as on the
 * firm's 1099, or "unknown"; (c) one reason code; (d) the date only for code
 * A or C; (e) checked when a 1099 came; (f) in whole dollars.
 */
function rowBindings(): Bindings {
  const out: Record<string, Fn> = {};
  ROW_NUMBERS.forEach((number, index) => {
    const read =
      (pick: (columns: RowColumns) => string | number | boolean | undefined): Fn =>
      (_, info) => {
        const found = rowOf(info, index);
        if (found === undefined || "unsupported" in found) return found;
        return pick(rowColumns(found));
      };
    const row = `0.line.${number}_firm_col`;
    out[`${row}_a`] = read((columns) => columns.firmName);
    out[`${row}_b`] = read((columns) => columns.firmTin);
    out[`${row}_c`] = read((columns) => columns.reasonCode);
    out[`${row}_d`] = read((columns) => columns.determinationDate);
    out[`${row}_e`] = read((columns) => columns.received1099);
    out[`${row}_f`] = read((columns) => columns.wages);
  });
  return out as Bindings;
}

/* Lines 6 through 13 of this copy's person; blank with no person. */
function linesOf(info: Form8919FilingInfo): Form8919Lines | undefined {
  const filer = filerOf(info);
  return filer === undefined
    ? undefined
    : form8919Lines(filer.rows, filer.socialSecurityWagesAndTips);
}

/* "Name of person who must file this form": one form for each spouse who must file. */
function personName(info: Form8919FilingInfo): string | undefined {
  const owner = filerOf(info)?.owner;
  if (owner === undefined) return undefined;
  const [first, last] =
    owner === "spouse"
      ? [info.spouseFirstName, info.spouseLastName]
      : [info.taxpayerFirstName, info.taxpayerLastName];
  return first && last ? `${first} ${last}` : undefined;
}

export function register(): void {
  defineForm<Form8919, Form8919FilingInfo>("form-8919", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => personName(info),
      "0.header.ssn": (_, info) => {
        const owner = filerOf(info)?.owner;
        if (owner === undefined) return undefined;
        return owner === "spouse" ? info.spouseSSN : info.taxpayerSSN;
      },
      ...rowBindings(),
      // MANUAL EDIT: irs-8919-form-2025::sec::omb-no-1545-0074::b02, b03 (lines.ts).
      "0.line.6_total_wages": (_, info) => linesOf(info)?.line6,
      // MANUAL EDIT: line 7 is printed on the form ($176,100); no widget.
      "0.line.8_total_social_security_wages_tips": (_, info) => linesOf(info)?.line8,
      "0.line.9_subtract_line_8_from_7": (_, info) => linesOf(info)?.line9,
      "0.line.10_wages_subject_social_security_tax": (_, info) => linesOf(info)?.line10,
      "0.line.11_social_security_tax": (_, info) => linesOf(info)?.line11,
      "0.line.12_medicare_tax": (_, info) => linesOf(info)?.line12,
      "0.line.13_total_uncollected_tax": (_, info) => linesOf(info)?.line13,
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
