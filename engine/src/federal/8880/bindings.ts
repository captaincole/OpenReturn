/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import {
  columnOf,
  line10Of,
  line7Of,
  line8Of,
  line9Of,
  worksheetOf,
  type Accessor,
} from "./credit.js";
import type { Form8880FilingInfo } from "./filingInfo.js";
import { line12, type ColumnLines, type CreditLimitLines } from "./lines.js";
import type { Form8880 } from "./types.js";

type Fn = BindingFn<Form8880, Form8880FilingInfo, keyof Form8880>;
type Bindings = Partial<{ [K in keyof Form8880]: BindingFn<Form8880, Form8880FilingInfo, K> }>;

/*
 * MANUAL EDIT: lines 1 through 6, one per column
 * (irs-8880-form-2025::sec::omb-no-1545-0074::b01, ::b02). Column (b) is for a
 * joint return only (irs-8880-form-2025::sec::specific-instructions::b01).
 */
const COLUMN_FIELDS: Record<string, keyof ColumnLines> = {
  "0.line.1_ira_able_contributions": "line1",
  "0.line.2_elective_deferrals": "line2",
  "0.line.3_total_contributions": "line3",
  "0.line.4_certain_distributions": "line4",
  "0.line.5_contributions_less_distributions": "line5",
  "0.line.6_smaller_of_line_5_or_2000": "line6",
};

function columnBindings(): Bindings {
  const out: Record<string, Fn> = {};
  for (const [field, line] of Object.entries(COLUMN_FIELDS)) {
    out[`${field}_col_a`] = (_, info) => columnOf(info, "you")?.[line];
    out[`${field}_col_b`] = (_, info) => columnOf(info, "spouse")?.[line];
  }
  return out as Bindings;
}

/* A worksheet line, or the gap; blank before line 10 is figured. */
function worksheetLine(
  form: Accessor,
  info: Form8880FilingInfo,
  pick: (lines: CreditLimitLines) => number | undefined,
) {
  const worksheet = worksheetOf(form, info);
  if (worksheet === undefined || "unsupported" in worksheet) return worksheet;
  return pick(worksheet);
}

/* MANUAL EDIT: line 12, the smaller of lines 10 and 11 (irs-8880-form-2025::sec::omb-no-1545-0074::b03). */
function line12Of(form: Accessor, info: Form8880FilingInfo) {
  const tentative = line10Of(form, info);
  const limit = worksheetLine(form, info, (lines) =>
    lines.creditAllowed ? lines.line3 : undefined,
  );
  if (typeof tentative !== "number") return tentative;
  if (typeof limit !== "number") return limit;
  return line12(tentative, limit);
}

export function register(): void {
  defineForm<Form8880, Form8880FilingInfo>("form-8880", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      ...columnBindings(),
      // MANUAL EDIT: irs-8880-form-2025::sec::line-7::b01; a column that waits keeps it blank.
      "0.line.7_total_line_6": (_, info) => line7Of(info),
      // MANUAL EDIT: Form 1040 line 11a; blank when line 7 is zero (stop).
      "0.line.8_adjusted_gross_income": (form, info) => line8Of(form, info),
      // MANUAL EDIT: the table's digit after "0."; "0" prints, then the form stops.
      "0.line.9_applicable_decimal_amount": (form, info) => {
        const digit = line9Of(form, info);
        return typeof digit === "number" ? String(digit) : digit;
      },
      "0.line.10_line_7_times_line_9": (form, info) => line10Of(form, info),
      // MANUAL EDIT: the worksheet's line 3; blank when it is zero or less (stop).
      "0.line.11_tax_liability_limitation": (form, info) =>
        worksheetLine(form, info, (lines) => (lines.creditAllowed ? lines.line3 : undefined)),
      "0.line.12_retirement_savings_credit": (form, info) => line12Of(form, info),
      // MANUAL EDIT: irs-8880-form-2025::sec::credit-limit-worksheet::b01.
      "1.credit_limit_worksheet.1_form_1040_line_18": (form, info) =>
        worksheetLine(form, info, (lines) => lines.line1),
      "1.credit_limit_worksheet.2_schedule_3_credits_total": (form, info) =>
        worksheetLine(form, info, (lines) => lines.line2),
      "1.credit_limit_worksheet.3_credit_limit": (form, info) =>
        worksheetLine(form, info, (lines) => lines.line3),
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
