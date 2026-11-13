/*
 * tcb-ca-004 — the TaxCalcBench answer key (output.xml, ty25-ca-004), typed line by
 * line. The key is the California return (Form 540, Schedule CA (540) and FTB
 * 3514); the federal forms are inputs, not checked. Change a value only when the
 * FTB instructions say the key is wrong (README.md).
 */

import type { ExpectedResults } from "../../types.js";

const FORM_540: Partial<ExpectedResults> = {
  engineFields: {
    "form-540.line.7_personal_exemption_count": 2, // Exemptions/Personal/Count
    "form-540.line.7_personal_exemption_amount": 306, // Exemptions/Personal/Amount
    "form-540.line.8_blind_exemption_count": 2, // Exemptions/Blind/Count
    "form-540.line.8_blind_exemption_amount": 306, // Exemptions/Blind/Amount
    "form-540.line.9_senior_exemption_count": 2, // Exemptions/Senior/Count
    "form-540.line.9_senior_exemption_amount": 306, // Exemptions/Senior/Amount
    "form-540.line.10_dependent_exemption_count": 1, // Exemptions/Dependent/Count
    "form-540.line.10_dependent_exemption_amount": 475, // Exemptions/Dependent/Amount
    "form-540.line.11_total_exemption_amount": 1393, // TotalExemptionAmt
    "form-540.line.12_state_wages": 5500, // StateWages
    "form-540.line.13_federal_agi": 5503, // FederalAGI
    "form-540.line.14_ca_adjustments_subtractions": 1768, // CAAdjSubtractions
    "form-540.line.15_ca_agi_before_additions": 3735, // SubtotalAfterCASubtractions
    "form-540.line.17_ca_agi": 3735, // CAAGI
    "form-540.line.18_deductions": 11412, // CADeductions
    "form-540.line.19_taxable_income": 0, // CATaxableIncome
    "form-540.line.32_exemption_credits": 1393, // ExemptionCredits
    "form-540.line.75_eitc": 1582, // Payments/EarnedIncomeTaxCredit
    "form-540.line.76_young_child_tax_credit": 1189, // Payments/YoungChildTaxCredit
    "form-540.line.78_total_payments": 2771, // Payments/TotalPayments
    "form-540.line.91_use_tax": 0, // UseTax
    "form-540.line.93_payments_balance": 2771, // PaymentsBalance
    "form-540.line.95_payments_after_isr_penalty": 2771, // PaymentsAfterISRPenalty
    "form-540.line.97_overpaid_tax": 2771, // OverpaidTax
    "form-540.line.99_overpaid_tax_available": 2771, // OverpaidTaxAvailable
    "form-540.line.115_refund_or_no_amount_due": 2771, // Refund
  },
  renderedChecked: [
    "form-540.header.filing_status", // FilerStatus MarriedOrRDPFilingJointly (single-select)
    "form-540.header.mailing_same_as_residence", // PrincipalResidence/SameAddress X
    "form-540.line.31_tax_from_tax_table", // ComputationMethod Tax Table
    "form-540.line.91_no_use_tax_owed", // NoUseTaxOwed X
    "form-540.line.92_full_year_health_coverage", // FullYearHealthCareCoverage X
  ],
  renderedText: {
    "form-540.header.first_name": "Sam",
    "form-540.header.middle_initial": "I",
    "form-540.header.last_name": "Legend",
    "form-540.header.spouse_first_name": "Lisa",
    "form-540.header.spouse_middle_initial": "a",
    "form-540.header.spouse_last_name": "Legend",
    "form-540.header.county_at_filing": "San Francisco",
    "form-540.dependents.dep1_first_name": "Grogu",
    "form-540.dependents.dep1_last_name": "Legend",
    "form-540.dependents.dep1_relationship": "Grandchild",
  },
};

/*
 * Schedule CA (540). The key also fills Part II lines 1–29 for a couple who take
 * the standard deduction on both returns; the instructions leave them blank, so
 * only line 30 is checked (README.md).
 */
const SCHEDULE_CA: Partial<ExpectedResults> = {
  engineFields: {
    // Part I, Section A — column A is the federal return.
    "schedule-ca.0.line.1a_federal": 5500, // Wages
    "schedule-ca.0.line.1z_federal": 5500, // WagesSalariesAndTips
    "schedule-ca.0.line.2b_federal": 35, // TaxableInterest
    "schedule-ca.0.line.6a_federal": 60000, // Income/SocialSecurityBenefits (gross)
    "schedule-ca.0.line.6b_federal": 1768, // FederalAmounts/SocialSecurityBenefits
    "schedule-ca.0.line.6b_subtractions": 1768, // Subtractions/SocialSecurityBenefits
    "schedule-ca.2.line.b10_federal": 7303, // FederalAmounts/TotalIncome
    "schedule-ca.2.line.b10_subtractions": 1768, // Subtractions/TotalIncome
    // Section C — adjustments to income.
    "schedule-ca.2.line.c21_federal": 1800, // StudentLoanInterest
    "schedule-ca.3.line.c26_federal": 1800, // FederalAmounts/NetAdjustments
    "schedule-ca.3.line.c27_federal": 5503, // AdjustmentsToIncome/FederalAmounts/Total
    "schedule-ca.3.line.c27_subtractions": 1768, // AdjustmentsToIncome/Subtractions/Total
    // Part II.
    "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 11412, // CADeductions
  },
};

const FORM_3514: Partial<ExpectedResults> = {
  engineFields: {
    "form-3514.0.line.2_federal_agi": 5503, // QualifyingInformation/FederalAGI
    "form-3514.0.line.3_federal_eic": 1879, // QualifyingInformation/FederalEIC
    "form-3514.0.line.4_investment_income": 35, // InvestmentIncome
    "form-3514.0.line.11_days_lived_in_ca_child_1": 365, // TotalLivingWithDays
    "form-3514.1.line.13_ca_wages": 5500, // CaliforniaEarnedIncome/StateWages
    "form-3514.1.line.16_wages_less_lines_14_15": 5500, // NetCAEarnedIncome
    "form-3514.1.line.19_ca_earned_income": 5500, // CAEarnedIncome
    "form-3514.1.line.20_ca_eitc": 1582, // EarnedIncomeTaxCredit
    "form-3514.2.line.23_ca_earned_income": 5500, // YCTCreditComputation/CAEarnedIncome
    "form-3514.2.line.28_yctc": 1189, // ResidentYoungChildTaxCredit
  },
  renderedChecked: [
    "form-3514.0.line.1a_irs_disallowed_federal_eic", // PreviouslyDisallowedFederalEIC false (No)
    "form-3514.0.line.1b_ftb_disallowed_ca_eitc", // PreviouslyDisallowedCAEIC false (No)
  ],
  renderedText: {
    "form-3514.0.line.5_first_name_child_1": "Grogu", // QualifyingChildInformation/Name/FirstName
    "form-3514.0.line.6_last_name_child_1": "Legend", // Name/LastName
    "form-3514.0.line.7_ssn_or_itin_child_1": "900456789", // SSN
    "form-3514.0.line.8_date_of_birth_child_1": "09/10/2024", // BirthDate 2024-09-10
    "form-3514.0.line.10_relationship_child_1": "Grandchild", // Relationship GRANDCHILD
    "form-3514.1.line.12a_street_address_child_1": "111 Sunnydale Ln", // Address/AddressLine1Txt
    "form-3514.1.line.12b_city_child_1": "San Francisco", // Address/CityNm
    "form-3514.1.line.12c_state_child_1": "CA", // Address/StateAbbreviationCd
    "form-3514.1.line.12d_zip_child_1": "94117", // Address/ZIPCd
  },
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-540": FORM_540,
  "schedule-ca": SCHEDULE_CA,
  "form-3514": FORM_3514,
};

export function tcbCa004Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
