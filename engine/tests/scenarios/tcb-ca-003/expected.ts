/*
 * tcb-ca-003 — the TaxCalcBench answer key (output.xml, ty25-ca-003), typed line by
 * line. The key is the California return (Form 540 and FTB 3514); the federal
 * forms are inputs, not checked. Change a value only when the FTB instructions
 * say the key is wrong (README.md).
 */

import type { ExpectedResults } from "../../types.js";

const FORM_540: Partial<ExpectedResults> = {
  engineFields: {
    "form-540.line.7_personal_exemption_count": 2, // Exemptions/Personal/Count
    "form-540.line.7_personal_exemption_amount": 306, // Exemptions/Personal/Amount
    "form-540.line.10_dependent_exemption_count": 2, // Exemptions/Dependent/Count
    "form-540.line.10_dependent_exemption_amount": 950, // Exemptions/Dependent/Amount
    "form-540.line.11_total_exemption_amount": 1256, // TotalExemptionAmt
    "form-540.line.12_state_wages": 41500, // StateWages
    "form-540.line.13_federal_agi": 16500, // FederalAGI
    "form-540.line.15_ca_agi_before_additions": 16500, // SubtotalAfterCASubtractions
    "form-540.line.17_ca_agi": 16500, // CAAGI
    "form-540.line.18_deductions": 11412, // CADeductions (standard deduction)
    "form-540.line.19_taxable_income": 5088, // CATaxableIncome
    "form-540.line.31_tax_amount": 51, // StateIncomeTax (Tax Table)
    "form-540.line.32_exemption_credits": 1256, // ExemptionCredits
    "form-540.line.71_ca_income_tax_withheld": 3000, // CAWithholding
    "form-540.line.75_eitc": 1078, // Payments/EarnedIncomeTaxCredit
    "form-540.line.78_total_payments": 4078, // Payments/TotalPayments
    "form-540.line.91_use_tax": 0, // UseTax
    "form-540.line.93_payments_balance": 4078, // PaymentsBalance
    "form-540.line.95_payments_after_isr_penalty": 4078, // PaymentsAfterISRPenalty
    "form-540.line.97_overpaid_tax": 4078, // OverpaidTax
    "form-540.line.99_overpaid_tax_available": 4078, // OverpaidTaxAvailable
    "form-540.line.115_refund_or_no_amount_due": 4078, // Refund
  },
  renderedChecked: [
    "form-540.header.filing_status", // FilerStatus MarriedOrRDPFilingJointly (single-select)
    "form-540.header.mailing_same_as_residence", // PrincipalResidence/SameAddress X
    "form-540.line.31_tax_from_tax_table", // ComputationMethod Tax Table
    "form-540.line.91_no_use_tax_owed", // NoUseTaxOwed X
    "form-540.line.92_full_year_health_coverage", // FullYearHealthCareCoverage X
  ],
  renderedText: {
    "form-540.header.first_name": "Basset", // Filer/Primary/FirstName
    "form-540.header.last_name": "Hound", // Filer/Primary/LastName
    "form-540.header.spouse_first_name": "Apple", // Filer/SpouseRDP/FirstName
    "form-540.header.spouse_last_name": "Banana", // Filer/SpouseRDP/LastName
    "form-540.header.county_at_filing": "San Francisco", // PrincipalResidence/CountyInCalifornia
    "form-540.dependents.dep1_first_name": "TERRIER", // Dependent/Individual[1]
    "form-540.dependents.dep1_last_name": "HOUND",
    "form-540.dependents.dep1_relationship": "Son",
    "form-540.dependents.dep2_first_name": "DACHSHUND", // Dependent/Individual[2]
    "form-540.dependents.dep2_last_name": "HOUND",
    "form-540.dependents.dep2_relationship": "Son",
  },
};

const FORM_3514: Partial<ExpectedResults> = {
  engineFields: {
    "form-3514.0.line.2_federal_agi": 16500, // QualifyingInformation/FederalAGI
    "form-3514.0.line.3_federal_eic": 6610, // QualifyingInformation/FederalEIC
    "form-3514.0.line.11_days_lived_in_ca_child_1": 365, // QualifyingChildInformation/TotalLivingWithDays
    "form-3514.0.line.11_days_lived_in_ca_child_2": 365, // QualifyingChildInformation/TotalLivingWithDays
    "form-3514.1.line.13_ca_wages": 41500, // CaliforniaEarnedIncome/StateWages
    "form-3514.1.line.16_wages_less_lines_14_15": 41500, // NetCAEarnedIncome
    "form-3514.1.line.18_business_income": -31000, // BusinessIncomeLoss/TotalBusinessIncomeLoss
    "form-3514.1.line.19_ca_earned_income": 10500, // CAEarnedIncome
    "form-3514.1.line.20_ca_eitc": 1078, // EarnedIncomeTaxCredit
  },
  renderedChecked: [
    "form-3514.0.line.1a_irs_disallowed_federal_eic", // PreviouslyDisallowedFederalEIC false (No)
    "form-3514.0.line.1b_ftb_disallowed_ca_eitc", // PreviouslyDisallowedCAEIC false (No)
  ],
  renderedText: {
    "form-3514.1.line.18a_business_name": "Tax prep business", // BusinessNameLine1Txt
    "form-3514.1.line.18b_business_address": "1122 Canine Lane", // USAddress/AddressLine1Txt
    "form-3514.1.line.18b_business_city": "Sacremento", // USAddress/CityNm
    "form-3514.1.line.18b_business_state": "CA", // USAddress/StateAbbreviationCd
    "form-3514.1.line.18b_business_zip": "94203", // USAddress/ZIPCd
    "form-3514.1.line.18e_business_code": "541213", // BusinessActivityCode
  },
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-540": FORM_540,
  "form-3514": FORM_3514,
};

export function tcbCa003Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
