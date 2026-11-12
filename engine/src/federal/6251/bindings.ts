/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { lookupPreferentialBrackets } from "../../data/preferentialBrackets.js";
import { defineForm, type FormAccessor } from "../../defineForm.js";
import { atLeast, numberOrBlank, roundDollars, sum } from "../../money.js";
import { SSN, type FilingStatus } from "../../values.js";
import { computeQdcg, type QdcgBreakdown } from "../../worksheets/qdcg.js";
import { qdcgInputsFromReturn } from "../1040/qdcgInputs.js";
import type { Form6251FilingInfo } from "./filingInfo.js";
import type { Form6251 } from "./types.js";

type Form = FormAccessor<Form6251>;

// MANUAL EDIT: line 5 chart (irs-6251-inst-2025::sec::part-ii-alternative-minimum-tax::b01).
interface ExemptionRow {
  exemption: number;
  phaseOutStart: number;
}
const EXEMPTION_SINGLE_HOH: ExemptionRow = { exemption: 88_100, phaseOutStart: 626_350 };
const EXEMPTION_MFJ_QSS: ExemptionRow = { exemption: 137_000, phaseOutStart: 1_252_700 };
const EXEMPTION_MFS: ExemptionRow = { exemption: 68_500, phaseOutStart: 626_350 };
const EXEMPTION_BY_STATUS: Record<FilingStatus, ExemptionRow> = {
  single: EXEMPTION_SINGLE_HOH,
  head_of_household: EXEMPTION_SINGLE_HOH,
  married_filing_jointly: EXEMPTION_MFJ_QSS,
  qualifying_surviving_spouse: EXEMPTION_MFJ_QSS,
  married_filing_separately: EXEMPTION_MFS,
};
const EXEMPTION_PHASE_OUT_RATE = 0.25;
// MANUAL EDIT: line 4 add-on for MFS (irs-6251-inst-2025::sec::line-4-alternative-minimum-taxable-income::b01).
const MFS_ADD_ON_START = 900_350;
const MFS_ADD_ON_MAX = 68_500;
const MFS_ADD_ON_RATE = 0.25;

// MANUAL EDIT: the AMT rate step of lines 7, 18 and 39 (irs-6251-inst-2025::sec::line-18::b01).
const AMT_LOW_RATE = 0.26;
const AMT_HIGH_RATE = 0.28;
const AMT_RATE_BREAK = 239_100;
const AMT_RATE_BREAK_MFS = 119_550;
const AMT_HIGH_RATE_SUBTRACTION = 4_782;
const AMT_HIGH_RATE_SUBTRACTION_MFS = 2_391;
// MANUAL EDIT: Part III lines 31, 34 and 37.
const FIFTEEN_PERCENT = 0.15;
const TWENTY_PERCENT = 0.2;
const TWENTY_FIVE_PERCENT = 0.25;
const TAX_YEAR = 2025;

/* An adjustment line prints only when there is an amount to adjust. */
const nonZeroOrBlank = (value: number | undefined): number | undefined =>
  value === undefined || value === 0 ? undefined : value;

/*
 * MANUAL EDIT: line 8 of the AMT Form 4952
 * (irs-6251-inst-2025::sec::line-2c-investment-interest::b01–b03). Line 2 is last
 * year's AMT carryover, taken as 0 when the regular one is 0; line 3 adds it
 * to the regular line 1. Line 4a adds line 2g; the line 1 interest on private
 * activity bonds, the refigured gains (line 2k) and line 5 have no facts, so those
 * lines match the regular form, and line 4g keeps the regular election (it is
 * within 4b + 4e). Undefined while either carryover is unstated.
 */
function amtInvestmentInterestDeduction(form: Form, info: Form6251FilingInfo): number | undefined {
  const regularLine2 = numberOrBlank(form["form-4952.0.line.2_disallowed_prior_year_interest"]);
  const line2 = info.amtDisallowedInterestCarryover ?? (regularLine2 === 0 ? 0 : undefined);
  if (line2 === undefined) return undefined;
  const line3 = sum(form["form-4952.0.line.1_investment_interest_paid"], line2);
  const line4h = sum(
    form["form-4952.0.line.4h_investment_income"],
    form["0.line.2g_private_activity_bond_interest"],
  );
  const line6 = atLeast(0, line4h - sum(form["form-4952.0.line.5_investment_expenses"]));
  return Math.min(line3, line6);
}

/* Line 2c either waits on an input or has its amount (blank when it does not apply). */
type Line2cOutcome = { waits: true } | { waits: false; amount: number | undefined };

/*
 * MANUAL EDIT: irs-6251-inst-2025::sec::line-2c-investment-interest::b03: regular
 * Form 4952 line 8 less AMT line 8, negative when the AMT amount is larger. A filer
 * who does not itemize enters nothing (Schedule E is not modeled), and no regular
 * Form 4952 means no AMT one. With both, the line waits while either Form 4952's
 * line 8 is still waiting on an input.
 */
function line2cOutcome(form: Form, info: Form6251FilingInfo): Line2cOutcome {
  if (info.itemizesDeductions !== true || info.mustFile?.["form-4952"]?.value !== true) {
    return { waits: false, amount: undefined };
  }
  const regularLine8 = numberOrBlank(form["form-4952.0.line.8_investment_interest_deduction"]);
  const amtLine8 = amtInvestmentInterestDeduction(form, info);
  if (regularLine8 === undefined || amtLine8 === undefined) return { waits: true };
  return { waits: false, amount: nonZeroOrBlank(roundDollars(regularLine8 - amtLine8)) };
}

/*
 * MANUAL EDIT: Exemption Worksheet—Line 5 (irs-6251-inst-2025::sec::exemption-worksheet::b01–b02).
 * 0 means the exemption is zero: the Note skips the worksheet and line 5.
 */
export function exemptionAmount(line4: number, status: FilingStatus): number {
  const row = EXEMPTION_BY_STATUS[status];
  if (line4 <= row.phaseOutStart) return row.exemption;
  const reduction = roundDollars((line4 - row.phaseOutStart) * EXEMPTION_PHASE_OUT_RATE);
  return atLeast(0, row.exemption - reduction);
}

/* Line 4's married-filing-separately add-on: 25% of the excess over $900,350, at most $68,500. */
export function withMfsAddOn(combined: number, status: FilingStatus): number {
  if (status !== "married_filing_separately" || combined <= MFS_ADD_ON_START) return combined;
  const addOn = roundDollars((combined - MFS_ADD_ON_START) * MFS_ADD_ON_RATE);
  return combined + Math.min(MFS_ADD_ON_MAX, addOn);
}

/* MANUAL EDIT: lines 7, 18 and 39: 26% up to the break, else 28% less the subtraction. */
export function amtTaxAtRates(amount: number, status: FilingStatus): number {
  const mfs = status === "married_filing_separately";
  if (amount <= (mfs ? AMT_RATE_BREAK_MFS : AMT_RATE_BREAK)) {
    return roundDollars(amount * AMT_LOW_RATE);
  }
  const subtraction = mfs ? AMT_HIGH_RATE_SUBTRACTION_MFS : AMT_HIGH_RATE_SUBTRACTION;
  return roundDollars(amount * AMT_HIGH_RATE - subtraction);
}

const isPositive = (value: unknown): boolean => (numberOrBlank(value) ?? 0) > 0;

/*
 * MANUAL EDIT: line 7 sends a filer to Part III for capital gain distributions
 * reported directly on 1040 line 7a, qualified dividends on line 3a, or a gain on
 * both Schedule D lines 15 and 16 (the AMT ones match: see regularWorksheet).
 * Line 6: "If zero or less, enter -0- here and on lines 7, 9, and 11, and go to line 10."
 */
function completesPartIII(form: Form): boolean {
  if (!isPositive(form["0.line.6_amti_less_exemption"])) return false;
  return (
    isPositive(form["form-1040.line.3a"]) ||
    (form["form-1040.line.7b_schedule_d_not_required"] === true &&
      isPositive(form["form-1040.line.7a"])) ||
    (isPositive(form["schedule-d.0.line.15_net_long_term_gain_loss"]) &&
      isPositive(form["schedule-d.1.line.16_combined_gain_loss"]))
  );
}

/*
 * MANUAL EDIT: the regular-tax worksheet, used as the AMT one
 * (irs-6251-inst-2025::sec::part-iii-tax-computation-using::b01–b03). ASSUMED: no
 * gain differs for the AMT (no fact holds an AMT basis or AMT loss carryover: see
 * line 2k), no Schedule K-1 (Form 1041) is ingested, and the AMT Form 4952 keeps
 * the regular line 4g (see line 2c), so the AMT worksheets match the regular ones.
 * A zero 1040 line 15 (statement 2) still figures lines 2–4. The QDCG worksheet
 * stands in for the Schedule D Tax Worksheet only while Schedule D lines 18 and
 * 19 are zero (its line 10 equals line 13 then, and line 21 equals line 14).
 * Form 2555 is not modeled.
 */
function regularWorksheet(form: Form, status: FilingStatus | undefined): QdcgBreakdown | undefined {
  if (status === undefined || !completesPartIII(form)) return undefined;
  if (
    isPositive(form["schedule-d.1.line.18_rate_gain_worksheet_amount"]) ||
    isPositive(form["schedule-d.1.line.19_unrecaptured_sec1250_gain"])
  ) {
    return undefined;
  }
  const taxable = numberOrBlank(form["form-1040.line.15"]);
  if (taxable === undefined) return undefined;
  const qualifiedDividends = numberOrBlank(form["form-1040.line.3a"]) ?? 0;
  try {
    return computeQdcg(qdcgInputsFromReturn(form, taxable, qualifiedDividends, status)).breakdown;
  } catch {
    return undefined;
  }
}

/* MANUAL EDIT: the form's gates: lines 32 and 12 the same skip 33–37; line 14 zero or blank skips 35–37. */
const skipsLines33To37 = (form: Form): boolean =>
  form["1.line.32_add_lines_23_30"] === form["1.line.12_amount_from_line_6"];
const skipsLines35To37 = (form: Form): boolean =>
  skipsLines33To37(form) || !isPositive(form["1.line.14_schedule_d_line_19"]);

export function register(): void {
  defineForm<Form6251, Form6251FilingInfo>("form-6251", {
    bindings: {
      // MANUAL EDIT: "Name(s) shown on Form 1040": both spouses on a joint return.
      "0.header.taxpayer_name": (_, info) => {
        if (!info.taxpayerFirstName || !info.taxpayerLastName) return undefined;
        const taxpayer = `${info.taxpayerFirstName} ${info.taxpayerLastName}`;
        const joint = info.filingStatus === "married_filing_jointly";
        return joint && info.spouseFirstName && info.spouseLastName
          ? `${taxpayer} and ${info.spouseFirstName} ${info.spouseLastName}`
          : taxpayer;
      },
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: irs-6251-inst-2025::sec::line-1a::b01. No Schedule 1-A subtracts nothing.
      "0.line.1a_deductions_less_schedule_1a": (form) => {
        const line14 = numberOrBlank(form["form-1040.line.14"]);
        if (line14 === undefined) return undefined;
        const seniorDeduction =
          numberOrBlank(form["schedule-1-a.1.line.37_enhanced_senior_deduction"]) ?? 0;
        return line14 - seniorDeduction;
      },
      // MANUAL EDIT: irs-6251-inst-2025::sec::line-1b::b01: a negative result stays negative.
      "0.line.1b_taxable_income_start": (form) => {
        const agi = numberOrBlank(form["form-1040.line.11b"]);
        const line1a = numberOrBlank(form["0.line.1a_deductions_less_schedule_1a"]);
        return agi === undefined || line1a === undefined ? undefined : agi - line1a;
      },
      /*
       * MANUAL EDIT: irs-6251-inst-2025::sec::line-2a-taxes::b01. An itemizer adds back
       * Schedule A line 7; a standard-deduction filer adds back line 12e. Schedule A
       * filed for California only does not itemize here. The gate matches 1040 line
       * 12e: no decision means the standard deduction. Schedule A line 6 is not
       * modeled, so line 7 holds no generation-skipping taxes; a net qualified
       * disaster loss and Form 1040-NR are not modeled.
       */
      "0.line.2a_taxes_or_standard_deduction": (form, info) =>
        numberOrBlank(
          info.itemizesDeductions === true
            ? form["schedule-a.0.line.7_total_taxes"]
            : form["form-1040.line.12e"],
        ),
      // MANUAL EDIT: see line2cOutcome; a waiting line stays blank.
      "0.line.2c_investment_interest_expense": (form, info) => {
        const outcome = line2cOutcome(form, info);
        return outcome.waits ? undefined : outcome.amount;
      },
      /*
       * MANUAL EDIT: irs-6251-inst-2025::sec::line-2g-interest-from-private-activity-bonds::b01–b02.
       * 1099-INT box 9 plus 1099-DIV box 13. KNOWN GAP: no fact holds a deduction
       * allocable to that interest, so nothing reduces it; Form 8814 is not modeled.
       */
      "0.line.2g_private_activity_bond_interest": (_, info) => {
        const interest = roundDollars(info.privateActivityBondInterest);
        return interest !== undefined && interest > 0 ? interest : undefined;
      },
      /*
       * MANUAL EDIT: irs-6251-inst-2025::sec::line-2i-exercise-of-incentive-stock-options::b01–b02.
       * The fact is the spread on stock not sold by year end: a same-year sale needs no adjustment.
       */
      "0.line.2i_incentive_stock_options": (_, info) => {
        const spread = roundDollars(info.isoExerciseSpread);
        return spread !== undefined && spread > 0 ? spread : undefined;
      },
      /*
       * MANUAL EDIT: combine lines 1b through 3 (each negative line holds its own sign), then
       * the MFS add-on (irs-6251-inst-2025::sec::line-4-alternative-minimum-taxable-income::b01).
       * Blank while line 2c waits: sum() would count it as 0.
       * KNOWN GAP: Schedule E is not modeled, so the REMIC floor (Schedule E line 38(c)) never applies.
       */
      "0.line.4_alternative_minimum_taxable_income": (form, info) => {
        const line1b = numberOrBlank(form["0.line.1b_taxable_income_start"]);
        if (line1b === undefined || line2cOutcome(form, info).waits) return undefined;
        const combined = sum(
          line1b,
          form["0.line.2a_taxes_or_standard_deduction"],
          form["0.line.2b_tax_refund"],
          form["0.line.2c_investment_interest_expense"],
          form["0.line.2d_depletion"],
          form["0.line.2e_net_operating_loss_deduction"],
          form["0.line.2f_alternative_tax_nol_deduction"],
          form["0.line.2g_private_activity_bond_interest"],
          form["0.line.2h_qualified_small_business_stock"],
          form["0.line.2i_incentive_stock_options"],
          form["0.line.2j_estates_and_trusts"],
          form["0.line.2k_disposition_of_property"],
          form["0.line.2l_post_1986_depreciation"],
          form["0.line.2m_passive_activities"],
          form["0.line.2n_loss_limitations"],
          form["0.line.2o_circulation_costs"],
          form["0.line.2p_long_term_contracts"],
          form["0.line.2q_mining_costs"],
          form["0.line.2r_research_experimental_costs"],
          form["0.line.2s_pre_1987_installment_sales"],
          form["0.line.2t_intangible_drilling_costs"],
          form["0.line.3_other_adjustments"],
        );
        return info.filingStatus === undefined
          ? combined
          : withMfsAddOn(combined, info.filingStatus);
      },
      // MANUAL EDIT: a zero exemption leaves line 5 blank; line 6 then takes line 4.
      "0.line.5_exemption": (form, info) => {
        const line4 = numberOrBlank(form["0.line.4_alternative_minimum_taxable_income"]);
        if (line4 === undefined || info.filingStatus === undefined) return undefined;
        return nonZeroOrBlank(exemptionAmount(line4, info.filingStatus));
      },
      "0.line.6_amti_less_exemption": (form, info) => {
        const line4 = numberOrBlank(form["0.line.4_alternative_minimum_taxable_income"]);
        if (line4 === undefined || info.filingStatus === undefined) return undefined;
        return atLeast(0, line4 - exemptionAmount(line4, info.filingStatus));
      },
      /*
       * MANUAL EDIT: a zero line 6 enters -0- on lines 7, 9 and 11. Part III's filers
       * enter line 40; all others tax line 6 at the AMT rates. Form 2555 is not modeled
       * (irs-6251-inst-2025::sec::line-7::b01).
       */
      "0.line.7_tax_on_line_6": (form, info) => {
        const line6 = numberOrBlank(form["0.line.6_amti_less_exemption"]);
        if (line6 === undefined || info.filingStatus === undefined) return undefined;
        if (line6 === 0) return 0;
        return completesPartIII(form)
          ? form["1.line.40_smaller_line_38_or_39"]
          : amtTaxAtRates(line6, info.filingStatus);
      },
      // MANUAL EDIT: line 8 is unsupported, so it subtracts nothing.
      "0.line.9_tentative_minimum_tax": (form) => {
        const line7 = numberOrBlank(form["0.line.7_tax_on_line_6"]);
        return line7 === undefined
          ? undefined
          : line7 - sum(form["0.line.8_amt_foreign_tax_credit"]);
      },
      /*
       * MANUAL EDIT: irs-6251-inst-2025::sec::line-10::b01–b02. Forms 4972 and 8978 and
       * Schedule J are not modeled, so 1040 line 16 needs no refiguring; Schedule 3
       * line 1 is unsupported and subtracts nothing.
       */
      "0.line.10_regular_tax_less_credits": (form) => {
        const line16 = numberOrBlank(form["form-1040.line.16"]);
        if (line16 === undefined) return undefined;
        const tax = sum(line16, form["schedule-2.0.line.1z_total_lines_1a_through_1y"]);
        return atLeast(0, tax - sum(form["schedule-3.0.line.1"]));
      },
      // MANUAL EDIT: a zero line 9 (line 6 zero) enters -0- without line 10.
      "0.line.11_amt": (form) => {
        const line9 = numberOrBlank(form["0.line.9_tentative_minimum_tax"]);
        if (line9 === 0) return 0;
        const line10 = numberOrBlank(form["0.line.10_regular_tax_less_credits"]);
        return line9 === undefined || line10 === undefined ? undefined : atLeast(0, line9 - line10);
      },
      // MANUAL EDIT: Part III is blank unless line 7 sends the filer to it.
      "1.line.12_amount_from_line_6": (form) =>
        completesPartIII(form) ? numberOrBlank(form["0.line.6_amti_less_exemption"]) : undefined,
      // MANUAL EDIT: QDCG worksheet line 4 (or Schedule D Tax Worksheet line 13); see regularWorksheet.
      "1.line.13_qualified_dividends_gain_amount": (form, info) =>
        regularWorksheet(form, info.filingStatus)?.line4,
      // MANUAL EDIT: blank while Schedule D line 19 is (it is unsupported); the AMT amount matches.
      "1.line.14_schedule_d_line_19": (form) =>
        completesPartIII(form)
          ? nonZeroOrBlank(numberOrBlank(form["schedule-d.1.line.19_unrecaptured_sec1250_gain"]))
          : undefined,
      /*
       * MANUAL EDIT: with line 14 zero, the smaller of line 13 and Schedule D Tax Worksheet
       * line 10 is line 13 (line 13 = line 10 less line 12). Otherwise worksheet line 10 is
       * not modeled, so the line waits.
       */
      "1.line.15_adjusted_net_capital_gain": (form) =>
        isPositive(form["1.line.14_schedule_d_line_19"])
          ? undefined
          : form["1.line.13_qualified_dividends_gain_amount"],
      "1.line.16_smaller_line_12_or_15": (form) => {
        const line12 = form["1.line.12_amount_from_line_6"];
        const line15 = form["1.line.15_adjusted_net_capital_gain"];
        return line12 === undefined || line15 === undefined ? undefined : Math.min(line12, line15);
      },
      "1.line.17_line_12_minus_16": (form) => {
        const line12 = form["1.line.12_amount_from_line_6"];
        const line16 = form["1.line.16_smaller_line_12_or_15"];
        return line12 === undefined || line16 === undefined ? undefined : line12 - line16;
      },
      "1.line.18_tax_on_line_17": (form, info) => {
        const line17 = form["1.line.17_line_12_minus_16"];
        if (line17 === undefined || info.filingStatus === undefined) return undefined;
        return amtTaxAtRates(line17, info.filingStatus);
      },
      "1.line.19_zero_rate_threshold": (form, info) =>
        completesPartIII(form) && info.filingStatus !== undefined
          ? lookupPreferentialBrackets(TAX_YEAR, info.filingStatus).zeroRateCeiling
          : undefined,
      // MANUAL EDIT: QDCG worksheet line 5 (or Schedule D Tax Worksheet line 14); 0 when 1040 line 15 is.
      "1.line.20_regular_tax_taxable_income": (form, info) =>
        regularWorksheet(form, info.filingStatus)?.line5,
      "1.line.21_line_19_minus_20": (form) => {
        const line19 = form["1.line.19_zero_rate_threshold"];
        const line20 = form["1.line.20_regular_tax_taxable_income"];
        return line19 === undefined || line20 === undefined
          ? undefined
          : atLeast(0, line19 - line20);
      },
      "1.line.22_smaller_line_12_or_13": (form) => {
        const line12 = form["1.line.12_amount_from_line_6"];
        const line13 = form["1.line.13_qualified_dividends_gain_amount"];
        return line12 === undefined || line13 === undefined ? undefined : Math.min(line12, line13);
      },
      "1.line.23_amount_taxed_at_zero": (form) => {
        const line21 = form["1.line.21_line_19_minus_20"];
        const line22 = form["1.line.22_smaller_line_12_or_13"];
        return line21 === undefined || line22 === undefined ? undefined : Math.min(line21, line22);
      },
      "1.line.24_line_22_minus_23": (form) => {
        const line22 = form["1.line.22_smaller_line_12_or_13"];
        const line23 = form["1.line.23_amount_taxed_at_zero"];
        return line22 === undefined || line23 === undefined ? undefined : line22 - line23;
      },
      "1.line.25_fifteen_rate_threshold": (form, info) =>
        completesPartIII(form) && info.filingStatus !== undefined
          ? lookupPreferentialBrackets(TAX_YEAR, info.filingStatus).fifteenRateCeiling
          : undefined,
      "1.line.26_amount_from_line_21": (form) => form["1.line.21_line_19_minus_20"],
      // MANUAL EDIT: QDCG worksheet line 5 (Schedule D Tax Worksheet line 21 equals line 14 here).
      "1.line.27_regular_tax_taxable_income": (form, info) =>
        regularWorksheet(form, info.filingStatus)?.line5,
      "1.line.28_add_lines_26_27": (form) => {
        const line26 = form["1.line.26_amount_from_line_21"];
        const line27 = form["1.line.27_regular_tax_taxable_income"];
        return line26 === undefined || line27 === undefined ? undefined : line26 + line27;
      },
      "1.line.29_line_25_minus_28": (form) => {
        const line25 = form["1.line.25_fifteen_rate_threshold"];
        const line28 = form["1.line.28_add_lines_26_27"];
        return line25 === undefined || line28 === undefined
          ? undefined
          : atLeast(0, line25 - line28);
      },
      "1.line.30_smaller_line_24_or_29": (form) => {
        const line24 = form["1.line.24_line_22_minus_23"];
        const line29 = form["1.line.29_line_25_minus_28"];
        return line24 === undefined || line29 === undefined ? undefined : Math.min(line24, line29);
      },
      "1.line.31_tax_at_fifteen_percent": (form) => {
        const line30 = form["1.line.30_smaller_line_24_or_29"];
        return line30 === undefined ? undefined : roundDollars(line30 * FIFTEEN_PERCENT);
      },
      "1.line.32_add_lines_23_30": (form) => {
        const line23 = form["1.line.23_amount_taxed_at_zero"];
        const line30 = form["1.line.30_smaller_line_24_or_29"];
        return line23 === undefined || line30 === undefined ? undefined : line23 + line30;
      },
      "1.line.33_line_22_minus_32": (form) => {
        const line22 = form["1.line.22_smaller_line_12_or_13"];
        const line32 = form["1.line.32_add_lines_23_30"];
        if (line22 === undefined || line32 === undefined || skipsLines33To37(form))
          return undefined;
        return line22 - line32;
      },
      "1.line.34_tax_at_twenty_percent": (form) => {
        const line33 = form["1.line.33_line_22_minus_32"];
        return line33 === undefined ? undefined : roundDollars(line33 * TWENTY_PERCENT);
      },
      "1.line.35_add_lines_17_32_33": (form) => {
        const line17 = form["1.line.17_line_12_minus_16"];
        const line32 = form["1.line.32_add_lines_23_30"];
        const line33 = form["1.line.33_line_22_minus_32"];
        if (line17 === undefined || line32 === undefined || line33 === undefined) return undefined;
        return skipsLines35To37(form) ? undefined : line17 + line32 + line33;
      },
      "1.line.36_line_12_minus_35": (form) => {
        const line12 = form["1.line.12_amount_from_line_6"];
        const line35 = form["1.line.35_add_lines_17_32_33"];
        return line12 === undefined || line35 === undefined ? undefined : line12 - line35;
      },
      "1.line.37_tax_at_twenty_five_percent": (form) => {
        const line36 = form["1.line.36_line_12_minus_35"];
        return line36 === undefined ? undefined : roundDollars(line36 * TWENTY_FIVE_PERCENT);
      },
      // MANUAL EDIT: lines 34 and 37 count as 0 when the form skips them.
      "1.line.38_add_lines_18_31_34_37": (form) => {
        const line18 = form["1.line.18_tax_on_line_17"];
        const line31 = form["1.line.31_tax_at_fifteen_percent"];
        if (line18 === undefined || line31 === undefined) return undefined;
        return sum(
          line18,
          line31,
          form["1.line.34_tax_at_twenty_percent"],
          form["1.line.37_tax_at_twenty_five_percent"],
        );
      },
      "1.line.39_tax_on_line_12": (form, info) => {
        const line12 = form["1.line.12_amount_from_line_6"];
        if (line12 === undefined || info.filingStatus === undefined) return undefined;
        return amtTaxAtRates(line12, info.filingStatus);
      },
      "1.line.40_smaller_line_38_or_39": (form) => {
        const line38 = form["1.line.38_add_lines_18_31_34_37"];
        const line39 = form["1.line.39_tax_on_line_12"];
        return line38 === undefined || line39 === undefined ? undefined : Math.min(line38, line39);
      },
    },

    unsupported: {
      "0.line.2b_tax_refund":
        "Schedule 1 line 1 (state and local tax refunds) is unsupported and line 8z carries only 1099-MISC other income, so no tax refund reaches the return.",
      "0.line.2d_depletion":
        "No fact holds the AMT-refigured depletion or the property's adjusted basis that the AMT difference needs (Schedule C line 12 holds only the regular depletion).",
      "0.line.2e_net_operating_loss_deduction":
        "Schedule 1 line 8a is unsupported: no fact holds a net operating loss carryforward.",
      "0.line.2f_alternative_tax_nol_deduction":
        "No fact holds an alternative tax net operating loss carryback or carryforward.",
      "0.line.2h_qualified_small_business_stock":
        "Form 8949 column (g) is unsupported, so the return claims no section 1202 exclusion for qualified small business stock.",
      "0.line.2j_estates_and_trusts":
        "Schedule K-1 (Form 1041) is not ingested, so box 12 code A has no fact.",
      "0.line.2k_disposition_of_property":
        "No fact holds an AMT basis that differs from the regular basis (stock from an earlier ISO exercise, depreciated property), so no gain or loss can be refigured.",
      "0.line.2l_post_1986_depreciation":
        "No fact holds the method, recovery class, placed-in-service date or AMT depreciation the adjustment needs (Schedule C line 13 holds only the regular depreciation).",
      "0.line.2m_passive_activities":
        "Passive activities (Form 8582, Schedule E, K-1s) are not modeled.",
      "0.line.2n_loss_limitations":
        "At-risk (Form 6198) and partnership or S corporation basis limits are not modeled.",
      "0.line.2o_circulation_costs": "No fact holds circulation costs under section 173.",
      "0.line.2p_long_term_contracts": "No fact holds a long-term contract under section 460.",
      "0.line.2q_mining_costs":
        "No fact holds mining exploration or development costs under section 616 or 617.",
      "0.line.2r_research_experimental_costs":
        "No fact holds research and experimental costs under section 174.",
      "0.line.2s_pre_1987_installment_sales":
        "No fact holds an installment sale made after August 16, 1986, and before 1987.",
      "0.line.2t_intangible_drilling_costs":
        "No fact holds intangible drilling costs for oil, gas or geothermal wells.",
      "0.line.3_other_adjustments":
        "No fact says whether a deducted mortgage is on a qualified dwelling, and the other line 3 items (pre-1987 depreciation, Form 8990, related adjustments) are not modeled.",
      "0.line.8_amt_foreign_tax_credit":
        "Schedule 3 line 1 (the regular foreign tax credit) is unsupported and Form 1116 is not modeled, so no AMT foreign tax credit can be figured.",
    },

    // MANUAL EDIT: the SSN renders with dashes; this form has no comb widget.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
