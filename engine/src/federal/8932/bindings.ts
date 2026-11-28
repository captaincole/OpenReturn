/*
 * Form 8932, Credit for Employer Differential Wage Payments, for an individual
 * with employees in a Schedule C business or a Schedule F farm. Lines 1 to 3
 * read only facts (resolveInfo.ts, lines.ts); line 2 also lowers the wages of
 * the activity that paid them (facts/kinds/differentialWage.ts), and line 4
 * goes to Form 3800 Part III line 1w (form3800.ts). Lines 5 and 6 are for
 * cooperatives, estates and trusts: "All others, stop here"
 * (irs-8932-form-2025::sec::face-page-1::b01).
 */

import { defineForm } from "../../defineForm.js";
import type { Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { isGap } from "../3800/cells.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8932FilingInfo } from "./filingInfo.js";
import { line4Of, type Lines1To2 } from "./lines.js";
import type { Form8932 } from "./types.js";

type Value = number | Unsupported | undefined;

/* Line 1 or 2, or the gap or wait of both. */
function linesValue(info: Form8932FilingInfo, pick: (lines: Lines1To2) => number): Value {
  const lines = info.differentialWage?.lines;
  return lines === undefined || isGap(lines) ? lines : pick(lines);
}

/* Line 4: "Add lines 2 and 3" (face-page-1::b01); blank while both are blank. */
function line4Value(info: Form8932FilingInfo): Value {
  const line2 = linesValue(info, (lines) => lines.line2);
  const line3 = info.differentialWage?.line3;
  if (isGap(line2)) return line2;
  if (isGap(line3)) return line3;
  return line4Of(line2, line3);
}

/* The form files only with a credit on line 4 (resolveInfo.ts). */
const LINE_4 = "form-8932.0.line.4_add_lines_2_and_3";

export function register(): void {
  defineForm<Form8932, Form8932FilingInfo>("form-8932", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      "0.line.1_eligible_differential_wage_payments": (_, info) =>
        linesValue(info, (lines) => lines.line1),
      "0.line.2_line1_times_20_percent": (_, info) => linesValue(info, (lines) => lines.line2),
      "0.line.3_credit_from_pass_through_entities": (_, info) => info.differentialWage?.line3,
      "0.line.4_add_lines_2_and_3": (_, info) => line4Value(info),
      /*
       * Lines 5 and 6: "Cooperatives, estates, and trusts, go to line 5 ... All
       * others, stop here and report this amount on Form 3800, Part III, line
       * 1w" (face-page-1::b01). An individual's return leaves them blank.
       */
      "0.line.5_amount_allocated_to_patrons_beneficiaries": () => undefined,
      "0.line.6_cooperatives_estates_trusts_credit": () => undefined,
    },

    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },

    filesOnlyWithAmountOn: LINE_4,
  });
}
