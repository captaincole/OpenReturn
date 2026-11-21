/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 * MANUAL EDIT: written by hand. The arithmetic is lines.ts; the conditions of
 * the election are children.ts. A child whose form is not figured leaves every
 * line blank while an answer is missing, and unsupported with the gap's reason.
 */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { roundToPlaces } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import type { Form8814Child, Form8814FilingInfo } from "./filingInfo.js";
import { RATIO_PLACES, type Form8814Lines, type Form8814PartI } from "./lines.js";
import type { Form8814 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form8814]: BindingFn<Form8814, Form8814FilingInfo, K> }>;

const childOf = (info: Form8814FilingInfo): Form8814Child | undefined =>
  info.form8814Children?.[info.form8814CopyIndex ?? 0];

/* A line of this child's form; blank while it waits, unsupported with the child's gap. */
function line<V>(read: (lines: Form8814Lines) => V | undefined) {
  return (_: unknown, info: Form8814FilingInfo): V | Unsupported | undefined => {
    const child = childOf(info);
    if (child?.gap !== undefined) return unsupported(child.gap);
    return child?.lines === undefined ? undefined : read(child.lines);
  };
}

/* A Part I line; blank when line 4 is at or under the base amount ("skip lines 5 through 12"). */
const partILine = <V>(read: (partI: Form8814PartI) => V | undefined) =>
  line((lines) => (lines.partI === undefined ? undefined : read(lines.partI)));

/*
 * Lines 7 and 8 print in two fields around the form's decimal point: the whole
 * part ("0", or "1" when the line is all of line 4) and three digits.
 */
const scaled = (ratio: number) => roundToPlaces(ratio * 10 ** RATIO_PLACES, 0);
const wholePartText = (ratio: number | undefined) =>
  ratio === undefined ? undefined : ratio >= 1 ? "1" : "0";
const decimalPartText = (ratio: number | undefined) =>
  ratio === undefined
    ? undefined
    : String(scaled(ratio) % 10 ** RATIO_PLACES).padStart(RATIO_PLACES, "0");

const headerBindings: Bindings = {
  // irs-8814-inst-2025::sec::specific-instructions::b01: both names on a joint return, the first one's SSN.
  "0.header.taxpayer_name": (_, info) => {
    if (!info.taxpayerFirstName || !info.taxpayerLastName) return undefined;
    const taxpayer = `${info.taxpayerFirstName} ${info.taxpayerLastName}`;
    return info.filingStatus === "married_filing_jointly" &&
      info.spouseFirstName &&
      info.spouseLastName
      ? `${taxpayer} and ${info.spouseFirstName} ${info.spouseLastName}`
      : taxpayer;
  },
  "0.header.ssn": (_, info) => (info.taxpayerSSN ? SSN.format(info.taxpayerSSN) : undefined),
  // The dependent fact has no middle initial.
  "0.header.a_child_name": (_, info) => childOf(info)?.name,
  "0.header.b_child_ssn": (_, info) => {
    const ssn = childOf(info)?.ssn;
    return ssn ? SSN.format(ssn) : undefined;
  },
  // ::line-12::b01, ::line-15::b01: one form per child; box C when more than one is attached.
  "0.header.c_more_than_one_form_8814": (_, info) =>
    (info.form8814Children?.length ?? 0) > 1 ? true : undefined,
};

const partIBindings: Bindings = {
  /*
   * ::line-1a::b01: taxable interest. Nominee interest and the accrued-interest,
   * ABP and OID adjustments on the dotted line are out of scope (no fact holds
   * them), so line 1a is the 1099 amount.
   */
  "0.line.1a_child_taxable_interest": line((lines) => lines.line1a),
  // ::line-1b::b01–b02: tax-exempt interest, kept off line 1a.
  "0.line.1b_child_tax_exempt_interest": line((lines) => lines.line1b),
  // ::line-2a::b01: ordinary dividends, Alaska Permanent Fund dividends included.
  "0.line.2a_child_ordinary_dividends": line((lines) => lines.line2a),
  // ::line-2b::b01: the qualified dividends included on line 2a.
  "0.line.2b_child_qualified_dividends": line((lines) => lines.line2b),
  // ::line-3::b01: capital gain distributions (1099-DIV box 2a).
  "0.line.3_child_capital_gain_distributions": line((lines) => lines.line3),
  "0.line.4_total_interest_dividends": line((lines) => lines.line4),
  "0.line.6_amount_over_base": partILine((partI) => partI.line6),
  "0.line.7_qualified_dividends_ratio_whole": partILine((partI) => wholePartText(partI.line7)),
  "0.line.7_qualified_dividends_ratio_decimal": partILine((partI) => decimalPartText(partI.line7)),
  "0.line.8_capital_gain_ratio_whole": partILine((partI) => wholePartText(partI.line8)),
  "0.line.8_capital_gain_ratio_decimal": partILine((partI) => decimalPartText(partI.line8)),
  // ::line-9::b01: 1040 lines 3a and 3b, or Schedule B line 5.
  "0.line.9_qualified_dividends_to_report": partILine((partI) => partI.line9),
  // ::line-10::b01: Schedule D line 13, or 1040 line 7a.
  "0.line.10_capital_gain_to_report": partILine((partI) => partI.line10),
  "0.line.11_add_lines_9_10": partILine((partI) => partI.line11),
  // ::line-12::b01: Schedule 1 line 8z, added across the forms.
  "0.line.12_other_income_schedule_1": partILine((partI) => partI.line12),
};

const partIIBindings: Bindings = {
  "0.line.14_amount_over_not_taxed": line((lines) => lines.line14),
  // The blank form: "No. Enter $135"; "Yes. Multiply line 14 by 10%". ::line-15::b01: 1040 line 16.
  "0.line.15_line_14_less_than_1350_no": line((lines) =>
    lines.line14LessThanAmountNotTaxed ? undefined : true,
  ),
  "0.line.15_line_14_less_than_1350_yes": line((lines) =>
    lines.line14LessThanAmountNotTaxed ? true : undefined,
  ),
  "0.line.15_tax": line((lines) => lines.line15),
};

export function register(): void {
  defineForm<Form8814, Form8814FilingInfo>("form-8814", {
    bindings: { ...headerBindings, ...partIBindings, ...partIIBindings },
  });
}
