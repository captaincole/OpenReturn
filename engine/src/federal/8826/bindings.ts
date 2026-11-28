/*
 * Form 8826, Disabled Access Credit, for an individual: lines 1 to 6 from the
 * disabled access facts of the taxpayer's own businesses (figures.ts), line 7
 * from the K-1s, line 8 to Form 3800 Part III line 1e (form3800.ts). Line 6
 * also reduces the business's Schedule C expense line
 * (facts/kinds/activitiesOnReturn.ts). Lines 2 and 4 are printed on the form
 * ($250 and $10,000) and have no fields.
 */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8826Figures, Form8826FilingInfo } from "./filingInfo.js";
import { line8Of, type CreditLines } from "./lines.js";
import type { Form8826 } from "./types.js";

type Value = number | Unsupported | undefined;
type CentsRule = (form: unknown, info: Form8826FilingInfo) => string | Unsupported | undefined;

/*
 * Lines 1 to 6: the taxpayer's own expenditures. Blank with none (only line
 * 7), and while a prior-year answer is missing; the gap when the facts cannot
 * be figured.
 */
function ownLine(info: Form8826FilingInfo, line: keyof CreditLines): Value {
  const figures = info.form8826;
  if (figures === undefined || !figures.ownCredit) return undefined;
  if (figures.gap !== undefined) return unsupported(figures.gap);
  return figures.lines?.[line];
}

/* Line 7: the K-1 credits, or the gap of a K-1 with no amount; blank with none. */
function line7Of(figures: Form8826Figures | undefined): Value {
  const k1 = figures?.k1Credits;
  if (k1 === undefined) return undefined;
  return "gap" in k1 ? unsupported(k1.gap) : k1.amount;
}

const isGap = (value: Value): value is Unsupported => typeof value === "object";

/* Line 8: "Add lines 6 and 7, but do not enter more than $5,000"; blank while both are blank or line 6 waits. */
function line8Value(info: Form8826FilingInfo): Value {
  const line6 = ownLine(info, "line6");
  const line7 = line7Of(info.form8826);
  if (isGap(line6)) return line6;
  if (isGap(line7)) return line7;
  if (line6 === undefined && line7 === undefined) return undefined;
  if (info.form8826?.ownCredit && line6 === undefined) return undefined;
  return line8Of(line6, line7);
}

/*
 * The cents box of each line. Every line is whole dollars (the 1040 rule,
 * irs-1040-inst-2025::sec::rounding-off-to-whole::b01), so a line with an
 * amount prints 00, as the form prints on lines 2 and 4; a blank line leaves
 * it blank, and a gap stays a gap.
 */
const WHOLE_DOLLAR_CENTS = "00";
const centsOf =
  (dollars: (info: Form8826FilingInfo) => Value): CentsRule =>
  (_, info) => {
    const value = dollars(info);
    return typeof value === "number" ? WHOLE_DOLLAR_CENTS : value;
  };

const line1 = (info: Form8826FilingInfo) => ownLine(info, "line1");
const line3 = (info: Form8826FilingInfo) => ownLine(info, "line3");
const line5 = (info: Form8826FilingInfo) => ownLine(info, "line5");
const line6 = (info: Form8826FilingInfo) => ownLine(info, "line6");
const line7 = (info: Form8826FilingInfo) => line7Of(info.form8826);

export function register(): void {
  defineForm<Form8826, Form8826FilingInfo>("form-8826", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      "0.line.1_total_eligible_access_expenditures_dollars": (_, info) => line1(info),
      "0.line.1_total_eligible_access_expenditures_cents": centsOf(line1),
      "0.line.3_subtract_2_from_1_dollars": (_, info) => line3(info),
      "0.line.3_subtract_2_from_1_cents": centsOf(line3),
      "0.line.5_smaller_of_3_or_4_dollars": (_, info) => line5(info),
      "0.line.5_smaller_of_3_or_4_cents": centsOf(line5),
      "0.line.6_multiply_5_by_50_percent_dollars": (_, info) => line6(info),
      "0.line.6_multiply_5_by_50_percent_cents": centsOf(line6),
      "0.line.7_credit_from_partnerships_s_corporations_dollars": (_, info) => line7(info),
      "0.line.7_credit_from_partnerships_s_corporations_cents": centsOf(line7),
      "0.line.8_total_disabled_access_credit_dollars": (_, info) => line8Value(info),
      "0.line.8_total_disabled_access_credit_cents": centsOf(line8Value),
    },

    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
