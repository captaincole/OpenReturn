/*
 * tcb-ca-005 — the TaxCalcBench answer key (output.xml, ty25-ca-005), typed line by
 * line. The key is the California return (Form 540 and its schedules); the federal
 * forms are inputs, not checked. Change a value only when the FTB instructions say
 * the key is wrong (README.md).
 */

import type { ExpectedResults } from "../../types.js";

const FORM_540: Partial<ExpectedResults> = {
  engineFields: {
    "form-540.line.7_personal_exemption_count": 2, // Exemptions/Personal/Count
    "form-540.line.7_personal_exemption_amount": 306, // Exemptions/Personal/Amount
    "form-540.line.10_dependent_exemption_count": 1, // Exemptions/Dependent/Count
    "form-540.line.10_dependent_exemption_amount": 475, // Exemptions/Dependent/Amount
    "form-540.line.11_total_exemption_amount": 781, // TotalExemptionAmt
    "form-540.line.12_state_wages": 194368, // StateWages
    "form-540.line.13_federal_agi": 264765, // FederalAGI
    "form-540.line.14_ca_adjustments_subtractions": 16881, // CAAdjSubtractions
    "form-540.line.15_ca_agi_before_additions": 247884, // SubtotalAfterCASubtractions
    "form-540.line.17_ca_agi": 247884, // CAAGI
    "form-540.line.18_deductions": 41859, // CADeductions
    "form-540.line.19_taxable_income": 206025, // CATaxableIncome
    "form-540.line.31_tax_amount": 12038, // StateIncomeTax (Tax Rate Schedule)
    "form-540.line.32_exemption_credits": 781, // ExemptionCredits
    "form-540.line.33_tax_after_exemption_credits": 11257, // TaxAfterExemptions
    "form-540.line.35_total_tax_after_credits": 11257, // Tax/TotalTax
    "form-540.line.48_tax_after_credits": 11257, // SpecialCredits/TotalTaxAfterCredits
    "form-540.line.61_alternative_minimum_tax": 13446, // AlternativeMinTax (Schedule P)
    "form-540.line.63_other_taxes_credit_recapture": 280, // OtherTaxesAndRecapture (FTB 3805P)
    "form-540.line.64_total_tax": 24983, // OtherTaxes/TotalTax
    "form-540.line.71_ca_income_tax_withheld": 8081, // CAWithholding
    "form-540.line.78_total_payments": 8081, // TotalPayments
    "form-540.line.91_use_tax": 0, // UseTax
    "form-540.line.93_payments_balance": 8081, // PaymentsBalance
    "form-540.line.95_payments_after_isr_penalty": 8081, // PaymentsAfterISRPenalty
    "form-540.line.100_tax_due": 16902, // TaxDue
    "form-540.line.111_amount_you_owe": 16902, // AmountOwed
    "form-540.line.114_total_amount_due": 16902, // TotalAmtDue
  },
  renderedChecked: [
    "form-540.header.filing_status", // FilerStatus MarriedOrRDPFilingJointly (single-select)
    "form-540.header.mailing_same_as_residence", // PrincipalResidence/SameAddress X
    "form-540.line.31_tax_from_rate_schedule", // ComputationMethod Tax Rate Schedule
    "form-540.line.91_no_use_tax_owed", // NoUseTaxOwed X
    "form-540.line.92_full_year_health_coverage", // FullYearHealthCareCoverage X
  ],
  renderedText: {
    "form-540.header.first_name": "Madison",
    "form-540.header.last_name": "Gray",
    "form-540.header.spouse_first_name": "Salvester",
    "form-540.header.spouse_last_name": "Slone",
    "form-540.header.county_at_filing": "Los Angeles",
    "form-540.dependents.dep1_first_name": "Jessica",
    "form-540.dependents.dep1_last_name": "Davies",
    "form-540.dependents.dep1_relationship": "Niece",
  },
};

const SCHEDULE_CA: Partial<ExpectedResults> = {
  engineFields: {
    // Part I, Section A — column A is the federal return.
    "schedule-ca.0.line.1a_federal": 194368, // Wages
    "schedule-ca.0.line.1z_federal": 194368, // WagesSalariesAndTips
    "schedule-ca.0.line.2b_federal": 330, // TaxableInterest
    "schedule-ca.0.line.3a_federal": 4870, // QualifiedDividends
    "schedule-ca.0.line.3b_federal": 4870, // OrdinaryDividends
    "schedule-ca.0.line.5a_federal": 18773, // PensionsAndAnnuities (gross)
    "schedule-ca.0.line.5b_federal": 11207, // PensionsAndAnnuities (taxable)
    "schedule-ca.0.line.6a_federal": 19860, // SocialSecurityBenefits (gross)
    "schedule-ca.0.line.6b_federal": 16881, // SocialSecurityBenefits (taxable)
    "schedule-ca.0.line.6b_subtractions": 16881, // Subtractions/SocialSecurityBenefits
    "schedule-ca.0.line.7a_federal": 37109, // CapitalGainLoss
    "schedule-ca.2.line.b10_federal": 264765, // TotalIncome
    "schedule-ca.2.line.b10_subtractions": 16881, // Subtractions/TotalIncome
    "schedule-ca.3.line.c27_federal": 264765, // AdjustmentsToIncome/FederalAmounts/Total
    "schedule-ca.3.line.c27_subtractions": 16881, // AdjustmentsToIncome/Subtractions/Total
    // Part II — adjustments to federal itemized deductions.
    "schedule-ca.4.page2.medical_dental_expenses": 8286, // MedicalAndDentalExpenses
    "schedule-ca.4.page2.medical_agi_line11b": 264765, // FederalAGI
    "schedule-ca.4.page2.medical_agi_threshold": 19857, // MedicalAndDentalAllowance (7.5%)
    "schedule-ca.4.page2.taxes_5a_federal": 8081, // StateLocalIncomeOrSalesTaxes
    "schedule-ca.4.page2.taxes_5a_subtractions": 8081, // Subtractions/StateLocalIncomeOrSalesTaxes
    "schedule-ca.4.page2.taxes_5b_federal": 1900, // RealEstateTaxes
    "schedule-ca.4.page2.taxes_5d_federal": 9981, // StateAndLocalTaxesSubtotal
    "schedule-ca.4.page2.taxes_5e_federal": 9981, // StateAndLocalTaxAllowance
    "schedule-ca.4.page2.taxes_5e_subtractions": 8081, // Subtractions/StateAndLocalTaxAllowance
    "schedule-ca.4.page2.taxes_7_federal": 9981, // TotalTaxesPaid
    "schedule-ca.4.page2.taxes_7_subtractions": 8081, // Subtractions/TotalTaxesPaid
    "schedule-ca.4.page2.interest_8a_federal": 8059, // MortgageIntAndPointsReported
    "schedule-ca.4.page2.interest_8e_federal": 8059, // InterestSubtotal
    "schedule-ca.4.page2.interest_9_federal": 1900, // InvestmentInterest (Form 4952 line 8)
    "schedule-ca.4.page2.interest_10_federal": 9959, // TotalInterestPaid
    "schedule-ca.5.page2.charity_11_federal": 25000, // GiftsByCashOrCheck
    "schedule-ca.5.page2.charity_12_federal": 5000, // GiftsByOtherMethods
    "schedule-ca.5.page2.charity_14_federal": 30000, // TotalCharitableContributions
    "schedule-ca.5.page2.total_itemized_17_federal": 49940, // FederalAmounts/Total
    "schedule-ca.5.page2.total_itemized_17_subtractions": 8081, // Subtractions/Total
    "schedule-ca.5.page2.total_itemized_18_combined": 41859, // Total
    "schedule-ca.5.page2.job_expenses_23_agi": 264765, // JobExpenseAndMiscDeductions/FederalAGI
    "schedule-ca.5.page2.job_expenses_24_threshold": 5295, // FederalMiscDeductionAllowance (2%)
    "schedule-ca.5.page2.total_itemized_26": 41859, // TotalItemizedDeductions
    "schedule-ca.5.page2.total_itemized_28": 41859, // TotalAdjustments
    "schedule-ca.5.page2.total_itemized_29": 41859, // CAItemizedDeductions
    "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 41859, // CADeductions
  },
};

/*
 * Schedule P (540). The key prints line 1 (41,859) although the couple itemizes;
 * the form says to go to line 2, so line 1 is not checked (README.md).
 */
const SCHEDULE_P: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-p.0.line.3_personal_real_property_taxes": 1900, // PersonalAndRealPropTaxes
    "schedule-p.0.line.10_iso_cqso": 275000, // ISOAndCQSOs
    "schedule-p.0.line.14_total_adjustments_preferences": 276900, // TotalAdjAndPreferences
    "schedule-p.0.line.15_taxable_income": 206025, // CATaxableIncome
    "schedule-p.1.line.19_combine_lines_14_through_18": 482925, // PreNOLAMTI
    "schedule-p.1.line.21_alternative_minimum_taxable_income": 482925, // AlternativeMinTaxableIncome
    "schedule-p.1.line.22_exemption_amount": 118872, // Exemption (worksheet: 123,667 − 25% × (482,925 − 463,745))
    "schedule-p.1.line.23_amti_less_exemption": 364053, // AMTIMinusExemption
    "schedule-p.1.line.24_tentative_minimum_tax": 25484, // TentativeMinimumTax
    "schedule-p.1.line.25_regular_tax_before_credits": 12038, // RegularTaxLiability
    "schedule-p.1.line.26_alternative_minimum_tax": 13446, // AlternativeMinimumTax
    "schedule-p.1.part3.1_tax_from_form_540_line_35": 11257, // TaxReducingCredits/RegularTax
    "schedule-p.1.part3.2_tentative_minimum_tax": 25484, // TaxReducingCredits/TentativeMinimumTax
    "schedule-p.2.part3.11_tax_balance_col_c": 11257, // NetTaxReducingCredits/NetTax
    "schedule-p.3.part3.22_alternative_minimum_tax_col_c": 13446, // AMTReducingCredits/AlternativeMinimumTax
    "schedule-p.3.part3.25_adjusted_amt_col_c": 13446, // AdjustedAMT
  },
};

const FORM_3526: Partial<ExpectedResults> = {
  engineFields: {
    "form-3526.0.line.2_disallowed_prior_year_interest": 650, // PrYrDisallowedInvestIntExpense
    "form-3526.0.line.3_total_investment_interest": 1900, // TotalInvestIntExpense
    "form-3526.0.line.4a_gross_investment_income": 5200, // GrossIncomeInvestmentProperty
    "form-3526.0.line.4b_net_gain_investment_property": 37109, // PropertyDispositionNetGain
    "form-3526.0.line.4c_net_capital_gain_investment_property": 37109, // PropertyDispositionNetCapitalGain
    "form-3526.0.line.4f_investment_income": 5200, // InvestmentIncome
    "form-3526.0.line.6_net_investment_income": 5200, // NetInvestmentIncome
    "form-3526.0.line.8_investment_interest_deduction": 1900, // InvestmentIntExpenseDeduction
    "form-3526.0.line.9_federal_4952_line_8": 1900, // FedInvestIntExpenseDedAdj
    "form-3526.0.line.10_california_adjustment": 0, // CAInvestIntExpenseDedAdj
  },
};

const FORM_3805P: Partial<ExpectedResults> = {
  engineFields: {
    "form-3805p.0.part1.line_1_early_distributions_in_income": 11207, // IncludedInIncome
    "form-3805p.0.part1.line_3_amount_subject_to_additional_tax": 11207, // SubjectToAddlTax
    "form-3805p.0.part1.line_4_early_distribution_tax_due": 280, // AdditionalTax (2.5%)
  },
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-540": FORM_540,
  "schedule-ca": SCHEDULE_CA,
  "schedule-p": SCHEDULE_P,
  "form-3526": FORM_3526,
  "form-3805p": FORM_3805P,
};

export function tcbCa005Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
