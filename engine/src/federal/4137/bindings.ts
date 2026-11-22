/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import type { Form4137FilingInfo, TipFiler } from "./filingInfo.js";
import {
  form4137Lines,
  LINE_1_ROW_COUNT,
  rowColumns,
  type Form4137Lines,
  type TipRow,
} from "./lines.js";
import type { Form4137 } from "./types.js";

type Fn = BindingFn<Form4137, Form4137FilingInfo, keyof Form4137>;
type Bindings = Partial<{ [K in keyof Form4137]: BindingFn<Form4137, Form4137FilingInfo, K> }>;

const ROW_LETTERS = ["a", "b", "c", "d", "e"] as const;

const OVERFLOW = unsupported(
  "Line 1 has five rows; a sixth employer goes on an attached statement or another Form 4137's line 1 (irs-4137-form-2025::sec::line-1::b01), which the engine does not print. Lines 2 through 13 still count every row.",
);

/* The person this copy is for (renderCopies sets the index). */
export function filerOf(info: Form4137FilingInfo): TipFiler | undefined {
  return info.form4137Filers?.[info.form4137CopyIndex ?? 0];
}

/* A row of line 1, or the overflow reason when the person has more employers than rows. */
function rowOf(info: Form4137FilingInfo, index: number): TipRow | Unsupported | undefined {
  const rows = filerOf(info)?.rows ?? [];
  return rows.length > LINE_1_ROW_COUNT ? OVERFLOW : rows[index];
}

/*
 * MANUAL EDIT: line 1 (irs-4137-form-2025::sec::line-1::b01): one row per
 * employer. Columns (a) and (b) exactly as on the W-2; (c) and (d) in whole dollars.
 */
function line1Bindings(): Bindings {
  const out: Record<string, Fn> = {};
  ROW_LETTERS.forEach((letter, index) => {
    const read =
      (pick: (row: TipRow) => string | number): Fn =>
      (_, info) => {
        const found = rowOf(info, index);
        if (found === undefined || "unsupported" in found) return found;
        return pick(found);
      };
    const row = `0.line.1_row_${letter}_employer_tips`;
    out[`${row}_col_a`] = read((found) => found.employerName);
    out[`${row}_col_b`] = read((found) => found.employerEin);
    out[`${row}_col_c`] = read((found) => rowColumns(found).received);
    out[`${row}_col_d`] = read((found) => rowColumns(found).reported);
  });
  return out as Bindings;
}

/* Lines 2 through 13 of this copy's person; blank with no person. */
function linesOf(info: Form4137FilingInfo): Form4137Lines | undefined {
  const filer = filerOf(info);
  return filer === undefined
    ? undefined
    : form4137Lines(filer.rows, filer.socialSecurityWagesAndTips);
}

/* "Name of person who received tips": one form for each spouse with unreported tips. */
function personName(info: Form4137FilingInfo): string | undefined {
  const owner = filerOf(info)?.owner;
  if (owner === undefined) return undefined;
  const [first, last] =
    owner === "spouse"
      ? [info.spouseFirstName, info.spouseLastName]
      : [info.taxpayerFirstName, info.taxpayerLastName];
  return first && last ? `${first} ${last}` : undefined;
}

export function register(): void {
  defineForm<Form4137, Form4137FilingInfo>("form-4137", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => personName(info),
      "0.header.ssn": (_, info) => {
        const owner = filerOf(info)?.owner;
        if (owner === undefined) return undefined;
        return owner === "spouse" ? info.spouseSSN : info.taxpayerSSN;
      },
      ...line1Bindings(),
      // MANUAL EDIT: irs-4137-form-2025::sec::omb-no-1545-0074::b01, b02 (lines.ts).
      "0.line.2_total_tips_received": (_, info) => linesOf(info)?.line2,
      "0.line.3_total_tips_reported": (_, info) => linesOf(info)?.line3,
      "0.line.4_unreported_tips": (_, info) => linesOf(info)?.line4,
      // MANUAL EDIT: line-5::b01: only tips not required to be reported (under $20 in a month).
      "0.line.5_tips_under_20_month": (_, info) => linesOf(info)?.line5,
      "0.line.6_tips_subject_medicare_tax": (_, info) => linesOf(info)?.line6,
      // MANUAL EDIT: line 7 is printed on the form ($176,100); no widget.
      "0.line.8_social_security_wages_tips": (_, info) => linesOf(info)?.line8,
      "0.line.9_remaining_social_security_base": (_, info) => linesOf(info)?.line9,
      // MANUAL EDIT: line-10::b01: government-employee 1.45% tips leave out of the comparison only.
      "0.line.10_tips_subject_social_security_tax": (_, info) => linesOf(info)?.line10,
      "0.line.11_social_security_tax": (_, info) => linesOf(info)?.line11,
      "0.line.12_medicare_tax": (_, info) => linesOf(info)?.line12,
      "0.line.13_total_tax_unreported_tips": (_, info) => linesOf(info)?.line13,
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
