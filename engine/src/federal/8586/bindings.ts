/*
 * Form 8586, Low-Income Housing Credit, for an individual who owns a
 * low-income housing building directly (a Form 8609-A for each building) and
 * may also hold the credit through a K-1. Lines 1 to 5 come from the resolver
 * (resolveInfo.ts, lines.ts); line 5 goes to Form 3800 Part III line 4d
 * (form3800.ts). Lines 6 and 7 are for estates and trusts: "All others, stop
 * here" (irs-8586-form-2025::sec::face-page-1::b01).
 */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8586FilingInfo } from "./filingInfo.js";
import { LINE_2_BIN_ROWS, type Form8586Lines } from "./lines.js";
import type { Form8586 } from "./types.js";

const MORE_BINS_GAP = (count: number) =>
  `${count} buildings had a decreased basis; line 2 holds four BINs and the rest go on an attached schedule ("If you need more space, attach a schedule", irs-8586-form-2025::sec::face-page-1::b01), which the engine does not write.`;

/* A line from the resolver's lines; blank while the form does not file. */
const lineOf =
  <T extends number | string | boolean>(
    pick: (lines: Form8586Lines) => T | Unsupported | undefined,
  ) =>
  (_: unknown, info: Form8586FilingInfo): T | Unsupported | undefined => {
    const lines = info.lowIncomeHousingCredit;
    return lines === undefined ? undefined : pick(lines);
  };

/* Line 2's BIN in row `index` ((i) is 0); the last row names the schedule's gap when more are left. */
function binOf(index: number) {
  return lineOf((lines) => {
    const bins = lines.decreasedBins;
    if (index === LINE_2_BIN_ROWS - 1 && bins.length > LINE_2_BIN_ROWS) {
      return unsupported(MORE_BINS_GAP(bins.length));
    }
    return bins[index];
  });
}

export function register(): void {
  defineForm<Form8586, Form8586FilingInfo>("form-8586", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      // Line 1: "Number of Forms 8609-A attached" (face-page-1::b01).
      "0.line.1_forms_8609a_attached": lineOf((lines) => lines.line1),
      // Line 2: Yes or No, from item E of each Form 8609-A (lines.ts).
      "0.line.2_yes": lineOf((lines) => (lines.line2Decreased ? true : undefined)),
      "0.line.2_no": lineOf((lines) => (lines.line2Decreased ? undefined : true)),
      "0.line.2_i_decreased_basis_bin": binOf(0),
      "0.line.2_ii_decreased_basis_bin": binOf(1),
      "0.line.2_iii_decreased_basis_bin": binOf(2),
      "0.line.2_iv_decreased_basis_bin": binOf(3),
      // Line 3: the total of line 18 of the Forms 8609-A (line-3::b01).
      "0.line.3_current_year_credit_8609a": lineOf((lines) => lines.line3),
      // Line 4: the K-1 credits and other pass-through notices (passThroughCredits.ts).
      "0.line.4_credit_from_pass_through": lineOf((lines) => lines.line4),
      // Line 5: "Add lines 3 and 4" (face-page-1::b01).
      "0.line.5_add_lines": lineOf((lines) => lines.line5),
      /*
       * Lines 6 and 7: "Estates and trusts, go to line 6. ... All others, stop
       * here and report this amount on Form 3800, Part III, line 4d"
       * (face-page-1::b01); line 6 is the beneficiaries' share (line-6::b01).
       * An individual's return leaves them blank.
       */
      "0.line.6_allocated_to_beneficiaries": () => undefined,
      "0.line.7_subtract_6_from_5": () => undefined,
    },

    // The identifying number widget (maxLength 11) keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
