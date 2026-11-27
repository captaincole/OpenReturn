/*
 * Form 5884, Work Opportunity Credit, for an individual with targeted group
 * employees in a Schedule C business or a Schedule F farm. Lines 1a to 3 read
 * only facts (resolveInfo.ts, lines.ts); line 4 goes to Form 3800 Part III
 * line 4b (federal/5884/sources.ts). Lines 5 and 6 are for cooperatives,
 * estates and trusts: "All others, stop here" (irs-5884-face-2025::sec::face-page-1::b02).
 */

import { defineForm } from "../../defineForm.js";
import type { Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { isGap } from "../3800/cells.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form5884FilingInfo } from "./filingInfo.js";
import { line4Of, type Lines1To2, type RateLine } from "./lines.js";
import type { Form5884 } from "./types.js";

type Value = number | Unsupported | undefined;

/* One of lines 1a to 2, or the gap or wait of all of them. */
function linesValue(
  info: Form5884FilingInfo,
  pick: (lines: Lines1To2) => number | undefined,
): Value {
  const lines = info.workOpportunity?.lines;
  return lines === undefined || isGap(lines) ? lines : pick(lines);
}

const wagesOf = (line: RateLine | undefined) => line?.wages;
const creditOf = (line: RateLine | undefined) => line?.credit;

/* Line 4: "Add lines 2 and 3" (face-page-1::b02). */
function line4Value(info: Form5884FilingInfo): Value {
  const line2 = linesValue(info, (lines) => lines.line2);
  const line3 = info.workOpportunity?.line3;
  if (isGap(line2)) return line2;
  if (isGap(line3)) return line3;
  return line2 === undefined ? undefined : line4Of(line2, line3);
}

/* The form files only with a credit of its own on line 2 (resolveInfo.ts). */
const LINE_2 = "form-5884.0.line.2_add_lines";

export function register(): void {
  defineForm<Form5884, Form5884FilingInfo>("form-5884", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      // Lines 1a to 1c: the wages in the entry space, the credit in the right column (lines.ts).
      "0.line.1a_first_year_wages_120_hours": (_, info) =>
        linesValue(info, (lines) => wagesOf(lines.line1a)),
      "0.line.1a_multiply_wages_by_25_percent": (_, info) =>
        linesValue(info, (lines) => creditOf(lines.line1a)),
      "0.line.1b_first_year_wages_400_hours": (_, info) =>
        linesValue(info, (lines) => wagesOf(lines.line1b)),
      "0.line.1b_multiply_wages_by_40_percent": (_, info) =>
        linesValue(info, (lines) => creditOf(lines.line1b)),
      "0.line.1c_second_year_wages_ltfa": (_, info) =>
        linesValue(info, (lines) => wagesOf(lines.line1c)),
      "0.line.1c_multiply_wages_by_50_percent": (_, info) =>
        linesValue(info, (lines) => creditOf(lines.line1c)),
      "0.line.2_add_lines": (_, info) => linesValue(info, (lines) => lines.line2),
      "0.line.3_pass_through_credit": (_, info) => info.workOpportunity?.line3,
      "0.line.4_total_work_opportunity_credit": (_, info) => line4Value(info),
      /*
       * Lines 5 and 6: "Cooperatives, estates, and trusts, go to line 5 ... All
       * others, stop here and report this amount on Form 3800, Part III, line 4b"
       * (face-page-1::b02). An individual's return leaves them blank.
       */
      "0.line.5_allocated_to_patrons_beneficiaries": () => undefined,
      "0.line.6_subtract_5_from_4": () => undefined,
    },

    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },

    filesOnlyWithAmountOn: LINE_2,
  });
}
