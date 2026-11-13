/*
 * tcb-ca-007 — the TaxCalcBench answer key (output.xml, ty25-ca-007), typed line by
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
    "form-540.line.13_federal_agi": 41896, // FederalAGI
    "form-540.line.15_ca_agi_before_additions": 41896, // SubtotalAfterCASubtractions
    "form-540.line.16_ca_adjustments_additions": 24187, // CAAdjAdditions
    "form-540.line.17_ca_agi": 66083, // CAAGI
    "form-540.line.18_deductions": 26850, // CADeductions
    "form-540.line.19_taxable_income": 39233, // CATaxableIncome
    "form-540.line.31_tax_amount": 932, // StateIncomeTax (Tax Table)
    "form-540.line.32_exemption_credits": 1578, // ExemptionCredits
    "form-540.line.63_other_taxes_credit_recapture": 25, // OtherTaxesAndRecapture (FTB 3805P)
    "form-540.line.64_total_tax": 25, // OtherTaxes/TotalTax
    "form-540.line.71_ca_income_tax_withheld": 48, // CAWithholding
    "form-540.line.78_total_payments": 48, // TotalPayments
    "form-540.line.91_use_tax": 0, // UseTax
    "form-540.line.93_payments_balance": 48, // PaymentsBalance
    "form-540.line.95_payments_after_isr_penalty": 48, // PaymentsAfterISRPenalty
    "form-540.line.97_overpaid_tax": 23, // OverpaidTax
    "form-540.line.99_overpaid_tax_available": 23, // OverpaidTaxAvailable
    "form-540.line.115_refund_or_no_amount_due": 23, // Refund
  },
  renderedChecked: [
    "form-540.header.filing_status", // FilerStatus MarriedOrRDPFilingSeparately (single-select)
    "form-540.header.mailing_same_as_residence", // PrincipalResidence/SameAddress X
    "form-540.line.31_tax_from_tax_table", // ComputationMethod Tax Table
    "form-540.line.91_no_use_tax_owed", // NoUseTaxOwed X
    "form-540.line.92_full_year_health_coverage", // FullYearHealthCareCoverage X
  ],
  renderedText: {
    "form-540.header.first_name": "State",
    "form-540.header.last_name": "Married",
    "form-540.header.county_at_filing": "Los Angeles",
    "form-540.dependents.dep1_first_name": "Brewster",
    "form-540.dependents.dep1_last_name": "Married",
    "form-540.dependents.dep1_relationship": "Son",
    "form-540.dependents.dep2_first_name": "Daisy",
    "form-540.dependents.dep2_last_name": "Married",
    "form-540.dependents.dep2_relationship": "Daughter",
    "form-540.dependents.dep3_first_name": "Skipper",
    "form-540.dependents.dep3_last_name": "Married",
    "form-540.dependents.dep3_relationship": "Son",
  },
};

const SCHEDULE_CA: Partial<ExpectedResults> = {
  engineFields: {
    // Part I, Section A — column A is the federal return.
    "schedule-ca.0.line.1a_federal": 35000, // FederalAmounts/Wages
    "schedule-ca.0.line.1a_additions": 9800, // Additions/Wages (employee for California)
    "schedule-ca.0.line.1z_federal": 35000, // FederalAmounts/WagesSalariesAndTips
    "schedule-ca.0.line.1z_additions": 9800, // Additions/WagesSalariesAndTips
    "schedule-ca.0.line.3a_federal": 75, // QualifiedDividends
    "schedule-ca.0.line.3b_federal": 75, // OrdinaryDividends
    "schedule-ca.0.line.4a_federal": 4001, // IRADistributions
    "schedule-ca.0.line.5a_federal": 8500, // PensionsAndAnnuities (gross)
    "schedule-ca.0.line.5b_federal": 1500, // FederalAmounts/PensionsAndAnnuities
    "schedule-ca.0.line.7a_federal": 20, // CapitalGainLoss
    // Section B — Schedule 1 income.
    "schedule-ca.0.line.b2a_federal": 666, // AlimonyReceived
    "schedule-ca.0.line.b3_federal": 3547, // BusinessIncomeLoss
    "schedule-ca.0.line.b3_additions": 11140, // Additions/BusinessIncomeLoss (employee for California)
    "schedule-ca.0.line.b5_federal": 4300, // Rents
    "schedule-ca.0.line.b5_additions": 3200, // Additions/Rents (FTB 3885A line 8b)
    "schedule-ca.1.line.b8b_federal": 650, // Gambling
    "schedule-ca.1.line.b8h_federal": 26, // JuryDutyPay
    "schedule-ca.1.line.b8i_federal": 36, // PrizesAndAwards
    "schedule-ca.1.line.b8k_federal": 46, // StockOptions
    "schedule-ca.1.line.b8z_federal": 288, // OtherIncomeAdditionalItems/Total
    "schedule-ca.2.line.b9a_federal": 1046, // TotalOtherIncome
    "schedule-ca.2.line.b10_federal": 46154, // FederalAmounts/TotalIncome
    "schedule-ca.2.line.b10_additions": 24140, // Additions/TotalIncome
    // Section C — Schedule 1 adjustments.
    "schedule-ca.2.line.c15_federal": 251, // DeductibleSelfEmploymentTax
    "schedule-ca.2.line.c16_federal": 1270, // SEPSimpleQualifiedPlans
    "schedule-ca.2.line.c19a_federal": 555, // AlimonyPaid
    "schedule-ca.2.line.c20_federal": 2000, // IRADeduction
    "schedule-ca.3.line.c24a_federal": 7, // JuryDutyPay
    "schedule-ca.3.line.c24d_federal": 17, // ReforestationAmortizationExp
    "schedule-ca.3.line.c24e_federal": 27, // SupplementalUnemployBeneRepay
    "schedule-ca.3.line.c24f_federal": 47, // Sect501c18DPensionPlansContrib
    "schedule-ca.3.line.c24h_federal": 37, // UnlawfulDiscriminatFeesCosts
    "schedule-ca.3.line.c24i_federal": 47, // FederalAmounts/AttorneyFeesCostsPaid
    "schedule-ca.3.line.c24i_subtractions": 47, // Subtractions/AttorneyFeesCostsPaid
    "schedule-ca.3.line.c25_federal": 182, // FederalAmounts/TotalOtherAdjustments
    "schedule-ca.3.line.c25_subtractions": 47, // Subtractions/TotalOtherAdjustments
    "schedule-ca.3.line.c26_federal": 4258, // FederalAmounts/NetAdjustments
    "schedule-ca.3.line.c26_subtractions": 47, // Subtractions/NetAdjustments
    "schedule-ca.3.line.c27_federal": 41896, // FederalAmounts/Total
    "schedule-ca.3.line.c27_subtractions": -47, // Subtractions/Total
    "schedule-ca.3.line.c27_additions": 24140, // Additions/Total
    // Part II — adjustments to federal itemized deductions.
    "schedule-ca.4.page2.medical_dental_expenses": 8300, // MedicalAndDentalExpenses
    "schedule-ca.4.page2.medical_agi_line11b": 41896, // FederalAGI
    "schedule-ca.4.page2.medical_agi_threshold": 3142, // MedicalAndDentalAllowance (7.5%)
    "schedule-ca.4.page2.medical_line4_federal": 5158, // TotalMedicalAndDentalExpenses
    "schedule-ca.4.page2.taxes_5a_federal": 1068, // StateLocalIncomeOrSalesTaxes
    "schedule-ca.4.page2.taxes_5a_subtractions": 1068, // Subtractions/StateLocalIncomeOrSalesTaxes
    "schedule-ca.4.page2.taxes_5b_federal": 3682, // RealEstateTaxes
    "schedule-ca.4.page2.taxes_5c_federal": 250, // PersonalPropertyTaxes
    "schedule-ca.4.page2.taxes_5d_federal": 5000, // StateAndLocalTaxesSubtotal
    "schedule-ca.4.page2.taxes_5e_federal": 5000, // StateAndLocalTaxAllowance
    "schedule-ca.4.page2.taxes_5e_subtractions": 1068, // Subtractions/StateAndLocalTaxAllowance
    "schedule-ca.4.page2.taxes_6_federal": 500, // OtherTaxes
    "schedule-ca.4.page2.taxes_7_federal": 5500, // TotalTaxesPaid
    "schedule-ca.4.page2.taxes_7_subtractions": 1068, // Subtractions/TotalTaxesPaid
    "schedule-ca.4.page2.interest_8a_federal": 9100, // MortgageIntAndPointsReported
    "schedule-ca.4.page2.interest_8e_federal": 9100, // InterestSubtotal
    "schedule-ca.4.page2.interest_9_federal": 60, // InvestmentInterest (Form 4952 line 8)
    "schedule-ca.4.page2.interest_10_federal": 9160, // TotalInterestPaid
    "schedule-ca.5.page2.charity_11_federal": 7500, // GiftsByCashOrCheck
    "schedule-ca.5.page2.charity_14_federal": 7500, // TotalCharitableContributions
    "schedule-ca.5.page2.other_deductions_16_federal": 600, // OtherItemizedDeductions
    "schedule-ca.5.page2.total_itemized_17_federal": 27918, // FederalAmounts/Total
    "schedule-ca.5.page2.total_itemized_17_subtractions": 1068, // Subtractions/Total
    "schedule-ca.5.page2.total_itemized_18_combined": 26850, // Total
    "schedule-ca.5.page2.job_expenses_23_agi": 41896, // JobExpenseAndMiscDeductions/FederalAGI
    "schedule-ca.5.page2.job_expenses_24_threshold": 838, // FederalMiscDeductionAllowance (2%)
    "schedule-ca.5.page2.total_itemized_26": 26850, // TotalItemizedDeductions
    "schedule-ca.5.page2.total_itemized_28": 26850, // TotalAdjustments
    "schedule-ca.5.page2.total_itemized_29": 26850, // CAItemizedDeductions
    "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 26850, // CADeductions
  },
};

const FORM_3526: Partial<ExpectedResults> = {
  engineFields: {
    "form-3526.0.line.2_disallowed_prior_year_interest": 60, // PrYrDisallowedInvestIntExpense
    "form-3526.0.line.3_total_investment_interest": 60, // TotalInvestIntExpense
    "form-3526.0.line.4a_gross_investment_income": 75, // GrossIncomeInvestmentProperty
    "form-3526.0.line.4b_net_gain_investment_property": 20, // PropertyDispositionNetGain
    "form-3526.0.line.4c_net_capital_gain_investment_property": 20, // PropertyDispositionNetCapitalGain
    "form-3526.0.line.4e_elected_net_capital_gain": 20, // ElectedNetCapitalGain
    "form-3526.0.line.4f_investment_income": 95, // InvestmentIncome
    "form-3526.0.line.6_net_investment_income": 95, // NetInvestmentIncome
    "form-3526.0.line.8_investment_interest_deduction": 60, // InvestmentIntExpenseDeduction
    "form-3526.0.line.9_federal_4952_line_8": 60, // FedInvestIntExpenseDedAdj
    "form-3526.0.line.10_california_adjustment": 0, // CAInvestIntExpenseDedAdj
  },
};

const FORM_3805P: Partial<ExpectedResults> = {
  engineFields: {
    "form-3805p.0.part1.line_1_early_distributions_in_income": 1000, // IncludedInIncome
    "form-3805p.0.part1.line_3_amount_subject_to_additional_tax": 1000, // SubjectToAddlTax
    "form-3805p.0.part1.line_4_early_distribution_tax_due": 25, // AdditionalTax (2.5%)
  },
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-540": FORM_540,
  "schedule-ca": SCHEDULE_CA,
  "form-3526": FORM_3526,
  "form-3805p": FORM_3805P,
};

export function tcbCa007Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
