/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn, type FormAccessor } from "../../defineForm.js";
import { sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8815FilingInfo, Line1Row } from "./filingInfo.js";
import {
  expenseLines,
  line9Worksheet,
  LINE_1_ROW_COUNT,
  phaseOutLines,
  ratioDigits,
  type ExpenseLines,
  type Line6Worksheet,
  type Line9Worksheet,
  type PhaseOutLines,
} from "./lines.js";
import type { Form8815 } from "./types.js";

type Form = FormAccessor<Form8815>;
type Fn = BindingFn<Form8815, Form8815FilingInfo, keyof Form8815>;
type Bindings = Partial<{ [K in keyof Form8815]: BindingFn<Form8815, Form8815FilingInfo, K> }>;

const OVERFLOW = unsupported(
  "Line 1 has three rows; more rows need an attached statement, which the engine does not print. Lines 2 and 3 still count every row.",
);

/* MANUAL EDIT: line 1 (irs-8815-form-2025::sec::specific-instructions::b01), one row per expense fact. */
function rowOf(info: Form8815FilingInfo, index: number): Line1Row | Unsupported | undefined {
  const rows = info.savingsBondExclusion?.rows ?? [];
  return rows.length > LINE_1_ROW_COUNT ? OVERFLOW : rows[index];
}

function line1Bindings(): Bindings {
  const out: Record<string, Fn> = {};
  for (let index = 0; index < LINE_1_ROW_COUNT; index++) {
    const row = `0.line.1_row${index + 1}`;
    const read =
      (pick: (row: Line1Row) => string): Fn =>
      (_, info) => {
        const found = rowOf(info, index);
        if (found === undefined || "unsupported" in found) return found;
        return pick(found);
      };
    out[`${row}_col_a`] = read((found) => found.studentName);
    out[`${row}_col_b_line1`] = read((found) => found.institutionName);
    out[`${row}_col_b_line2`] = read((found) => found.institutionAddress);
  }
  return out as Bindings;
}

/* Lines 4 through 8; undefined before the resolver ran. */
function linesOf(info: Form8815FilingInfo): ExpenseLines | undefined {
  const exclusion = info.savingsBondExclusion;
  if (!exclusion) return undefined;
  return expenseLines(exclusion.line2, exclusion.line3, exclusion.worksheet);
}

/* Form 1040 lines 1z, 3b, 4b, 5b, 6b and 7a; Schedule 1 lines 1 through 7 and 9 (step-action::b03). */
const OTHER_INCOME = [
  "form-1040.line.1z",
  "form-1040.line.3b",
  "form-1040.line.4b",
  "form-1040.line.5b",
  "form-1040.line.6b",
  "form-1040.line.7a",
  "schedule-1.0.line.1",
  "schedule-1.0.line.2a",
  "schedule-1.0.line.3",
  "schedule-1.0.line.4",
  "schedule-1.0.line.5",
  "schedule-1.0.line.6",
  "schedule-1.0.line.7",
  "schedule-1.0.line.9",
];

/* Schedule 1 lines 11 through 20, 23 and 25 (step-action::b03); not line 21, student loan interest. */
const ADJUSTMENTS = [
  "schedule-1.1.line.11",
  "schedule-1.1.line.12",
  "schedule-1.1.line.13",
  "schedule-1.1.line.14",
  "schedule-1.1.line.15",
  "schedule-1.1.line.16",
  "schedule-1.1.line.17",
  "schedule-1.1.line.18",
  "schedule-1.1.line.19a",
  "schedule-1.1.line.20",
  "schedule-1.1.line.23",
  "schedule-1.1.line.25",
];

/*
 * MANUAL EDIT: the Line 9 Worksheet (irs-8815-form-2025::sec::step-action::b03).
 * Blank when the form stopped at line 4. Like Form 1040 line 9, it waits while
 * Schedule 1 files and its line 10 is blank, and for an IRA contribution while
 * line 20 is blank. A case that adds to modified AGI
 * or needs a deduction figured first is unsupported (line9Gaps.ts).
 */
function line9Of(form: Form, info: Form8815FilingInfo): Line9Worksheet | Unsupported | undefined {
  const exclusion = info.savingsBondExclusion;
  if (!exclusion || linesOf(info)?.line8 === undefined) return undefined;
  if (exclusion.line9Gap) return unsupported(exclusion.line9Gap);
  if (info.mustFile?.["schedule-1"]?.value === true && form["schedule-1.0.line.10"] === undefined)
    return undefined;
  // An IRA deduction with no gap (line9Gaps.ts): wait for Schedule 1 line 20, never read it as 0.
  if (exclusion.readsIraDeduction && form["schedule-1.1.line.20"] === undefined) return undefined;
  return line9Worksheet(
    sum(form["schedule-b.0.line.2_total_interest"]),
    sum(...OTHER_INCOME.map((id) => form[id])),
    sum(...ADJUSTMENTS.map((id) => form[id])),
  );
}

const isUnsupported = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && "unsupported" in value;

/* Lines 10 through 14; blank while line 9 or the filing status waits, and after the Note's stop. */
function phaseOf(form: Form, info: Form8815FilingInfo): PhaseOutLines | Unsupported | undefined {
  const line8 = linesOf(info)?.line8;
  const line9 = line9Of(form, info);
  if (line9 === undefined || isUnsupported(line9)) return line9;
  if (line8 === undefined) return undefined;
  const limits = info.savingsBondExclusion?.limits;
  return limits === undefined ? undefined : phaseOutLines(line8, line9.line5, limits);
}

function fromPhase(pick: (lines: PhaseOutLines) => number | string | undefined): Fn {
  return (form, info) => {
    const lines = phaseOf(form, info);
    if (lines === undefined || isUnsupported(lines)) return lines;
    return pick(lines);
  };
}

function fromLine9(pick: (lines: Line9Worksheet) => number): Fn {
  return (form, info) => {
    const lines = line9Of(form, info);
    if (lines === undefined || isUnsupported(lines)) return lines;
    return pick(lines);
  };
}

/* MANUAL EDIT: the Line 6 Worksheet (irs-8815-form-2025::sec::line-6::b01, b02), printed with line 5. */
function fromLine6Worksheet(pick: (worksheet: Line6Worksheet) => number | undefined): Fn {
  return (_, info) => {
    const worksheet = info.savingsBondExclusion?.worksheet;
    if (worksheet === undefined || linesOf(info)?.line5 === undefined) return undefined;
    return pick(worksheet);
  };
}

const digitsOf = (scaled: number | undefined, part: "whole" | "decimal") =>
  scaled === undefined ? undefined : ratioDigits(scaled)[part];

/* Lines 9 through 14 and both worksheets. */
function computedBindings(): Bindings {
  const out: Record<string, Fn> = {
    "0.line.9_modified_adjusted_gross_income": fromLine9((lines) => lines.line5),
    // MANUAL EDIT: lines 10–14 (face-page-1::b02, b03).
    "0.line.10_phaseout_threshold": fromPhase((lines) => lines.line10),
    "0.line.11_income_over_threshold": fromPhase((lines) => lines.line11),
    "0.line.12_phaseout_ratio_whole": fromPhase((lines) => digitsOf(lines.line12, "whole")),
    "0.line.12_phaseout_ratio_decimal": fromPhase((lines) => digitsOf(lines.line12, "decimal")),
    "0.line.13_phaseout_reduction": fromPhase((lines) => lines.line13),
    "0.line.14_excludable_bond_interest": fromPhase((lines) => lines.line14),
    "2.line6_worksheet.1_amount_from_line_5": fromLine6Worksheet((ws) => ws.line1),
    "2.line6_worksheet.2_paper_ee_bonds_face_value": fromLine6Worksheet((ws) => ws.line2),
    "2.line6_worksheet.3_half_of_line_2": fromLine6Worksheet((ws) => ws.line3),
    "2.line6_worksheet.4_electronic_ee_and_i_bonds_face_value": fromLine6Worksheet(
      (ws) => ws.line4,
    ),
    "2.line6_worksheet.5_add_lines_3_and_4": fromLine6Worksheet((ws) => ws.line5),
    "2.line6_worksheet.6_line_1_minus_line_5": fromLine6Worksheet((ws) => ws.line6),
    "2.line6_worksheet.7_interest_reported_previous_years": fromLine6Worksheet((ws) => ws.line7),
    "2.line6_worksheet.8_line_6_minus_line_7": fromLine6Worksheet((ws) => ws.line8),
    "3.line.1_worksheet_schedule_b_line_2": fromLine9((lines) => lines.line1),
    "3.line.2_worksheet_other_income_total": fromLine9((lines) => lines.line2),
    "3.line.3_worksheet_add_lines_1_2": fromLine9((lines) => lines.line3),
    "3.line.4_worksheet_schedule_1_adjustments": fromLine9((lines) => lines.line4),
    "3.line.5_worksheet_modified_agi": fromLine9((lines) => lines.line5),
  };
  return out as Bindings;
}

export function register(): void {
  defineForm<Form8815, Form8815FilingInfo>("form-8815", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      ...line1Bindings(),
      // MANUAL EDIT: lines 2–8 (irs-8815-form-2025::sec::face-page-1::b01, b02; line-2::b01, line-3::b01).
      "0.line.2_qualified_education_expenses": (_, info) => info.savingsBondExclusion?.line2,
      "0.line.3_nontaxable_educational_benefits": (_, info) => info.savingsBondExclusion?.line3,
      "0.line.4_net_education_expenses": (_, info) => linesOf(info)?.line4,
      "0.line.5_total_bond_proceeds": (_, info) => linesOf(info)?.line5,
      "0.line.6_bond_interest": (_, info) => linesOf(info)?.line6,
      "0.line.7_expense_ratio_whole": (_, info) => digitsOf(linesOf(info)?.line7, "whole"),
      "0.line.7_expense_ratio_decimal": (_, info) => digitsOf(linesOf(info)?.line7, "decimal"),
      "0.line.8_interest_times_ratio": (_, info) => linesOf(info)?.line8,
      ...computedBindings(),
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
