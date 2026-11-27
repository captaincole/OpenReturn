/*
 * Form 8862, Information To Claim Certain Credits After Disallowance. Every
 * field has a rule: the header, Part I (line 1 and the line 2 boxes, claims.ts)
 * and the parts each box opens (partII.ts, partIII.ts, partIV.ts). The form
 * leaves the return when no line 2 box ends up checked.
 */

import { defineForm } from "../../defineForm.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import { aotcBox, ctcBox, eicBox } from "./claims.js";
import type { Form8862FilingInfo } from "./filingInfo.js";
import { TAX_YEAR } from "./lines.js";
import type { Bindings } from "./pairs.js";
import { partIIBindings } from "./partII.js";
import { partIIIBindings } from "./partIII.js";
import { partIVBindings } from "./partIV.js";
import type { Form8862 } from "./types.js";

const partIBindings: Bindings = {
  "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
  "0.header.ssn": (_, info) => info.taxpayerSSN,
  // Line 1 (irs-8862-inst-2025::sec::line-1::b01): the year of this return, not the year of the denial.
  "0.line.1_tax_year_filing_form": () => String(TAX_YEAR),
  "0.line.2_claiming_eic": eicBox,
  "0.line.2_claiming_ctc_actc_odc": ctcBox,
  "0.line.2_claiming_aotc": aotcBox,
};

export function register(): void {
  defineForm<Form8862, Form8862FilingInfo>("form-8862", {
    bindings: {
      ...partIBindings,
      ...partIIBindings(),
      ...partIIIBindings(),
      ...partIVBindings(),
    },
    // The SSN box prints the number with its dashes, as Form 8880 does.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
    filesOnlyWithAmountOn: [
      "form-8862.0.line.2_claiming_eic",
      "form-8862.0.line.2_claiming_ctc_actc_odc",
      "form-8862.0.line.2_claiming_aotc",
    ],
  });
}
