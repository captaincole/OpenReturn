/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type FormSpec } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form4970Copy, Form4970FilingInfo, Form4970Lines } from "./filingInfo.js";
import type { Column, PartI, PartIITotals } from "./lines.js";
import type { Form4970 } from "./types.js";

type Bindings = FormSpec<Form4970, Form4970FilingInfo>["bindings"];
type Value = number | string | boolean;
type Result<T extends Value = Value> = T | Unsupported | undefined;
type Binding<T extends Value = Value> = (form: unknown, info: Form4970FilingInfo) => Result<T>;
type Figured = Extract<Form4970Copy["result"], { kind: "figured" }>;

const COLUMN_LETTERS = ["a", "b", "c"] as const;

/* The printed copy, or why its fields are unsupported; undefined while none prints. */
function copyOf(info: Form4970FilingInfo): Form4970Copy | Unsupported | undefined {
  if (info.form4970Gap !== undefined) return unsupported(info.form4970Gap);
  return info.form4970;
}

const isUnsupported = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && "unsupported" in value;

/* A header field from the trust's answers, whatever the state of its lines. */
const answerOf =
  <T extends Value>(
    pick: (copy: Form4970Copy, info: Form4970FilingInfo) => Result<T>,
  ): Binding<T> =>
  (_, info) => {
    const copy = copyOf(info);
    return copy === undefined || isUnsupported(copy) ? copy : pick(copy, info);
  };

/* A line of the printed form: unsupported with a gap, blank while it waits. */
const lineOf =
  <T extends Value>(pick: (lines: Form4970Lines, figured: Figured) => Result<T>): Binding<T> =>
  (_, info) => {
    const copy = copyOf(info);
    if (copy === undefined || isUnsupported(copy)) return copy;
    const { result } = copy;
    if (result.kind === "gap") return unsupported(result.reason);
    return result.kind === "waits" ? undefined : pick(result.lines, result);
  };

const partILine = (pick: (lines: PartI) => number | undefined): Binding<number> =>
  lineOf((lines) => pick(lines.partI));

/* Lines 13 to 16 and the stated lines 18, 20 and 22: no gap of line 17 reaches them. */
const statedColumnLine = (index: number, pick: (entry: Column) => Result): Binding =>
  lineOf((lines) => {
    const entry = lines.columns?.[index];
    return entry === undefined ? undefined : pick(entry);
  });

/* Lines 17, 19, 21 and 23 of a column: unsupported when line 17 cannot be figured. */
const figuredColumnLine = (index: number, pick: (entry: Column) => Result): Binding =>
  lineOf((lines, figured) => {
    const entry = lines.columns?.[index];
    if (entry === undefined) return undefined;
    const value = pick(entry);
    return value === undefined && figured.partIIGap ? unsupported(figured.partIIGap) : value;
  });

const totalLine = (pick: (totals: PartIITotals) => number | undefined): Binding<number> =>
  lineOf((lines, figured) => {
    if (lines.columns === undefined) return undefined;
    if (lines.totals === undefined)
      return figured.partIIGap ? unsupported(figured.partIIGap) : undefined;
    const value = pick(lines.totals);
    return value === undefined && figured.line28Gap ? unsupported(figured.line28Gap) : value;
  });

/* Line 13, columns (a) 2024 to (e) 2020 (irs-4970-form-2025::sec::line-13::b01). */
function line13Bindings(): Bindings {
  const letters = ["a", "b", "c", "d", "e"];
  return Object.fromEntries(
    letters.map((letter, index) => [
      `0.line.13_taxable_income_before_distribution_col_${letter}`,
      lineOf((lines) => lines.line13?.[index]),
    ]),
  ) as Bindings;
}

/* Lines 14 to 23, one entry per column (irs-4970-form-2025::sec::face-part-ii::b01). */
function columnBindings(): Bindings {
  const entries = COLUMN_LETTERS.flatMap((letter, index) => {
    const stated = (pick: (entry: Column) => Result) => statedColumnLine(index, pick);
    const figured = (pick: (entry: Column) => Result) => figuredColumnLine(index, pick);
    return [
      [`0.line.computation_year_col_${letter}`, stated((entry) => String(entry.year))],
      [`0.line.14_line_13_amounts_col_${letter}`, stated((entry) => entry.line14)],
      [`0.line.15_amount_from_line_12_col_${letter}`, stated((entry) => entry.line15)],
      [`0.line.16_recomputed_taxable_income_col_${letter}`, stated((entry) => entry.line16)],
      [`0.line.17_income_tax_on_line_16_col_${letter}`, figured((entry) => entry.line17)],
      [`0.line.18_income_tax_before_credits_col_${letter}`, stated((entry) => entry.line18)],
      [`0.line.19_additional_tax_before_credits_col_${letter}`, figured((entry) => entry.line19)],
      [`0.line.20_tax_credit_adjustment_col_${letter}`, stated((entry) => entry.line20)],
      [`0.line.21_subtract_line_20_from_19_col_${letter}`, figured((entry) => entry.line21)],
      [`0.line.22_amt_adjustments_col_${letter}`, stated((entry) => entry.line22)],
      [`0.line.23_combine_lines_21_and_22_col_${letter}`, figured((entry) => entry.line23)],
    ];
  });
  return Object.fromEntries(entries) as Bindings;
}

/* MANUAL EDIT: the header (irs-4970-form-2025::sec::face-header::b01). */
function headerBindings(): Bindings {
  return {
    "0.header.a_taxpayer_name": (_, info) => namesOnReturn(info),
    // The beneficiary's number, the spouse's when the spouse is the beneficiary (QUESTIONS.md question 5).
    "0.header.b_ssn": answerOf((copy, info) =>
      copy.answers.beneficiary === "spouse" ? info.spouseSSN : info.taxpayerSSN,
    ),
    "0.header.c_trust_name_address": answerOf(
      (copy) => `${copy.answers.trustName}\n${copy.answers.trustAddress}`,
    ),
    "0.header.d_trust_ein": answerOf((copy) => copy.answers.trustEin),
    // Item E: a foreign trust's form is only a Form 3520 worksheet (specific-instructions::b01), so a filed copy is domestic.
    "0.header.e_trust_type_domestic": answerOf(() => true),
    "0.header.e_trust_type_foreign": answerOf<boolean>(() => undefined),
    "0.header.f_beneficiary_date_of_birth": answerOf((copy, info) =>
      copy.answers.beneficiary === "spouse" ? info.spouseDateOfBirth : info.taxpayerDateOfBirth,
    ),
    // Item G: the number of trusts with an accumulation distribution this year, each with its own form.
    "0.header.g_number_of_trusts": (_, info) =>
      info.form4970TrustCount ? info.form4970TrustCount : undefined,
  };
}

/*
 * MANUAL EDIT: Part I (irs-4970-form-2025::sec::face-part-i::b01; line-2::b01,
 * line-4::b01, line-8::b01, line-11::b01). Lines 2, 20 and 22 are blank with
 * nothing to enter; lines 9 to 12 are blank with no year on line 8.
 */
function partIBindings(): Bindings {
  return {
    "0.line.1_current_distribution_earlier_years": partILine((lines) => lines.line1),
    "0.line.2_income_accumulated_before_21": partILine((lines) => lines.line2 || undefined),
    "0.line.3_subtract_line_2_from_1": partILine((lines) => lines.line3),
    "0.line.4_taxes_imposed_on_trust": partILine((lines) => lines.line4),
    "0.line.5_total_lines_3_and_4": partILine((lines) => lines.line5),
    "0.line.6_tax_exempt_interest": partILine((lines) => lines.line6),
    "0.line.7_taxable_part_of_line_5": partILine((lines) => lines.line7),
    "0.line.8_number_of_trust_earlier_years": partILine((lines) => lines.line8),
    "0.line.9_average_annual_amount": partILine((lines) => lines.line9),
    "0.line.10_line_9_times_25_percent": partILine((lines) => lines.line10),
    "0.line.11_number_of_years_taken_into_account": partILine((lines) => lines.line11),
    "0.line.12_average_amount_for_recomputing": partILine((lines) => lines.line12),
  };
}

/* MANUAL EDIT: lines 24 to 28 (face-part-ii::b01; line-28::b01). */
function totalBindings(): Bindings {
  return {
    "0.line.24_add_line_23_columns": totalLine((totals) => totals.line24),
    "0.line.25_line_24_divided_by_3": totalLine((totals) => totals.line25),
    "0.line.26_line_25_times_years": totalLine((totals) => totals.line26),
    "0.line.27_amount_from_line_4": totalLine((totals) => totals.line27),
    // With no year on line 8 the partial tax is 0 (QUESTIONS.md question 2).
    "0.line.28_partial_tax_on_accumulation_distribution": (form, info) => {
      const noYears = lineOf((lines) => (lines.columns === undefined ? lines.tax : undefined));
      return noYears(form, info) ?? totalLine((totals) => totals.line28)(form, info);
    },
  };
}

export function register(): void {
  defineForm<Form4970, Form4970FilingInfo>("form-4970", {
    bindings: {
      ...headerBindings(),
      ...partIBindings(),
      ...line13Bindings(),
      ...columnBindings(),
      ...totalBindings(),
    },
    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.b_ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
