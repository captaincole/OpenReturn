/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

/*
 * MANUAL EDIT: every line comes from one outcome (outcome.ts → form.ts). Part I
 * prints whenever the form files; Part III when box B, C or D is checked;
 * Schedule AI when box C is checked. A gap makes the lines it reaches unsupported.
 */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form2210Boxes, PenaltyMethod } from "./form.js";
import { form2210Outcome, type Form2210Info } from "./outcome.js";
import type { PartILines } from "./partI.js";
import type { ScheduleAIColumn } from "./scheduleAI.js";
import type { SelfEmploymentLines } from "./scheduleAIPartII.js";
import type { SectionAColumn } from "./sectionA.js";
import type { Form2210 } from "./types.js";

type Value = number | boolean;
type Binding = (form: unknown, info: Form2210Info) => Value | Unsupported | undefined;
type Figured = PenaltyMethod & { line19: number };

const COLUMNS = ["a", "b", "c", "d"] as const;

/* Part I: printed when the form files; a gap before Part I makes it unsupported. */
function partI(pick: (lines: PartILines) => Value | undefined): Binding {
  return (form, info) => {
    const outcome = form2210Outcome(form as never, info);
    if (outcome.kind === "figured") return pick(outcome.result.partI);
    if (outcome.kind === "gap")
      return outcome.partI ? pick(outcome.partI) : unsupported(outcome.reason);
    return undefined;
  };
}

/*
 * Part II: a checked box is true and an unchecked box false (it prints blank).
 * A box stays blank only while the form waits, so the engine keeps the form on
 * the return with its missing inputs (filesOnlyWithAmountOn).
 */
function box(pick: (boxes: Form2210Boxes) => boolean): Binding {
  return (form, info) => {
    const outcome = form2210Outcome(form as never, info);
    if (outcome.kind === "gap") return unsupported(outcome.reason);
    return outcome.kind === "figured" ? pick(outcome.result.boxes) : undefined;
  };
}

/* Part III and Schedule AI: blank unless the form figures the penalty. */
function figured(pick: (figured: Figured) => Value | undefined): Binding {
  return (form, info) => {
    const outcome = form2210Outcome(form as never, info);
    if (outcome.kind === "gap") return unsupported(outcome.reason);
    if (outcome.kind !== "figured" || !outcome.result.figured) return undefined;
    return pick(outcome.result.figured);
  };
}

const sectionA = (index: number, pick: (column: SectionAColumn) => number | undefined) =>
  figured((result) => pick(result.sectionA.columns[index]));

const scheduleAI = (index: number, pick: (column: ScheduleAIColumn) => number | undefined) =>
  figured((result) => {
    const column = result.scheduleAI?.[index];
    return column ? pick(column) : undefined;
  });

const partII = (index: number, pick: (lines: SelfEmploymentLines) => number) =>
  scheduleAI(index, (column) => (column.partII ? pick(column.partII) : undefined));

/* One binding per column: `${stem}_col_${letter}` for the columns the form prints. */
function byColumn(
  stem: string,
  letters: readonly string[],
  make: (index: number) => Binding,
): Record<string, Binding> {
  return Object.fromEntries(
    letters.map((letter) => [`${stem}_col_${letter}`, make(COLUMNS.indexOf(letter as "a"))]),
  );
}

const ALL = COLUMNS;
const LATER = ["b", "c", "d"];

// MANUAL EDIT: Part III Section A, lines 10–18 (irs-2210-inst-2025::sec::section-a-figure-your-underpayment::b01, line-11::b01).
const SECTION_A: Record<string, Binding> = {
  ...byColumn("1.line.10_required_installments", ALL, (index) =>
    sectionA(index, (col) => col.line10),
  ),
  ...byColumn("1.line.11_estimated_tax_paid_withheld", ALL, (index) =>
    sectionA(index, (col) => col.line11),
  ),
  ...byColumn("1.line.12_overpayment_from_previous_column", LATER, (index) =>
    sectionA(index, (col) => col.line12),
  ),
  ...byColumn("1.line.13_add_lines_11_12", LATER, (index) => sectionA(index, (col) => col.line13)),
  ...byColumn("1.line.14_previous_column_lines_16_17", LATER, (index) =>
    sectionA(index, (col) => col.line14),
  ),
  ...byColumn("1.line.15_subtract_line_14_from_13", ALL, (index) =>
    sectionA(index, (col) => col.line15),
  ),
  ...byColumn("1.line.16_subtract_line_13_from_14", ["b", "c"], (index) =>
    sectionA(index, (col) => col.line16),
  ),
  ...byColumn("1.line.17_underpayment", ALL, (index) => sectionA(index, (col) => col.line17)),
  ...byColumn("1.line.18_overpayment", ["a", "b", "c"], (index) =>
    sectionA(index, (col) => col.line18),
  ),
  // MANUAL EDIT: line 19, the worksheet's line 14 less a box B waiver (waiver-of-penalty::b01).
  "1.line.19_penalty": figured((result) => result.line19),
};

/* Schedule AI Part I lines (stem, pick) for every column; lines 22 and 25 skip column (a). */
const AI_LINES: Array<[string, (column: ScheduleAIColumn) => number | undefined]> = [
  ["2.line.1_adjusted_gross_income", (col) => col.line1],
  ["2.line.3_annualized_income", (col) => col.line3],
  ["2.line.4_itemized_deductions_for_period", (col) => col.line4],
  ["2.line.6_annualized_itemized_deductions", (col) => col.line6],
  ["2.line.7_standard_deduction", (col) => col.line7],
  ["2.line.8_larger_of_line_6_or_7", (col) => col.line8],
  ["2.line.9_qualified_business_income_deduction", (col) => col.line9],
  ["2.line.10_total_deductions", (col) => col.line10],
  ["2.line.11_income_less_deductions", (col) => col.line11],
  ["2.line.12_exemption_amount", (col) => col.line12],
  ["2.line.13_annualized_taxable_income", (col) => col.line13],
  ["2.line.14_tax_on_line_13", (col) => col.line14],
  ["2.line.15_self_employment_tax", (col) => col.line15],
  ["2.line.16_other_taxes", (col) => col.line16],
  ["2.line.17_total_tax", (col) => col.line17],
  ["2.line.18_credits", (col) => col.line18],
  ["2.line.19_tax_after_credits", (col) => col.line19],
  ["2.line.21_tax_times_applicable_percentage", (col) => col.line21],
  ["2.line.23_annualized_installment_before_limit", (col) => col.line23],
  ["2.line.24_regular_installment_25_percent", (col) => col.line24],
  ["2.line.26_regular_installment_plus_carryover", (col) => col.line26],
  ["2.line.27_annualized_income_installment", (col) => col.line27],
];

const AI_PART_II: Array<[string, (lines: SelfEmploymentLines) => number]> = [
  ["2.line.28_net_self_employment_earnings", (lines) => lines.line28],
  ["2.line.30_social_security_wages_for_period", (lines) => lines.line30],
  ["2.line.31_remaining_social_security_limit", (lines) => lines.line31],
  ["2.line.33_annualized_social_security_part", (lines) => lines.line33],
  ["2.line.35_annualized_medicare_part", (lines) => lines.line35],
  ["2.line.36_annualized_self_employment_tax", (lines) => lines.line36],
];

// MANUAL EDIT: Schedule AI (schedule-ai-annualized-income::b01–b03, line-1-2::b01 to line-30::b01).
const SCHEDULE_AI: Record<string, Binding> = Object.assign(
  {},
  ...AI_LINES.map(([stem, pick]) => byColumn(stem, ALL, (index) => scheduleAI(index, pick))),
  byColumn("2.line.22_previous_columns_line_27_total", LATER, (index) =>
    scheduleAI(index, (col) => col.line22),
  ),
  byColumn("2.line.25_previous_column_installment_carryover", LATER, (index) =>
    scheduleAI(index, (col) => col.line25),
  ),
  ...AI_PART_II.map(([stem, pick]) => byColumn(stem, ALL, (index) => partII(index, pick))),
);

// MANUAL EDIT: Part I lines 1–9 (line-1::b01 to line-19::b03) and the Part II boxes.
const PAGE_1: Record<string, Binding> = {
  "0.line.1_tax_after_credits": partI((lines) => lines.line1),
  "0.line.2_other_taxes": partI((lines) => lines.line2),
  "0.line.3_other_payments_refundable_credits": partI((lines) => lines.line3),
  "0.line.4_current_year_tax": partI((lines) => lines.line4),
  "0.line.5_ninety_percent_current_tax": partI((lines) => lines.line5),
  "0.line.6_withholding_taxes": partI((lines) => lines.line6),
  "0.line.7_tax_less_withholding": partI((lines) => lines.line7),
  "0.line.8_prior_year_tax_payment": partI((lines) => lines.line8),
  "0.line.9_required_annual_payment": partI((lines) => lines.line9),
  "0.line.9_more_than_line_6_no": partI((lines) =>
    lines.line9MoreThanLine6 === false ? true : undefined,
  ),
  "0.line.9_more_than_line_6_yes": partI((lines) => (lines.line9MoreThanLine6 ? true : undefined)),
  "0.line.box_a_waiver_entire_penalty": box((boxes) => boxes.a),
  "0.line.box_b_waiver_part_penalty": box((boxes) => boxes.b),
  "0.line.box_c_annualized_income_method": box((boxes) => boxes.c),
  "0.line.box_d_withholding_actual_dates": box((boxes) => boxes.d),
  "0.line.box_e_joint_return_one_year": box((boxes) => boxes.e),
};

/* The form files only with a Part II box checked ("If none apply, don't file Form 2210"). */
export const FORM_2210_BOXES = [
  "form-2210.0.line.box_a_waiver_entire_penalty",
  "form-2210.0.line.box_b_waiver_part_penalty",
  "form-2210.0.line.box_c_annualized_income_method",
  "form-2210.0.line.box_d_withholding_actual_dates",
  "form-2210.0.line.box_e_joint_return_one_year",
];

type Bindings = Partial<{ [K in keyof Form2210]: BindingFn<Form2210, Form2210Info, K> }>;

export function register(): void {
  defineForm<Form2210, Form2210Info>("form-2210", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      ...(PAGE_1 as Bindings),
      ...(SECTION_A as Bindings),
      ...(SCHEDULE_AI as Bindings),
    },
    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
    filesOnlyWithAmountOn: FORM_2210_BOXES,
  });
}
