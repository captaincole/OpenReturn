/* FTB 3461 rules, written by hand from ca-3461-inst-2025 (no answer key: QUESTIONS.md). */

import { defineForm, type BindingFn } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { isUnsupportedResult } from "../3801/context.js";
import {
  form3461Lines,
  partIAmounts,
  partIReads,
  type Form3461Lines,
  type Info,
  type Read,
} from "./figures.js";
import { line9, type CaPartIAmounts } from "./lines.js";
import type { Form3461 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form3461]: BindingFn<Form3461, Info, K> }>;

/* A Part I line: its read, blank for null. */
const partILine = (line: keyof CaPartIAmounts) => (form: Read, info: Info) =>
  partIReads(form, info)[line] ?? undefined;

/* A line of lines 10 to 17; the gap, or blank while the form waits. */
function figured(pick: (lines: Form3461Lines) => number | undefined) {
  return (form: Read, info: Info) => {
    const lines = form3461Lines(form, info);
    if (lines === undefined || isUnsupportedResult(lines)) return lines;
    return pick(lines);
  };
}

/* Lines 14b, 14c and 16 wait for the carryover answer. */
const afterCarryover = (pick: (lines: Form3461Lines) => number | undefined) =>
  figured((lines) => (lines.carryoverKnown ? pick(lines) : undefined));

/* "Enter any" amount (lines 10 and 11): blank for 0. */
const amountOrBlank = (amount: number) => (amount === 0 ? undefined : amount);

/* Lines 12 and 13 are blank when lines 10 and 11 have nothing (a 0 adds nothing to line 14a). */
const partIIEntry = (lines: Form3461Lines, amount: number) =>
  lines.line10 === 0 && lines.line11 === 0 ? undefined : amount;

const form3461Bindings: Bindings = {
  "0.header.name_shown_on_return": (_, info) => namesOnReturn(info),
  // Joint returns: "Complete one form FTB 3461 containing all the information for both spouses/RDPs" (specific-line-instructions::b01).
  "0.header.ssn_or_itin": (_, info) => info.taxpayerSSN,
  // Part I: each Schedule CA (540) line, column A minus column B plus column C (the form; figures.ts).
  "0.line.2_schedule_ca_section_b_line_3": partILine("line2"),
  "0.line.3_schedule_ca_section_a_line_7a": partILine("line3"),
  "0.line.4_schedule_ca_section_b_line_4": partILine("line4"),
  "0.line.5_schedule_ca_section_b_line_5": partILine("line5"),
  "0.line.6_schedule_ca_section_b_line_6": partILine("line6"),
  // Line 8: the federal Form 461 line 8 answer (ca-3461-inst-2025::sec::line-8::b01).
  "0.line.8_other_trade_or_business_income": partILine("line8"),
  // Line 9: "Combine all the entries from line 1 through line 8" (::line-9::b01).
  "0.line.9_total_income_loss_items": (form, info) => {
    const amounts = partIAmounts(form, info);
    return amounts === undefined || isUnsupportedResult(amounts) ? amounts : line9(amounts);
  },
  // Part II (::line-10::b01, ::line-11::b01, ::line-12::b01).
  "0.line.10_nonbusiness_income_or_gain": figured((lines) => amountOrBlank(lines.line10)),
  "0.line.11_nonbusiness_losses_or_deductions": figured((lines) => amountOrBlank(lines.line11)),
  "0.line.12_net_nonbusiness_amount": figured((lines) => partIIEntry(lines, lines.line12)),
  // Part III (::line-14a::b01 to ::line-17::b01; lines.ts).
  "0.line.13_nonbusiness_adjustment_sign_reversed": figured((lines) =>
    partIIEntry(lines, lines.line13),
  ),
  "0.line.14a_business_income_or_loss": figured((lines) => lines.line14a),
  "0.line.14b_prior_year_excess_loss_carryover": afterCarryover((lines) => lines.line14b),
  "0.line.14c_total_business_losses": afterCarryover((lines) => lines.line14c),
  // Line 15: $313,000, or $626,000 if married/RDP filing jointly (::line-15::b01, ::c-definitions::b01).
  "0.line.15_threshold_amount": (_, info) => info.form3461?.threshold,
  // Line 16: "If the result is zero or greater, you do not have excess business loss ... If the result is a negative amount, enter it here" (the form).
  "0.line.16_excess_business_loss": afterCarryover((lines) =>
    lines.line16 < 0 ? lines.line16 : undefined,
  ),
  "0.line.17_excess_business_loss_adjustment": afterCarryover((lines) =>
    lines.line17Waits ? undefined : lines.line17,
  ),
};

export function register(): void {
  defineForm<Form3461, Info>("form-3461", { bindings: form3461Bindings });
}
