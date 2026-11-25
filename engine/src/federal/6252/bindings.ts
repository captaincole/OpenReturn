/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 * MANUAL EDIT: written by hand. One copy for each installment sale (totals.ts);
 * the arithmetic is lines.ts, the gaps and waits sale.ts, Part III's questions
 * relatedParty.ts.
 */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { printedDate } from "../4797/dates.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form6252FilingInfo } from "./filingInfo.js";
import {
  printedPercentage,
  type PartIIILines,
  type PartIILines,
  type PartILines,
} from "./lines.js";
import type { PartIIIAnswers } from "./relatedParty.js";
import { moneyLine, type SaleForm } from "./sale.js";
import type { Form6252 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form6252]: BindingFn<Form6252, Form6252FilingInfo, K> }>;
type Value = string | number | boolean | undefined;
type LineFn = (form: unknown, info: Form6252FilingInfo) => Value | Unsupported;

/* The sale this copy prints, or the whole-form gap. */
function saleOf(info: Form6252FilingInfo): SaleForm | Unsupported | undefined {
  const totals = info.form6252Totals;
  if (totals === undefined) return undefined;
  if (totals.gap !== undefined) return unsupported(totals.gap);
  return totals.forms[info.form6252CopyIndex ?? 0];
}

/* A field of this copy's sale: blank with no sale, the gap with a whole-form gap. */
function ofSale(pick: (form: SaleForm) => Value | Unsupported): LineFn {
  return (_, info) => {
    const form = saleOf(info);
    if (form === undefined || "reason" in form) return form;
    return pick(form);
  };
}

/* A money line `line` of the form (lines.ts), through the sale's gap and wait (sale.ts). */
function money(line: number, pick: (form: SaleForm) => number | undefined): LineFn {
  return ofSale((form) => {
    const value = moneyLine(form, line, pick(form));
    return typeof value === "object" ? unsupported(value.reason) : value;
  });
}

const yes = (answer: boolean): true | undefined => (answer ? true : undefined);

const partILine = (line: number, pick: (lines: PartILines) => number | undefined) =>
  money(line, (form) => (form.partI === undefined ? undefined : pick(form.partI)));
const partIILine = (line: number, pick: (lines: PartIILines) => number | undefined) =>
  money(line, (form) => (form.partII === undefined ? undefined : pick(form.partII)));
const partIIILine = (line: number, pick: (lines: PartIIILines) => number) =>
  money(line, (form) => (form.partIIILines === undefined ? undefined : pick(form.partIIILines)));

/* Lines 27–29: the answers, printed only when Part III is completed. */
const answer = (pick: (answers: PartIIIAnswers) => Value): LineFn =>
  ofSale((form) => (form.partIII === undefined ? undefined : pick(form.partIII)));

/* Line 1: "Enter a code from the list below and describe the installment sale property" (specific-instructions::b01). */
const header: Bindings = {
  "0.header.taxpayer_name": (_, info) => (saleOf(info) ? namesOnReturn(info) : undefined),
  "0.header.identifying_number": (_, info) => (saleOf(info) ? info.taxpayerSSN : undefined),
  "0.line.1_description_of_property": ofSale(
    ({ sale }) => `${String(sale.propertyCode)} - ${sale.description}`,
  ),
  "0.line.2a_date_acquired": ofSale(({ sale }) => printedDate(sale.dateAcquired)),
  "0.line.2b_date_sold": ofSale(({ sale }) => printedDate(sale.dateSold)),
  "0.line.3_sold_to_related_party_yes": ofSale(({ sale }) => yes(sale.relatedParty !== undefined)),
  "0.line.3_sold_to_related_party_no": ofSale(({ sale }) => yes(sale.relatedParty === undefined)),
  // Line 4 (line-4::b01): "If you checked 'No,' the answer for all subsequent years must be 'No.'"
  "0.line.4_selling_price_determinable_yes": ofSale(({ sale }) =>
    yes(sale.sellingPriceDeterminable),
  ),
  "0.line.4_selling_price_determinable_no": ofSale(({ sale }) =>
    yes(!sale.sellingPriceDeterminable),
  ),
} as Bindings;

const partIBindings: Bindings = {
  "0.line.5_selling_price": partILine(5, (lines) => lines.line5),
  "0.line.6_liabilities_buyer_assumed": partILine(6, (lines) => lines.line6),
  "0.line.7_price_less_liabilities": partILine(7, (lines) => lines.line7),
  "0.line.8_cost_or_other_basis": partILine(8, (lines) => lines.line8),
  "0.line.9_depreciation_allowed": partILine(9, (lines) => lines.line9),
  "0.line.10_adjusted_basis": partILine(10, (lines) => lines.line10),
  "0.line.11_commissions_expenses_of_sale": partILine(11, (lines) => lines.line11),
  "0.line.12_income_recapture_form_4797": partILine(12, (lines) => lines.line12),
  "0.line.13_basis_expenses_recapture_total": partILine(13, (lines) => lines.line13),
  "0.line.14_price_less_line_13": partILine(14, (lines) => lines.line14),
  "0.line.15_excluded_gain_main_home": partILine(15, (lines) => lines.line15),
  "0.line.16_gross_profit": partILine(16, (lines) => lines.line16),
  "0.line.17_liabilities_over_basis": partILine(17, (lines) => lines.line17),
  "0.line.18_contract_price": partILine(18, (lines) => lines.line18),
} as Bindings;

const partIIBindings: Bindings = {
  // Line 19 as "a decimal rounded to at least 4 digits" (part-ii-installment-sale-income::b01).
  "0.line.19_gross_profit_percentage": ofSale((form) => {
    const value = moneyLine(form, 19, form.line19);
    if (typeof value === "object") return unsupported(value.reason);
    return value === undefined ? undefined : printedPercentage(value);
  }),
  "0.line.20_year_of_sale_line_17": partIILine(20, (lines) => lines.line20),
  "0.line.21_payments_received_during_year": partIILine(21, (lines) => lines.line21),
  "0.line.22_total_payments_this_year": partIILine(22, (lines) => lines.line22),
  "0.line.23_payments_received_prior_years": partIILine(23, (lines) => lines.line23),
  "0.line.24_installment_sale_income": partIILine(24, (lines) => lines.line24),
  "0.line.25_ordinary_income_recapture": partIILine(25, (lines) => lines.line25),
  "0.line.26_income_less_recapture": partIILine(26, (lines) => lines.line26),
} as Bindings;

const LINE_29_EXCEPTIONS = [
  ["0.line.29b_stock_sold_to_issuer", "stock_to_issuer"],
  ["0.line.29c_involuntary_conversion", "involuntary_conversion"],
  ["0.line.29d_after_death_of_party", "after_death"],
  ["0.line.29e_no_tax_avoidance_purpose", "no_tax_avoidance"],
] as const;

const partIIIBindings: Bindings = {
  "0.line.27_related_party_row1": answer((answers) => answers.line27Row1),
  "0.line.27_related_party_row2": answer((answers) => answers.line27Row2),
  "0.line.28_related_party_resold_yes": answer((answers) => yes(answers.resold)),
  "0.line.28_related_party_resold_no": answer((answers) => yes(!answers.resold)),
  "0.line.29a_second_disposition_after_2_years": answer((answers) =>
    yes(answers.box29aDate !== undefined),
  ),
  "0.line.29a_date_of_disposition": answer((answers) =>
    answers.box29aDate === undefined ? undefined : printedDate(answers.box29aDate),
  ),
  ...Object.fromEntries(
    LINE_29_EXCEPTIONS.map(([field, exception]) => [
      field,
      answer((answers) => yes(answers.exception === exception)),
    ]),
  ),
  "0.line.30_related_party_selling_price": partIIILine(30, (lines) => lines.line30),
  "0.line.31_contract_price_first_sale": partIIILine(31, (lines) => lines.line31),
  "0.line.32_smaller_of_30_or_31": partIIILine(32, (lines) => lines.line32),
  "0.line.33_total_payments_received": partIIILine(33, (lines) => lines.line33),
  "0.line.34_line_32_less_payments": partIIILine(34, (lines) => lines.line34),
  "0.line.35_related_party_sale_income": partIIILine(35, (lines) => lines.line35),
  "0.line.36_ordinary_income_recapture": partIIILine(36, (lines) => lines.line36),
  "0.line.37_income_less_recapture": partIIILine(37, (lines) => lines.line37),
} as Bindings;

export function register(): void {
  defineForm<Form6252, Form6252FilingInfo>("form-6252", {
    bindings: { ...header, ...partIBindings, ...partIIBindings, ...partIIIBindings },
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
