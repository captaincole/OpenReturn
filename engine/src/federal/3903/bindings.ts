/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form3903FilingInfo } from "./filingInfo.js";
import type { Form3903Lines } from "./lines.js";
import type { Form3903 } from "./types.js";

/* A line of the printed form: unsupported with a gap, blank with no certified move. */
function lineOf<T extends number | boolean>(
  pick: (form: Form3903Lines) => T | undefined,
): (form: unknown, info: Form3903FilingInfo) => T | Unsupported | undefined {
  return (_, info) => {
    if (info.form3903Gap) return unsupported(info.form3903Gap);
    return info.form3903 === undefined ? undefined : pick(info.form3903);
  };
}

export function register(): void {
  defineForm<Form3903, Form3903FilingInfo>("form-3903", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      /*
       * MANUAL EDIT: the certification box (irs-3903-inst-2025::sec::specific-instructions::b01,
       * "Check the box to certify"). The form files for a move the member certifies.
       */
      "0.header.armed_forces_move_certification": (_, info) =>
        info.form3903 !== undefined || info.form3903Gap !== undefined ? true : undefined,
      // MANUAL EDIT: lines 1–4 (line-1::b01, line-2::b01, line-4::b01), whole dollars (lines.ts).
      "0.line.1_transportation_storage_household_goods": lineOf((form) => form.line1),
      "0.line.2_travel_lodging": lineOf((form) => form.line2),
      "0.line.3_total_moving_expenses": lineOf((form) => form.line3),
      "0.line.4_government_paid_amount": lineOf((form) => form.line4),
      // MANUAL EDIT: line 5 (line-5::b01): Yes when line 3 is more than line 4, else No.
      "0.line.5_line_3_more_than_line_4_no": lineOf((form) => (form.line5Yes ? undefined : true)),
      "0.line.5_line_3_more_than_line_4_yes": lineOf((form) => (form.line5Yes ? true : undefined)),
      "0.line.5_moving_expense_deduction": lineOf((form) => form.line5),
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
