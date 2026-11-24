/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import { printedDate } from "./dates.js";
import type { Form4797FilingInfo, Form4797Overflow } from "./filingInfo.js";
import type { Form4797Lines, PartIVColumn } from "./lines.js";
import type { PartIIIColumn, SaleRow } from "./properties.js";
import type { Form4797 } from "./types.js";

type Value = number | string | undefined;
type Fn = BindingFn<Form4797, Form4797FilingInfo, keyof Form4797>;
type Bindings = Partial<{ [K in keyof Form4797]: BindingFn<Form4797, Form4797FilingInfo, K> }>;

/*
 * MANUAL EDIT: lines 3, 14 and 18a (Form 4684 Section B), 4 and 15 (Form 6252),
 * and 5 and 16 (Form 8824) are in `unsupported` below.
 */
const OVERFLOW =
  "More than four properties in this part: the paper form has four rows (part-iii::b01, use additional forms), and the engine prints one Form 4797 and no attached statement.";

type LineFn<T> = (form: unknown, info: Form4797FilingInfo) => T | Unsupported | undefined;

/* A line of the figured form: unsupported with a gap, blank with no figured form. */
function lineOf<T extends Value>(pick: (lines: Form4797Lines) => T | undefined): LineFn<T> {
  return (_, info) => {
    if (info.form4797Gap) return unsupported(info.form4797Gap);
    return info.form4797 === undefined ? undefined : pick(info.form4797);
  };
}

/* A line of lines 7–18b, which also waits on the summary gap (a K-1 section 1231 item, Form 6252 or 8824). */
function summaryLineOf(pick: (lines: Form4797Lines) => number | undefined): LineFn<number> {
  return (form, info) => {
    if (info.form4797SummaryGap && !info.form4797Gap) return unsupported(info.form4797SummaryGap);
    return lineOf(pick)(form, info);
  };
}

function overflowLineOf(part: keyof Form4797Overflow, pick: (lines: Form4797Lines) => Value): Fn {
  return (form, info) =>
    info.form4797Overflow?.[part] && !info.form4797Gap
      ? unsupported(OVERFLOW)
      : lineOf(pick)(form, info);
}

/* MANUAL EDIT: columns (a)–(g) of the line 2 and line 10 rows (properties.ts saleRow). */
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
    { line: "2", part: "partI" as const, rows: (lines: Form4797Lines) => lines.partIRows },
    { line: "10", part: "partII" as const, rows: (lines: Form4797Lines) => lines.partIIRows },
  ];
  for (const { line, part, rows } of parts) {
    for (let index = 0; index < 4; index += 1) {
      for (const [column, pick] of ROW_COLUMNS) {
        out[`0.line.${line}_row${index + 1}_col_${column}`] = overflowLineOf(part, (lines) => {
          const row = rows(lines)[index];
          return row === undefined ? undefined : pick(row);
        });
      }
    }
  }
  return out as Bindings;
}

/* MANUAL EDIT: Part III property columns A–D, lines 19–29b (properties.ts partIIIColumn). */
const LETTERS = ["a", "b", "c", "d"] as const;
const PART_III_LINES: Array<[string, (column: PartIIIColumn) => Value]> = [
  ["20_gross_sales_price", (column) => column.line20],
  ["21_cost_basis_plus_expense", (column) => column.line21],
  ["22_depreciation_allowed", (column) => column.line22],
  ["23_adjusted_basis", (column) => column.line23],
  ["24_total_gain", (column) => column.line24],
  ["25a_sec_1245_depreciation", (column) => column.line25a],
  ["25b_sec_1245_smaller_amount", (column) => column.line25b],
  ["26a_sec_1250_additional_depreciation_after_1975", (column) => column.line26a],
  ["26b_sec_1250_applicable_percentage_amount", (column) => column.line26b],
  ["26c_sec_1250_gain_less_26a", (column) => column.line26c],
  ["26d_sec_1250_additional_depreciation_1970_1975", (column) => column.line26d],
  ["26e_sec_1250_smaller_amount", (column) => column.line26e],
  // Line 26f is for corporations only (irs-4797-inst-2025::sec::line-26f::b01): blank on an individual return.
  ["26f_sec_291_amount", () => undefined],
  ["26g_sec_1250_total", (column) => column.line26g],
  ["27a_sec_1252_land_clearing_expenses", (column) => column.line27a],
  ["27b_sec_1252_applicable_percentage_amount", (column) => column.line27b],
  ["27c_sec_1252_smaller_amount", (column) => column.line27c],
  ["28a_sec_1254_drilling_mining_costs", (column) => column.line28a],
  ["28b_sec_1254_smaller_amount", (column) => column.line28b],
  ["29a_sec_1255_excluded_payments_percentage", (column) => column.line29a],
  ["29b_sec_1255_smaller_amount", (column) => column.line29b],
];

const partIIIColumnOf =
  (index: number, pick: (column: PartIIIColumn) => Value) =>
  (lines: Form4797Lines): Value => {
    const column = lines.partIIIColumns[index];
    return column === undefined ? undefined : pick(column);
  };

function partIIIBindings(): Bindings {
  const out: Record<string, Fn> = {};
  LETTERS.forEach((letter, index) => {
    const line19 = `1.line.19${letter}_property_col_`;
    out[`${line19}a`] = overflowLineOf(
      "partIII",
      partIIIColumnOf(index, (column) => column.description),
    );
    out[`${line19}b`] = overflowLineOf(
      "partIII",
      partIIIColumnOf(index, (column) => printedDate(column.dateAcquired)),
    );
    out[`${line19}c`] = overflowLineOf(
      "partIII",
      partIIIColumnOf(index, (column) => printedDate(column.dateSold)),
    );
    for (const [line, pick] of PART_III_LINES) {
      out[`1.line.${line}_col_${letter}`] = overflowLineOf("partIII", partIIIColumnOf(index, pick));
    }
  });
  return out as Bindings;
}

/* MANUAL EDIT: Part IV (lines 33–35); line 35 is a gap when it cannot reach its schedule. */
function partIVLine(
  column: "section179" | "section280f",
  pick: (lines: PartIVColumn) => number,
  isLine35 = false,
): LineFn<number> {
  return (form, info) => {
    const gap = info.form4797PartIVGap?.[column];
    if (isLine35 && gap && !info.form4797Gap) return unsupported(gap);
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
    out[`1.line.33_sec_179_or_depreciation_prior_years_col_${letter}`] = partIVLine(
      column,
      (each) => each.line33,
    );
    out[`1.line.34_recomputed_depreciation_col_${letter}`] = partIVLine(
      column,
      (each) => each.line34,
    );
    out[`1.line.35_recapture_amount_col_${letter}`] = partIVLine(
      column,
      (each) => each.line35,
      true,
    );
  }
  return out as Bindings;
}

export function register(): void {
  defineForm<Form4797, Form4797FilingInfo>("form-4797", {
    bindings: {
      ...rowBindings(),
      ...partIIIBindings(),
      ...partIVBindings(),
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: lines 1a–1c (line-1a::b01, line-1b::b01, line-1c::b01); 1c as a positive amount.
      "0.line.1a_gross_proceeds_1099b_1099s": lineOf((lines) => lines.line1a),
      "0.line.1b_gain_macrs_partial_dispositions": lineOf((lines) => lines.line1b),
      "0.line.1c_loss_macrs_partial_dispositions": lineOf((lines) => lines.line1c),
      // MANUAL EDIT: line 6 is line 32 when a gain; lines 7–12 net the section 1231 gains (lines.ts).
      "0.line.6_gain_from_line_32": lineOf((lines) => lines.line6),
      "0.line.7_net_section_1231_gain_loss": summaryLineOf((lines) => lines.line7),
      "0.line.8_nonrecaptured_section_1231_losses": summaryLineOf((lines) => lines.line8),
      "0.line.9_line_7_minus_line_8": summaryLineOf((lines) => lines.line9),
      // MANUAL EDIT: line 11 prints its loss as a positive amount: the form prints the parentheses.
      "0.line.11_loss_from_line_7": summaryLineOf((lines) => lines.line11),
      "0.line.12_gain_from_line_7_or_8": summaryLineOf((lines) => lines.line12),
      "0.line.13_gain_from_line_31": lineOf((lines) => lines.line13),
      "0.line.17_ordinary_gain_loss_total": summaryLineOf((lines) => lines.line17),
      "0.line.18b_redetermined_ordinary_gain_loss": summaryLineOf((lines) => lines.line18b),
      // MANUAL EDIT: the Summary of Part III Gains (lines 30–32).
      "1.line.30_total_gains_all_properties": lineOf((lines) => lines.line30),
      "1.line.31_total_recapture_amounts": lineOf((lines) => lines.line31),
      "1.line.32_gain_less_recapture": lineOf((lines) => lines.line32),
    },

    unsupported: {
      "0.line.3_gain_form_4684":
        "Form 4684 Section B (business and income-producing property) is not modeled: the casualty fact covers personal-use property only, so no line 39 gain reaches Form 4797.",
      "0.line.14_net_gain_loss_form_4684":
        "Form 4684 Section B (business and income-producing property) is not modeled: no lines 31 and 38a amount reaches Form 4797.",
      "0.line.18a_loss_form_4684_income_producing":
        "Line 18a needs a loss on Form 4684 line 35 column (b)(ii) (irs-4797-inst-2025::sec::line-18a::b01); Form 4684 Section B is not modeled.",
      "0.line.4_section_1231_gain_installment_sales":
        "Form 6252 (installment sales) has no rules: no line 26 or 37 section 1231 gain reaches Form 4797.",
      "0.line.15_ordinary_gain_installment_sales":
        "Form 6252 (installment sales) has no rules: no line 25 or 36 ordinary gain reaches Form 4797.",
      "0.line.5_section_1231_like_kind_exchanges":
        "Form 8824 (like-kind exchanges) has no rules: no section 1231 gain or loss reaches Form 4797.",
      "0.line.16_ordinary_like_kind_exchanges":
        "Form 8824 (like-kind exchanges) has no rules: no ordinary gain or loss reaches Form 4797.",
    },

    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
