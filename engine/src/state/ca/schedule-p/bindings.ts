/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { lookupStandardDeduction } from "../../../data/standardDeduction.js";
import { defineForm, type BindingFn, type FormAccessor } from "../../../defineForm.js";
import { atLeast, numberOrBlank, roundDollars, sum, sumOrBlank } from "../../../money.js";
import type { FilingStatus } from "../../../values.js";
import type { SchedulePFilingInfo } from "./filingInfo.js";
import { partIIICreditRows } from "./partIII.js";
import type { ScheduleP } from "./types.js";

type Bindings = Partial<{ [K in keyof ScheduleP]: BindingFn<ScheduleP, SchedulePFilingInfo, K> }>;
type Form = FormAccessor<ScheduleP>;

/*
 * Part II line 22, Exemption Worksheet
 * (ca-540-sched-p-inst-2025::sec::exemption-worksheet::b01): `amount` is
 * worksheet line 1, `phaseOutStart` line 3 (25% of AMTI above it reduces the
 * exemption), and at `zeroAt` or more "your exemption amount is zero".
 */
interface ExemptionRow {
  amount: number;
  phaseOutStart: number;
  zeroAt: number;
}
const EXEMPTION = {
  single: { amount: 92749, phaseOutStart: 347808, zeroAt: 718804 },
  head_of_household: { amount: 92749, phaseOutStart: 347808, zeroAt: 718804 },
  married_filing_jointly: { amount: 123667, phaseOutStart: 463745, zeroAt: 958413 },
  qualifying_surviving_spouse: { amount: 123667, phaseOutStart: 463745, zeroAt: 958413 },
  married_filing_separately: { amount: 61830, phaseOutStart: 231868, zeroAt: 479188 },
} as const satisfies Record<FilingStatus, ExemptionRow>;
const EXEMPTION_PHASE_OUT_RATE = 0.25;

/*
 * Part I line 21, the married/RDP filing separately worksheet
 * (ca-540-sched-p-inst-2025::sec::line-21-alternative-minimum-taxable-income-amti::b01):
 * above $479,188, add 25% of the excess, capped at $61,830.
 */
const MFS_LINE_21_THRESHOLD = 479188;
const MFS_LINE_21_RATE = 0.25;
const MFS_LINE_21_CAP = 61830;

/* Part I line 2: "2½% (.025) of federal Form 1040 or 1040-SR, line 11b" (the form). */
const MEDICAL_AMT_FLOOR_RATE = 0.025;
/* Part II line 24: "Multiply line 23 by 7.0% (.07)" (the form). */
const TENTATIVE_MINIMUM_TAX_RATE = 0.07;

/*
 * Line 7 refigures FTB 3526 for AMT: line 1 plus last year's AMT carryover
 * (instead of the regular one), capped at line 6, as the regular form does. The
 * line 1 and line 4a–4c differences have no facts, so the forms agree there.
 * With a regular carryover and no AMT carryover stated the result is unknown,
 * and lines 14 and 19 wait on line 7.
 */
function amtInvestmentInterestDeduction(form: Form, info: SchedulePFilingInfo): number | undefined {
  const line1 = numberOrBlank(form["form-3526.0.line.1_investment_interest_paid"]) ?? 0;
  const regularLine2 =
    numberOrBlank(form["form-3526.0.line.2_disallowed_prior_year_interest"]) ?? 0;
  const line6 = numberOrBlank(form["form-3526.0.line.6_net_investment_income"]);
  if (line6 === undefined) return undefined;
  const amtLine2 = regularLine2 > 0 ? info.caAmtDisallowedInterestCarryover : 0;
  if (amtLine2 === undefined) return undefined;
  return Math.min(line1 + atLeast(0, amtLine2), line6);
}

/* An add-back line prints only when there is an amount to add back. */
const positiveOrBlank = (value: number | undefined): number | undefined =>
  value !== undefined && value > 0 ? value : undefined;

/*
 * MANUAL EDIT: "If you itemized deductions, go to line 2. If you did not
 * itemize deductions, enter your standard deduction from Form 540, line 18"
 * (the form). Form 540 line 18 is Schedule CA Part II line 30, the larger of
 * the CA standard deduction and the CA itemized deductions, so the return
 * itemizes for California when line 18 is above the standard deduction.
 */
function itemizesForCalifornia(form: Form, info: SchedulePFilingInfo): boolean | undefined {
  const line18 = numberOrBlank(form["form-540.line.18_deductions"]);
  if (line18 === undefined || !info.filingStatus) return undefined;
  const standard = lookupStandardDeduction("state-ca", 2025, info.filingStatus);
  if (standard === undefined) return undefined;
  return line18 > standard;
}

/* The last filled column (c) among credit rows, read from the bottom up; else the section's opening balance. */
function lastTaxBalance(form: Form, opening: number, rows: Array<keyof ScheduleP>): number {
  for (const row of rows) {
    const balance = numberOrBlank(form[row]);
    if (balance !== undefined) return balance;
  }
  return opening;
}

const partI: Bindings = {
  // MANUAL EDIT: "Name or names as shown on Form 540": both spouses on a joint return.
  "0.header.name": (_, info) => {
    if (!info.taxpayerFirstName || !info.taxpayerLastName) return undefined;
    const taxpayer = `${info.taxpayerFirstName} ${info.taxpayerLastName}`;
    const joint = info.filingStatus === "married_filing_jointly";
    return joint && info.spouseFirstName && info.spouseLastName
      ? `${taxpayer} and ${info.spouseFirstName} ${info.spouseLastName}`
      : taxpayer;
  },
  "0.header.ssn": (_, info) => info.taxpayerSSN,
  "0.line.1_standard_deduction": (form, info) => {
    const itemizes = itemizesForCalifornia(form, info);
    if (itemizes === undefined) return undefined;
    return itemizes ? undefined : numberOrBlank(form["form-540.line.18_deductions"]);
  },
  /*
   * The smaller of federal Schedule A line 4 (Schedule CA Part II line 4,
   * column A) or 2½% of federal AGI (Form 540 line 13); no adjustment for
   * federal/California differences
   * (ca-540-sched-p-inst-2025::sec::line-2-medical-and-dental-expenses::b01).
   */
  "0.line.2_medical_dental_expenses": (form, info) => {
    if (itemizesForCalifornia(form, info) !== true) return undefined;
    const scheduleALine4 = numberOrBlank(form["schedule-ca.4.page2.medical_line4_federal"]);
    const federalAgi = numberOrBlank(form["form-540.line.13_federal_agi"]);
    if (scheduleALine4 === undefined || federalAgi === undefined) return undefined;
    const floor = roundDollars(federalAgi * MEDICAL_AMT_FLOOR_RATE);
    return positiveOrBlank(Math.min(scheduleALine4, floor));
  },
  /*
   * Schedule CA Part II lines 5b and 5c, column A, and line 6 (column A minus
   * column B) (ca-540-sched-p-inst-2025::sec::line-3-personal-property-taxes-and-real-property-taxes::b01).
   * The state income tax (line 5a) is not on this line.
   */
  "0.line.3_personal_real_property_taxes": (form, info) => {
    if (itemizesForCalifornia(form, info) !== true) return undefined;
    const columnA = sumOrBlank(
      form["schedule-ca.4.page2.taxes_5b_federal"],
      form["schedule-ca.4.page2.taxes_5c_federal"],
      form["schedule-ca.4.page2.taxes_6_federal"],
    );
    if (columnA === undefined) return undefined;
    return positiveOrBlank(
      roundDollars(columnA - sum(form["schedule-ca.4.page2.taxes_6_subtractions"])),
    );
  },
  // Schedule CA Part II line 25 (ca-540-sched-p-inst-2025::sec::line-5-miscellaneous-itemized-deductions::b01).
  "0.line.5_miscellaneous_itemized_deductions": (form, info) => {
    if (itemizesForCalifornia(form, info) !== true) return undefined;
    return positiveOrBlank(numberOrBlank(form["schedule-ca.5.page2.job_expenses_25_net"]));
  },
  /*
   * MANUAL EDIT: the difference between the regular FTB 3526 line 8 and the AMT
   * one, "as a negative amount" when the AMT amount is the larger
   * (ca-540-sched-p-inst-2025::sec::line-7-investment-interest-expense-adjustment::b02).
   * The AMT refiguring differs in line 1 (Part I line 4 interest), line 2 (the
   * 2024 AMT disallowed amount) and lines 4a–4c (AMT adjustments) (…::b01); only
   * line 2 has a fact (amtInvestmentInterestDeduction). Without itemizing, "do
   * not enter an adjustment" (…::b02).
   */
  "0.line.7_investment_interest_adjustment": (form, info) => {
    if (itemizesForCalifornia(form, info) !== true) return undefined;
    const regularLine8 = numberOrBlank(form["form-3526.0.line.8_investment_interest_deduction"]);
    const amtLine8 = amtInvestmentInterestDeduction(form, info);
    if (regularLine8 === undefined || amtLine8 === undefined) return undefined;
    return roundDollars(regularLine8 - amtLine8);
  },
  /*
   * The ISO spread: fair market value at exercise over the amount paid, for
   * stock not sold in the year (ca-540-sched-p-inst-2025::sec::line-9-adjusted-gain-or-loss::b02,
   * the run-in "Line 10" heading; same-year sale needs no adjustment, …::b03).
   */
  "0.line.10_iso_cqso": (_, info) => positiveOrBlank(numberOrBlank(info.isoExerciseSpread)),
  // "Enter the total on line 13" (ca-540-sched-p-inst-2025::sec::line-13-other-adjustments-and-preferences::b01).
  "0.line.13_other_adjustments_total": (form) =>
    sumOrBlank(
      form["0.line.13a_circulation_expenditures"],
      form["0.line.13b_depletion"],
      form["0.line.13c_installment_sales"],
      form["0.line.13d_intangible_drilling_costs"],
      form["0.line.13e_long_term_contracts"],
      form["0.line.13f_loss_limitations"],
      form["0.line.13g_mining_costs"],
      form["0.line.13h_patrons_adjustment"],
      form["0.line.13i_pollution_control_facilities"],
      form["0.line.13j_research_experimental"],
      form["0.line.13k_tax_shelter_farm_activities"],
      form["0.line.13l_related_adjustments"],
    ),
  // "Combine line 1 through line 13" (the form).
  "0.line.14_total_adjustments_preferences": (form, info) => {
    // Line 7 is unknown (not blank) while the return itemizes and FTB 3526 has a deduction.
    const line7Waits =
      itemizesForCalifornia(form, info) === true &&
      numberOrBlank(form["form-3526.0.line.8_investment_interest_deduction"]) !== undefined &&
      form["0.line.7_investment_interest_adjustment"] === undefined;
    if (line7Waits) return undefined;
    return sumOrBlank(
      form["0.line.1_standard_deduction"],
      form["0.line.2_medical_dental_expenses"],
      form["0.line.3_personal_real_property_taxes"],
      form["0.line.4_home_mortgage_interest"],
      form["0.line.5_miscellaneous_itemized_deductions"],
      form["0.line.6_property_tax_refund"],
      form["0.line.7_investment_interest_adjustment"],
      form["0.line.8_post_1986_depreciation"],
      form["0.line.9_adjusted_gain_loss"],
      form["0.line.10_iso_cqso"],
      form["0.line.11_passive_activities_adjustment"],
      form["0.line.12_estate_trust_beneficiaries"],
      form["0.line.13_other_adjustments_total"],
    );
  },
  /*
   * Form 540 line 19; when that is zero, line 17 less line 18 as a negative
   * amount (ca-540-sched-p-inst-2025::sec::line-15-taxable-income::b01).
   */
  "0.line.15_taxable_income": (form) => {
    const taxableIncome = numberOrBlank(form["form-540.line.19_taxable_income"]);
    if (taxableIncome === undefined) return undefined;
    if (taxableIncome > 0) return taxableIncome;
    const caAgi = numberOrBlank(form["form-540.line.17_ca_agi"]);
    const deductions = numberOrBlank(form["form-540.line.18_deductions"]);
    if (caAgi === undefined || deductions === undefined) return undefined;
    return Math.min(0, caAgi - deductions);
  },
  // Schedule CA Part I, Section B, lines 9b1–9b3, column B, "as a positive amount" (the form).
  "0.line.16_nol_deductions": (form) =>
    positiveOrBlank(
      sumOrBlank(
        form["schedule-ca.2.line.b9b1_subtractions"],
        form["schedule-ca.2.line.b9b2_subtractions"],
        form["schedule-ca.2.line.b9b3_subtractions"],
      ),
    ),
  /*
   * MANUAL EDIT: the regular-tax limitation on CA itemized deductions does not
   * apply for AMT; enter line 9 of the Itemized Deductions Worksheet
   * (ca-540-sched-p-inst-2025::sec::line-18-itemized-deductions-limitation::b01).
   * Schedule CA Part II line 29 is line 28 less that worksheet line 9
   * (ca-540-sched-ca-inst-2025::sec::itemized-deductions-worksheet::b01, line 10),
   * so the add-back is line 28 minus line 29: nothing at or under the federal
   * AGI threshold, where line 29 equals line 28.
   */
  "1.line.18_itemized_deductions_limitation": (form, info) => {
    if (itemizesForCalifornia(form, info) !== true) return undefined;
    const line28 = numberOrBlank(form["schedule-ca.5.page2.total_itemized_28"]);
    const line29 = numberOrBlank(form["schedule-ca.5.page2.total_itemized_29"]);
    if (line28 === undefined || line29 === undefined) return undefined;
    return positiveOrBlank(roundDollars(line28 - line29));
  },
  /*
   * "Combine line 14 through line 18" (the form). Line 17 excludes a qualified
   * taxpayer's trade or business income from AMTI
   * (ca-540-sched-p-inst-2025::sec::g-alternative-minimum-taxable-income-amti-exclusion::b01),
   * so it enters as a negative term.
   */
  "1.line.19_combine_lines_14_through_18": (form, info) => {
    // Line 14 waits (an unknown adjustment) while the return itemizes: so does AMTI.
    const line14 = form["0.line.14_total_adjustments_preferences"];
    if (line14 === undefined && itemizesForCalifornia(form, info) === true) return undefined;
    const exclusion = numberOrBlank(form["0.line.17_amti_exclusion"]);
    return sumOrBlank(
      form["0.line.14_total_adjustments_preferences"],
      form["0.line.15_taxable_income"],
      form["0.line.16_nol_deductions"],
      exclusion === undefined ? undefined : -exclusion,
      form["1.line.18_itemized_deductions_limitation"],
    );
  },
  /*
   * "Subtract line 20 from line 19" (the form). Married/RDP filing separately
   * above $479,188: add 25% of the excess, at most $61,830
   * (ca-540-sched-p-inst-2025::sec::line-21-alternative-minimum-taxable-income-amti::b01).
   */
  "1.line.21_alternative_minimum_taxable_income": (form, info) => {
    const line19 = numberOrBlank(form["1.line.19_combine_lines_14_through_18"]);
    if (line19 === undefined) return undefined;
    const amti = line19 - sum(form["1.line.20_amt_nol_deduction"]);
    const separate = info.filingStatus === "married_filing_separately";
    if (!separate || amti <= MFS_LINE_21_THRESHOLD) return amti;
    const addition = roundDollars((amti - MFS_LINE_21_THRESHOLD) * MFS_LINE_21_RATE);
    return amti + Math.min(addition, MFS_LINE_21_CAP);
  },
};

const partII: Bindings = {
  /*
   * The Exemption Worksheet (ca-540-sched-p-inst-2025::sec::exemption-worksheet::b01):
   * -0- at the zero point or above, else the exemption less 25% of AMTI over
   * the phase-out start, not below zero. The limit for certain children under
   * age 24 (earned income plus $9,750, …::sec::certain-children-under-age-24::b01)
   * is not modeled: no age or support facts.
   */
  "1.line.22_exemption_amount": (form, info) => {
    const amti = numberOrBlank(form["1.line.21_alternative_minimum_taxable_income"]);
    if (amti === undefined || !info.filingStatus) return undefined;
    const { amount, phaseOutStart, zeroAt } = EXEMPTION[info.filingStatus];
    if (amti >= zeroAt) return 0;
    if (amti <= phaseOutStart) return amount;
    const reduction = roundDollars((amti - phaseOutStart) * EXEMPTION_PHASE_OUT_RATE);
    return atLeast(0, amount - reduction);
  },
  // "Subtract line 22 from line 21. If zero or less, enter -0-" (the form; ca-540-sched-p-inst-2025::sec::line-23::b01).
  "1.line.23_amti_less_exemption": (form) => {
    const amti = numberOrBlank(form["1.line.21_alternative_minimum_taxable_income"]);
    const exemption = numberOrBlank(form["1.line.22_exemption_amount"]);
    if (amti === undefined || exemption === undefined) return undefined;
    return atLeast(0, amti - exemption);
  },
  // "Multiply line 23 by 7.0% (.07)" (the form); -0- with line 23 (ca-540-sched-p-inst-2025::sec::line-23::b01).
  "1.line.24_tentative_minimum_tax": (form) => {
    const base = numberOrBlank(form["1.line.23_amti_less_exemption"]);
    if (base === undefined) return undefined;
    return base > 0 ? roundDollars(base * TENTATIVE_MINIMUM_TAX_RATE) : 0;
  },
  // "Regular tax before credits from Form 540, line 31" (the form).
  "1.line.25_regular_tax_before_credits": (form) =>
    numberOrBlank(form["form-540.line.31_tax_amount"]),
  // "Subtract line 25 from line 24. If zero or less, enter -0-" (the form).
  "1.line.26_alternative_minimum_tax": (form) => {
    const tentative = numberOrBlank(form["1.line.24_tentative_minimum_tax"]);
    const regular = numberOrBlank(form["1.line.25_regular_tax_before_credits"]);
    if (tentative === undefined || regular === undefined) return undefined;
    return atLeast(0, tentative - regular);
  },
};

const partIII: Bindings = {
  // "Enter the amount from Form 540, line 35" (the form; ca-540-sched-p-inst-2025::sec::before-you-begin-part-iii::b01).
  "1.part3.1_tax_from_form_540_line_35": (form) =>
    numberOrBlank(form["form-540.line.35_total_tax_after_credits"]),
  // "Enter the tentative minimum tax from Part II, line 24" (the form).
  "1.part3.2_tentative_minimum_tax": (form) =>
    numberOrBlank(form["1.line.24_tentative_minimum_tax"]),
  // "Subtract line 2 from line 1. If the amount is zero or less than zero" enter -0- (ca-540-sched-p-inst-2025::sec::section-a-instructions::b01).
  "1.part3.3_excess_tax_offset_by_credits_col_c": (form) => {
    const tax = numberOrBlank(form["1.part3.1_tax_from_form_540_line_35"]);
    const tentative = numberOrBlank(form["1.part3.2_tentative_minimum_tax"]);
    if (tax === undefined || tentative === undefined) return undefined;
    return atLeast(0, tax - tentative);
  },
  /*
   * "If Part III, line 3 is zero, enter the amount from line 1. If line 3 is
   * more than zero, enter the total of line 2 and the last entry in column (c)"
   * (the form). With no Section A credit taken, the last entry is line 3.
   */
  "2.part3.11_tax_balance_col_c": (form) => {
    const tax = numberOrBlank(form["1.part3.1_tax_from_form_540_line_35"]);
    const tentative = numberOrBlank(form["1.part3.2_tentative_minimum_tax"]);
    const excess = numberOrBlank(form["1.part3.3_excess_tax_offset_by_credits_col_c"]);
    if (tax === undefined || tentative === undefined || excess === undefined) return undefined;
    if (excess === 0) return tax;
    return (
      tentative +
      lastTaxBalance(form, excess, [
        "2.part3.10_prior_year_amt_tax_balance_col_c",
        "2.part3.9_tax_balance_col_c",
        "2.part3.8_tax_balance_col_c",
        "2.part3.7_tax_balance_col_c",
        "2.part3.6_tax_balance_col_c",
        "1.part3.5_child_dependent_care_credit_col_c",
        "1.part3.4_prison_inmate_labor_credit_col_c",
      ])
    );
  },
  // "Enter your alternative minimum tax from Side 2, Part II, line 26" (the form).
  "3.part3.22_alternative_minimum_tax_col_c": (form) =>
    numberOrBlank(form["1.line.26_alternative_minimum_tax"]),
  /*
   * "Enter the balance from line 24, column (c)" (the form): the AMT less the
   * Section C carryover credits taken; with none taken, line 22.
   */
  "3.part3.25_adjusted_amt_col_c": (form) => {
    const amt = numberOrBlank(form["3.part3.22_alternative_minimum_tax_col_c"]);
    if (amt === undefined) return undefined;
    return lastTaxBalance(form, amt, [
      "3.part3.24_commercial_solar_carryover_tax_balance_col_c",
      "3.part3.23_solar_energy_carryover_tax_balance_col_c",
    ]);
  },
};

export function register(): void {
  defineForm<ScheduleP, SchedulePFilingInfo>("schedule-p", {
    bindings: { ...partI, ...partII, ...partIII },
    unsupported: {
      "0.line.4_home_mortgage_interest":
        "Home mortgage interest on proceeds not used to buy, build or improve the home (ca-540-sched-p-inst-2025::sec::line-4-certain-interest-on-a-home-mortgage::b01) — no fact on the use of home-equity loan proceeds.",
      "0.line.6_property_tax_refund":
        "Refund of personal or real property taxes deducted in a year after 1986 (ca-540-sched-p-inst-2025::sec::line-6-refund-of-personal-property-taxes-and-real-property-taxes::b01) — no property tax refund fact.",
      "0.line.8_post_1986_depreciation":
        "Regular less AMT (ADS) depreciation on Schedule C, E or F property (ca-540-sched-p-inst-2025::sec::property-placed-in-service-after-1998::b02) — no depreciation facts.",
      "0.line.9_adjusted_gain_loss":
        "Gain or loss refigured for property with a different AMT basis (ca-540-sched-p-inst-2025::sec::line-9-adjusted-gain-or-loss::b01) — no AMT basis facts.",
      "0.line.11_passive_activities_adjustment":
        "AMT passive activity income or loss less the regular amount, from a second FTB 3801 (ca-540-sched-p-inst-2025::sec::line-11-passive-activities-adjustment::b01) — no passive activity facts.",
      "0.line.12_estate_trust_beneficiaries":
        "Estate or trust beneficiary's AMT adjustment (the form; no line section) — no Schedule K-1 (541) facts.",
      "0.line.13a_circulation_expenditures":
        "Circulation expenditures amortized over three years for AMT (ca-540-sched-p-inst-2025::sec::line-13a-circulation-expenditures::b01) — no circulation expenditure facts.",
      "0.line.13b_depletion":
        "Depletion over the property's adjusted basis (ca-540-sched-p-inst-2025::sec::line-13b-depletion::b01) — no depletion facts.",
      "0.line.13c_installment_sales":
        "Installment-method income refigured for AMT, and QSBS installment payments (ca-540-sched-p-inst-2025::sec::line-13c-installment-sales::b01) — no installment sale facts.",
      "0.line.13d_intangible_drilling_costs":
        "Excess intangible drilling costs from geothermal wells (ca-540-sched-p-inst-2025::sec::line-13d-intangible-drilling-costs-idcs::b01) — no drilling cost facts.",
      "0.line.13e_long_term_contracts":
        "Long-term contract income under the percentage-of-completion method (ca-540-sched-p-inst-2025::sec::line-13e-long-term-contracts::b02) — no long-term contract facts.",
      "0.line.13f_loss_limitations":
        "At-risk and basis-limited losses refigured for AMT (ca-540-sched-p-inst-2025::sec::line-13f-loss-limitations::b01) — no loss limitation facts.",
      "0.line.13g_mining_costs":
        "Mining exploration and development costs amortized over 10 years for AMT (ca-540-sched-p-inst-2025::sec::line-13g-mining-costs::b01) — no mining cost facts.",
      "0.line.13h_patrons_adjustment":
        "AMT patronage dividend adjustment reported by a cooperative (ca-540-sched-p-inst-2025::sec::line-13h-patron-s-adjustment::b01) — no cooperative distribution facts.",
      "0.line.13i_pollution_control_facilities":
        "Pollution control facility amortization refigured for AMT (ca-540-sched-p-inst-2025::sec::line-13i-pollution-control-facilities::b01) — no pollution control facility facts.",
      "0.line.13j_research_experimental":
        "Research and experimental costs amortized over 10 years for AMT (ca-540-sched-p-inst-2025::sec::line-13j-research-and-experimental-costs::b01) — no research cost facts.",
      "0.line.13k_tax_shelter_farm_activities":
        "Nonpassive tax shelter farm activity gain or loss refigured for AMT (ca-540-sched-p-inst-2025::sec::line-13k-tax-shelter-farm-activities::b02) — no farm activity facts.",
      "0.line.13l_related_adjustments":
        "Income-limited items (IRC 179, SE health insurance, Keogh, …) refigured with AMT income (ca-540-sched-p-inst-2025::sec::line-13l-related-adjustments::b01) — no entry on lines 7 to 13k is modeled.",
      "0.line.17_amti_exclusion":
        "Trade or business income excluded by a qualified taxpayer with aggregate gross receipts under $1,000,000 (ca-540-sched-p-inst-2025::sec::g-alternative-minimum-taxable-income-amti-exclusion::b01) — no gross receipts fact.",
      "1.line.20_amt_nol_deduction":
        "AMT NOL deduction refigured on a second FTB 3805V, at most 90% of line 19 (ca-540-sched-p-inst-2025::sec::step-3-amt-nol-deduction-for-the-current-year::b01) — no NOL carryover facts.",
      ...partIIICreditRows,
    },
  });
}
