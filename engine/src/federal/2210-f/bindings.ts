/*
 * Form 2210-F rules, written by hand from irs-2210f-inst-2025 and the form face
 * (irs-2210f-face-2025); no answer key (QUESTIONS.md). Every line comes from one
 * outcome (outcome.ts → lines.ts). A gap makes every line unsupported; while an
 * answer waits, every line is blank and the form stays on the return.
 */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form2210FFilingInfo } from "./filingInfo.js";
import type { Form2210FLines, PenaltyLines } from "./lines.js";
import { form2210FOutcome } from "./outcome.js";
import type { Form2210F } from "./types.js";

type Value = number | boolean | string;
type Binding = (form: unknown, info: Form2210FFilingInfo) => Value | Unsupported | undefined;

/* A Part I box or a Part II line, once the form is figured. */
function fromLines(pick: (lines: Form2210FLines) => Value | undefined): Binding {
  return (form, info) => {
    const outcome = form2210FOutcome(form as never, info);
    if (outcome.kind === "gap") return unsupported(outcome.reason);
    return outcome.kind === "figured" ? pick(outcome.lines) : undefined;
  };
}

/* A Part III line: blank when no penalty is owed. */
const fromPenalty = (pick: (penalty: PenaltyLines) => Value) =>
  fromLines((lines) => (lines.penalty ? pick(lines.penalty) : undefined));

/* Line 14 prints the month and the day; the year "26" is printed on the form. */
function datePart(day: number, part: "month" | "day"): string {
  const date = new Date(day * 86_400_000);
  const value = part === "month" ? date.getUTCMonth() + 1 : date.getUTCDate();
  return String(value).padStart(2, "0");
}

const BINDINGS: Record<string, Binding> = {
  "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
  "0.header.identifying_number": (_, info) => info.taxpayerSSN,
  // Part I (irs-2210f-face-2025::sec::face-part-i::b01): an unchecked box is false and prints blank.
  "0.line.box_a_waiver_request": fromLines((lines) => lines.boxA),
  "0.line.box_b_joint_return_one_year": fromLines((lines) => lines.boxB),
  // Part II (irs-2210f-face-2025::sec::face-part-ii::b01–b02; irs-2210f-inst-2025::sec::line-1::b01 to line-10::b02).
  "0.line.1_tax_after_credits": fromLines((lines) => lines.line1),
  "0.line.2_other_taxes": fromLines((lines) => lines.line2),
  "0.line.3_add_lines_1_2": fromLines((lines) => lines.line3),
  "0.line.4_refundable_credits": fromLines((lines) => lines.line4),
  "0.line.6_current_year_tax": fromLines((lines) => lines.line6),
  "0.line.7_two_thirds_current_tax": fromLines((lines) => lines.line7),
  "0.line.8_withholding_taxes": fromLines((lines) => lines.line8),
  "0.line.9_tax_less_withholding": fromLines((lines) => lines.line9),
  "0.line.10_prior_year_tax": fromLines((lines) => lines.line10),
  "0.line.11_required_annual_payment": fromLines((lines) => lines.line11),
  "0.line.12_estimated_payments_withholding": fromLines((lines) => lines.line12),
  "0.line.13_underpayment": fromLines((lines) => lines.line13),
  // Part III (irs-2210f-face-2025::sec::face-part-iii::b01; irs-2210f-inst-2025::sec::waiver-of-penalty::b01).
  "0.line.14_payment_date_month": fromPenalty((penalty) => datePart(penalty.line14, "month")),
  "0.line.14_payment_date_day": fromPenalty((penalty) => datePart(penalty.line14, "day")),
  "0.line.15_days_from_jan_15": fromPenalty((penalty) => penalty.line15),
  "0.line.16_penalty": fromPenalty((penalty) => penalty.line16),
};

/* "File Form 2210-F only if one or both of the boxes in Part I apply to you" (face-header::b01). */
export const FORM_2210F_BOXES = [
  "form-2210-f.0.line.box_a_waiver_request",
  "form-2210-f.0.line.box_b_joint_return_one_year",
];

type Bindings = Partial<{ [K in keyof Form2210F]: BindingFn<Form2210F, Form2210FFilingInfo, K> }>;

export function register(): void {
  defineForm<Form2210F, Form2210FFilingInfo>("form-2210-f", {
    bindings: BINDINGS as Bindings,
    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
    filesOnlyWithAmountOn: FORM_2210F_BOXES,
  });
}
