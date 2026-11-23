/*
 * The amounts Form 1116 takes from the rest of the return: the deductions to
 * apportion (lines 3a, 3b, 4a), gross income from all sources (line 3e), the
 * taxable income and the QDCG worksheet for line 18, and the tax for line 20.
 * Every read is by full field id, so Schedule 3 and the credit forms can figure
 * the same numbers with their own accessor.
 */

import { atLeast, numberOrBlank, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { FilingStatus } from "../../values.js";
import { computeQdcg, type QdcgBreakdown } from "../../worksheets/qdcg.js";
import { qdcgInputsFromReturn } from "../1040/qdcgInputs.js";
import type { Form1116FilingInfo } from "./filingInfo.js";

export type Accessor = { readonly [fieldId: string]: unknown };

export interface ReturnAmounts {
  filingStatus: FilingStatus;
  line3a: number;
  line3b: number;
  line3e: number;
  /* Schedule A line 8e when the return itemizes; 0 when it does not. */
  homeMortgageInterest: number;
  /* Interest apportioned by the asset method: investment, student loan and car loan interest. */
  otherInterestExpense: number;
  /* Line 18 before the worksheet: 1040 line 11b − line 14 + Schedule 1-A line 37 (may be below 0). */
  limitTaxableIncome: number;
  qdcg: QdcgBreakdown;
  /* Schedule D line 18 or 19 above 0: the tax uses the Schedule D Tax Worksheet's rate gains. */
  rateGainWorksheet: boolean;
  /* Line 20 before the floor at 0. */
  regularTax: number;
  /* Form 1040 line 1z: employee compensation for the line 1b test. */
  compensation: number;
}

const STATE_INCOME_TAX_GAP =
  "The return deducts state and local income taxes on Schedule A line 5a; Form 1116 line 2 takes the part on foreign income and lines 2 and 3a share the line 5e limit, and the engine has no rule for the income the state taxes (irs-1116-inst-2025::sec::line-2-4::b01, irs-pub-514-2025::sec::determining-taxable-income-from-sources::b09).";
const BUSINESSES_GAP =
  "Line 3e needs the gross income of each Schedule C, and the engine reads only the first business's line 7.";
const PASS_THROUGH_GAP =
  "Line 3e needs gross income from all sources, and Schedule E Parts II–IV (partnerships, S corporations, estates and trusts, farm rental) report only net amounts.";
const OTHER_GAINS_GAP =
  "Line 3e needs gross income from all sources, and Schedule 1 line 4 (Form 4797) or line 6 (Schedule F) reports only a net amount.";
const CHILD_TAX_GAP =
  "Form 1040 line 16 is figured on Form 8615, so the Qualified Dividends and Capital Gain Tax Worksheet that line 18 reads is not the one the tax used.";
const FORM_8978_GAP =
  "Form 8978 files, and line 20 is adjusted by its line 14 (irs-1116-inst-2025::sec::line-20::b02); Form 8978 has no rules in the engine.";

const files = (info: Form1116FilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;
const positive = (value: unknown) => (numberOrBlank(value) ?? 0) > 0;

/*
 * Line 3a (irs-1116-inst-2025::sec::line-3a::b01): with itemized deductions,
 * medical expenses (Schedule A line 4) and the sales, real estate and personal
 * property taxes, no more than Schedule A line 5e (lines-2-through-5-deductions-and-losses::b02);
 * else the standard deduction (Form 1040 line 12e).
 */
function line3a(form: Accessor, info: Form1116FilingInfo): number | Unsupported | undefined {
  if (info.useItemizedDeductions !== true) return numberOrBlank(form["form-1040.line.12e"]);
  const salesTax = form["schedule-a.0.line.5a_general_sales_tax_election"] === true;
  if (!salesTax && positive(form["schedule-a.0.line.5a_state_local_income_or_sales_tax"])) {
    return unsupported(STATE_INCOME_TAX_GAP);
  }
  return sum(form["schedule-a.0.line.4_net_medical_dental"], form["schedule-a.0.line.5e_salt_cap"]);
}

/*
 * Line 3b (irs-1116-inst-2025::sec::line-3b::b01): deductions not definitely
 * related to any income, "for example, deductions shown on Schedule 1 ...
 * Part II". Student loan interest goes to line 4b (line-4b::b01), so it comes
 * out; the senior deduction is never here. Own reading (QUESTIONS.md).
 */
const line3b = (form: Accessor) =>
  atLeast(0, sum(form["schedule-1.1.line.26"]) - sum(form["schedule-1.1.line.21"]));

const SCHEDULE_D_GAIN_LINES = [
  "0.line.1a_gain_loss",
  "0.line.1b_gain_loss",
  "0.line.2_gain_loss",
  "0.line.3_gain_loss",
  "0.line.4_short_term_gain_other_forms",
  "0.line.5_net_short_term_passthrough",
  "0.line.8a_gain_loss",
  "0.line.8b_gain_loss",
  "0.line.9_gain_loss",
  "0.line.10_gain_loss",
  "0.line.11_long_term_gain_other_forms",
  "0.line.12_net_long_term_passthrough",
  "0.line.13_capital_gain_distributions",
];

const OTHER_INCOME_LINES = ["8b", "8c", "8e", "8f", "8g", "8h", "8i", "8j", "8k", "8l", "8m"]
  .concat(["8n", "8o", "8p", "8q", "8r", "8s", "8t", "8u", "8v", "8z"])
  .map((line) => `schedule-1.0.line.${line}`);

/*
 * Capital and ordinary gains "before subtracting any losses"
 * (irs-1116-inst-2025::sec::lines-3d-and-3e::b01): each Schedule D line above
 * 0, carryovers left out; without Schedule D, Form 1040 line 7a. A line nets
 * its own sales; the engine does not split it (QUESTIONS.md).
 */
function capitalGains(form: Accessor, info: Form1116FilingInfo): number {
  if (!files(info, "schedule-d")) return atLeast(0, form["form-1040.line.7a"]);
  return sum(...SCHEDULE_D_GAIN_LINES.map((line) => atLeast(0, form[`schedule-d.${line}`])));
}

/* Schedule 1 Part I in gross: business gross income, rents and royalties received, the other income above 0. */
function additionalIncome(form: Accessor, info: Form1116FilingInfo): number | Unsupported {
  if ((info.businesses?.length ?? 0) > 1) return unsupported(BUSINESSES_GAP);
  const scheduleE = numberOrBlank(form["schedule-e.1.line.41_total_income_or_loss"]);
  const partI = numberOrBlank(form["schedule-e.0.line.26_total_income_or_loss"]);
  if (scheduleE !== undefined && scheduleE !== partI) return unsupported(PASS_THROUGH_GAP);
  if (sum(form["schedule-1.0.line.4"]) !== 0 || sum(form["schedule-1.0.line.6"]) !== 0) {
    return unsupported(OTHER_GAINS_GAP);
  }
  const business = files(info, "schedule-c") ? atLeast(0, form["schedule-c.0.line.7"]) : 0;
  const rents =
    scheduleE === undefined
      ? 0
      : sum(
          form["schedule-e.0.line.23a_total_rents"],
          form["schedule-e.0.line.23b_total_royalties"],
        );
  return sum(
    atLeast(0, form["schedule-1.0.line.1"]),
    atLeast(0, form["schedule-1.0.line.2a"]),
    business,
    rents,
    atLeast(0, form["schedule-1.0.line.7"]),
    ...OTHER_INCOME_LINES.map((line) => atLeast(0, form[line])),
  );
}

/*
 * Line 3e: gross income from all sources and all categories
 * (irs-1116-inst-2025::sec::line-3e::b01): gross receipts less cost of goods
 * sold, gains before losses, all other income before deductions. Tax-exempt
 * interest and the nontaxable parts of pensions and benefits are exempt income
 * and stay out (line-3e::b02).
 */
export function grossIncomeAllSources(
  form: Accessor,
  info: Form1116FilingInfo,
): number | Unsupported {
  const additional = additionalIncome(form, info);
  if (typeof additional !== "number") return additional;
  return sum(
    form["form-1040.line.1z"],
    form["form-1040.line.2b"],
    form["form-1040.line.3b"],
    form["form-1040.line.4b"],
    form["form-1040.line.5b"],
    form["form-1040.line.6b"],
    capitalGains(form, info),
    additional,
  );
}

/*
 * Line 20 (irs-1116-inst-2025::sec::line-20::b01): Form 1040 line 16 and
 * Schedule 2 line 1z, less any Form 4972 tax on line 16.
 */
export function regularTaxForCredit(
  form: Accessor,
  info: Form1116FilingInfo,
): number | Unsupported | undefined {
  if (files(info, "form-8978")) return unsupported(FORM_8978_GAP);
  const line16 = numberOrBlank(form["form-1040.line.16"]);
  if (line16 === undefined) return undefined;
  const form4972Tax = files(info, "form-4972") ? sum(info.form4972Tax) : 0;
  return line16 - form4972Tax + sum(form["schedule-2.0.line.1z_total_lines_1a_through_1y"]);
}

/* The QDCG worksheet as Form 1040 line 16 figured it; a gap when line 16 came from Form 8615. */
function qdcgOf(form: Accessor, info: Form1116FilingInfo, filingStatus: FilingStatus) {
  if (files(info, "form-8615")) return unsupported(CHILD_TAX_GAP);
  const taxable = numberOrBlank(form["form-1040.line.15"]);
  if (taxable === undefined) return undefined;
  const qualified = sum(form["form-1040.line.3a"]);
  return computeQdcg(qdcgInputsFromReturn(form, taxable, qualified, filingStatus)).breakdown;
}

export function returnAmounts(
  form: Accessor,
  info: Form1116FilingInfo,
): ReturnAmounts | Unsupported | undefined {
  const filingStatus = info.filingStatus;
  if (filingStatus === undefined) return undefined;
  const deductions = line3a(form, info);
  const line3e = grossIncomeAllSources(form, info);
  const qdcg = qdcgOf(form, info, filingStatus);
  const regularTax = regularTaxForCredit(form, info);
  for (const value of [deductions, line3e, qdcg, regularTax]) {
    if (value === undefined || (typeof value === "object" && "unsupported" in value)) {
      return value as Unsupported | undefined;
    }
  }
  const line11b = numberOrBlank(form["form-1040.line.11b"]);
  const line14 = numberOrBlank(form["form-1040.line.14"]);
  if (line11b === undefined || line14 === undefined) return undefined;
  const itemizes = info.useItemizedDeductions === true;
  return {
    filingStatus,
    line3a: deductions as number,
    line3b: line3b(form),
    line3e: line3e as number,
    homeMortgageInterest: itemizes
      ? sum(form["schedule-a.0.line.8e_total_mortgage_interest_points"])
      : 0,
    otherInterestExpense: sum(
      itemizes ? form["schedule-a.0.line.9_investment_interest"] : 0,
      form["schedule-1.1.line.21"],
      form["schedule-1-a.1.line.30_car_loan_interest_deduction"],
    ),
    limitTaxableIncome:
      line11b - line14 + sum(form["schedule-1-a.1.line.37_enhanced_senior_deduction"]),
    qdcg: qdcg as QdcgBreakdown,
    rateGainWorksheet:
      positive(form["schedule-d.1.line.18_rate_gain_worksheet_amount"]) ||
      positive(form["schedule-d.1.line.19_unrecaptured_sec1250_gain"]),
    regularTax: regularTax as number,
    compensation: sum(form["form-1040.line.1z"]),
  };
}
