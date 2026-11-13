/*
 * tcb-us-002 — the TaxCalcBench answer key (output.xml, ty25-us-002), typed line by
 * line. The key is Column Tax's engine output, reviewed by their tax analysts.
 * Change a value only when the IRS instructions say the key is wrong (README.md).
 * Lines the key fills and the instructions leave blank are listed in the README.
 */

import type { ExpectedResults } from "../../types.js";

const FORM_1040: Partial<ExpectedResults> = {
  engineFields: {
    "form-1040.line.1a": 32000, // WagesAmt
    "form-1040.line.1z": 32000, // WagesSalariesAndTipsAmt
    "form-1040.line.8": 1650, // TotalAdditionalIncomeAmt (Schedule 1 line 10)
    "form-1040.line.9": 33650, // TotalIncomeAmt
    "form-1040.line.11a": 33650, // AdjustedGrossIncomeAmt
    "form-1040.line.11b": 33650,
    "form-1040.line.12e": 26125, // TotalItemizedOrStandardDedAmt (Schedule A line 16)
    "form-1040.line.14": 26125, // TotalDeductionsAmt
    "form-1040.line.15": 7525, // TaxableIncomeAmt
    "form-1040.line.16": 753, // TaxAmt
    "form-1040.line.18": 753, // TotalTaxBeforeCrAndOthTaxesAmt
    "form-1040.line.19": 753, // CTCODCAmt (Schedule 8812 line 14)
    "form-1040.line.21": 753, // TotalCreditsAmt
    "form-1040.line.25a": 2800, // FormW2WithheldTaxAmt
    "form-1040.line.25d": 2800, // WithholdingTaxAmt
    "form-1040.line.27a": 2678, // EarnedIncomeCreditAmt
    "form-1040.line.28": 1447, // AdditionalChildTaxCreditAmt (Schedule 8812 line 27)
    "form-1040.line.32": 4125, // RefundableCreditsAmt
    "form-1040.line.33": 6925, // TotalPaymentsAmt
    "form-1040.line.34": 6925, // OverpaidAmt
    "form-1040.line.35a": 6925, // RefundAmt
  },
  renderedChecked: [
    // IndividualReturnFilingStatusCd 4
    "form-1040.header.filing_status_hoh",
    // VirtualCurAcquiredDurTYInd false
    "form-1040.header.digital_assets_no",
    // DependentDetail: YesLiveWithChildOverHalfYrInd, YesLiveWithChldUSOvrHalfYrInd, EligibleForChildTaxCreditInd
    "form-1040.dependents.dep1_lived_with_you",
    "form-1040.dependents.dep1_lived_in_us",
    "form-1040.dependents.dep1_child_tax_credit",
  ],
};

const SCHEDULE_1: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-1.0.line.8g": 1650, // AlaskaPermanentFundDivAmt
    "schedule-1.0.line.9": 1650, // TotalOtherIncomeAmt
    "schedule-1.0.line.10": 1650, // TotalAdditionalIncomeAmt
  },
};

const SCHEDULE_8812: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-8812.0.line.1_form_1040_line_11a": 33650, // AdjustedGrossIncomeAmt
    "schedule-8812.0.line.3_modified_agi": 33650, // ModifiedAGIAmt
    "schedule-8812.0.line.4_qualifying_children_under_17": 1, // QlfyChildUnderAgeSSNCnt
    "schedule-8812.0.line.5_qualifying_children_times_2200": 2200, // QlfyChildUnderAgeSSNLimtAmt
    "schedule-8812.0.line.8_total_credit_before_limit": 2200, // InitialCTCODCAmt
    "schedule-8812.0.line.9_filing_status_threshold": 200000, // FilingStatusThresholdCd
    "schedule-8812.0.line.12_credit_after_phaseout": 2200, // CTCODCAfterAGILimitAmt
    "schedule-8812.0.line.13_credit_limit_worksheet_a": 753, // ACTCTaxLiabiltyLimitAmt
    "schedule-8812.0.line.14_child_tax_credit_and_other_dependents": 753, // CTCODCAmt
    "schedule-8812.1.line.16a_line12_minus_line14": 1447, // ACTCBeforeLimitAmt
    "schedule-8812.1.line.16b_qualifying_children_count": 1, // QlfyChildUnderAgeSSNCnt
    "schedule-8812.1.line.16b_qualifying_children_times_1700": 1700, // QlfyChildUnderAgeSSNLimtAmt
    "schedule-8812.1.line.17_smaller_of_16a_16b": 1447, // ACTCAfterLimitAmt
    "schedule-8812.1.line.18a_earned_income": 32000, // TotalEarnedIncomeAmt
    "schedule-8812.1.line.19_earned_income_over_2500": 29500, // NetTotalEarnedIncomeAmt
    "schedule-8812.1.line.20_line19_times_15_percent": 4425, // NetEarnedIncomeCalculatedAmt
    "schedule-8812.1.line.27_additional_child_tax_credit": 1447, // AdditionalChildTaxCreditAmt
  },
  renderedChecked: [
    // CTCODCOverAGILimitInd true: line 8 is more than line 11
    "schedule-8812.0.line.12_line8_more_than_line11_yes",
    // EarnedIncmMoreThanSpecifiedInd true: line 18a is more than $2,500
    "schedule-8812.1.line.19_line18a_more_than_2500_yes",
    // ThreeOrMoreQlfyChildrenInd false: line 16b is less than $5,100
    "schedule-8812.1.line.20_line16b_at_least_5100_no",
  ],
};

/*
 * Schedule A files only to claim the increased standard deduction: line 16 adds
 * the net qualified disaster loss (Form 4684 line 15, $2,500) and the standard
 * deduction ($23,625). "Do not enter an amount on any other line of Schedule A"
 * (irs-1040sa-inst-2025::sec::other-itemized-deductions::b01): the key's lines
 * 1–15 and 17 are left out and checked blank (README.md).
 */
const SCHEDULE_A: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-a.0.line.16_other_itemized_deductions_amount": 26125, // OtherMiscellaneousDedAmt
  },
  renderedBlank: [
    "schedule-a.0.line.1_medical_dental_expenses",
    "schedule-a.0.line.4_net_medical_dental",
    "schedule-a.0.line.5a_state_local_income_or_sales_tax",
    "schedule-a.0.line.7_total_taxes",
    "schedule-a.0.line.8a_mortgage_interest_form1098",
    "schedule-a.0.line.10_total_interest",
    "schedule-a.0.line.11_gifts_cash_check",
    "schedule-a.0.line.14_total_gifts",
    "schedule-a.0.line.15_casualty_theft_loss",
    "schedule-a.0.line.17_total_itemized_deductions",
  ],
};

const FORM_4952: Partial<ExpectedResults> = {
  engineFields: {
    "form-4952.0.line.1_investment_interest_paid": 4000, // InvestmentInterestExpenseAmt
    "form-4952.0.line.3_total_investment_interest": 4000, // TotalInvestmentInterestExpAmt
    "form-4952.0.line.7_disallowed_interest_carryforward": 4000, // DisallowedCarryForwardExpAmt
  },
};

/*
 * Form 4684 copy 0 (the fire, DR/EM box checked, EM-1234). Copies 1 and 2 are
 * appended at render; the golden checks copy 0, which alone carries lines 13–18.
 */
const FORM_4684: Partial<ExpectedResults> = {
  engineFields: {
    "form-4684.0.line.2_cost_basis_col_a": 15000, // CostOrOtherBasisAmt
    "form-4684.0.line.3_reimbursement_col_a": 2000, // InsuranceOrOthReimbursementAmt
    "form-4684.0.line.5_fmv_before_col_a": 14000, // FairMarketValueBeforeTheftAmt
    "form-4684.0.line.6_fmv_after_col_a": 2000, // FairMarketValueAfterTheftAmt
    "form-4684.0.line.7_fmv_decrease_col_a": 12000, // NetFairMarketValueAmt
    "form-4684.0.line.8_smaller_of_2_or_7_col_a": 12000, // SmllrOfAdjOrNetFairMrktVlAmt
    "form-4684.0.line.9_loss_col_a": 10000, // PropertyMinusInsuranceValueAmt
    "form-4684.0.line.10_casualty_theft_loss": 10000, // TotalPrsnlPropertyTheftLossAmt
    "form-4684.0.line.11_100_or_500_floor": 100, // CasualtyOrTheftLossLimitAmt
    "form-4684.0.line.12_loss_after_floor": 9900, // NetCasualtyOrTheftLossAmt
    "form-4684.0.line.14_total_losses": 12400, // TotalNetCasualtyOrTheftLossAmt
    "form-4684.0.line.15_net_gain_or_qualified_disaster_loss": 2500, // TotalTheftGainLessTotalLossAmt
    "form-4684.0.line.16_losses_less_gains": 9900, // TotalLossLessTotalTheftGainAmt
    "form-4684.0.line.17_ten_percent_agi": 3365, // TenPercentOfAGIAmt
    "form-4684.0.line.18_deductible_loss": 6535, // CalcAdjGroIncmMnsTotNetLossAmt
  },
  renderedText: {
    // The key's FEMA declaration number, EM-1234: the digits after the printed "EM-".
    "form-4684.0.header.fema_declaration_number_em": "1234",
    "form-4684.0.line.1_property_a_type": "House",
  },
  // The key has no line 13: no Form 4684 reports a gain.
  renderedBlank: ["form-4684.0.line.13_total_gains"],
  renderedChecked: [
    // FederallyDeclaredDisasterInd
    "form-4684.0.header.federally_declared_disaster",
  ],
};

/* IRS1040ScheduleEIC QualifyingChildInformation: the key prints the relationship code NEPHEW. */
const SCHEDULE_EIC: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-eic.0.line.6_months_lived_in_us_child_1": 12, // MonthsChildLivedWithYouCnt
  },
  renderedText: {
    "schedule-eic.0.line.1_name_child_1": "Kiddo Ben", // PersonFirstNm, PersonLastNm
    "schedule-eic.0.line.2_ssn_child_1": "900-45-6789", // QualifyingChildSSN
    "schedule-eic.0.line.3_birth_year_digit_1_child_1": "2", // ChildBirthYr 2021
    "schedule-eic.0.line.3_birth_year_digit_2_child_1": "0",
    "schedule-eic.0.line.3_birth_year_digit_3_child_1": "2",
    "schedule-eic.0.line.3_birth_year_digit_4_child_1": "1",
    "schedule-eic.0.line.5_relationship_child_1": "Nephew", // ChildRelationshipCd NEPHEW
  },
  renderedBlank: [
    // Born after 2006 and younger than the taxpayer: the schedule skips lines 4a and 4b.
    "schedule-eic.0.line.4a_student_under_24_yes_child_1",
    "schedule-eic.0.line.4a_student_under_24_no_child_1",
    "schedule-eic.0.line.1_name_child_2",
  ],
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-4684": FORM_4684,
  "form-4952": FORM_4952,
  "schedule-a": SCHEDULE_A,
  "schedule-1": SCHEDULE_1,
  "schedule-8812": SCHEDULE_8812,
  "schedule-eic": SCHEDULE_EIC,
  "form-1040": FORM_1040,
};

export function tcbUs002Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
