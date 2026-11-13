/*
 * tcb-us-001 — the TaxCalcBench answer key (output.xml, ty25-us-001), typed line by
 * line. The key is Column Tax's engine output, reviewed by their tax analysts.
 * Change a value only when the IRS instructions say the key is wrong (README.md).
 */

import type { ExpectedResults } from "../../types.js";

const FORM_1040: Partial<ExpectedResults> = {
  engineFields: {
    "form-1040.line.1a": 1100000, // WagesAmt
    "form-1040.line.1z": 1100000, // WagesSalariesAndTipsAmt
    "form-1040.line.7a": 5000000, // CapitalGainLossAmt
    "form-1040.line.9": 6100000, // TotalIncomeAmt
    "form-1040.line.11a": 6100000, // AdjustedGrossIncomeAmt
    "form-1040.line.11b": 6100000,
    "form-1040.line.12e": 114800, // TotalItemizedOrStandardDedAmt (Schedule A line 17)
    "form-1040.line.14": 114800, // TotalDeductionsAmt
    "form-1040.line.15": 5985200, // TaxableIncomeAmt
    "form-1040.line.16": 1332556, // TaxAmt
    "form-1040.line.17": 15302, // AdditionalTaxAmt (Schedule 2 line 3)
    "form-1040.line.18": 1347858, // TotalTaxBeforeCrAndOthTaxesAmt
    "form-1040.line.22": 1347858, // TaxLessCreditsAmt
    "form-1040.line.23": 195250, // TotalOtherTaxesAmt (Schedule 2 line 21)
    "form-1040.line.24": 1543108, // TotalTaxAmt
    "form-1040.line.25a": 378000, // FormW2WithheldTaxAmt
    "form-1040.line.25c": 8100, // TaxWithheldOtherAmt (Form 8959 line 24)
    "form-1040.line.25d": 386100, // WithholdingTaxAmt
    "form-1040.line.33": 386100, // TotalPaymentsAmt
    "form-1040.line.37": 1157008, // OwedAmt
  },
  renderedChecked: [
    // IndividualReturnFilingStatusCd 4
    "form-1040.header.filing_status_hoh",
    // VirtualCurAcquiredDurTYInd false
    "form-1040.header.digital_assets_no",
  ],
};

const SCHEDULE_2: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-2.0.line.2_alternative_minimum_tax": 15302, // AlternativeMinimumTaxAmt
    "schedule-2.0.line.3_total_lines_1z_and_2": 15302, // AdditionalTaxAmt
    "schedule-2.0.line.11_additional_medicare_tax": 8100, // TotalAMRRTTaxAmt
    "schedule-2.0.line.12_net_investment_income_tax": 187150, // IndivNetInvstIncomeTaxAmt
    "schedule-2.1.line.21_total_other_taxes": 195250, // TotalOtherTaxesAmt
  },
};

const SCHEDULE_A: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-a.0.line.5b_real_estate_taxes": 2500, // RealEstateTaxesAmt
    "schedule-a.0.line.5c_personal_property_taxes": 300, // PersonalPropertyTaxesAmt
    "schedule-a.0.line.5d_total_state_local_taxes": 2800, // TotalStateAndLocalTaxAmt
    "schedule-a.0.line.5e_salt_cap": 2800, // StateAndLocalTaxLimitationAmt
    "schedule-a.0.line.7_total_taxes": 2800, // TotalTaxesPaidAmt
    "schedule-a.0.line.8a_mortgage_interest_form1098": 32000, // RptHomeMortgIntAndPointsAmt
    "schedule-a.0.line.8e_total_mortgage_interest_points": 32000, // TotalHomeMortgIntAndPointsAmt
    "schedule-a.0.line.9_investment_interest": 75000, // InvestmentInterestAmt (Form 4952)
    "schedule-a.0.line.10_total_interest": 107000, // TotalInterestPaidAmt
    "schedule-a.0.line.11_gifts_cash_check": 5000, // GiftsByCashOrCheckAmt
    "schedule-a.0.line.14_total_gifts": 5000, // TotalCharitableContriAmt
    "schedule-a.0.line.17_total_itemized_deductions": 114800, // TotalItemizedDeductionsAmt
  },
};

const FORM_4952: Partial<ExpectedResults> = {
  engineFields: {
    "form-4952.0.line.1_investment_interest_paid": 75000, // InvestmentInterestExpenseAmt
    "form-4952.0.line.3_total_investment_interest": 75000, // TotalInvestmentInterestExpAmt
    "form-4952.0.line.4d_net_gain_investment_property": 5000000, // InvestmentPropNetDispGainAmt
    "form-4952.0.line.4e_smaller_net_gain_or_capital_gain": 5000000, // PropertyDspstnCapGainInvIncAmt
    "form-4952.0.line.4g_elected_investment_income": 75000, // InvestmentIncomeElectionAmt
    "form-4952.0.line.4h_investment_income": 75000, // InvestmentIncomeAmt
    "form-4952.0.line.6_net_investment_income": 75000, // NetInvestmentIncomeAmt
    "form-4952.0.line.8_investment_interest_deduction": 75000, // InvestmentInterestExpDeductAmt
  },
};

const FORM_8949: Partial<ExpectedResults> = {
  engineFields: {
    "form-8949.1.part2.row1_proceeds": 10000000, // ProceedsSalesPriceAmt
    "form-8949.1.part2.row1_cost_basis": 5000000, // CostOrOtherBasisAmt
    "form-8949.1.part2.row1_gain_loss": 5000000, // GainOrLossAmt
    "form-8949.1.part2.totals_proceeds": 10000000,
    "form-8949.1.part2.totals_cost_basis": 5000000,
    "form-8949.1.part2.totals_gain_loss": 5000000,
  },
  renderedText: {
    "form-8949.1.part2.row1_date_acquired": "01/01/1999", // AcquiredDt
    "form-8949.1.part2.row1_date_sold": "01/01/2025", // SoldOrDisposedDt
  },
  renderedChecked: [
    // TransRptOn1099BThatShowBssInd X
    "form-8949.1.part2.box_d_long_term_basis_reported",
  ],
};

const SCHEDULE_D: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-d.0.line.8b_proceeds": 10000000, // TotalProceedsSalesPriceAmt (box D)
    "schedule-d.0.line.8b_cost": 5000000, // TotalCostOrOtherBasisAmt
    "schedule-d.0.line.8b_gain_loss": 5000000, // TotalGainOrLossAmt
    "schedule-d.0.line.15_net_long_term_gain_loss": 5000000, // NetLTCapitalGainOrLossAmt
    "schedule-d.1.line.16_combined_gain_loss": 5000000, // NetSTAndLTCapitalGainOrLossAmt
  },
  renderedChecked: [
    // STAndLTGainInd true
    "schedule-d.1.line.17_both_gains_yes",
  ],
};

const FORM_8959: Partial<ExpectedResults> = {
  engineFields: {
    "form-8959.0.line.1_medicare_wages_tips": 1100000, // TotalW2MedicareWagesAndTipsAmt
    "form-8959.0.line.4_total_medicare_wages": 1100000, // TotalMedicareWagesAndTipsAmt
    "form-8959.0.line.5_filing_status_threshold_wages": 200000, // FilingStatusThresholdCd
    "form-8959.0.line.6_excess_medicare_wages": 900000, // WagesTipsSubjToAddlMedcrTaxAmt
    "form-8959.0.line.7_additional_medicare_tax_wages": 8100, // AdditionalMedicareTaxAmt
    "form-8959.0.line.18_total_additional_medicare_tax": 8100, // TotalAMRRTTaxAmt
    "form-8959.0.line.19_medicare_tax_withheld": 24050, // TotalW2MedicareTaxWithheldAmt
    "form-8959.0.line.20_medicare_wages_from_line1": 1100000,
    "form-8959.0.line.21_regular_medicare_tax_on_wages": 15950, // TotalMedicareTaxAmt
    "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 8100, // AddnlMedicareTaxWithholdingAmt
    "form-8959.0.line.24_total_additional_medicare_tax_withholding": 8100, // AddlMedcrRRTTaxWithholdingAmt
  },
};

const FORM_8960: Partial<ExpectedResults> = {
  engineFields: {
    "form-8960.0.line.5a": 5000000, // PropertyDisposGainOrLossAmt
    "form-8960.0.line.5d": 5000000, // GainOrLossFromDisposAmt
    "form-8960.0.line.8": 5000000, // TotalIncomeAmt
    "form-8960.0.line.9a": 75000, // InvestmentInterestAmt (Form 4952)
    "form-8960.0.line.9d": 75000, // InvestmentExpenseAmt
    "form-8960.0.line.11": 75000, // TotalDeductionModificationAmt
    "form-8960.0.line.12": 4925000, // NetInvestmentIncomeAmt
    "form-8960.0.line.13": 6100000, // ModifiedAGIAmt
    "form-8960.0.line.14": 200000, // FilingThresholdAmt
    "form-8960.0.line.15": 5900000, // MAGILessThresholdAmt
    "form-8960.0.line.16": 4925000, // SmllrIncmOrMAGILessThrshldAmt
    "form-8960.0.line.17": 187150, // IndivNetInvstIncomeTaxAmt
  },
};

const FORM_6251: Partial<ExpectedResults> = {
  engineFields: {
    "form-6251.0.line.1a_deductions_less_schedule_1a": 114800, // TotDedLessEnhncSrDedAmt
    "form-6251.0.line.1b_taxable_income_start": 5985200, // AGILessTotDedLessEnhncSrDedAmt
    "form-6251.0.line.2a_taxes_or_standard_deduction": 2800, // ScheduleATaxesAmt
    "form-6251.0.line.2i_incentive_stock_options": 250000, // IncentiveStockOptionsAmt
    "form-6251.0.line.4_alternative_minimum_taxable_income": 6238000, // AlternativeMinTaxableIncomeAmt
    "form-6251.0.line.6_amti_less_exemption": 6238000, // AdjAlternativeMinTaxableIncAmt
    "form-6251.0.line.7_tax_on_line_6": 1347858, // TaxOnAltMinTaxableIncAmt
    "form-6251.0.line.9_tentative_minimum_tax": 1347858, // TentativeAlternativeMinTaxAmt
    "form-6251.0.line.10_regular_tax_less_credits": 1332556, // AdjustedRegularTaxAmt
    "form-6251.0.line.11_amt": 15302, // AlternativeMinimumTaxAmt
    "form-6251.1.line.12_amount_from_line_6": 6238000, // ReportedAltMinTaxableIncAmt
    "form-6251.1.line.13_qualified_dividends_gain_amount": 4925000, // CapitalGainsWorksheetAmt
    "form-6251.1.line.15_adjusted_net_capital_gain": 4925000, // SumPlusUnrecapturedSect1250Amt
    "form-6251.1.line.16_smaller_line_12_or_15": 4925000, // SmallerOfAltMinTxblIncOrSumAmt
    "form-6251.1.line.17_line_12_minus_16": 1313000, // AdjAltMinTaxableIncLessGainAmt
    "form-6251.1.line.18_tax_on_line_17": 362858, // NetAdjAltMinTxblIncTimesPctAmt
    "form-6251.1.line.19_zero_rate_threshold": 64750, // FilingStatusLimitAmt
    "form-6251.1.line.20_regular_tax_taxable_income": 1060200, // IncomeAboveThresholdWorkshtAmt
    "form-6251.1.line.22_smaller_line_12_or_13": 4925000, // SmllrOfAdjustedAltMinOrSchDAmt
    "form-6251.1.line.24_line_22_minus_23": 4925000, // SmllrNetAdjAltMinOrNetGainAmt
    "form-6251.1.line.25_fifteen_rate_threshold": 566700, // FilingThresholdAmt
    "form-6251.1.line.27_regular_tax_taxable_income": 1060200, // ApplcblCapGainsOrSchDWrkshtAmt
    "form-6251.1.line.28_add_lines_26_27": 1060200, // SumThresholdApplcblWrkshtAmt
    "form-6251.1.line.33_line_22_minus_32": 4925000, // ExcessOfSumAmt
    "form-6251.1.line.34_tax_at_twenty_percent": 985000, // ExcessOfSumTimesPctAmt
    "form-6251.1.line.38_add_lines_18_31_34_37": 1347858, // SumOfAltMinTaxPercentagesAmt
    "form-6251.1.line.39_tax_on_line_12": 1741858, // NetAltMinTxblIncTimesFSPctAmt
    "form-6251.1.line.40_smaller_line_38_or_39": 1347858, // TaxOnAlternativeMinimumGainAmt
  },
  renderedBlank: [
    // Line 14 is zero or blank: the form skips lines 35 through 37.
    "form-6251.1.line.35_add_lines_17_32_33",
    "form-6251.1.line.36_line_12_minus_35",
    "form-6251.1.line.37_tax_at_twenty_five_percent",
  ],
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-8949": FORM_8949,
  "schedule-d": SCHEDULE_D,
  "form-8959": FORM_8959,
  "form-8960": FORM_8960,
  "form-4952": FORM_4952,
  "schedule-a": SCHEDULE_A,
  "form-6251": FORM_6251,
  "schedule-2": SCHEDULE_2,
  "form-1040": FORM_1040,
};

export function tcbUs001Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
