/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type FormAccessor } from "../../defineForm.js";
import type { Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form7206FilingInfo } from "./filingInfo.js";
import { ratioText, type Form7206Lines } from "./lines.js";
import { planLines } from "./results.js";
import type { Form7206 } from "./types.js";

type Form = FormAccessor<Form7206>;

/*
 * MANUAL EDIT: one copy per plan ("Use a separate Form 7206 for each trade or
 * business under which an insurance plan is established", the form's note).
 * A line of this copy: the plan's gap, blank with no plan or while a line it
 * reads waits, else the line (lines.ts). A line the plan's kind skips is blank.
 */
function lineOf<T extends number | string>(
  pick: (lines: Form7206Lines) => T | undefined,
): (form: Form, info: Form7206FilingInfo) => T | Unsupported | undefined {
  return (form, info) => {
    const plan = info.form7206Plans?.[info.form7206CopyIndex ?? 0];
    if (plan === undefined) return undefined;
    const lines = planLines(plan, form, info);
    if (lines === undefined || "unsupported" in lines) return lines;
    return pick(lines);
  };
}

export function register(): void {
  defineForm<Form7206, Form7206FilingInfo>("form-7206", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.taxpayer_id": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: lines 1 and 2 (irs-7206-face-2025::sec::face-page-1::b01, ::b02; plans.ts, lines.ts).
      "0.line.1_health_insurance_paid": lineOf((lines) => lines.line1),
      "0.line.2_long_term_care_premiums": lineOf((lines) => lines.line2),
      "0.line.3_total_premiums": lineOf((lines) => lines.line3),
      // MANUAL EDIT: lines 4–10 for a Schedule C or F business; blank for an S corporation ("skip to line 11").
      "0.line.4_business_net_profit": lineOf((lines) => lines.line4),
      "0.line.5_total_net_profits": lineOf((lines) => lines.line5),
      "0.line.6_business_profit_ratio": lineOf((lines) =>
        lines.line6 === undefined ? undefined : ratioText(lines.line6),
      ),
      "0.line.7_allocated_se_tax_deduction": lineOf((lines) => lines.line7),
      "0.line.8_profit_less_se_tax": lineOf((lines) => lines.line8),
      "0.line.9_retirement_plan_deduction": lineOf((lines) => lines.line9),
      "0.line.10_net_earned_income": lineOf((lines) => lines.line10),
      // MANUAL EDIT: line 11, W-2 box 5 from the S corporation (::b03).
      "0.line.11_s_corp_medicare_wages": lineOf((lines) => lines.line11),
      // MANUAL EDIT: line 12, Form 2555 line 45 attributable to line 4 or 11 (results.ts).
      "0.line.12_form_2555_exclusion": lineOf((lines) => lines.line12),
      "0.line.13_earned_income_limit": lineOf((lines) => lines.line13),
      "0.line.14_se_health_insurance_deduction": lineOf((lines) => lines.line14),
    },

    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.taxpayer_id": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
