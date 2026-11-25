/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 * MANUAL EDIT: written by hand. One copy for each installment sale with a form
 * this year (totals.ts); the arithmetic is federal Form 6252's on California's
 * amounts (lines.ts), the gaps and waits sale.ts.
 */

import { defineForm, type BindingFn } from "../../../defineForm.js";
import { printedDate } from "../../../federal/4797/dates.js";
import {
  printedPercentage,
  type PartIIILines,
  type PartIILines,
  type PartILines,
} from "../../../federal/6252/lines.js";
import type { PartIIIAnswers } from "../../../federal/6252/relatedParty.js";
import { moneyLine, type SaleForm } from "../../../federal/6252/sale.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { Form3805EFilingInfo } from "./filingInfo.js";
import { soldToRelatedParty } from "./lines.js";
import type { Form3805E } from "./types.js";

type Bindings = Partial<{ [K in keyof Form3805E]: BindingFn<Form3805E, Form3805EFilingInfo, K> }>;
type Value = string | number | undefined;
type LineFn = (form: unknown, info: Form3805EFilingInfo) => Value | Unsupported;

/* The sale this copy prints, or the whole-form gap. */
function saleOf(info: Form3805EFilingInfo): SaleForm | Unsupported | undefined {
  const totals = info.form3805ETotals;
  if (totals === undefined) return undefined;
  if (totals.gap !== undefined) return unsupported(totals.gap);
  return totals.forms[info.form3805ECopyIndex ?? 0];
}

/* A field of this copy's sale: blank with no sale, the gap with a whole-form gap. */
function ofSale(pick: (form: SaleForm) => Value | Unsupported): LineFn {
  return (_, info) => {
    const form = saleOf(info);
    if (form === undefined || "reason" in form) return form;
    return pick(form);
  };
}

/* A money line `line` of the form, through the sale's gap and wait (federal/6252/sale.ts). */
function money(line: number, pick: (form: SaleForm) => number | undefined): LineFn {
  return ofSale((form) => {
    const value = moneyLine(form, line, pick(form));
    return typeof value === "object" ? unsupported(value.reason) : value;
  });
}

const yesNo = (answer: boolean): "yes" | "no" => (answer ? "yes" : "no");

/*
 * Part I: "Complete this part for the year of sale only" (the form; federal
 * Form 6252 completes it every year). In a later year lines 5–18 are blank,
 * and line 19 still prints the year of sale's percentage (line-19::b01).
 */
const partILine = (line: number, pick: (lines: PartILines) => number | undefined) =>
  ofSale((form) => {
    if (!form.yearOfSale) return undefined;
    const value = moneyLine(form, line, form.partI === undefined ? undefined : pick(form.partI));
    return typeof value === "object" ? unsupported(value.reason) : value;
  });
const partIILine = (line: number, pick: (lines: PartIILines) => number | undefined) =>
  money(line, (form) => (form.partII === undefined ? undefined : pick(form.partII)));
const partIIILine = (line: number, pick: (lines: PartIIILines) => number) =>
  money(line, (form) => (form.partIIILines === undefined ? undefined : pick(form.partIIILines)));

/* Lines 27–29: the answers, printed only when Part III is completed. */
const answer = (pick: (answers: PartIIIAnswers) => Value): LineFn =>
  ofSale((form) => (form.partIII === undefined ? undefined : pick(form.partIII)));

const header: Bindings = {
  "0.header.taxpayer_name": (_, info) => (saleOf(info) ? namesOnReturn(info) : undefined),
  "0.header.taxpayer_id_number": (_, info) => (saleOf(info) ? info.taxpayerSSN : undefined),
  // Line 1: the property; the California form has no code list.
  "0.line.1_description_of_property": ofSale(({ sale }) => sale.description),
  "0.line.2a_date_acquired": ofSale(({ sale }) => printedDate(sale.dateAcquired)),
  "0.line.2b_date_sold": ofSale(({ sale }) => printedDate(sale.dateSold)),
  "0.line.3_sold_to_related_party": ofSale(({ sale }) => yesNo(soldToRelatedParty(sale))),
  // Line 4 follows federal Form 6252 (specific-line-instructions::b01).
  "0.line.4_selling_price_determinable": ofSale(({ sale }) => yesNo(sale.sellingPriceDeterminable)),
} as Bindings;

const partIBindings: Bindings = {
  "0.line.5_selling_price": partILine(5, (lines) => lines.line5),
  "0.line.6_debts_buyer_assumed": partILine(6, (lines) => lines.line6),
  "0.line.7_selling_price_less_debts": partILine(7, (lines) => lines.line7),
  "0.line.8_cost_or_other_basis": partILine(8, (lines) => lines.line8),
  // Line 9: "Use California amounts" (the form).
  "0.line.9_depreciation_allowed": partILine(9, (lines) => lines.line9),
  "0.line.10_adjusted_basis": partILine(10, (lines) => lines.line10),
  "0.line.11_expenses_of_sale": partILine(11, (lines) => lines.line11),
  // Line 12 (line-12::b01): Schedule D-1 Part III and IV; a 2025 sale with depreciation is a gap (sale.ts).
  "0.line.12_income_recapture": partILine(12, (lines) => lines.line12),
  "0.line.13_basis_expenses_recapture_total": partILine(13, (lines) => lines.line13),
  "0.line.14_selling_price_less_total": partILine(14, (lines) => lines.line14),
  // Line 15: "using California amounts" (the form; line-15::b01).
  "0.line.15_main_home_excluded_gain": partILine(15, (lines) => lines.line15),
  "0.line.16_gross_profit": partILine(16, (lines) => lines.line16),
  "0.line.17_debts_over_basis": partILine(17, (lines) => lines.line17),
  "0.line.18_contract_price": partILine(18, (lines) => lines.line18),
} as Bindings;

const partIIBindings: Bindings = {
  /*
   * DECISION (2026-11-24, by the author, not reviewed by a person): line 19 has
   * exactly 4 decimal places, and lines 24 and 35 multiply by the printed value,
   * as on federal Form 6252 (rule-decisions row A1). Text A: "Enter it as a
   * decimal rounded to at least 4 digits, and include all zeros"
   * (ca-3805e-inst-2025::sec::line-19::b01): more digits are allowed. Text B:
   * line 24 "Multiply line 22 by line 19" and line 35 "Multiply line 34 by the
   * gross profit percentage on line 19" (the form). The engine follows the
   * form's arithmetic on the printed line, the same way on both returns.
   */
  "0.line.19_gross_profit_percentage": ofSale((form) => {
    const value = moneyLine(form, 19, form.line19);
    if (typeof value === "object") return unsupported(value.reason);
    return value === undefined ? undefined : printedPercentage(value);
  }),
  "0.line.20_year_of_sale_debts_over_basis": partIILine(20, (lines) => lines.line20),
  "0.line.21_payments_received_during_year": partIILine(21, (lines) => lines.line21),
  "0.line.22_payments_total": partIILine(22, (lines) => lines.line22),
  "1.line.23_payments_received_prior_years": partIILine(23, (lines) => lines.line23),
  "1.line.24_installment_sale_income": partIILine(24, (lines) => lines.line24),
  "1.line.25_ordinary_income_recapture": partIILine(25, (lines) => lines.line25),
  "1.line.26_installment_income_less_recapture": partIILine(26, (lines) => lines.line26),
} as Bindings;

/* Line 29's boxes b–e, by the fact's answer. */
const LINE_29_BOXES = {
  stock_to_issuer: "b_stock_to_issuing_corporation",
  involuntary_conversion: "c_involuntary_conversion",
  after_death: "d_after_death_seller_or_buyer",
  no_tax_avoidance: "e_no_tax_avoidance_purpose",
} as const;

/* Line 29: box a when the resale was more than 2 years after the sale, else the stated condition. */
function line29Box(answers: PartIIIAnswers): string | undefined {
  if (answers.box29aDate !== undefined) return "a_more_than_two_years_after";
  return answers.exception === undefined ? undefined : LINE_29_BOXES[answers.exception];
}

const partIIIBindings: Bindings = {
  // Line 27: one box for the name, address and identifying number, one per row.
  "1.line.27_related_party_name_address_tin": answer(
    (answers) => `${answers.line27Row1}\n${answers.line27Row2}`,
  ),
  "1.line.28_related_party_second_disposition": answer((answers) => yesNo(answers.resold)),
  "1.line.29_second_disposition_exception": answer(line29Box),
  "1.line.29a_second_disposition_date": answer((answers) =>
    answers.box29aDate === undefined ? undefined : printedDate(answers.box29aDate),
  ),
  "1.line.30_related_party_selling_price": partIIILine(30, (lines) => lines.line30),
  "1.line.31_contract_price_first_sale": partIIILine(31, (lines) => lines.line31),
  "1.line.32_smaller_of_line_30_or_31": partIIILine(32, (lines) => lines.line32),
  "1.line.33_total_payments_received": partIIILine(33, (lines) => lines.line33),
  "1.line.34_line_32_less_payments": partIIILine(34, (lines) => lines.line34),
  "1.line.35_related_party_installment_income": partIIILine(35, (lines) => lines.line35),
  "1.line.36_ordinary_income_recapture": partIIILine(36, (lines) => lines.line36),
  "1.line.37_related_party_income_less_recapture": partIIILine(37, (lines) => lines.line37),
} as Bindings;

export function register(): void {
  defineForm<Form3805E, Form3805EFilingInfo>("form-3805e", {
    bindings: { ...header, ...partIBindings, ...partIIBindings, ...partIIIBindings },
  });
}
