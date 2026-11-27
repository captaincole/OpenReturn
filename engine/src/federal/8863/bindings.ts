/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 * MANUAL EDIT: written by hand. The arithmetic is lines.ts; Parts I and II and
 * the Credit Limit Worksheet read the return in credit.ts; Part III is
 * partIIIBindings.ts. A gap leaves its lines unsupported with the reason.
 */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { namesOnReturn } from "../returnNames.js";
import { partIIOf, partIOf, worksheetOf } from "./credit.js";
import type { Form8863FilingInfo } from "./filingInfo.js";
import { decimalText, magiLimit, type PartIILines, type PartILines } from "./lines.js";
import { partIIIBindings } from "./partIIIBindings.js";
import type { Form8863 } from "./types.js";

type Fn = BindingFn<Form8863, Form8863FilingInfo, keyof Form8863>;
type Bindings = Partial<{ [K in keyof Form8863]: BindingFn<Form8863, Form8863FilingInfo, K> }>;
type Value = string | number | boolean | undefined;

const SEPARATE_RETURN_GAP = unsupported(
  "A married filing separately return cannot take an education credit (irs-8863-inst-2025::sec::who-can-claim-an-education-credit::b03).",
);

/* The filer's SSN in the three boxes of each page's header. */
const ssnPart = (info: Form8863FilingInfo, start: number, end: number) =>
  info.taxpayerSSN?.slice(start, end);

/* A value from a part's result: blank while it waits, the gap when it is one. */
function fromResult<R>(
  result: R | Unsupported | undefined,
  pick: (lines: R) => Value,
): Value | Unsupported {
  if (result === undefined) return undefined;
  if (typeof result === "object" && result !== null && "unsupported" in result) {
    return result as Unsupported;
  }
  return pick(result as R);
}

const partI =
  (pick: (lines: PartILines) => Value): Fn =>
  (form, info) =>
    fromResult(partIOf(form, info), pick);
const partII =
  (pick: (lines: PartIILines) => Value): Fn =>
  (form, info) =>
    fromResult(partIIOf(form, info), pick);

/* Lines 2 and 13: the MAGI limit for the filing status, when the part is filled. */
function statusLimit(part: "I" | "II"): Fn {
  return (_, info) => {
    const figured = info.form8863;
    const filled = part === "I" ? figured?.americanOpportunity : (figured?.line10 ?? 0) > 0;
    if (!filled || figured?.studentsMissing || info.filingStatus === undefined) return undefined;
    if (info.filingStatus === "married_filing_separately") return SEPARATE_RETURN_GAP;
    return magiLimit(info.filingStatus === "married_filing_jointly");
  };
}

const partIBindings: Record<string, Fn> = {
  // MANUAL EDIT: part-i-refundable-american::b01: the total of every line 30; blank with no such student.
  "0.line.1_total_part3_line_30": (_, info) =>
    info.form8863?.americanOpportunity && !info.form8863.studentsMissing
      ? info.form8863.line1
      : undefined,
  "0.line.2_filing_status_limit": statusLimit("I"),
  // MANUAL EDIT: line-3::b01: Form 1040 line 11b plus Form 4563 line 15; Form 2555 is a gap (credit.ts).
  "0.line.3_modified_agi": partI((lines) => lines.magi),
  // MANUAL EDIT: zero or less prints 0 and stops the part.
  "0.line.4_limit_minus_agi": partI((lines) => lines.room),
  // MANUAL EDIT: lines 5 and 6 are skipped after the line 4 stop.
  "0.line.5_phaseout_range": partI((lines) => lines.range),
  "0.line.6_phaseout_decimal_whole": partI((lines) =>
    lines.decimal === undefined ? undefined : decimalText(lines.decimal).whole,
  ),
  "0.line.6_phaseout_decimal_fraction": partI((lines) =>
    lines.decimal === undefined ? undefined : decimalText(lines.decimal).fraction,
  ),
  // MANUAL EDIT: line-7::b02, b03: checked when the filer cannot take the refundable part.
  "0.line.7_under_24_no_refundable_credit": partI((lines) =>
    lines.line7 !== undefined && lines.line7Box ? true : undefined,
  ),
  "0.line.7_tentative_american_opportunity_credit": partI((lines) => lines.line7),
  "0.line.8_refundable_american_opportunity_credit": partI((lines) => lines.line8),
  "0.line.9_nonrefundable_american_opportunity_credit": partI((lines) => lines.line9),
};

const partIIBindings: Record<string, Fn> = {
  // MANUAL EDIT: line-10::b01: the total of every line 31, 0 when none ("If zero, skip lines 11 through 17").
  "0.line.10_total_part3_line_31": (_, info) =>
    info.form8863?.studentsMissing ? undefined : info.form8863?.line10,
  "0.line.11_smaller_of_line_10_or_10000": partII((lines) => lines.line11),
  "0.line.12_tentative_lifetime_learning_credit": partII((lines) => lines.line12),
  "0.line.13_filing_status_limit": statusLimit("II"),
  "0.line.14_modified_agi": partII((lines) => lines.phase?.magi),
  "0.line.15_limit_minus_agi": partII((lines) => lines.phase?.room),
  // MANUAL EDIT: lines 16 and 17 are skipped when line 15 is zero or less.
  "0.line.16_phaseout_range": partII((lines) => lines.phase?.range),
  "0.line.17_phaseout_decimal_whole": partII((lines) =>
    lines.phase?.decimal === undefined ? undefined : decimalText(lines.phase.decimal).whole,
  ),
  "0.line.17_phaseout_decimal_fraction": partII((lines) =>
    lines.phase?.decimal === undefined ? undefined : decimalText(lines.phase.decimal).fraction,
  ),
  "0.line.18_lifetime_learning_credit_after_phaseout": partII((lines) => lines.line18),
  // MANUAL EDIT: line-19::b01, credit-limit-worksheet::b01: worksheet line 7.
  "0.line.19_nonrefundable_education_credits": (form, info) =>
    fromResult(worksheetOf(form, info), (lines) => lines.line7),
};

const headerBindings: Bindings = {
  "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
  "0.header.ssn_first_3_digits": (_, info) => ssnPart(info, 0, 3),
  "0.header.ssn_middle_2_digits": (_, info) => ssnPart(info, 3, 5),
  "0.header.ssn_last_4_digits": (_, info) => ssnPart(info, 5, 9),
};

export function register(): void {
  defineForm<Form8863, Form8863FilingInfo>("form-8863", {
    bindings: {
      ...headerBindings,
      ...(partIBindings as Bindings),
      ...(partIIBindings as Bindings),
      ...partIIIBindings,
    },
  });
}
