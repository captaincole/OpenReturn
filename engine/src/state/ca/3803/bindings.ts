/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 * MANUAL EDIT: written by hand. The arithmetic is lines.ts; the conditions of
 * the election are children.ts. A child whose form is not figured leaves every
 * line blank while an answer is missing, and unsupported with the gap's reason.
 */

import { defineForm, type BindingFn } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { Form3803Child, Form3803FilingInfo } from "./filingInfo.js";
import type { Form3803Lines, Form3803PartI } from "./lines.js";
import type { Form3803 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form3803]: BindingFn<Form3803, Form3803FilingInfo, K> }>;

const childOf = (info: Form3803FilingInfo): Form3803Child | undefined =>
  info.form3803Children?.[info.form3803CopyIndex ?? 0];

/* A line of this child's form; blank while it waits, unsupported with the child's gap. */
function line<V>(read: (lines: Form3803Lines) => V | undefined) {
  return (_: unknown, info: Form3803FilingInfo): V | Unsupported | undefined => {
    const child = childOf(info);
    if (child?.gap !== undefined) return unsupported(child.gap);
    return child?.lines === undefined ? undefined : read(child.lines);
  };
}

/* Lines 5 and 6; blank when line 4 is $2,700 or less ("skip line 5 and line 6 and go to line 7"). */
const partILine = <V>(read: (partI: Form3803PartI) => V | undefined) =>
  line((lines) => (lines.partI === undefined ? undefined : read(lines.partI)));

const headerBindings: Bindings = {
  // ca-3803-inst-2025::sec::specific-line-instructions::b01: both names on a joint return, the first one's SSN or ITIN.
  "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
  "0.header.ssn": (_, info) => info.taxpayerSSN,
  // The dependent fact has no middle initial.
  "0.header.child_name": (_, info) => childOf(info)?.name,
  "0.header.child_ssn": (_, info) => childOf(info)?.ssn,
  // ::c-how-to-make-the-election::b01: one form per child; the box when more than one is attached.
  "0.header.more_than_one_form_attached": (_, info) =>
    (info.form3803Children?.length ?? 0) > 1 ? true : undefined,
};

const partIBindings: Bindings = {
  // ::line-1a::b01: interest taxable by California. Nominee amounts are out of scope (no fact holds them).
  "0.line.1a_child_taxable_interest": line((lines) => lines.line1a),
  // ::line-1b::b01: interest exempt from California tax, kept off line 1a.
  "0.line.1b_child_tax_exempt_interest": line((lines) => lines.line1b),
  // ::line-2::b01: ordinary dividends (1099-DIV box 1a); the form: "If none, enter -0-."
  "0.line.2_child_ordinary_dividends": line((lines) => lines.line2),
  // ::line-3::b01: capital gain distributions taxable by California (1099-DIV box 2a).
  "0.line.3_child_capital_gain_distributions": line((lines) => lines.line3),
  "0.line.4_total_child_income": line((lines) => lines.line4),
  "0.line.5_base_amount": partILine((partI) => partI.line5),
  // ::line-6::b01: Schedule CA (540) line 8z, column B or C (scheduleCaLine8z.ts).
  "0.line.6_income_to_report_on_return": partILine((partI) => partI.line6),
};

const partIIBindings: Bindings = {
  "0.line.7_amount_not_taxed": line((lines) => lines.line7),
  "0.line.8_income_over_amount_not_taxed": line((lines) => lines.line8),
  // ::line-9::b01: Form 540 line 31, added across the forms.
  "0.line.9_tax_on_first_2700": line((lines) => lines.line9),
};

export function register(): void {
  defineForm<Form3803, Form3803FilingInfo>("form-3803", {
    bindings: { ...headerBindings, ...partIBindings, ...partIIBindings },
  });
}
