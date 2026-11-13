/*
 * tcb-ca-009 — the TaxCalcBench answer key (output.xml, ty25-ca-009), typed line by
 * line. The key is the California return (Form 540 and its schedules); the federal
 * forms are inputs, not checked. Change a value only when the FTB instructions say
 * the key is wrong (README.md).
 */

import type { ExpectedResults } from "../../types.js";

const FORM_540: Partial<ExpectedResults> = {
  engineFields: {
    "form-540.line.7_personal_exemption_count": 2, // Exemptions/Personal/Count
    "form-540.line.7_personal_exemption_amount": 306, // Exemptions/Personal/Amount
    "form-540.line.9_senior_exemption_count": 1, // Exemptions/Senior/Count
    "form-540.line.9_senior_exemption_amount": 153, // Exemptions/Senior/Amount
    "form-540.line.10_dependent_exemption_count": 1, // Exemptions/Dependent/Count
    "form-540.line.10_dependent_exemption_amount": 475, // Exemptions/Dependent/Amount
    "form-540.line.11_total_exemption_amount": 934, // TotalExemptionAmt
    "form-540.line.13_federal_agi": 249108, // FederalAGI
    "form-540.line.14_ca_adjustments_subtractions": 46800, // CAAdjSubtractions
    "form-540.line.15_ca_agi_before_additions": 202308, // SubtotalAfterCASubtractions
    "form-540.line.17_ca_agi": 202308, // CAAGI
    "form-540.line.18_deductions": 25000, // CADeductions
    "form-540.line.19_taxable_income": 177308, // CATaxableIncome
    "form-540.line.31_tax_amount": 9367, // StateIncomeTax (Tax Rate Schedule)
    "form-540.line.32_exemption_credits": 934, // ExemptionCredits
    "form-540.line.33_tax_after_exemption_credits": 8433, // TaxAfterExemptions
    "form-540.line.35_total_tax_after_credits": 8433, // Tax/TotalTax
    "form-540.line.48_tax_after_credits": 8433, // SpecialCredits/TotalTaxAfterCredits
    "form-540.line.64_total_tax": 8433, // OtherTaxes/TotalTax
    "form-540.line.91_use_tax": 0, // UseTax
    "form-540.line.100_tax_due": 8433, // TaxDue
    "form-540.line.111_amount_you_owe": 8433, // AmountOwed
    "form-540.line.114_total_amount_due": 8433, // TotalAmtDue
  },
  renderedChecked: [
    "form-540.header.filing_status", // FilerStatus QualifyingSurvivingSpouseOrRDP (single-select)
    "form-540.header.mailing_same_as_residence", // PrincipalResidence/SameAddress X
    "form-540.line.31_tax_from_rate_schedule", // ComputationMethod Tax Rate Schedule
    "form-540.line.91_no_use_tax_owed", // NoUseTaxOwed X
    "form-540.line.92_full_year_health_coverage", // FullYearHealthCareCoverage X
  ],
  renderedText: {
    "form-540.header.first_name": "Health",
    "form-540.header.last_name": "Savings",
    "form-540.header.county_at_filing": "San Diego",
    "form-540.header.spouse_rdp_year_of_death": "2023", // FilingStatus/YearSpouseRDPDied
    "form-540.dependents.dep1_first_name": "Jesse",
    "form-540.dependents.dep1_last_name": "Savings",
    "form-540.dependents.dep1_relationship": "Son",
  },
};

const SCHEDULE_CA: Partial<ExpectedResults> = {
  engineFields: {
    // Part I, Section A — column A is the federal return.
    "schedule-ca.0.line.1a_federal": 20000, // Wages
    "schedule-ca.0.line.1z_federal": 20000, // WagesSalariesAndTips
    "schedule-ca.0.line.2b_federal": 17775, // TaxableInterest
    "schedule-ca.0.line.3a_federal": 59775, // QualifiedDividends
    "schedule-ca.0.line.3b_federal": 88545, // OrdinaryDividends
    "schedule-ca.0.line.5b_federal": 78778, // PensionsAndAnnuities (taxable)
    "schedule-ca.0.line.6a_federal": 56994, // Income/SocialSecurityBenefits (gross)
    "schedule-ca.0.line.6b_federal": 48445, // FederalAmounts/SocialSecurityBenefits (taxable)
    "schedule-ca.0.line.6b_subtractions": 48445, // Subtractions/SocialSecurityBenefits
    "schedule-ca.0.line.7a_federal": -2790, // CapitalGainLoss
    // Part I, Section B — other income.
    "schedule-ca.1.line.b8f_federal": 855, // Form8889Income
    "schedule-ca.1.line.b8f_subtractions": 855, // Subtractions/Form8889Income
    "schedule-ca.2.line.b9a_federal": 855, // TotalOtherIncome
    "schedule-ca.2.line.b9a_subtractions": 855, // Subtractions/TotalOtherIncome
    "schedule-ca.2.line.b10_federal": 251608, // TotalIncome
    "schedule-ca.2.line.b10_subtractions": 49300, // Subtractions/TotalIncome
    // Part I, Section C — adjustments to income.
    "schedule-ca.2.line.c13_federal": 2500, // HealthSavingsAccount
    "schedule-ca.2.line.c13_subtractions": 2500, // Subtractions/HealthSavingsAccount
    "schedule-ca.3.line.c26_federal": 2500, // NetAdjustments
    "schedule-ca.3.line.c26_subtractions": 2500, // Subtractions/NetAdjustments
    "schedule-ca.3.line.c27_federal": 249108, // AdjustmentsToIncome/FederalAmounts/Total
    "schedule-ca.3.line.c27_subtractions": 46800, // AdjustmentsToIncome/Subtractions/Total
    // Part II — adjustments to federal itemized deductions (not itemized federally).
    "schedule-ca.4.page2.medical_agi_line11b": 249108, // FederalAGI
    "schedule-ca.4.page2.medical_agi_threshold": 18683, // MedicalAndDentalAllowance (7.5%)
    "schedule-ca.5.page2.charity_11_federal": 25000, // GiftsByCashOrCheck
    "schedule-ca.5.page2.charity_14_federal": 25000, // TotalCharitableContributions
    "schedule-ca.5.page2.total_itemized_17_federal": 25000, // FederalAmounts/Total
    "schedule-ca.5.page2.total_itemized_18_combined": 25000, // Total
    "schedule-ca.5.page2.job_expenses_23_agi": 249108, // JobExpenseAndMiscDeductions/FederalAGI
    "schedule-ca.5.page2.job_expenses_24_threshold": 4982, // FederalMiscDeductionAllowance (2%)
    "schedule-ca.5.page2.total_itemized_26": 25000, // TotalItemizedDeductions
    "schedule-ca.5.page2.total_itemized_28": 25000, // TotalAdjustments
    "schedule-ca.5.page2.total_itemized_29": 25000, // CAItemizedDeductions
    "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 25000, // CADeductions
  },
  renderedChecked: [
    "schedule-ca.4.page2.itemize_ca_not_federal", // FederalNotItemized X
  ],
};

/*
 * Schedule P (540). The key prints line 1 (25,000) although the return itemizes;
 * the form says to go to line 2, so line 1 is not checked (README.md).
 */
const SCHEDULE_P: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-p.0.line.10_iso_cqso": 50000, // ISOAndCQSOs
    "schedule-p.0.line.14_total_adjustments_preferences": 50000, // TotalAdjAndPreferences
    "schedule-p.0.line.15_taxable_income": 177308, // CATaxableIncome
    "schedule-p.1.line.19_combine_lines_14_through_18": 227308, // PreNOLAMTI
    "schedule-p.1.line.21_alternative_minimum_taxable_income": 227308, // AlternativeMinTaxableIncome
    "schedule-p.1.line.22_exemption_amount": 123667, // Exemption
    "schedule-p.1.line.23_amti_less_exemption": 103641, // AMTIMinusExemption
    "schedule-p.1.line.24_tentative_minimum_tax": 7255, // TentativeMinimumTax
    "schedule-p.1.line.25_regular_tax_before_credits": 9367, // RegularTaxLiability
    "schedule-p.1.line.26_alternative_minimum_tax": 0, // AlternativeMinimumTax
    "schedule-p.1.part3.1_tax_from_form_540_line_35": 8433, // TaxReducingCredits/RegularTax
    "schedule-p.1.part3.2_tentative_minimum_tax": 7255, // TaxReducingCredits/TentativeMinimumTax
    "schedule-p.1.part3.3_excess_tax_offset_by_credits_col_c": 1178, // ExcessRegularTax
    "schedule-p.2.part3.11_tax_balance_col_c": 8433, // NetTaxReducingCredits/NetTax
  },
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-540": FORM_540,
  "schedule-ca": SCHEDULE_CA,
  "schedule-p": SCHEDULE_P,
};

export function tcbCa009Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
