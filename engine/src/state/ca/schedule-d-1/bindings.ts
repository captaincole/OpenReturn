/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../../defineForm.js";
import { printedDate } from "../../../federal/4797/dates.js";
import type { PartIVColumn } from "../../../federal/4797/lines.js";
import type { PartIIIColumn, SaleRow } from "../../../federal/4797/properties.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { SSN } from "../../../values.js";
import { COLUMNS_PER_COPY, ROWS_PER_COPY, entryOnCopy } from "./copies.js";
import type { ScheduleD1FilingInfo } from "./filingInfo.js";
import type { ScheduleD1Lines } from "./lines.js";
import type { ScheduleD1 } from "./types.js";

type Value = number | string | undefined;
type Fn = BindingFn<ScheduleD1, ScheduleD1FilingInfo, keyof ScheduleD1>;
type Bindings = Partial<{
  [K in keyof ScheduleD1]: BindingFn<ScheduleD1, ScheduleD1FilingInfo, K>;
}>;
type LineFn<T> = (form: unknown, info: ScheduleD1FilingInfo) => T | Unsupported | undefined;

/*
 * MANUAL EDIT: lines 3, 14 and 18a (federal Form 4684 Section B), 4 and 15 (FTB
 * 3805E) and 5 and 16 (federal Form 8824) are in `unsupported` below. Line 29f is
 * "for corporations only": blank on an individual return.
 */

const copyIndexOf = (info: ScheduleD1FilingInfo): number => info.scheduleD1CopyIndex ?? 0;

/* A line of a copy's rows or columns: unsupported with a gap, blank with no figured schedule. */
function copyLineOf<T extends Value>(
  pick: (lines: ScheduleD1Lines, copyIndex: number) => T | undefined,
): LineFn<T> {
  return (_, info) => {
    if (info.scheduleD1Gap) return unsupported(info.scheduleD1Gap);
    return info.scheduleD1 === undefined ? undefined : pick(info.scheduleD1, copyIndexOf(info));
  };
}

/* A total of the whole schedule: on the first copy only (copies.ts). */
function lineOf<T extends Value>(pick: (lines: ScheduleD1Lines) => T | undefined): LineFn<T> {
  return copyLineOf((lines, copyIndex) => (copyIndex === 0 ? pick(lines) : undefined));
}

/* A line of lines 7–21, which also waits on the summary gap. */
function summaryLineOf(pick: (lines: ScheduleD1Lines) => number | undefined): LineFn<number> {
  return (form, info) => {
    if (info.scheduleD1SummaryGap && !info.scheduleD1Gap && copyIndexOf(info) === 0) {
      return unsupported(info.scheduleD1SummaryGap);
    }
    return lineOf(pick)(form, info);
  };
}

/* MANUAL EDIT: columns (a)–(g) of the line 2 and line 10 rows (federal properties.ts saleRow). */
const ROW_COLUMNS: Array<[string, (row: SaleRow) => Value]> = [
  ["a", (row) => row.description],
  ["b", (row) => printedDate(row.dateAcquired)],
  ["c", (row) => printedDate(row.dateSold)],
  ["d", (row) => row.grossSalesPrice],
  ["e", (row) => row.depreciation],
  ["f", (row) => row.costPlusExpense],
  ["g", (row) => row.gainOrLoss],
];

function rowBindings(): Bindings {
  const out: Record<string, Fn> = {};
  const parts = [
    { line: "2", rows: (lines: ScheduleD1Lines) => lines.partIRows },
    { line: "10", rows: (lines: ScheduleD1Lines) => lines.partIIRows },
  ];
  for (const { line, rows } of parts) {
    for (let slot = 0; slot < ROWS_PER_COPY; slot += 1) {
      for (const [column, pick] of ROW_COLUMNS) {
        out[`0.line.${line}_row${slot + 1}_col_${column}`] = copyLineOf((lines, copyIndex) => {
          const row = rows(lines)[entryOnCopy(copyIndex, slot, ROWS_PER_COPY)];
          return row === undefined ? undefined : pick(row);
        });
      }
    }
  }
  return out as Bindings;
}

/* MANUAL EDIT: Part III property columns A–D, lines 23–32b = federal Form 4797 lines 20–29b. */
const LETTERS = ["a", "b", "c", "d"] as const;
const PART_III_LINES: Array<[string, (column: PartIIIColumn) => Value]> = [
  ["23_gross_sales_price", (column) => column.line20],
  ["24_cost_basis_plus_expense", (column) => column.line21],
  ["25_depreciation_allowed", (column) => column.line22],
  ["26_adjusted_basis", (column) => column.line23],
  ["27_total_gain", (column) => column.line24],
  ["28a_sec_1245_depreciation", (column) => column.line25a],
  ["28b_sec_1245_smaller_amount", (column) => column.line25b],
  ["29a_additional_depreciation_after_1976", (column) => column.line26a],
  ["29b_sec_1250_applicable_percentage_amount", (column) => column.line26b],
  ["29c_gain_less_additional_depreciation", (column) => column.line26c],
  ["29d_additional_depreciation_1971_to_1976", (column) => column.line26d],
  ["29e_smaller_of_29c_29d", (column) => column.line26e],
  // Line 29f is "for corporations only" (the form; irc-section-1250-property::b01): blank here.
  ["29f_sec_291_amount", () => undefined],
  ["29g_sec_1250_recapture_total", (column) => column.line26g],
  ["30a_soil_water_land_expenses", (column) => column.line27a],
  ["30b_sec_1252_applicable_percentage_amount", (column) => column.line27b],
  ["30c_sec_1252_smaller_amount", (column) => column.line27c],
  ["31a_intangible_drilling_costs", (column) => column.line28a],
  ["31b_sec_1254_smaller_amount", (column) => column.line28b],
  ["32a_sec_126_excluded_payments", (column) => column.line29a],
  ["32b_sec_1255_smaller_amount", (column) => column.line29b],
];

/* Property column `slot` (A to D) of a copy. */
const partIIIColumnOf = (slot: number, pick: (column: PartIIIColumn) => Value): Fn =>
  copyLineOf((lines, copyIndex) => {
    const column = lines.partIIIColumns[entryOnCopy(copyIndex, slot, COLUMNS_PER_COPY)];
    return column === undefined ? undefined : pick(column);
  });

function partIIIBindings(): Bindings {
  const out: Record<string, Fn> = {};
  LETTERS.forEach((letter, slot) => {
    const line22 = `1.line.22${letter}_`;
    out[`${line22}property_description`] = partIIIColumnOf(slot, (column) => column.description);
    out[`${line22}date_acquired`] = partIIIColumnOf(slot, (column) =>
      printedDate(column.dateAcquired),
    );
    out[`${line22}date_sold`] = partIIIColumnOf(slot, (column) => printedDate(column.dateSold));
    for (const [line, pick] of PART_III_LINES) {
      out[`1.line.${line}_col_${letter}`] = partIIIColumnOf(slot, pick);
    }
  });
  return out as Bindings;
}

/* MANUAL EDIT: Part IV (lines 36–38 = federal lines 33–35); line 38 is a gap when it cannot reach Schedule CA. */
function partIVLine(
  column: "section179" | "section280f",
  pick: (lines: PartIVColumn) => number,
  isLine38 = false,
): LineFn<number> {
  return (form, info) => {
    const gap = info.scheduleD1PartIVGap?.[column];
    if (isLine38 && gap && !info.scheduleD1Gap && copyIndexOf(info) === 0) return unsupported(gap);
    return lineOf((lines) => {
      const figured = lines.partIV[column];
      return figured === undefined ? undefined : pick(figured);
    })(form, info);
  };
}

function partIVBindings(): Bindings {
  const out: Record<string, Fn> = {};
  const columns = [
    ["a", "section179"],
    ["b", "section280f"],
  ] as const;
  for (const [letter, column] of columns) {
    out[`1.line.36_expense_or_recovery_deductions_col_${letter}`] = partIVLine(
      column,
      (each) => each.line33,
    );
    out[`1.line.37_depreciation_or_recovery_deductions_col_${letter}`] = partIVLine(
      column,
      (each) => each.line34,
    );
    out[`1.line.38_recapture_amount_col_${letter}`] = partIVLine(
      column,
      (each) => each.line35,
      true,
    );
  }
  return out as Bindings;
}

/* MANUAL EDIT: Parts I and II, lines 1a–18b (the federal Form 4797 arithmetic, lines.ts). */
const PART_I_AND_II: Bindings = {
  // Lines 1a–1c (part-i::b01: "Enter the amount of gain or loss computed using California amounts").
  "0.line.1a_gross_proceeds_1099b_1099s": lineOf((lines) => lines.line1a),
  "0.line.1b_macrs_partial_disposition_gain": lineOf((lines) => lines.line1b),
  "0.line.1c_macrs_partial_disposition_loss": lineOf((lines) => lines.line1c),
  // Line 6 is line 35 when a gain; lines 7–12 net the section 1231 gains (part-i::b02, b03; part-ii::b01).
  "0.line.6_gain_from_line_35": lineOf((lines) => lines.line6),
  "0.line.7_net_section_1231_gain_loss": summaryLineOf((lines) => lines.line7),
  "0.line.8_nonrecaptured_section_1231_losses": summaryLineOf((lines) => lines.line8),
  "0.line.9_line_7_minus_line_8": summaryLineOf((lines) => lines.line9),
  // Line 11 prints its loss as a positive amount: the form prints the parentheses.
  "0.line.11_loss_from_line_7": summaryLineOf((lines) => lines.line11),
  "0.line.12_gain_from_line_7_or_8": summaryLineOf((lines) => lines.line12),
  "0.line.13_gain_from_line_34": lineOf((lines) => lines.line13),
  "0.line.17_total_ordinary_gain_loss": summaryLineOf((lines) => lines.line17),
  "0.line.18b_redetermined_gain_loss": summaryLineOf((lines) => lines.line18b),
  // MANUAL EDIT: Part II Section B, lines 19–21 (part-ii::b03).
  "1.line.19_federal_ordinary_gain_loss": summaryLineOf((lines) => lines.line19),
  "1.line.20_california_ordinary_gain_loss": summaryLineOf((lines) => lines.line20),
  "1.line.21a_federal_exceeds_california_difference": summaryLineOf((lines) => lines.line21a),
  "1.line.21b_california_exceeds_federal_difference": summaryLineOf((lines) => lines.line21b),
  // The Summary of Part III Gains, lines 33–35.
  "1.line.33_total_gains_all_properties": lineOf((lines) => lines.line30),
  "1.line.34_total_recapture_ordinary_income": lineOf((lines) => lines.line31),
  "1.line.35_gain_less_recapture": lineOf((lines) => lines.line32),
};

export function register(): void {
  defineForm<ScheduleD1, ScheduleD1FilingInfo>("schedule-d-1", {
    bindings: {
      ...rowBindings(),
      ...partIIIBindings(),
      ...partIVBindings(),
      ...PART_I_AND_II,
      "0.header.taxpayer_name": (_, info) =>
        info.scheduleD1 || info.scheduleD1Gap ? namesOnReturn(info) : undefined,
      "0.header.taxpayer_id_number": (_, info) =>
        info.scheduleD1 || info.scheduleD1Gap ? info.taxpayerSSN : undefined,
    },

    unsupported: {
      "0.line.3_gain_from_form_4684":
        "Federal Form 4684 Section B (business and income-producing property) is not modeled: no line 39 gain reaches Schedule D-1.",
      "0.line.14_net_gain_loss_form_4684":
        "Federal Form 4684 Section B (business and income-producing property) is not modeled: no lines 31 and 38a amount reaches Schedule D-1.",
      "0.line.18a_form_4684_loss_in_line_11":
        "Line 18a needs a loss from federal Form 4684 Section B, Part II, column (b)(ii); Form 4684 Section B is not modeled.",
      "0.line.4_section_1231_installment_gain":
        "FTB 3805E (installment sales) has no rules: no line 26 or 37 section 1231 gain reaches Schedule D-1.",
      "0.line.15_ordinary_gain_installment_sales":
        "FTB 3805E (installment sales) has no rules: no line 25 or 36 ordinary gain reaches Schedule D-1.",
      "0.line.5_section_1231_like_kind_gain_loss":
        "Federal Form 8824 (like-kind exchanges) has no rules: no section 1231 gain or loss reaches Schedule D-1.",
      "0.line.16_ordinary_like_kind_gain_loss":
        "Federal Form 8824 (like-kind exchanges) has no rules: no ordinary gain or loss reaches Schedule D-1.",
    },

    formatters: {
      "0.header.taxpayer_id_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
