/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../../defineForm.js";
import type { ParentFilingStatus } from "../../../facts/index.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { type Unsupported } from "../../../types.js";
import { ssnOf } from "../../../values.js";
import type { Form3800CaFilingInfo } from "./filingInfo.js";
import {
  form3800CaLines,
  type Accessor,
  type Form3800CaLines,
  type PartII,
  type PartIII,
} from "./form.js";
import { line12bDigits } from "./lines.js";
import type { Form3800Ca } from "./types.js";

type Bindings = Partial<{
  [K in keyof Form3800Ca]: BindingFn<Form3800Ca, Form3800CaFilingInfo, K>;
}>;
type Value<T> = T | Unsupported | undefined;

/* A line of the form: the gap for the whole form, else the line; blank when the form waits. */
function lineOf<T>(pick: (lines: Form3800CaLines) => Value<T>) {
  return (form: unknown, info: Form3800CaFilingInfo): Value<T> => {
    const lines = form3800CaLines(form as Accessor, info);
    if (lines === undefined || "unsupported" in lines) return lines;
    return pick(lines);
  };
}

const partIILine = <T>(pick: (part: PartII) => Value<T>) =>
  lineOf((lines) => (lines.partII === undefined ? undefined : pick(lines.partII)));
const partIIILine = <T>(pick: (part: PartIII) => Value<T>) =>
  lineOf((lines) => (lines.partIII === undefined ? undefined : pick(lines.partIII)));

/* The header's radio values for the parent's filing status (the catalog's options). */
const STATUS_OPTION: Record<ParentFilingStatus, string> = {
  single: "single",
  married_filing_jointly: "married_rdp_filing_jointly",
  married_filing_separately: "married_rdp_filing_separately",
  head_of_household: "head_of_household",
  qualifying_surviving_spouse: "qualifying_surviving_spouse_rdp",
};

/* MANUAL EDIT: the child and the parent the instructions pick (ca-3800-inst-2025::sec::specific-line-instructions::b01, ::b02). */
const headerBindings: Bindings = {
  "0.header.child_name": (_, info) => namesOnReturn(info),
  "0.header.child_ssn": (_, info) => info.taxpayerSSN,
  "0.header.parent_name": (_, info) => info.form3800CaAnswers?.parentName,
  "0.header.parent_ssn": (_, info) => ssnOf(info.form3800CaAnswers?.parentSsn),
  "0.header.parent_filing_status": (_, info) => {
    const status = info.form3800CaAnswers?.parentFilingStatus;
    return status === undefined ? undefined : STATUS_OPTION[status];
  },
};

/* MANUAL EDIT: Part I (::part-i-child-s-net-unearned-income::b01, ::b02); lines 4 and 5 blank after line 3 stops. */
const partIBindings: Bindings = {
  "0.line.1_child_unearned_income": lineOf((lines) => lines.line1),
  "0.line.2_unearned_income_deduction": lineOf((lines) => lines.line2),
  "0.line.3_unearned_income_less_deduction": lineOf((lines) => lines.line3),
  "0.line.4_child_taxable_income": lineOf((lines) => lines.line4),
  "0.line.5_net_unearned_income": lineOf((lines) => lines.line5),
};

/* MANUAL EDIT: Part II (::part-ii-tentative-tax-based-on-parent-s-tax-rate::b01 to ::b04); lines 12a and 12b blank with line 7 blank. */
const partIIBindings: Bindings = {
  "0.line.6_parent_taxable_income": partIILine((part) => part.line6),
  "0.line.7_other_children_net_unearned_income": partIILine((part) => part.line7),
  "0.line.8_total_income_at_parent_rate": partIILine((part) => part.line8),
  "0.line.9_tax_on_line_8": partIILine((part) => part.line9),
  "0.line.10_parent_tax": partIILine((part) => part.line10),
  "0.line.11_tax_difference_at_parent_rate": partIILine((part) => part.line11),
  "0.line.12a_all_children_net_unearned_income": partIILine((part) => part.line12a),
  "0.line.12b_child_share_decimal": partIILine((part) =>
    part.line12b === undefined ? undefined : line12bDigits(part.line12b),
  ),
  "0.line.13_child_share_of_tentative_tax": partIILine((part) => part.line13),
};

/* MANUAL EDIT: Part III (::part-iii-child-s-tax::b01 to ::b03). */
const partIIIBindings: Bindings = {
  "0.line.14_taxable_income_less_net_unearned": partIIILine((part) => part.line14),
  "0.line.15_tax_on_line_14": partIIILine((part) => part.line15),
  "0.line.16_tax_at_parent_rate_total": partIIILine((part) => part.line16),
  "0.line.17_tax_on_line_4": partIIILine((part) => part.line17),
  "0.line.18_child_tax": partIIILine((part) => part.line18),
};

export function register(): void {
  defineForm<Form3800Ca, Form3800CaFilingInfo>("form-3800-ca", {
    bindings: { ...headerBindings, ...partIBindings, ...partIIBindings, ...partIIIBindings },
    /*
     * MANUAL EDIT: line 1 at $2,700 or less: "stop here; do not file this
     * form" (the blank form). Line 3 is above 0 exactly when line 1 is above
     * line 2, which is $2,700 or more (QUESTIONS.md).
     */
    filesOnlyWithAmountOn: "form-3800-ca.0.line.3_unearned_income_less_deduction",
  });
}
