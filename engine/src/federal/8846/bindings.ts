/*
 * Form 8846, Credit for Employer Social Security and Medicare Taxes Paid on
 * Certain Employee Tips, for an individual: lines 1 to 4 from the tip credit
 * facts of the taxpayer's own businesses (figures.ts), line 5 from the K-1s,
 * line 6 to Form 3800 Part III line 4f (form3800.ts). Line 4 also reduces the
 * business's Schedule C line 23 (facts/kinds/activitiesOnReturn.ts).
 */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8846Figures, Form8846FilingInfo } from "./filingInfo.js";
import { line6Of, type CreditLines } from "./lines.js";
import type { Form8846 } from "./types.js";

type Value = number | Unsupported | undefined;

/*
 * Lines 1 to 4: "Figure the current-year credit from your trade or business
 * on lines 1 through 4" (irs-8846-form-2025::sec::specific-instructions::b01).
 * Blank with no credit of the taxpayer's own business (only line 5), and while
 * an answer is missing; the gap when the facts do not add up.
 */
function ownLine(info: Form8846FilingInfo, line: keyof CreditLines): Value {
  const figures = info.form8846;
  if (figures === undefined || !figures.ownCredit) return undefined;
  if (figures.gap !== undefined) return unsupported(figures.gap);
  return figures.lines?.[line];
}

/* Line 5: the K-1 credits, or the gap of a K-1 with no amount; blank with none. */
function line5Of(figures: Form8846Figures | undefined): Value {
  const k1 = figures?.k1Credits;
  if (k1 === undefined) return undefined;
  return "gap" in k1 ? unsupported(k1.gap) : k1.amount;
}

const isGap = (value: Value): value is Unsupported => typeof value === "object";

/* Line 6: "Add lines 4 and 5"; blank while both are blank. */
function line6Value(info: Form8846FilingInfo): Value {
  const line4 = ownLine(info, "line4");
  const line5 = line5Of(info.form8846);
  if (isGap(line4)) return line4;
  if (isGap(line5)) return line5;
  if (line4 === undefined && line5 === undefined) return undefined;
  if (info.form8846?.ownCredit && line4 === undefined) return undefined;
  return line6Of(line4, line5);
}

export function register(): void {
  defineForm<Form8846, Form8846FilingInfo>("form-8846", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      "0.line.1_tips_received_by_employees": (_, info) => ownLine(info, "line1"),
      "0.line.2_tips_not_subject_to_credit": (_, info) => ownLine(info, "line2"),
      "0.line.3_subtract_2_from_1": (_, info) => ownLine(info, "line3"),
      /*
       * "If you had any tipped employees whose wages (including tips) exceeded
       * $176,100, see instructions and check here" (irs-8846-form-2025::sec::face-page-1::b01).
       */
      "0.line.4_wages_exceeded_limit_check": (_, info) =>
        info.form8846?.ownCredit ? info.form8846.overWageBase : undefined,
      "0.line.4_multiply_3_by_7_65_percent": (_, info) => ownLine(info, "line4"),
      "0.line.5_credit_from_partnerships_s_corps": (_, info) => line5Of(info.form8846),
      "0.line.6_add_lines": (_, info) => line6Value(info),
    },

    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
