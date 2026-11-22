/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { Form3913FilingInfo } from "./filingInfo.js";
import type { Form3913Lines } from "./lines.js";
import type { Form3913 } from "./types.js";

const yesNo = (answer: boolean) => (answer ? "yes" : "no");

/* A line of the printed form: unsupported with a gap, blank with no move or while an answer waits. */
function lineOf<T extends number | string>(
  pick: (form: Form3913Lines) => T | undefined,
): (form: unknown, info: Form3913FilingInfo) => T | Unsupported | undefined {
  return (_, info) => {
    if (info.form3913Gap) return unsupported(info.form3913Gap);
    return info.form3913 === undefined ? undefined : pick(info.form3913);
  };
}

export function register(): void {
  defineForm<Form3913, Form3913FilingInfo>("form-3913", {
    bindings: {
      "0.header.names_on_return": (_, info) => namesOnReturn(info),
      "0.header.ssn_or_itin": (_, info) => info.taxpayerSSN,
      /*
       * MANUAL EDIT: "Before you begin: Are you a military member?" Yes for a
       * certified Armed Forces move (ca-3913-inst-2025::sec::members-of-the-armed-forces::b01),
       * No for a work move that meets the distance and time tests (non-military-members::b01).
       * With more than one move, each copy has its own answer: unsupported.
       */
      "0.header.military_member": (_, info) => {
        if (info.form3913Military === undefined) {
          return info.form3913Gap ? unsupported(info.form3913Gap) : undefined;
        }
        return yesNo(info.form3913Military);
      },
      // MANUAL EDIT: lines 1–4 (line-1, line-2::b01, line-4::b01), whole dollars (lines.ts).
      "0.line.1_transportation_storage_household_goods": lineOf((form) => form.line1),
      "0.line.2_travel_and_lodging": lineOf((form) => form.line2),
      "0.line.3_total_moving_expenses": lineOf((form) => form.line3),
      "0.line.4_employer_paid_not_in_wages": lineOf((form) => form.line4),
      // MANUAL EDIT: line 5 (line-5::b01): Yes when line 3 is more than line 4, else No.
      "0.line.5_line_3_more_than_line_4": lineOf((form) => yesNo(form.line5Yes)),
      // MANUAL EDIT: the amount prints only under Yes: "Enter the result here".
      "0.line.5_moving_expense_deduction": lineOf((form) => form.line5),
    },
  });
}
