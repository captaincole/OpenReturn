/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import type { ParentFilingStatus } from "../../facts/index.js";
import { type Unsupported } from "../../types.js";
import { SSN, ssnOf } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8615FilingInfo } from "./filingInfo.js";
import {
  form8615Lines,
  type Accessor,
  type Form8615Lines,
  type PartII,
  type PartIII,
  type TaxLine,
} from "./form.js";
import { line12bDigits } from "./lines.js";
import type { Form8615 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form8615]: BindingFn<Form8615, Form8615FilingInfo, K> }>;
type Value<T> = T | Unsupported | undefined;

/* A line of the form: the gap for the whole form, else the line; blank when the form waits. */
function lineOf<T>(pick: (lines: Form8615Lines) => Value<T>) {
  return (form: unknown, info: Form8615FilingInfo): Value<T> => {
    const lines = form8615Lines(form as Accessor, info);
    if (lines === undefined || "unsupported" in lines) return lines;
    return pick(lines);
  };
}

const partIILine = <T>(pick: (part: PartII) => Value<T>) =>
  lineOf((lines) => (lines.partII === undefined ? undefined : pick(lines.partII)));
const partIIILine = <T>(pick: (part: PartIII) => Value<T>) =>
  lineOf((lines) => (lines.partIII === undefined ? undefined : pick(lines.partIII)));

/* A tax line's amount, or its box: checked only when the line used a worksheet. */
const taxOf = (line: TaxLine) => ("unsupported" in line ? line : line.tax);
const boxOf = (line: TaxLine) =>
  "unsupported" in line ? line : line.worksheetUsed ? true : undefined;

/* Line C: the box for the parent's filing status (irs-8615-inst-2025::sec::specific-instructions::b01). */
const statusBox = (status: ParentFilingStatus) => (_: unknown, info: Form8615FilingInfo) => {
  const parent = info.form8615Answers?.parent;
  return parent === undefined ? undefined : parent.filingStatus === status ? true : undefined;
};

const headerBindings: Bindings = {
  "0.header.child_name": (_, info) => namesOnReturn(info),
  "0.header.child_ssn": (_, info) => info.taxpayerSSN,
  // MANUAL EDIT: lines A and B, the parent the instructions pick (::specific-instructions::b01, ::b02).
  "0.header.a_parent_name": (_, info) => info.form8615Answers?.parent.name,
  "0.header.b_parent_ssn": (_, info) => ssnOf(info.form8615Answers?.parent.ssn),
  "0.header.c_parent_filing_status_single": statusBox("single"),
  "0.header.c_parent_filing_status_married_jointly": statusBox("married_filing_jointly"),
  "0.header.c_parent_filing_status_married_separately": statusBox("married_filing_separately"),
  "0.header.c_parent_filing_status_head_of_household": statusBox("head_of_household"),
  "0.header.c_parent_filing_status_surviving_spouse": statusBox("qualifying_surviving_spouse"),
};

/* MANUAL EDIT: Part I (::line-1::b01 through ::line-5::b01); lines 4 and 5 blank after line 3 stops. */
const partIBindings: Bindings = {
  "0.line.1_child_unearned_income": lineOf((lines) => lines.line1),
  "0.line.2_unearned_income_floor": lineOf((lines) => lines.line2),
  "0.line.3_line_1_minus_line_2": lineOf((lines) => lines.line3),
  "0.line.4_child_taxable_income": lineOf((lines) => lines.line4),
  "0.line.5_net_unearned_income": lineOf((lines) => lines.line5),
};

/* MANUAL EDIT: Part II (::line-6::b01 through ::line-13::b01); lines 12a and 12b blank with line 7 blank. */
const partIIBindings: Bindings = {
  "0.line.6_parent_taxable_income": partIILine((part) => part.line6),
  "0.line.7_other_children_net_unearned_income": partIILine((part) => part.line7),
  "0.line.8_add_lines_5_6_7": partIILine((part) => part.line8),
  "0.line.9_tax_worksheet_used_checkbox": partIILine((part) => boxOf(part.line9)),
  "0.line.9_tax_on_line_8": partIILine((part) => taxOf(part.line9)),
  "0.line.10_tax_worksheet_used_checkbox": partIILine((part) => boxOf(part.line10)),
  "0.line.10_parent_tax": partIILine((part) => taxOf(part.line10)),
  "0.line.11_line_9_minus_line_10": partIILine((part) => part.line11),
  "0.line.12a_add_lines_5_7": partIILine((part) => part.line12a),
  "0.line.12b_line_5_share_decimal": partIILine((part) =>
    part.line12b === undefined ? undefined : line12bDigits(part.line12b),
  ),
  "0.line.13_child_share_parent_rate_tax": partIILine((part) => part.line13),
};

/* MANUAL EDIT: Part III (::line-14::b01 through ::line-18::b01). */
const partIIIBindings: Bindings = {
  "0.line.14_line_4_minus_line_5": partIIILine((part) => part.line14),
  "0.line.15_tax_worksheet_used_checkbox": partIIILine((part) => boxOf(part.line15)),
  "0.line.15_tax_on_line_14": partIIILine((part) => taxOf(part.line15)),
  "0.line.16_add_lines_13_15": partIIILine((part) => part.line16),
  "0.line.17_tax_worksheet_used_checkbox": partIIILine((part) => boxOf(part.line17)),
  "0.line.17_tax_on_line_4": partIIILine((part) => taxOf(part.line17)),
  "0.line.18_child_tax": partIIILine((part) => part.line18),
};

export function register(): void {
  defineForm<Form8615, Form8615FilingInfo>("form-8615", {
    bindings: { ...headerBindings, ...partIBindings, ...partIIBindings, ...partIIIBindings },

    // The SSN widgets (text, maxLength 11) keep the dashes.
    formatters: {
      "0.header.child_ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
      "0.header.b_parent_ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
