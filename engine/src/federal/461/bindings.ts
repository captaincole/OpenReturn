/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import {
  formGap,
  line2Source,
  line3Source,
  line5Source,
  line6Source,
  partIAmounts,
  partIIAmounts,
  type Info,
  type Read,
} from "./figures.js";
import { line9, partIII, type PartIIIAmounts } from "./lines.js";
import type { Form461 } from "./types.js";

/* A blank line for 0 where the form asks to "enter any" amount (lines 10 and 11). */
const amountOrBlank = (amount: number) => (amount === 0 ? undefined : amount);

/* Line 12 or 13: blank when lines 10 and 11 have nothing (a 0 adds nothing to line 14). */
const partIIEntry = (lines: { line10: number; line11: number }, amount: number) =>
  lines.line10 === 0 && lines.line11 === 0 ? undefined : amount;

/* Line 9: lines 1 to 8 combined; the gap while a Part I line is unknown. */
function partIComputed(form: Read, info: Info): number | Unsupported | undefined {
  const gap = formGap(info);
  if (gap) return unsupported(gap);
  const amounts = partIAmounts(form, info);
  return amounts && line9(amounts);
}

/* Lines 10 to 16 from Part I and Part II; the gap, or undefined while a line or an answer waits. */
function computed(form: Read, info: Info) {
  const gap = formGap(info);
  if (gap) return unsupported(gap);
  const partI = partIAmounts(form, info);
  const partII = partI && partIIAmounts(form, info, partI);
  if (!partI || !partII || !info.form461) return undefined;
  return {
    ...partII,
    ...partIII(line9(partI), partII.line10, partII.line11, info.form461.threshold),
  };
}

/* One line of lines 10 to 16. */
function partIIOrIII(
  pick: (lines: PartIIIAmounts & { line10: number; line11: number }) => number | undefined,
) {
  return (form: Read, info: Info) => {
    const lines = computed(form, info);
    if (lines === undefined || "unsupported" in lines) return lines;
    return pick(lines);
  };
}

/* A Part I line the engine cannot fill on this return, else blank (lines 4 and 6). */
const gapOrBlank = (pick: (info: Info) => string | undefined) => (_: Read, info: Info) => {
  const gap = pick(info);
  return gap ? unsupported(gap) : undefined;
};

export function register(): void {
  defineForm<Form461, Info>("form-461", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // Joint returns: "Complete one Form 461 containing all the information for both spouses" (specific-instructions::b01).
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: Part I copies the return's lines (irs-461-inst-2025::sec::line-2::b01 to ::line-8::b01).
      "0.line.2_schedule_1_line_3": (form, info) => line2Source(form, info) ?? undefined,
      "0.line.3_form_1040_line_7a": (form, info) => line3Source(form, info) ?? undefined,
      // Schedule 1 line 4 comes from Form 4797, which has no rules here: blank without it.
      "0.line.4_schedule_1_line_4": gapOrBlank((info) => info.form461?.gaps.line4),
      "0.line.5_schedule_1_line_5": (form, info) => {
        const gap = info.form461?.gaps.line5;
        return gap ? unsupported(gap) : (line5Source(form, info) ?? undefined);
      },
      // MANUAL EDIT: line 6 copies Schedule 1 line 6, Schedule F line 34 (::line-6::b01); the gap when a farm's is one.
      "0.line.6_schedule_1_line_6": (form, info) => {
        const gap = info.form461?.gaps.line6;
        return gap ? unsupported(gap) : (line6Source(form, info) ?? undefined);
      },
      "0.line.8_other_business_income_loss": (_, info) => info.form461?.otherBusinessIncome,
      "0.line.9_total_income_loss_items": partIComputed,
      // MANUAL EDIT: Part II (line-10::b01, line-11::b01, line-12::b01; figures.ts and classify.ts).
      "0.line.10_nonbusiness_income_gain": partIIOrIII((lines) => amountOrBlank(lines.line10)),
      "0.line.11_nonbusiness_losses_deductions": partIIOrIII((lines) =>
        amountOrBlank(lines.line11),
      ),
      // Lines 12 and 13 are blank when Part II has nothing to enter.
      "0.line.12_nonbusiness_net_adjustment": partIIOrIII((lines) =>
        partIIEntry(lines, lines.line12),
      ),
      // MANUAL EDIT: Part III (line-14::b01, line-16::b01; lines.ts).
      "0.line.13_line_12_sign_reversed": partIIOrIII((lines) => partIIEntry(lines, lines.line13)),
      "0.line.14_net_business_income_loss": partIIOrIII((lines) => lines.line14),
      // Line 15: $313,000, or $626,000 if married filing jointly (who-must-file::b02).
      "0.line.15_threshold_amount": (_, info) => info.form461?.threshold,
      "0.line.16_excess_business_loss": partIIOrIII((lines) => lines.line16),
    },
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
