/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type FormAccessor } from "../../defineForm.js";
import { numberOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8828FactLines, Form8828FilingInfo } from "./filingInfo.js";
import { modifiedAgi, recaptureLines, type RecaptureLines } from "./lines.js";
import type { Form8828 } from "./types.js";

type Value = number | string | boolean | undefined;
type Binding<T extends Value> = (
  form: FormAccessor<Form8828>,
  info: Form8828FilingInfo,
) => T | Unsupported | undefined;

/* The facts' lines for one line of the form: unsupported from its gap's line on, undefined with no sale. */
function factLinesFor(
  line: number,
  info: Form8828FilingInfo,
): Form8828FactLines | Unsupported | undefined {
  if (info.form8828Gap) return unsupported(info.form8828Gap);
  const lines = info.form8828;
  if (lines?.gap && lines.gap.fromLine <= line) return unsupported(lines.gap.reason);
  return lines;
}

const isGap = (value: object): value is Unsupported => "unsupported" in value;

/* A line of the printed form that the facts settle. */
function lineOf<T extends Value>(line: number, pick: (lines: Form8828FactLines) => T): Binding<T> {
  return (_, info) => {
    const lines = factLinesFor(line, info);
    return lines === undefined || isGap(lines) ? lines : pick(lines);
  };
}

type PartII = RecaptureLines & { line15: number; line16: number };

/*
 * Lines 15 to 23. Blank after a loss on line 13 ("stop here"); blank while
 * Form 1040 line 11 is not figured. Line 15 starts from AGI "as shown on line 11
 * of your Form 1040" and adds the tax-exempt interest of line 2a (line-15::b01).
 */
function partIILine<T extends Value>(line: number, pick: (lines: PartII) => T): Binding<T> {
  return (form, info) => {
    const fromFacts = factLinesFor(line, info);
    if (fromFacts === undefined || isGap(fromFacts)) return fromFacts;
    const { gain, line16, line19, line20, gainIncludedInIncome } = fromFacts;
    const agi = numberOrBlank(form["form-1040.line.11b"]);
    if (gain.line14 === undefined || agi === undefined) return undefined;
    if (line16 === undefined || line20 === undefined) return undefined;
    const taxExempt = numberOrBlank(form["form-1040.line.2a"]) ?? 0;
    const line15 = modifiedAgi(agi, taxExempt, gainIncludedInIncome);
    const lines = recaptureLines({ line14: gain.line14, line15, line16, line19, line20 });
    return pick({ ...lines, line15, line16 });
  };
}

/* A date's month, day or year box: MM, DD, YYYY. */
function datePart(date: string | undefined, part: "year" | "month" | "day"): string | undefined {
  const [year, month, day] = date?.split("-") ?? [];
  return { year, month, day }[part];
}

const percent = (value: number | undefined): string | undefined =>
  value === undefined ? undefined : String(value);

export function register(): void {
  defineForm<Form8828, Form8828FilingInfo>("form-8828", {
    bindings: {
      // MANUAL EDIT: "should be the same as those shown on your tax return" (specific-instructions::b01).
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: Part I from the notice and the sale (line-1::b01 to line-8::b01).
      "0.line.1_property_address": lineOf(1, (lines) => lines.propertyAddress),
      "0.line.2a_tax_exempt_bond_loan": lineOf(2, (lines) =>
        lines.subsidyType === "qualified_mortgage_bond" ? true : undefined,
      ),
      "0.line.2b_mortgage_credit_certificate": lineOf(2, (lines) =>
        lines.subsidyType === "mortgage_credit_certificate" ? true : undefined,
      ),
      "0.line.3_bond_certificate_issuer": lineOf(3, (lines) => lines.issuer),
      "0.line.4_original_lender_name_address": lineOf(4, (lines) => lines.lender),
      "0.line.5_loan_closing_date_month": lineOf(5, (lines) =>
        datePart(lines.closingDate, "month"),
      ),
      "0.line.5_loan_closing_date_day": lineOf(5, (lines) => datePart(lines.closingDate, "day")),
      "0.line.5_loan_closing_date_year": lineOf(5, (lines) => datePart(lines.closingDate, "year")),
      "0.line.6_sale_disposition_date_month": lineOf(6, (lines) =>
        datePart(lines.saleDate, "month"),
      ),
      "0.line.6_sale_disposition_date_day": lineOf(6, (lines) => datePart(lines.saleDate, "day")),
      "0.line.6_sale_disposition_date_year": lineOf(6, (lines) => datePart(lines.saleDate, "year")),
      "0.line.7_holding_period_years": lineOf(7, (lines) => lines.line7.years),
      "0.line.7_holding_period_full_months": lineOf(7, (lines) => lines.line7.fullMonths),
      "0.line.8_full_repayment_date_month": lineOf(8, (lines) =>
        datePart(lines.repaymentDate, "month"),
      ),
      "0.line.8_full_repayment_date_day": lineOf(8, (lines) =>
        datePart(lines.repaymentDate, "day"),
      ),
      "0.line.8_full_repayment_date_year": lineOf(8, (lines) =>
        datePart(lines.repaymentDate, "year"),
      ),
      // MANUAL EDIT: lines 9 to 14, the gain of the filer's interest (lines.ts, gainLines).
      "0.line.9_sales_price": lineOf(9, (lines) => lines.gain.line9),
      "0.line.10_expenses_of_sale": lineOf(10, (lines) => lines.gain.line10),
      "0.line.11_amount_realized": lineOf(11, (lines) => lines.gain.line11),
      "0.line.12_adjusted_basis": lineOf(12, (lines) => lines.gain.line12),
      "0.line.13_gain_or_loss": lineOf(13, (lines) => lines.gain.line13),
      "0.line.14_half_of_gain": lineOf(14, (lines) => lines.gain.line14),
      // MANUAL EDIT: lines 15 to 23 (lines.ts, modifiedAgi and recaptureLines).
      "0.line.15_modified_agi": partIILine(15, (lines) => lines.line15),
      "0.line.16_adjusted_qualifying_income": partIILine(16, (lines) => lines.line16),
      "0.line.17_income_over_qualifying": partIILine(17, (lines) => lines.line17),
      "0.line.18_income_percentage": partIILine(18, (lines) => percent(lines.line18)),
      "0.line.19_federally_subsidized_amount": partIILine(19, (lines) => lines.line19),
      "0.line.20_holding_period_percentage": partIILine(20, (lines) => percent(lines.line20)),
      "0.line.21_subsidized_amount_times_holding": partIILine(21, (lines) => lines.line21),
      "0.line.22_recapture_amount": partIILine(22, (lines) => lines.line22),
      "0.line.23_recapture_tax": partIILine(23, (lines) => lines.line23),
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
