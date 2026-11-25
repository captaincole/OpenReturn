/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import {
  itemAOf,
  line1Of,
  line3Of,
  line4Of,
  partIILine,
  partILine,
  type Form8911CreditInfo,
} from "./credit.js";
import type { Form8911 } from "./types.js";

/*
 * The form files only with a credit: line 3 (the business part), or line 10,
 * read where it lands, Schedule 3 line 6j. Lines 7 and 9: "do not file this
 * form unless you are claiming a credit on line 3".
 */
const CREDIT_FIELDS = ["form-8911.0.line.3_business_investment_use_credit", "schedule-3.0.line.6j"];

export function register(): void {
  defineForm<Form8911, Form8911CreditInfo>("form-8911", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: Item A (irs-8911-inst-2025::sec::specific-instructions-for-form::b01).
      "0.header.a_number_of_refueling_properties": (_, info) => itemAOf(info),
      // MANUAL EDIT: Part I, Schedule A line 16 of each property (blank form; line-2::b01, line-3::b01).
      "0.line.1_business_credit_from_schedule_a": (_, info) => line1Of(info),
      "0.line.2_credit_from_partnerships_s_corporations": (_, info) =>
        partILine(info, (lines) => lines.line2),
      "0.line.3_business_investment_use_credit": (form, info) => line3Of(form, info),
      // MANUAL EDIT: Part II, Schedule A line 21 of each property, then the tax limit (line-6b::b01, line-8::b01, line-10::b01).
      "0.line.4_personal_credit_from_schedule_a": (_, info) => line4Of(info),
      "0.line.5_regular_tax_before_credits": (form, info) =>
        partIILine(form, info, (lines) => lines.line5),
      "0.line.6a_foreign_tax_credit": (form, info) =>
        partIILine(form, info, (lines) => lines.line6a),
      "0.line.6b_certain_allowable_credits": (form, info) =>
        partIILine(form, info, (lines) => lines.line6b),
      "0.line.6c_total_credits_reducing_tax": (form, info) =>
        partIILine(form, info, (lines) => lines.line6c),
      "0.line.7_net_regular_tax": (form, info) => partIILine(form, info, (lines) => lines.line7),
      "0.line.8_tentative_minimum_tax": (form, info) =>
        partIILine(form, info, (lines) => lines.line8),
      "0.line.9_net_tax_less_minimum_tax": (form, info) =>
        partIILine(form, info, (lines) => lines.line9),
      "0.line.10_personal_use_credit": (form, info) =>
        partIILine(form, info, (lines) => lines.line10),
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },

    filesOnlyWithAmountOn: CREDIT_FIELDS,
  });
}
