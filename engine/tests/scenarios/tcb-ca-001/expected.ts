/*
 * tcb-ca-001 — the TaxCalcBench answer key (output.xml, ty25-ca-001), typed line by
 * line. The key is the California return (Form 540 and its schedules); the federal
 * forms are inputs, not checked. Change a value only when the FTB instructions say
 * the key is wrong (README.md).
 */

import type { ExpectedResults } from "../../types.js";

const FORM_540: Partial<ExpectedResults> = {
  engineFields: {
    "form-540.line.7_personal_exemption_count": 1, // Exemptions/Personal/Count
    "form-540.line.7_personal_exemption_amount": 153, // Exemptions/Personal/Amount
    "form-540.line.10_dependent_exemption_count": 3, // Exemptions/Dependent/Count
    "form-540.line.10_dependent_exemption_amount": 1425, // Exemptions/Dependent/Amount
    "form-540.line.11_total_exemption_amount": 1578, // TotalExemptionAmt
    "form-540.line.12_state_wages": 2248, // StateWages
    "form-540.line.13_federal_agi": 9126, // FederalAGI
    "form-540.line.14_ca_adjustments_subtractions": 6878, // CAAdjSubtractions
    "form-540.line.15_ca_agi_before_additions": 2248, // SubtotalAfterCASubtractions
    "form-540.line.17_ca_agi": 2248, // CAAGI
    "form-540.line.18_deductions": 11412, // CADeductions
    "form-540.line.19_taxable_income": 0, // CATaxableIncome
    "form-540.line.32_exemption_credits": 1578, // ExemptionCredits
    "form-540.line.75_eitc": 851, // Payments/EarnedIncomeTaxCredit
    "form-540.line.76_young_child_tax_credit": 1189, // Payments/YoungChildTaxCredit
    "form-540.line.78_total_payments": 2040, // Payments/TotalPayments
    "form-540.line.91_use_tax": 0, // UseTax
    "form-540.line.93_payments_balance": 2040, // PaymentsBalance
    "form-540.line.95_payments_after_isr_penalty": 2040, // PaymentsAfterISRPenalty
    "form-540.line.97_overpaid_tax": 2040, // OverpaidTax
    "form-540.line.99_overpaid_tax_available": 2040, // OverpaidTaxAvailable
    "form-540.line.115_refund_or_no_amount_due": 2040, // Refund
  },
  renderedChecked: [
    "form-540.header.filing_status", // FilerStatus HeadOfHousehold (single-select)
    "form-540.header.mailing_same_as_residence", // PrincipalResidence/SameAddress X
    "form-540.line.31_tax_from_tax_table", // ComputationMethod Tax Table
    "form-540.line.91_no_use_tax_owed", // NoUseTaxOwed X
    "form-540.line.92_full_year_health_coverage", // FullYearHealthCareCoverage X
  ],
  renderedText: {
    "form-540.header.first_name": "Virginia",
    "form-540.header.last_name": "Test",
    "form-540.header.county_at_filing": "Santa Clara",
    "form-540.dependents.dep1_first_name": "Elijah", // Dependent/Individual[1]
    "form-540.dependents.dep1_last_name": "Test",
    "form-540.dependents.dep1_relationship": "Son",
    "form-540.dependents.dep2_first_name": "Jacob", // Dependent/Individual[2]
    "form-540.dependents.dep2_last_name": "Test",
    "form-540.dependents.dep2_relationship": "Son",
    "form-540.dependents.dep3_first_name": "Johnny", // Dependent/Individual[3]
    "form-540.dependents.dep3_last_name": "Test",
    "form-540.dependents.dep3_relationship": "Son",
  },
};

/*
 * Schedule CA (540). The key also fills Part II lines for a filer who takes the
 * standard deduction on both returns; the instructions leave them blank, so only
 * line 30 is checked (README.md).
 */
const SCHEDULE_CA: Partial<ExpectedResults> = {
  engineFields: {
    // Part I, Section A — column A is the federal return.
    "schedule-ca.0.line.1a_federal": 2248, // Wages
    "schedule-ca.0.line.1z_federal": 2248, // WagesSalariesAndTips
    // Section B.
    "schedule-ca.0.line.b7_federal": 6878, // FederalAmounts/UnemploymentCompensation
    "schedule-ca.0.line.b7_subtractions": 6878, // Subtractions/UnemploymentCompensation
    "schedule-ca.2.line.b10_federal": 9126, // FederalAmounts/TotalIncome
    "schedule-ca.2.line.b10_subtractions": 6878, // Subtractions/TotalIncome
    // Section C.
    "schedule-ca.3.line.c27_federal": 9126, // AdjustmentsToIncome/FederalAmounts/Total
    "schedule-ca.3.line.c27_subtractions": 6878, // AdjustmentsToIncome/Subtractions/Total
    // Part II.
    "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 11412, // CADeductions
  },
};

const FORM_3514: Partial<ExpectedResults> = {
  engineFields: {
    "form-3514.0.line.2_federal_agi": 9126, // QualifyingInformation/FederalAGI
    "form-3514.0.line.3_federal_eic": 1001, // QualifyingInformation/FederalEIC
    "form-3514.1.line.13_ca_wages": 2248, // CaliforniaEarnedIncome/StateWages
    "form-3514.1.line.16_wages_less_lines_14_15": 2248, // NetCAEarnedIncome
    "form-3514.1.line.19_ca_earned_income": 2248, // CAEarnedIncome
    "form-3514.1.line.20_ca_eitc": 851, // EarnedIncomeTaxCredit
    "form-3514.2.line.23_ca_earned_income": 2248, // YCTCreditComputation/CAEarnedIncome
    "form-3514.2.line.28_yctc": 1189, // ResidentYoungChildTaxCredit
  },
  renderedChecked: [
    "form-3514.0.line.1a_irs_disallowed_federal_eic", // PreviouslyDisallowedFederalEIC false (No)
    "form-3514.0.line.1b_ftb_disallowed_ca_eitc", // PreviouslyDisallowedCAEIC false (No)
  ],
  renderedText: {
    /*
     * QualifyingChildInformation[1..3]. The key lists Johnny, then Jacob; the
     * instructions ask only that a child under six be in a column
     * (ca-3514-inst-2025::sec::step-8-qualifications-for-young-child-tax::b02),
     * and the engine lists its young children in the order recorded (README.md).
     * The key prints the relationship in capitals ("SON"); the answer is "Son".
     */
    "form-3514.0.line.5_first_name_child_1": "Jacob", // QualifyingChildInformation[2]
    "form-3514.0.line.6_last_name_child_1": "Test",
    "form-3514.0.line.7_ssn_or_itin_child_1": "900456789",
    "form-3514.0.line.8_date_of_birth_child_1": "12/24/2021",
    "form-3514.0.line.10_relationship_child_1": "Son",
    "form-3514.0.line.11_days_lived_in_ca_child_1": "365",
    "form-3514.0.line.5_first_name_child_2": "Johnny", // QualifyingChildInformation[1]
    "form-3514.0.line.6_last_name_child_2": "Test",
    "form-3514.0.line.7_ssn_or_itin_child_2": "900456789",
    "form-3514.0.line.8_date_of_birth_child_2": "03/28/2025",
    "form-3514.0.line.10_relationship_child_2": "Son",
    "form-3514.0.line.11_days_lived_in_ca_child_2": "365",
    "form-3514.0.line.5_first_name_child_3": "Elijah", // QualifyingChildInformation[3]
    "form-3514.0.line.6_last_name_child_3": "Test",
    "form-3514.0.line.7_ssn_or_itin_child_3": "900456789",
    "form-3514.0.line.8_date_of_birth_child_3": "02/07/2011",
    "form-3514.0.line.10_relationship_child_3": "Son",
    "form-3514.0.line.11_days_lived_in_ca_child_3": "365",
    /* Line 12, Address/CityNm, StateAbbreviationCd and ZIPCd. Line 12a is left out (README.md). */
    "form-3514.1.line.12b_city_child_1": "SAN JOSE",
    "form-3514.1.line.12c_state_child_1": "CA",
    "form-3514.1.line.12d_zip_child_1": "95117",
    "form-3514.1.line.12b_city_child_2": "SAN JOSE",
    "form-3514.1.line.12c_state_child_2": "CA",
    "form-3514.1.line.12d_zip_child_2": "95117",
    "form-3514.1.line.12b_city_child_3": "SAN JOSE",
    "form-3514.1.line.12c_state_child_3": "CA",
    "form-3514.1.line.12d_zip_child_3": "95117",
  },
};

const FORM_3532: Partial<ExpectedResults> = {
  engineFields: {
    "form-3532.0.line.4_gross_income": 0, // QPGrossIncome
    "form-3532.0.line.5_days_lived_with_you": 365, // TotalLivingWithDays
  },
  renderedChecked: [
    "form-3532.0.line.1_marital_status", // MaritalStatus/NotMarriedRDPDuringYear X (box 1a)
    "form-3532.0.line.2_qualifying_person_relationship", // SonDaughterStepsonStepdaughter X (box 2a)
  ],
  renderedText: {
    "form-3532.0.line.3_first_name": "Elijah", // QualifyingPersonInformation/Name/FirstName
    "form-3532.0.line.3_last_name": "Test", // Name/LastName
    "form-3532.0.line.3_ssn": "900456789", // SSN
    "form-3532.0.line.3_date_of_birth": "02/07/2011", // BirthDate 2011-02-07
  },
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-540": FORM_540,
  "schedule-ca": SCHEDULE_CA,
  "form-3514": FORM_3514,
  "form-3532": FORM_3532,
};

export function tcbCa001Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
