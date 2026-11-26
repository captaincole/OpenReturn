/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8697FilingInfo } from "./filingInfo.js";
import { FILING_YEAR } from "./lines.js";
import {
  addressLine,
  depositLine,
  entityLine,
  FILING_YEAR_BEGINNING,
  FILING_YEAR_ENDING,
  filingYearAdjustment,
  filingYearLine,
  filingYearTax,
  firstCopyLine,
  interestColumnLine,
  planLine,
  regularColumnLine,
  simplifiedColumnLine,
  totalLine,
  yearEndedMonth,
  yearEndedYear,
  type Binding,
} from "./printed.js";
import type { Form8697 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form8697]: BindingFn<Form8697, Form8697FilingInfo, K> }>;

const PART_I_COLUMNS = ["a", "b"] as const;
const PART_II_COLUMNS = ["a", "b", "c"] as const;

/*
 * MANUAL EDIT: Part I columns (a) and (b): the year ended, lines 1–6
 * (irs-8697-inst-2025::sec::line-1::b01, ::line-2::b01, ::line-3::b01,
 * ::lines-4-and-5::b01) and the interest of lines 7 and 8 (::lines-7-and-8::b01,
 * federal/8697/interest.ts).
 */
const PART_I_BINDINGS: Record<string, Binding> = Object.fromEntries(
  PART_I_COLUMNS.flatMap((letter, index) => [
    [`0.part1.year_ended_month_col_${letter}`, regularColumnLine(index, yearEndedMonth)],
    [`0.part1.year_ended_year_col_${letter}`, regularColumnLine(index, yearEndedYear)],
    [
      `0.part1.1_prior_year_taxable_income_col_${letter}`,
      regularColumnLine(index, (column) => column.lines.line1),
    ],
    [
      `0.part1.2_adjustment_to_income_col_${letter}`,
      regularColumnLine(index, (column) => column.lines.line2),
    ],
    [
      `0.part1.3_adjusted_taxable_income_col_${letter}`,
      regularColumnLine(index, (column) => column.lines.line3),
    ],
    [
      `0.part1.4_tax_on_line_3_col_${letter}`,
      regularColumnLine(index, (column) => column.lines.line4),
    ],
    [
      `0.part1.5_tax_shown_on_return_col_${letter}`,
      regularColumnLine(index, (column) => column.lines.line5),
    ],
    [
      `0.part1.6_increase_or_decrease_in_tax_col_${letter}`,
      regularColumnLine(index, (column) => column.lines.line6),
    ],
    [
      `0.part1.7_interest_due_on_increase_col_${letter}`,
      interestColumnLine("regular", index, (column) => column.interest.due),
    ],
    [
      `0.part1.8_interest_refunded_on_decrease_col_${letter}`,
      interestColumnLine("regular", index, (column) => column.interest.refunded),
    ],
  ]),
);

/*
 * MANUAL EDIT: Part II columns (a) to (c): the year ended, lines 1–7
 * (::line-1-2::b01, ::line-2-2::b01, ::line-3-2::b01, ::line-4::b01, ::line-5::b01,
 * the form's lines 6 and 7) and the interest of lines 8 and 9 (::lines-8-and-9::b01).
 */
const PART_II_BINDINGS: Record<string, Binding> = Object.fromEntries(
  PART_II_COLUMNS.flatMap((letter, index) => [
    [`1.part2.year_ended_month_col_${letter}`, simplifiedColumnLine(index, yearEndedMonth)],
    [`1.part2.year_ended_year_col_${letter}`, simplifiedColumnLine(index, yearEndedYear)],
    [
      `1.part2.1_regular_taxable_income_adjustment_col_${letter}`,
      simplifiedColumnLine(index, (column) => column.lines.line1),
    ],
    [
      `1.part2.2_regular_tax_increase_decrease_col_${letter}`,
      simplifiedColumnLine(index, (column) => column.lines.line2),
    ],
    [
      `1.part2.3_amti_adjustment_col_${letter}`,
      simplifiedColumnLine(index, (column) => column.lines.line3),
    ],
    [
      `1.part2.4_amt_increase_decrease_col_${letter}`,
      simplifiedColumnLine(index, (column) => column.lines.line4),
    ],
    [
      `1.part2.5_larger_of_line_2_or_4_col_${letter}`,
      simplifiedColumnLine(index, (column) => column.lines.line5),
    ],
    [
      `1.part2.6_overpayment_ceiling_col_${letter}`,
      simplifiedColumnLine(index, (column) => column.lines.line6),
    ],
    [
      `1.part2.7_tax_increase_decrease_prior_years_col_${letter}`,
      simplifiedColumnLine(index, (column) => column.lines.line7),
    ],
    [
      `1.part2.8_interest_due_on_increase_col_${letter}`,
      interestColumnLine("simplified_marginal_impact", index, (column) => column.interest.due),
    ],
    [
      `1.part2.9_interest_refunded_on_decrease_col_${letter}`,
      interestColumnLine("simplified_marginal_impact", index, (column) => column.interest.refunded),
    ],
  ]),
);

const SMIM = "simplified_marginal_impact";

/* The signature section is for a paid preparer; the engine prepares the taxpayer's own return (as Form 8379). */
const NO_PAID_PREPARER = (): undefined => undefined;

const BINDINGS: Record<string, Binding> = {
  // MANUAL EDIT: every copy names the filer and the tax year (::filing-year::b01, ::item-a-identifying-number::b01).
  "0.header.filing_year_beginning": planLine(() => FILING_YEAR_BEGINNING),
  "0.header.filing_year_ending": planLine(() => FILING_YEAR_ENDING),
  "0.header.name": planLine((_, info) => namesOnReturn(info)),
  "0.header.a_identifying_number": planLine((_, info) => info.taxpayerSSN),
  // MANUAL EDIT: the address only when the form is filed separately, for a refund (::filing-year::b01).
  "0.header.street_address": addressLine((info) => info.homeAddressLine1),
  "0.header.city_or_town": addressLine((info) => info.homeAddressCity),
  "0.header.state_or_province": addressLine((info) => info.homeAddressState),
  "0.header.zip_or_postal_code": addressLine((info) => info.homeAddressZip),
  // MANUAL EDIT: item B: an individual's return; the other boxes stay unchecked.
  "0.header.b_taxpayer_type_individual": firstCopyLine(undefined, () => true),
  "0.header.b_taxpayer_type_corporation": planLine(() => undefined),
  "0.header.b_taxpayer_type_s_corporation": planLine(() => undefined),
  "0.header.b_taxpayer_type_partnership": planLine(() => undefined),
  "0.header.b_taxpayer_type_estate_or_trust": planLine(() => undefined),
  // MANUAL EDIT: item C, the pass-through entity that holds the contracts (the form face).
  "0.header.c_pass_through_entity_name": entityLine((entity) => entity.name),
  "0.header.c_pass_through_entity_ein": entityLine((entity) => entity.ein),
  // MANUAL EDIT: Part I's filing-year column (::part-i-regular-method::b01).
  "0.part1.year_ended_month_filing_year": filingYearLine(() => yearEndedMonth()),
  "0.part1.year_ended_year_filing_year": filingYearLine(() =>
    yearEndedYear({ taxYear: FILING_YEAR }),
  ),
  "0.part1.1_prior_year_taxable_income_filing_year": filingYearLine((line1) => line1),
  "0.part1.2_adjustment_to_income_filing_year": filingYearLine((_, plan) =>
    filingYearAdjustment(plan),
  ),
  "0.part1.3_adjusted_taxable_income_filing_year": filingYearLine((line1, plan) => {
    const line2 = filingYearAdjustment(plan);
    return line1 === undefined || line2 === undefined ? undefined : line1 + line2;
  }),
  "0.part1.4_tax_on_line_3_filing_year": filingYearLine((_, plan) => filingYearTax(plan)),
  ...PART_I_BINDINGS,
  // MANUAL EDIT: column (c), first copy only (plan.ts has line 2(c)'s DECISION).
  "0.part1.2_adjustment_to_income_col_c": totalLine("regular", (totals) => totals.line2Total),
  "0.part1.7_interest_due_on_increase_col_c": totalLine("regular", (totals) => totals.dueTotal),
  "0.part1.8_interest_refunded_on_decrease_col_c": totalLine(
    "regular",
    (totals) => totals.refundTotal,
  ),
  // MANUAL EDIT: lines 9a and 10 (the form face; ::line-9a::b01, ::line-10::b01).
  "0.part1.9a_net_interest_refunded": totalLine("regular", (totals) => totals.net.refund),
  "0.part1.9b_routing_number": depositLine("regular", (deposit) => deposit.routingNumber),
  "0.part1.9c_account_type_checking": depositLine("regular", (deposit) =>
    deposit.accountType === "checking" ? true : undefined,
  ),
  "0.part1.9c_account_type_savings": depositLine("regular", (deposit) =>
    deposit.accountType === "savings" ? true : undefined,
  ),
  "0.part1.9d_account_number": depositLine("regular", (deposit) => deposit.accountNumber),
  "0.part1.10_net_interest_owed": totalLine("regular", (totals) => totals.net.owed),
  ...PART_II_BINDINGS,
  // MANUAL EDIT: column (d) and lines 10a and 11, first copy only (::line-10a::b01, ::line-11::b01).
  "1.part2.8_interest_due_on_increase_col_d": totalLine(SMIM, (totals) => totals.dueTotal),
  "1.part2.9_interest_refunded_on_decrease_col_d": totalLine(SMIM, (totals) => totals.refundTotal),
  "1.part2.10a_net_interest_refunded": totalLine(SMIM, (totals) => totals.net.refund),
  "1.part2.10b_routing_number": depositLine(SMIM, (deposit) => deposit.routingNumber),
  "1.part2.10c_account_type_checking": depositLine(SMIM, (deposit) =>
    deposit.accountType === "checking" ? true : undefined,
  ),
  "1.part2.10c_account_type_savings": depositLine(SMIM, (deposit) =>
    deposit.accountType === "savings" ? true : undefined,
  ),
  "1.part2.10d_account_number": depositLine(SMIM, (deposit) => deposit.accountNumber),
  "1.part2.11_net_interest_owed": totalLine(SMIM, (totals) => totals.net.owed),
  "1.signing.preparer_self_employed": NO_PAID_PREPARER,
  "1.signing.preparer_name": NO_PAID_PREPARER,
  "1.signing.preparer_ptin": NO_PAID_PREPARER,
  "1.signing.firm_name": NO_PAID_PREPARER,
  "1.signing.firm_ein": NO_PAID_PREPARER,
  "1.signing.firm_address": NO_PAID_PREPARER,
  "1.signing.firm_phone": NO_PAID_PREPARER,
};

export function register(): void {
  defineForm<Form8697, Form8697FilingInfo>("form-8697", {
    bindings: BINDINGS as unknown as Bindings,

    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.a_identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
