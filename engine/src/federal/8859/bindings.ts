/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type FormAccessor } from "../../defineForm.js";
import type { Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import {
  form8859LinesOf,
  isUnsupported,
  line1Of,
  taxLiabilityLimitOf,
  type Form8859CreditInfo,
} from "./creditLimit.js";
import type { Form8859Lines, TaxLiabilityLimit } from "./lines.js";
import type { Form8859 } from "./types.js";

type Form = FormAccessor<Form8859>;
// MANUAL EDIT: worksheet line 2 reads the slots of the credits before this one.
type Info = Form8859CreditInfo;
type Cell = number | Unsupported | undefined;

const formLine =
  (pick: (lines: Form8859Lines) => number) =>
  (form: Form, info: Info): Cell => {
    const lines = form8859LinesOf(form, info);
    if (lines === undefined || isUnsupported(lines)) return lines;
    return pick(lines);
  };

const worksheetLine =
  (pick: (limit: TaxLiabilityLimit) => number) =>
  (form: Form, info: Info): Cell => {
    const limit = taxLiabilityLimitOf(form, info);
    if (limit === undefined || isUnsupported(limit)) return limit;
    return pick(limit);
  };

export function register(): void {
  defineForm<Form8859, Info>("form-8859", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: line 1 is line 4 of the 2024 Form 8859 (irs-8859-form-2025::sec::face-page-1::b01).
      "0.line.1_credit_carryforward_from_2024": (_, info) => line1Of(info),
      // MANUAL EDIT: line 2 is worksheet line 3 (tax-liability-limit-worksheet-line-2::b02).
      "0.line.2_tax_liability_limitation": formLine((lines) => lines.line2),
      "0.line.3_current_year_credit": formLine((lines) => lines.line3),
      "0.line.4_credit_carryforward_to_2026": formLine((lines) => lines.line4),
      // MANUAL EDIT: the worksheet (tax-liability-limit-worksheet-line-2::b01, b02).
      "0.worksheet.1_tax_liability_before_credits": worksheetLine((limit) => limit.line1),
      "0.worksheet.2_total_other_credits": worksheetLine((limit) => limit.line2),
      "0.worksheet.3_tax_liability_limit": worksheetLine((limit) => limit.line3),
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
