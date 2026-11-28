/*
 * Form 6478, Biofuel Producer Credit, on an individual's 2025 return. The
 * credit is for fuel sold or used before 2025, so lines 1 and 2 (the
 * taxpayer's own production) are blank on every 2025 return. Line 3 holds
 * the credits a pass-through entity allocates from a tax year that began in
 * 2024 (resolveInfo.ts); line 4 goes to Form 3800 Part III line 4c, which
 * takes each of those credits as its own source (form3800.ts).
 */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form6478Figures, Form6478FilingInfo } from "./filingInfo.js";
import { line4Of } from "./lines.js";
import type { Form6478 } from "./types.js";

type Value = number | Unsupported | undefined;

/*
 * Lines 1 and 2: "Enter the number of gallons of second generation biofuel
 * sold or used for the tax year that meets the conditions"
 * (irs-6478-inst-2025::sec::specific-instructions::b01), and the credit is
 * "for fuel sold or used before 2025" (what-s-new::b01): a tax year that
 * begins in 2025 has no such gallons, so "lines 1 and 2 of Form 6478 cannot be
 * used for 2025" (irs.gov, "Completing Form 6478 for tax years beginning after
 * 2024"). Blank: nothing applies, and nothing is included in income (line-2::b01).
 */
const noOwnProduction = (): undefined => undefined;

/* Line 3: the pass-through credits, or the gap of one the engine cannot place; blank with none. */
function line3Value(figures: Form6478Figures | undefined): Value {
  const line3 = figures?.line3;
  if (line3 === undefined) return undefined;
  return "gap" in line3 ? unsupported(line3.gap) : line3.amount;
}

/* Line 4: "Add lines 2 and 3"; line 2 is blank, so line 4 is line 3. */
function line4Value(figures: Form6478Figures | undefined): Value {
  const line3 = line3Value(figures);
  if (typeof line3 === "object") return line3;
  return line4Of(noOwnProduction(), line3);
}

export function register(): void {
  defineForm<Form6478, Form6478FilingInfo>("form-6478", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      "0.line.1_second_generation_biofuel_col_a": noOwnProduction,
      "0.line.1_second_generation_biofuel_col_c": noOwnProduction,
      /*
       * "To claim a second generation biofuel producer credit on line 1, you
       * must be registered with the IRS. Enter your SB registration number"
       * (irs-6478-inst-2025::sec::line-2::b01): blank with no line 1 credit.
       */
      "0.line.2_irs_registration_number": noOwnProduction,
      // "Enter the amount from column (c) on line 1": blank, as line 1 is.
      "0.line.2_amount_from_line_1": noOwnProduction,
      "0.line.3_credit_from_pass_throughs": (_, info) => line3Value(info.form6478),
      "0.line.4_add_lines_2_3": (_, info) => line4Value(info.form6478),
      /*
       * Lines 5 and 6 are for cooperatives, estates and trusts
       * (irs-6478-inst-2025::sec::line-5::b01, line-6::b01). An individual's
       * return stops at line 4: "All others, stop here and report this amount
       * on the appropriate line of Form 3800" (irs-6478-face-2025::sec::face-page-1::b01).
       */
      "0.line.5_allocated_to_patrons_beneficiaries": () => undefined,
      "0.line.6_subtract_line_5_from_4": () => undefined,
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
