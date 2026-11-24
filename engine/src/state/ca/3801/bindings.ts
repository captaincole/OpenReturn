/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 *
 * MANUAL EDIT: FTB 3801, Passive Activity Loss Limitations, for a California
 * resident (Form 540). Side 1 is lines.ts; Side 2 is worksheetBindings.ts;
 * Sides 3 and 4 are partBindings.ts. Every field reads context.ts, which
 * reads the resolver's California figures (formScope.ts).
 */

import { defineForm, type FormSpec } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { SSN } from "../../../values.js";
import { fromContext } from "./context.js";
import type { Form3801FilingInfo } from "./filingInfo.js";
import type { Form3801Lines } from "./lines.js";
import { partBindings, type Fn } from "./partBindings.js";
import type { Form3801 } from "./types.js";
import { worksheetBindings } from "./worksheetBindings.js";

type Bindings = FormSpec<Form3801, Form3801FilingInfo>["bindings"];

/* Side 1's fields and the line each prints; Part II prints positive amounts (part-ii::b01). */
const SIDE_1: ReadonlyArray<[fieldId: string, line: keyof Form3801Lines]> = [
  ["0.line.1a_rental_real_estate_net_income", "line1a"],
  ["0.line.1b_rental_real_estate_net_loss", "line1b"],
  ["0.line.1c_rental_real_estate_prior_unallowed_losses", "line1c"],
  ["0.line.1d_rental_real_estate_combined", "line1d"],
  ["0.line.2a_other_passive_net_income", "line2a"],
  ["0.line.2b_other_passive_net_loss", "line2b"],
  ["0.line.2c_other_passive_prior_unallowed_losses", "line2c"],
  ["0.line.2d_other_passive_combined", "line2d"],
  ["0.line.3_total_passive_income_or_loss", "line3"],
  ["0.line.4_smaller_of_1d_or_3_loss", "line4"],
  ["0.line.5_special_allowance_income_limit", "line5"],
  ["0.line.6_federal_modified_agi", "line6"],
  ["0.line.7_limit_minus_modified_agi", "line7"],
  ["0.line.8_half_of_line_7", "line8"],
  ["0.line.9_special_allowance", "line9"],
  ["0.line.10_passive_income_total", "line10"],
  ["0.line.11_total_losses_allowed", "line11"],
];

/* The lines that read line 6, and so show its gap (context.ts). */
const READS_LINE_6: ReadonlyArray<keyof Form3801Lines> = [
  "line6",
  "line7",
  "line8",
  "line9",
  "line11",
];

function side1Bindings(): Record<string, Fn> {
  return Object.fromEntries(
    SIDE_1.map(([fieldId, line]) => [
      fieldId,
      fromContext((context) => context.lines[line], READS_LINE_6.includes(line)),
    ]),
  );
}

/* Every FTB 3801 binding; the unit tests evaluate them without the engine. */
export function form3801Bindings(): Bindings {
  const bindings: Record<string, Fn> = {
    "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
    // A joint return shows the SSN listed first on the return, the taxpayer's.
    "0.header.ssn": (_, info) => info.taxpayerSSN,
    ...side1Bindings(),
    ...worksheetBindings(),
    ...partBindings(),
  };
  return bindings as Bindings;
}

export function register(): void {
  defineForm<Form3801, Form3801FilingInfo>("form-3801", {
    bindings: form3801Bindings(),
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
