/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { sumOrBlank } from "../../money.js";
import { SSN } from "../../values.js";
import { addCells, type Cell } from "../3800/cells.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8844FilingInfo } from "./filingInfo.js";
import { line4Of } from "./lines.js";
import { isPassThroughZoneCredit } from "./sources.js";
import type { Form8844 } from "./types.js";

/*
 * MANUAL EDIT: line 3, the credits from Schedule K-1 (Form 1065) box 15 code L,
 * Schedule K-1 (Form 1120-S) box 13 code L, Schedule K-1 (Form 1041) box 13
 * code K and Form 1099-PATR box 12 (irs-8844-inst-2025::sec::line-3::b01): "All
 * other filers figuring a separate credit on earlier lines must report the
 * above credits on line 3". Form 3800 holds each one as a line 3 source; blank
 * when there is none.
 */
function line3Of(info: Form8844FilingInfo): Cell {
  const sources = (info.form3800Sources?.current ?? []).filter(isPassThroughZoneCredit);
  const amounts = sources.map((source) => source.credit.amount);
  const gap = amounts.find((amount) => typeof amount === "object");
  return gap ?? sumOrBlank(...amounts);
}

/* MANUAL EDIT: line 4, "Add lines 2 and 3"; an individual stops here (face, line 4). */
function line4(info: Form8844FilingInfo): Cell {
  const line2 = info.form8844?.line2;
  // Line 2 waits on an employee's work opportunity credit wages, so line 4 waits too.
  if (info.form8844 !== undefined && line2 === undefined) return undefined;
  const line3 = line3Of(info);
  if (typeof line2 === "number" && typeof line3 !== "object") return line4Of(line2, line3 ?? 0);
  return addCells(line2, line3);
}

export function register(): void {
  defineForm<Form8844, Form8844FilingInfo>("form-8844", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: line 1, each qualified zone employee's wages up to $15,000 (irs-8844-inst-2025::sec::specific-instructions::b01; lines.ts).
      "0.line.1_qualified_empowerment_zone_wages": (_, info) => info.form8844?.line1,
      // MANUAL EDIT: line 2, line 1 × 20% (lines.ts).
      "0.line.2_multiply_1_by_20_percent": (_, info) => info.form8844?.line2,
      "0.line.3_credit_from_pass_through_entities": (_, info) => line3Of(info),
      "0.line.4_add_lines": (_, info) => line4(info),
      /*
       * MANUAL EDIT: lines 5 and 6 are for cooperatives, estates and trusts
       * (irs-8844-inst-2025::sec::line-5::b01; complete-form-8810-corporate-passive-activity-loss::b01).
       * An individual's return never fills them: "All others, stop here" at line 4.
       */
      "0.line.5_allocated_to_patrons_beneficiaries": () => undefined,
      "0.line.6_subtract_5_from_4": () => undefined,
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
