/*
 * Form 8834, Qualified Electric Vehicle Credit, for an individual: a passive
 * activity credit carried from a year before 2007 that Form 8582-CR allows
 * this year (line 1), limited by the tax (lines 2 to 7). The rules are in
 * credit.ts and lines.ts.
 */

import { defineForm } from "../../defineForm.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import {
  line1Of,
  line7Value,
  netRegularTaxLine,
  taxLimitLine,
  type Form8834CreditInfo,
} from "./credit.js";
import type { Form8834 } from "./types.js";

/*
 * The form files only with a credit allowed on line 1: "Use Form 8834 to claim
 * any qualified electric vehicle passive activity credit allowed for the
 * current tax year" (irs-8834-form-2025::sec::purpose-of-form::b01).
 */
const LINE_1 = "form-8834.0.line.1_passive_activity_credits_allowed";

export function register(): void {
  defineForm<Form8834, Form8834CreditInfo>("form-8834", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      "0.line.1_passive_activity_credits_allowed": (form, info) => line1Of(form, info),
      "0.line.2_regular_tax_before_credits": (form, info) =>
        netRegularTaxLine(form, info, (lines) => lines.line2),
      "0.line.3a_foreign_tax_credit": (form, info) =>
        netRegularTaxLine(form, info, (lines) => lines.line3a),
      "0.line.3b_certain_allowable_credits": (form, info) =>
        netRegularTaxLine(form, info, (lines) => lines.line3b),
      "0.line.3c_total_credits": (form, info) =>
        netRegularTaxLine(form, info, (lines) => lines.line3c),
      "0.line.4_net_regular_tax": (form, info) =>
        netRegularTaxLine(form, info, (lines) => lines.line4),
      "0.line.5_tentative_minimum_tax": (form, info) =>
        taxLimitLine(form, info, (lines) => lines.line5),
      "0.line.6_net_tax_less_minimum_tax": (form, info) =>
        taxLimitLine(form, info, (lines) => lines.line6),
      "0.line.7_qualified_electric_vehicle_credit": (form, info) => line7Value(form, info),
    },

    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },

    filesOnlyWithAmountOn: LINE_1,
  });
}
