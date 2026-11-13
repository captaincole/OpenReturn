/*
 * tcb-ca-002 — the TaxCalcBench answer key (output.xml, ty25-ca-002), typed line by
 * line. The key is the California return (Form 540 and its schedules); the federal
 * forms are inputs, not checked. Change a value only when the FTB instructions say
 * the key is wrong (README.md).
 */

import type { ExpectedResults } from "../../types.js";

const FORM_540: Partial<ExpectedResults> = {
  engineFields: {
    "form-540.line.7_personal_exemption_count": 1, // Exemptions/Personal/Count
    "form-540.line.7_personal_exemption_amount": 153, // Exemptions/Personal/Amount
    "form-540.line.8_blind_exemption_count": 1, // Exemptions/Blind/Count
    "form-540.line.8_blind_exemption_amount": 153, // Exemptions/Blind/Amount
    "form-540.line.10_dependent_exemption_count": 1, // Exemptions/Dependent/Count
    "form-540.line.10_dependent_exemption_amount": 475, // Exemptions/Dependent/Amount
    "form-540.line.11_total_exemption_amount": 781, // TotalExemptionAmt
    "form-540.line.12_state_wages": 65111, // StateWages
    "form-540.line.13_federal_agi": 100250, // FederalAGI
    "form-540.line.14_ca_adjustments_subtractions": 12875, // CAAdjSubtractions
    "form-540.line.15_ca_agi_before_additions": 87375, // SubtotalAfterCASubtractions
    "form-540.line.17_ca_agi": 87375, // CAAGI
    "form-540.line.18_deductions": 11412, // CADeductions
    "form-540.line.19_taxable_income": 75963, // CATaxableIncome
    "form-540.line.31_tax_amount": 1933, // StateIncomeTax (Tax Table)
    "form-540.line.32_exemption_credits": 781, // ExemptionCredits
    "form-540.line.33_tax_after_exemption_credits": 1152, // TaxAfterExemptions
    "form-540.line.35_total_tax_after_credits": 1152, // Tax/TotalTax
    "form-540.line.48_tax_after_credits": 1152, // SpecialCredits/TotalTaxAfterCredits
    "form-540.line.64_total_tax": 1152, // OtherTaxes/TotalTax
    "form-540.line.71_ca_income_tax_withheld": 1079, // CAWithholding
    "form-540.line.72_ca_estimated_tax_payments": 42, // CAEstimatesAndOtherPymts (FTB 3519)
    "form-540.line.78_total_payments": 1121, // TotalPayments
    "form-540.line.91_use_tax": 0, // UseTax
    "form-540.line.93_payments_balance": 1121, // PaymentsBalance
    "form-540.line.95_payments_after_isr_penalty": 1121, // PaymentsAfterISRPenalty
    "form-540.line.100_tax_due": 31, // TaxDue
    "form-540.line.111_amount_you_owe": 31, // AmountOwed
    "form-540.line.114_total_amount_due": 31, // TotalAmtDue
  },
  renderedChecked: [
    "form-540.header.filing_status", // FilerStatus HeadOfHousehold (single-select)
    "form-540.header.mailing_same_as_residence", // PrincipalResidence/SameAddress X
    "form-540.line.31_tax_from_tax_table", // ComputationMethod Tax Table
    "form-540.line.91_no_use_tax_owed", // NoUseTaxOwed X
    "form-540.line.92_full_year_health_coverage", // FullYearHealthCareCoverage X
  ],
  renderedText: {
    "form-540.header.first_name": "Carol",
    "form-540.header.last_name": "Johnson",
    "form-540.header.county_at_filing": "Yuba",
    "form-540.dependents.dep1_first_name": "Only",
    "form-540.dependents.dep1_last_name": "Johnson",
    "form-540.dependents.dep1_relationship": "Son",
  },
};

/*
 * Schedule CA (540). The key also fills Part II lines 2–26 for a filer who takes
 * the standard deduction on both returns; the instructions leave them blank, so
 * only line 30 is checked (README.md).
 */
const SCHEDULE_CA: Partial<ExpectedResults> = {
  engineFields: {
    // Part I, Section A — column A is the federal return.
    "schedule-ca.0.line.1a_federal": 65111, // Wages
    "schedule-ca.0.line.1z_federal": 65111, // WagesSalariesAndTips
    "schedule-ca.0.line.2b_federal": 6222, // TaxableInterest
    "schedule-ca.0.line.6a_federal": 15500, // Income/SocialSecurityBenefits (gross)
    "schedule-ca.0.line.6b_federal": 13175, // FederalAmounts/SocialSecurityBenefits
    "schedule-ca.0.line.6b_subtractions": 13175, // Subtractions/SocialSecurityBenefits
    // Section B.
    "schedule-ca.0.line.b3_federal": 18566, // BusinessIncomeLoss
    "schedule-ca.2.line.b10_federal": 103074, // FederalAmounts/TotalIncome
    "schedule-ca.2.line.b10_subtractions": 13175, // Subtractions/TotalIncome
    // Section C — adjustments to income.
    "schedule-ca.2.line.c11_federal": 300, // FederalAmounts/EducatorExpense
    "schedule-ca.2.line.c11_subtractions": 300, // Subtractions/EducatorExpense
    "schedule-ca.2.line.c15_federal": 1312, // DeductibleSelfEmploymentTax
    "schedule-ca.2.line.c18_federal": 1212, // EarlyWithdrawalSavingsPenalty
    "schedule-ca.3.line.c26_federal": 2824, // FederalAmounts/NetAdjustments
    "schedule-ca.3.line.c26_subtractions": 300, // Subtractions/NetAdjustments
    "schedule-ca.3.line.c27_federal": 100250, // AdjustmentsToIncome/FederalAmounts/Total
    "schedule-ca.3.line.c27_subtractions": 12875, // AdjustmentsToIncome/Subtractions/Total
    // Part II.
    "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 11412, // CADeductions
  },
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-540": FORM_540,
  "schedule-ca": SCHEDULE_CA,
};

export function tcbCa002Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
