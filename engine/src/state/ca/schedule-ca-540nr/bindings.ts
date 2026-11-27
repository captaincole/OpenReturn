/*
 * Schedule CA (540NR). Every field of the catalog gets its rule here:
 * - Part I (partI.ts): each person's stated residency answers.
 * - Part II columns A to C and Part III: Schedule CA (540)'s rule of the same
 *   line (fromScheduleCa.ts), except the lines below that take a form the
 *   engine figures for Form 540 only.
 * - Part II columns D and E (columns.ts), Part IV (partIV.ts).
 */

import { defineForm, type FormSpec } from "../../../defineForm.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import { gapFor } from "../540nr/form540NRBinding.js";
import catalog from "./catalog.json";
import { columnDOf, columnEOf, columnEValue, type PartIILine } from "./columns.js";
import type { ScheduleCa540NRFilingInfo } from "./filingInfo.js";
import { scheduleCaRule, scheduleCaValue, type Bind } from "./fromScheduleCa.js";
import { PART_I_BINDINGS } from "./partI.js";
import * as partIV from "./partIV.js";
import type { ScheduleCa540NR } from "./types.js";

type Spec = FormSpec<ScheduleCa540NR, ScheduleCa540NRFilingInfo>;

const FORM_PREFIX = "schedule-ca-540nr.";
const COLUMN_D = "_total_ca_law";
const COLUMN_E = "_ca_amounts";

/*
 * Columns B and C whose Schedule CA (540) rule takes a California form that
 * files with Form 540 only (540nr/californiaForms.ts): a named gap when this
 * return needs the form, else Schedule CA (540)'s rule.
 */
const TAKES_FORM_540_FORM: Readonly<Record<string, readonly string[]>> = {
  "0.line.1h_additions": ["form-3913"],
  "1.line.b3_subtractions": ["schedule-d-1", "form-3885a"],
  "1.line.b3_additions": ["schedule-d-1", "form-3885a"],
  "1.line.b4_subtractions": ["schedule-d-1"],
  "1.line.b4_additions": ["schedule-d-1"],
  "1.line.b5_subtractions": ["form-3801", "form-3885a"],
  "1.line.b5_additions": ["form-3801", "form-3885a"],
  "1.line.b8a_additions": ["form-3805v"],
  "1.line.b8p_subtractions": ["form-3461"],
  "1.line.b8p_additions": ["form-3461"],
  "1.line.b8z_subtractions": ["form-3800-ca", "form-3803", "form-3461"],
  "1.line.b8z_additions": ["form-3800-ca", "form-3803", "form-5870a"],
  "2.line.b9b1_subtractions": ["form-3805v"],
  "2.line.b9b2_subtractions": ["form-3805v"],
  "2.line.c14_additions": ["form-3913"],
  "3.line.c26_additions": ["form-3913"],
  "3.part3.9_interest_subtractions": ["form-3526"],
  "3.part3.9_interest_additions": ["form-3526"],
};

/*
 * Line 7a columns B and C: "If there are differences, use Schedule D (540NR)
 * ... to calculate the amount to enter on line 7a"
 * (ca-540nr-sched-ca-inst-2025::sec::line-7a-capital-gain-or-loss::b01): its
 * line 12a goes in column B and line 12b in column C
 * (ca-540nr-sched-d-inst-2025::sec::line-12a::b01, ::line-12b::b01). A gap of
 * the schedule is the column's gap. With a capital gain or loss and no
 * Schedule D (540NR) (its decision says no), the column is a named gap, as
 * Schedule CA (540) line 7a is without Schedule D (540).
 */
const NO_SCHEDULE_D_540NR =
  "Line 7a columns B and C come from Schedule D (540NR), California Capital Gain or Loss Adjustment, which does not file on this return (its decision says no).";
const line7aAdjustment =
  (line: "12a" | "12b"): Bind =>
  (form, info) => {
    if (info.mustFile?.["schedule-d-540nr"]?.value !== true) {
      return numberOrBlank(form["0.line.7a_federal"])
        ? unsupported(NO_SCHEDULE_D_540NR)
        : undefined;
    }
    const gap = info.scheduleD540NRFigures?.gap;
    if (gap !== undefined) return unsupported(`Schedule D (540NR): ${gap}`);
    return numberOrBlank(form[`schedule-d-540nr.0.line.${line}`]);
  };

/* Line 19b: the alimony recipient's SSN, in the form's three boxes (Schedule CA (540)'s line 19b value). */
const recipientSsnPart =
  (start: number, end: number): Bind =>
  (form, info) => {
    const ssn = scheduleCaValue("2.line.c19b_recipient_ssn", form, info);
    if (typeof ssn !== "string") return undefined;
    const digits = [...ssn].filter((character) => character >= "0" && character <= "9").join("");
    return digits.length === 9 ? digits.slice(start, end) : undefined;
  };

const OWN: Readonly<Record<string, Bind>> = {
  ...(PART_I_BINDINGS as Record<string, Bind>),
  "0.line.7a_subtractions": line7aAdjustment("12a"),
  "0.line.7a_additions": line7aAdjustment("12b"),
  "2.line.c19b_recipient_ssn_first3": recipientSsnPart(0, 3),
  "2.line.c19b_recipient_ssn_middle2": recipientSsnPart(3, 5),
  "2.line.c19b_recipient_ssn_last4": recipientSsnPart(5, 9),
  "4.part4.1_california_agi": partIV.line1CaliforniaAgi as Bind,
  "4.part4.2_deductions_from_line_30": partIV.line2Deductions as Bind,
  "4.part4.3_deduction_percentage_whole_digit": partIV.line3PercentageWholeDigit as Bind,
  "4.part4.3_deduction_percentage_decimal_digits": partIV.line3PercentageDecimalDigits as Bind,
  "4.part4.4_california_deductions_prorated": partIV.line4ProratedDeductions as Bind,
  "4.part4.5_california_taxable_income": partIV.line5CaliforniaTaxableIncome as Bind,
};

/* "0.line.1a_total_ca_law" → "1a". */
const lineOf = (field: string, suffix: string) =>
  field.slice(field.indexOf(".line.") + ".line.".length, -suffix.length) as PartIILine;

type Rule = { bind: Bind } | { unsupported: string };

function ruleOf(field: string): Rule {
  if (field in OWN) return { bind: OWN[field] };
  if (field.endsWith(COLUMN_D)) {
    const line = lineOf(field, COLUMN_D);
    return { bind: (form) => columnDOf(form, line) };
  }
  if (field.endsWith(COLUMN_E)) {
    const line = lineOf(field, COLUMN_E);
    return { bind: (form, info) => columnEValue(columnEOf(form, info, line)) };
  }
  const rule = scheduleCaRule(field);
  if (rule === undefined) throw new Error(`Schedule CA (540NR) ${field} has no rule.`);
  const forms = TAKES_FORM_540_FORM[field];
  if (forms === undefined) return rule;
  return {
    bind: (form, info) =>
      gapFor(info, ...forms) ??
      ("bind" in rule ? rule.bind(form, info) : unsupported(rule.unsupported)),
  };
}

function specOf(): Pick<Spec, "bindings" | "unsupported"> {
  const bindings: Record<string, Bind> = {};
  const unsupportedFields: Record<string, string> = {};
  for (const { fieldId } of catalog.fields) {
    const field = fieldId.slice(FORM_PREFIX.length);
    const rule = ruleOf(field);
    if ("bind" in rule) bindings[field] = rule.bind;
    else unsupportedFields[field] = rule.unsupported;
  }
  return { bindings: bindings as Spec["bindings"], unsupported: unsupportedFields };
}

export function register(): void {
  defineForm<ScheduleCa540NR, ScheduleCa540NRFilingInfo>("schedule-ca-540nr", specOf());
}
