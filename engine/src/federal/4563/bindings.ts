/* Form 4563 rules: Part I in answers.ts, Part II here, the arithmetic in lines.ts. */

import { defineForm, type FormSpec } from "../../defineForm.js";
import type { AmericanSamoaOtherIncome } from "../../facts/index.js";
import { formatDollars } from "../../money.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import { answer, filerOf, partIBindings, type Binding } from "./answers.js";
import type { Form4563FilingInfo } from "./filingInfo.js";
import type { Form4563Lines } from "./lines.js";
import type { Form4563 } from "./types.js";

type Form4563Bindings = FormSpec<Form4563, Form4563FilingInfo>["bindings"];

/* A Part II line of this copy's person (irs-4563-form-2025::sec::face-part-ii::b01); blank with no amount. */
const line = (pick: (lines: Form4563Lines) => number | undefined): Binding =>
  answer((_, filer) => pick(filer.lines));

/* Line 14: "List type and amount", the first kind on the first line and the rest on the second. */
function otherIncomeText(items: AmericanSamoaOtherIncome[], part: 0 | 1): string | undefined {
  const listed = items.map((item) => `${item.description} ${formatDollars(item.amount)}`);
  if (part === 0) return listed[0];
  return listed.length > 1 ? listed.slice(1).join("; ") : undefined;
}

function partIIBindings(): Record<string, Binding> {
  return {
    "0.line.7_wages_salaries_tips": line((lines) => lines.line7),
    "0.line.8_taxable_interest": line((lines) => lines.line8),
    "0.line.9_ordinary_dividends": line((lines) => lines.line9),
    "0.line.10_business_income": line((lines) => lines.line10),
    "0.line.11_capital_gain": line((lines) => lines.line11),
    "0.line.12_rental_real_estate_royalties": line((lines) => lines.line12),
    "0.line.13_farm_income": line((lines) => lines.line13),
    "0.line.14_other_income_type": answer((value) => otherIncomeText(value.otherIncome ?? [], 0)),
    "0.line.14_other_income_type_cont": answer((value) =>
      otherIncomeText(value.otherIncome ?? [], 1),
    ),
    "0.line.14_other_income": line((lines) => lines.line14),
    // "Add lines 7 through 14. This is the amount you may exclude from your gross income."
    "0.line.15_total_exclusion": line((lines) => lines.line15),
  };
}

export function register(): void {
  defineForm<Form4563, Form4563FilingInfo>("form-4563", {
    bindings: {
      // "Name(s) shown on Form 1040 or 1040-SR": both names on a joint return.
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // Each person's own form: the spouse's copy carries the spouse's number.
      "0.header.ssn": (_, info) =>
        filerOf(info)?.owner === "spouse" ? info.spouseSSN : info.taxpayerSSN,
      // The rows of line 6 are built in a loop, so the record's keys are strings.
      ...(partIBindings() as Form4563Bindings),
      ...(partIIBindings() as Form4563Bindings),
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
