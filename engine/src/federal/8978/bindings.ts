/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8978FilingInfo } from "./filingInfo.js";
import type { FiguredColumn, FormTotals } from "./lines.js";
import type { Form8978Copy } from "./plan.js";
import type { Form8978 } from "./types.js";

type Value = number | string | boolean;
type Binding = (form: unknown, info: Form8978FilingInfo) => Value | Unsupported | undefined;
type Bindings = Partial<{ [K in keyof Form8978]: BindingFn<Form8978, Form8978FilingInfo, K> }>;

const COLUMNS = ["a", "b", "c", "d"] as const;

/*
 * MANUAL EDIT: the copy being printed (plan.ts; the copies spec in
 * federal/index.ts): the AAR form first, four columns to a form. A gap makes
 * every amount line unsupported; with no Form 8986 for 2025 the form is blank.
 */
function copyLine(
  pick: (copy: Form8978Copy) => Value | undefined,
): (form: unknown, info: Form8978FilingInfo) => Value | Unsupported | undefined {
  return (_, info) => {
    const plan = info.form8978;
    if (plan === undefined) return undefined;
    if (plan.gap !== undefined) return unsupported(plan.gap);
    const copy = plan.copies[info.form8978CopyIndex ?? 0];
    return copy === undefined ? undefined : pick(copy);
  };
}

/* A line of one column: blank in a column the copy does not use, and while the column waits. */
const columnLine = (index: number, pick: (lines: FiguredColumn) => number): Binding =>
  copyLine((copy) => {
    const lines = copy.columns[index]?.lines;
    return lines === undefined ? undefined : pick(lines);
  });

/* Lines 14, 16 and 18: blank while a column waits. */
const totalLine = (pick: (totals: FormTotals) => number): Binding =>
  copyLine((copy) => (copy.totals === undefined ? undefined : pick(copy.totals)));

/*
 * MANUAL EDIT: the "Tax Year Ended" heading of a column used: a calendar-year
 * partner's year ends 12/31, and the year prints after the "20"
 * (irs-8978-inst-2025::sec::inconsistent-positions::b02: column (a) "labelled 12/31/2023").
 */
const DECEMBER = "12";
const LAST_DAY = "31";
const CENTURY = 2000;
const headerLine = (index: number, pick: (taxYear: number) => string): Binding =>
  copyLine((copy) => {
    const column = copy.columns[index];
    return column === undefined ? undefined : pick(column.taxYear);
  });

/* Each column line: the field stem and the line it prints. */
const COLUMN_LINES: ReadonlyArray<[stem: string, pick: (lines: FiguredColumn) => number]> = [
  ["0.line.1a_total_income_original", (lines) => lines.line1a],
  ["0.line.1b_adjustments_to_income", (lines) => lines.line1b],
  ["0.line.2_corrected_income", (lines) => lines.line2],
  ["0.line.3a_total_deductions_original", (lines) => lines.line3a],
  ["0.line.3b_adjustments_to_deductions", (lines) => lines.line3b],
  ["0.line.4_corrected_deductions", (lines) => lines.line4],
  ["0.line.5_corrected_taxable_income", (lines) => lines.line5],
  ["0.line.6_income_tax", (lines) => lines.line6],
  ["0.line.7_alternative_minimum_tax", (lines) => lines.line7],
  ["0.line.8_total_corrected_income_tax", (lines) => lines.line8],
  ["0.line.9a_total_credits_original", (lines) => lines.line9a],
  ["0.line.9b_adjustments_to_credits", (lines) => lines.line9b],
  ["0.line.10_corrected_credits", (lines) => lines.line10],
  ["0.line.11_total_corrected_tax_liability", (lines) => lines.line11],
  ["0.line.12_total_income_tax_original", (lines) => lines.line12],
  ["0.line.13_increase_decrease_to_tax", (lines) => lines.line13],
  ["0.line.15_penalties", (lines) => lines.line15],
  ["0.line.17_interest", (lines) => lines.line17],
];

const HEADER_PARTS: ReadonlyArray<[stem: string, pick: (taxYear: number) => string]> = [
  ["0.header.tax_year_ended_month", () => DECEMBER],
  ["0.header.tax_year_ended_day", () => LAST_DAY],
  ["0.header.tax_year_ended_year", (taxYear) => String(taxYear - CENTURY).padStart(2, "0")],
];

// MANUAL EDIT: every column of Part I, II and III (lines.ts names each line's block id).
const COLUMN_BINDINGS = Object.fromEntries(
  COLUMNS.flatMap((letter, index) => [
    ...COLUMN_LINES.map(([stem, pick]) => [`${stem}_col_${letter}`, columnLine(index, pick)]),
    ...HEADER_PARTS.map(([stem, pick]) => [`${stem}_col_${letter}`, headerLine(index, pick)]),
  ]),
) as Bindings;

export function register(): void {
  defineForm<Form8978, Form8978FilingInfo>("form-8978", {
    bindings: {
      "0.header.partner_name": (_, info) => namesOnReturn(info),
      "0.header.partner_tax_id_number": (_, info) => info.taxpayerSSN,
      /*
       * MANUAL EDIT: one form for each source; the box says which
       * (irs-8978-inst-2025::sec::what-s-new::b01).
       */
      "0.header.source_bba_audit": copyLine((copy) =>
        copy.source === "bba_audit" ? true : undefined,
      ) as Bindings["0.header.source_bba_audit"],
      "0.header.source_aar_filing": copyLine((copy) =>
        copy.source === "aar" ? true : undefined,
      ) as Bindings["0.header.source_aar_filing"],
      ...COLUMN_BINDINGS,
      /*
       * MANUAL EDIT: line 14 (::line-14-total-additional-reporting-year-tax-enter-the::b01),
       * line 16 (::line-15::b01, "Penalties for each applicable tax year") and
       * line 18 (::line-17::b01): the sums of lines 13, 15 and 17.
       */
      "0.line.14_total_increase_decrease_reporting_year_tax": totalLine(
        (totals) => totals.line14,
      ) as Bindings["0.line.14_total_increase_decrease_reporting_year_tax"],
      "0.line.16_total_penalties": totalLine(
        (totals) => totals.line16,
      ) as Bindings["0.line.16_total_penalties"],
      "0.line.18_total_interest": totalLine(
        (totals) => totals.line18,
      ) as Bindings["0.line.18_total_interest"],
    },

    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.partner_tax_id_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
