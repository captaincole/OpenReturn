/*
 * Form 8882, Credit for Employer-Provided Childcare Facilities and Services,
 * for an individual: lines 1 to 4 from the childcare expenditure facts of the
 * taxpayer's own businesses (figures.ts), line 5 from the K-1s, line 7 to Form
 * 3800 Part III line 1k (form3800.ts). Line 7 also lowers the business's
 * deductions and the facility's basis (facts/kinds/activitiesOnReturn.ts).
 * Lines 8 and 9 are for estates and trusts.
 */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8882Figures, Form8882FilingInfo } from "./filingInfo.js";
import { line6Of, line7Of, type OwnLines } from "./lines.js";
import type { Form8882 } from "./types.js";

type Value = number | Unsupported | undefined;
type Rule = (form: unknown, info: Form8882FilingInfo) => Value | string;

const isGap = (value: Value): value is Unsupported => typeof value === "object";

/*
 * Lines 1 to 4: blank with no expenditure of the taxpayer's own business
 * (only line 5), and while an expenditure fact is malformed; the gap when the
 * credit cannot come off the business's deductions or basis.
 */
function ownLine(info: Form8882FilingInfo, line: keyof OwnLines): Value {
  const figures = info.form8882;
  if (figures === undefined || !figures.ownCredit) return undefined;
  if (figures.gap !== undefined) return unsupported(figures.gap);
  return figures.lines?.[line];
}

/* Line 5: the pass-through credits, or the gap of a K-1 with no amount; blank with none. */
function line5Of(figures: Form8882Figures | undefined): Value {
  const credits = figures?.passThrough;
  if (credits === undefined) return undefined;
  return "gap" in credits ? unsupported(credits.gap) : credits.amount;
}

/* Line 6: "Add lines 2, 4, and 5"; blank while the form waits or has nothing to add. */
function line6Value(info: Form8882FilingInfo): Value {
  const figures = info.form8882;
  const line5 = line5Of(figures);
  const own = (["line2", "line4"] as const).map((line) => ownLine(info, line));
  const gap = [...own, line5].find(isGap);
  if (gap !== undefined) return gap;
  if (figures?.ownCredit && figures.lines === undefined) return undefined;
  if (own.every((value) => value === undefined) && line5 === undefined) return undefined;
  return line6Of(figures?.lines ?? {}, line5 as number | undefined);
}

/* Line 7: "Enter the smaller of line 6 or $150,000" (irs-8882-form-2025::sec::face-page-1::b01). */
function line7Value(info: Form8882FilingInfo): Value {
  const line6 = line6Value(info);
  return typeof line6 === "number" ? line7Of(line6) : line6;
}

/*
 * Lines 8 and 9: "Estates and trusts, go to line 8 ... All others, stop here
 * and report this amount on Form 3800, Part III, line 1k"
 * (irs-8882-form-2025::sec::face-page-1::b01). An individual's return stops at
 * line 7, so both stay blank.
 */
const estatesAndTrustsOnly = (): undefined => undefined;

/*
 * The cents boxes. The return rounds to whole dollars ("If you do round to
 * whole dollars, you must round all amounts", irs-1040-inst-2025::sec::rounding-off-to-whole::b01),
 * so a line with an amount prints 00; a blank line leaves its box blank
 * (QUESTIONS.md).
 */
const WHOLE_DOLLAR_CENTS = "00";
const cents =
  (dollars: (info: Form8882FilingInfo) => Value): Rule =>
  (_, info) => {
    const value = dollars(info);
    return typeof value === "number" ? WHOLE_DOLLAR_CENTS : value;
  };

const own = (line: keyof OwnLines) => (info: Form8882FilingInfo) => ownLine(info, line);
const line5 = (info: Form8882FilingInfo) => line5Of(info.form8882);

/* The dollars box and the cents box of each line. */
function amountLine(name: string, dollars: (info: Form8882FilingInfo) => Value) {
  return {
    [`0.line.${name}_dollars`]: ((_, info) => dollars(info)) as Rule,
    [`0.line.${name}_cents`]: cents(dollars),
  };
}

export const form8882Bindings = (): Record<string, Rule> => ({
  "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
  // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
  "0.header.identifying_number": (_, info) => info.taxpayerSSN,
  ...amountLine("1_qualified_childcare_facility_expenditures", own("line1")),
  ...amountLine("2_multiply_1_by_25_percent", own("line2")),
  ...amountLine("3_resource_referral_expenditures", own("line3")),
  ...amountLine("4_multiply_3_by_10_percent", own("line4")),
  ...amountLine("5_credit_from_pass_through_entities", line5),
  ...amountLine("6_add_lines", line6Value),
  ...amountLine("7_smaller_of_6_or_150000", line7Value),
  ...amountLine("8_allocated_to_beneficiaries", estatesAndTrustsOnly),
  ...amountLine("9_subtract_8_from_7", estatesAndTrustsOnly),
});

export function register(): void {
  defineForm<Form8882, Form8882FilingInfo>("form-8882", {
    bindings: form8882Bindings() as never,
    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
