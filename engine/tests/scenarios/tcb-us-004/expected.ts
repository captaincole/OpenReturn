/*
 * tcb-us-004 — the TaxCalcBench answer key (output.xml, ty25-us-004), typed line by
 * line. The key is Column Tax's engine output, reviewed by their tax analysts.
 * Change a value only when the IRS instructions say the key is wrong (README.md).
 */

import type { ExpectedResults } from "../../types.js";

const FORM_1040: Partial<ExpectedResults> = {
  engineFields: {
    "form-1040.line.1a": 194368, // WagesAmt
    "form-1040.line.1z": 194368, // WagesSalariesAndTipsAmt
    "form-1040.line.2b": 330, // TaxableInterestAmt
    "form-1040.line.3a": 4870, // QualifiedDividendsAmt
    "form-1040.line.3b": 4870, // OrdinaryDividendsAmt
    "form-1040.line.6a": 19860, // SocSecBnftAmt
    "form-1040.line.6b": 16881, // TaxableSocSecAmt
    "form-1040.line.7a": 37109, // CapitalGainLossAmt
    "form-1040.line.8": 4582, // TotalAdditionalIncomeAmt (Schedule 1 line 10)
    "form-1040.line.9": 258140, // TotalIncomeAmt
    "form-1040.line.10": 275, // TotalAdjustmentsAmt (Schedule 1 line 26)
    "form-1040.line.11a": 257865, // AdjustedGrossIncomeAmt
    "form-1040.line.11b": 257865,
    "form-1040.line.12e": 38731, // TotalItemizedOrStandardDedAmt (Schedule A line 17)
    "form-1040.line.13a": 721, // QualifiedBusinessIncomeDedAmt
    "form-1040.line.14": 39452, // TotalDeductionsAmt
    "form-1040.line.15": 218413, // TaxableIncomeAmt
    "form-1040.line.16": 34963, // TaxAmt
    "form-1040.line.18": 34963, // TotalTaxBeforeCrAndOthTaxesAmt
    "form-1040.line.19": 2200, // CTCODCAmt (Schedule 8812)
    "form-1040.line.21": 2200, // TotalCreditsAmt
    "form-1040.line.22": 32763, // TaxLessCreditsAmt
    "form-1040.line.23": 848, // TotalOtherTaxesAmt (Schedule 2 line 21)
    "form-1040.line.24": 33611, // TotalTaxAmt
    "form-1040.line.25a": 31427, // FormW2WithheldTaxAmt
    "form-1040.line.25b": 1986, // Form1099WithheldTaxAmt (SSA-1099 box 6)
    "form-1040.line.25d": 33413, // WithholdingTaxAmt
    "form-1040.line.33": 33413, // TotalPaymentsAmt
    "form-1040.line.37": 198, // OwedAmt
  },
  renderedChecked: [
    // IndividualReturnFilingStatusCd 2
    "form-1040.header.filing_status_mfj",
    // VirtualCurAcquiredDurTYInd false
    "form-1040.header.digital_assets_no",
  ],
};

const SCHEDULE_1: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-1.0.line.3": 3882, // BusinessIncomeLossAmt
    "schedule-1.0.line.8b": 700, // GamblingReportableWinningAmt
    "schedule-1.0.line.9": 700, // TotalOtherIncomeAmt
    "schedule-1.0.line.10": 4582, // TotalAdditionalIncomeAmt
    "schedule-1.1.line.15": 275, // DeductibleSelfEmploymentTaxAmt
    "schedule-1.1.line.26": 275, // TotalAdjustmentsAmt
  },
};

const SCHEDULE_2: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-2.0.line.4_self_employment_tax": 549, // SelfEmploymentTaxAmt
    "schedule-2.0.line.12_net_investment_income_tax": 299, // IndivNetInvstIncomeTaxAmt
    "schedule-2.1.line.21_total_other_taxes": 848, // TotalOtherTaxesAmt
  },
};

const FORM_4952: Partial<ExpectedResults> = {
  engineFields: {
    "form-4952.0.line.2_disallowed_prior_year_interest": 650, // PriorYrDisallowInvsmtIntExpAmt
    "form-4952.0.line.3_total_investment_interest": 650, // TotalInvestmentInterestExpAmt
    "form-4952.0.line.4a_gross_investment_income": 5200, // InvestmentPropGrossIncomeAmt
    "form-4952.0.line.4b_qualified_dividends": 4870, // InvestmentPropQualDividendsAmt
    "form-4952.0.line.4c_income_less_qualified_dividends": 330, // InvestmentPropNetGrossIncAmt
    "form-4952.0.line.4d_net_gain_investment_property": 37109, // InvestmentPropNetDispGainAmt
    "form-4952.0.line.4e_smaller_net_gain_or_capital_gain": 37109, // PropertyDspstnCapGainInvIncAmt
    "form-4952.0.line.4g_elected_investment_income": 320, // InvestmentIncomeElectionAmt
    "form-4952.0.line.4h_investment_income": 650, // InvestmentIncomeAmt
    "form-4952.0.line.6_net_investment_income": 650, // NetInvestmentIncomeAmt
    "form-4952.0.line.8_investment_interest_deduction": 650, // InvestmentInterestExpDeductAmt
  },
  renderedBlank: [
    // No interest paid this year: the key has no line 1.
    "form-4952.0.line.1_investment_interest_paid",
  ],
};

const SCHEDULE_8812: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-8812.0.line.1_form_1040_line_11a": 257865, // AdjustedGrossIncomeAmt
    "schedule-8812.0.line.3_modified_agi": 257865, // ModifiedAGIAmt
    "schedule-8812.0.line.4_qualifying_children_under_17": 1, // QlfyChildUnderAgeSSNCnt
    "schedule-8812.0.line.5_qualifying_children_times_2200": 2200, // QlfyChildUnderAgeSSNLimtAmt
    "schedule-8812.0.line.8_total_credit_before_limit": 2200, // InitialCTCODCAmt
    "schedule-8812.0.line.9_filing_status_threshold": 400000, // FilingStatusThresholdCd
    "schedule-8812.0.line.12_credit_after_phaseout": 2200, // CTCODCAfterAGILimitAmt
    "schedule-8812.0.line.13_credit_limit_worksheet_a": 34963, // ACTCTaxLiabiltyLimitAmt
    "schedule-8812.0.line.14_child_tax_credit_and_other_dependents": 2200, // CTCODCAmt
  },
  renderedChecked: [
    // CTCODCOverAGILimitInd true: line 8 is more than line 11
    "schedule-8812.0.line.12_line8_more_than_line11_yes",
  ],
};

const SCHEDULE_A: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-a.0.line.1_medical_dental_expenses": 8286, // MedicalAndDentalExpensesAmt
    "schedule-a.0.line.2_agi_from_1040": 257865, // TaxReturnAGIAmt
    "schedule-a.0.line.3_agi_multiplied": 19340, // CalculatedMedicalAllowanceAmt
    "schedule-a.0.line.4_net_medical_dental": 0, // line 3 is more than line 1
    "schedule-a.0.line.5a_state_local_income_or_sales_tax": 8081, // StateAndLocalTaxAmt (W-2 box 17 × 2)
    "schedule-a.0.line.5d_total_state_local_taxes": 8081, // TotalStateAndLocalTaxAmt
    "schedule-a.0.line.5e_salt_cap": 8081, // StateAndLocalTaxLimitationAmt
    "schedule-a.0.line.7_total_taxes": 8081, // TotalTaxesPaidAmt
    "schedule-a.0.line.9_investment_interest": 650, // InvestmentInterestAmt (Form 4952)
    "schedule-a.0.line.10_total_interest": 650, // TotalInterestPaidAmt
    "schedule-a.0.line.11_gifts_cash_check": 25000, // GiftsByCashOrCheckAmt
    "schedule-a.0.line.12_gifts_other_than_cash": 5000, // OtherThanByCashOrCheckAmt
    "schedule-a.0.line.14_total_gifts": 30000, // TotalCharitableContriAmt
    "schedule-a.0.line.17_total_itemized_deductions": 38731, // TotalItemizedDeductionsAmt
  },
  renderedBlank: [
    // The couple own no home in this case: no real estate tax, no Form 1098.
    "schedule-a.0.line.5b_real_estate_taxes",
    "schedule-a.0.line.5c_personal_property_taxes",
    "schedule-a.0.line.8a_mortgage_interest_form1098",
    "schedule-a.0.line.8e_total_mortgage_interest_points",
  ],
};

const SCHEDULE_B: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-b.0.line.1_amount_1": 330, // Social Finance
    "schedule-b.0.line.2_total_interest": 330, // InterestSubtotalAmt
    "schedule-b.0.line.4_taxable_interest": 330, // TaxableInterestSubtotalAmt
    "schedule-b.0.line.5_amount_1": 4870, // IBM
    "schedule-b.0.line.6_total_ordinary_dividends": 4870, // TotalOrdinaryDividendsAmt
  },
  renderedText: {
    "schedule-b.0.line.1_payer_name_1": "Social Finance",
    "schedule-b.0.line.5_payer_name_1": "IBM",
  },
};

const SCHEDULE_C: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-c.0.line.1": 3882, // TotalGrossReceiptsAmt
    "schedule-c.0.line.3": 3882, // NetGrossReceiptsAmt
    "schedule-c.0.line.5": 3882, // GrossProfitAmt
    "schedule-c.0.line.7": 3882, // GrossIncomeAmt
    "schedule-c.0.line.29": 3882, // TentativeProfitOrLossAmt
    "schedule-c.0.line.31": 3882, // NetProfitOrLossAmt
  },
  renderedText: {
    "schedule-c.0.header.name": "Madison Gray",
    "schedule-c.0.line.a_principal_business": "consultant",
    "schedule-c.0.line.b_business_code": "541219",
    "schedule-c.0.line.e_business_address": "110 Maitland HWY",
  },
  renderedChecked: [
    "schedule-c.0.line.f_cash",
    "schedule-c.0.line.g_yes",
    "schedule-c.0.line.i_no",
  ],
};

const SCHEDULE_SE: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-se.0.line.2": 3882, // NetNonFarmProfitLossAmt
    "schedule-se.0.line.3": 3882, // SETotalNetEarningsOrLossAmt
    "schedule-se.0.line.4a": 3585, // MinimumProfitForSETaxAmt
    "schedule-se.0.line.4c": 3585, // CombinedSEAmt
    "schedule-se.0.line.6": 3585, // CombinedSEAndChurchWagesAmt
    "schedule-se.0.line.8a": 164772, // SSTWagesRRTCompAmt (Madison's W-2 box 3)
    "schedule-se.0.line.8d": 164772, // TotalWagesAndUnreportedTipsAmt
    "schedule-se.0.line.9": 11328, // AllowableSEAmt
    "schedule-se.0.line.10": 445, // TaxBaseAmt
    "schedule-se.0.line.11": 104, // SEBaseAmt
    "schedule-se.0.line.12": 549, // SelfEmploymentTaxAmt
    "schedule-se.0.line.13": 275, // DeductibleSelfEmploymentTaxAmt
  },
  renderedText: { "schedule-se.0.header.name": "Madison Gray" },
};

const FORM_8949: Partial<ExpectedResults> = {
  engineFields: {
    "form-8949.1.part2.row1_proceeds": 76100, // ProceedsSalesPriceAmt
    "form-8949.1.part2.row1_cost_basis": 38991, // CostOrOtherBasisAmt
    "form-8949.1.part2.row1_gain_loss": 37109, // GainOrLossAmt
    "form-8949.1.part2.totals_proceeds": 76100,
    "form-8949.1.part2.totals_cost_basis": 38991,
    "form-8949.1.part2.totals_gain_loss": 37109,
  },
};

const SCHEDULE_D: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-d.0.line.8b_proceeds": 76100, // TotalProceedsSalesPriceAmt (box D)
    "schedule-d.0.line.8b_cost": 38991, // TotalCostOrOtherBasisAmt
    "schedule-d.0.line.8b_gain_loss": 37109, // TotalGainOrLossAmt
    "schedule-d.0.line.15_net_long_term_gain_loss": 37109, // NetLTCapitalGainOrLossAmt
    "schedule-d.1.line.16_combined_gain_loss": 37109, // NetSTAndLTCapitalGainOrLossAmt
  },
};

const FORM_8960: Partial<ExpectedResults> = {
  engineFields: {
    "form-8960.0.line.1": 330, // TaxableInterestAmt
    "form-8960.0.line.2": 4870, // OrdinaryDividendsAmt
    "form-8960.0.line.4a": 3882, // NetRentalIncomeOrLossAmt (Schedule C, non-passive)
    "form-8960.0.line.4b": -3882, // AdjNetIncmOrLossNonSect1411Amt
    "form-8960.0.line.5a": 37109, // PropertyDisposGainOrLossAmt
    "form-8960.0.line.5d": 37109, // GainOrLossFromDisposAmt
    "form-8960.0.line.8": 42309, // TotalIncomeAmt
    "form-8960.0.line.9a": 650, // InvestmentInterestAmt (Form 4952)
    "form-8960.0.line.9b": 1326, // StateLocalForeignIncomeTaxAmt
    "form-8960.0.line.9d": 1976, // InvestmentExpenseAmt
    "form-8960.0.line.11": 1976, // TotalDeductionModificationAmt
    "form-8960.0.line.12": 40333, // NetInvestmentIncomeAmt
    "form-8960.0.line.13": 257865, // ModifiedAGIAmt
    "form-8960.0.line.14": 250000, // FilingThresholdAmt
    "form-8960.0.line.15": 7865, // MAGILessThresholdAmt
    "form-8960.0.line.16": 7865, // SmllrIncmOrMAGILessThrshldAmt
    "form-8960.0.line.17": 299, // IndivNetInvstIncomeTaxAmt
  },
};

/* One business on line 1i; QBI is Schedule C line 31 less the deductible part of SE tax. */
const FORM_8995: Partial<ExpectedResults> = {
  engineFields: {
    "form-8995.0.line.1i_c": 3607, // QlfyBusinessIncomeOrLossAmt (3,882 − 275)
    "form-8995.0.line.2": 3607, // TotQlfyBusinessIncomeOrLossAmt
    "form-8995.0.line.4": 3607, // TotQualifiedBusinessIncomeAmt
    "form-8995.0.line.5": 721, // QBIComponentAmt
    "form-8995.0.line.10": 721, // QBIDedBfrIncomeLimitationAmt
    "form-8995.0.line.11": 219134, // TaxableIncomeBeforeQBIDedAmt
    "form-8995.0.line.12": 41979, // NetCapitalGainAmt (37,109 + 4,870)
    "form-8995.0.line.13": 177155, // AdjustedTaxableIncomeAmt
    "form-8995.0.line.14": 35431, // IncomeLimitationAmt
    "form-8995.0.line.15": 721, // QualifiedBusinessIncomeDedAmt
  },
  renderedText: { "form-8995.0.line.1i_b": "900456789" }, // SSN (no EIN: the owner's SSN)
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-8949": FORM_8949,
  "schedule-d": SCHEDULE_D,
  "schedule-b": SCHEDULE_B,
  "schedule-c": SCHEDULE_C,
  "schedule-se": SCHEDULE_SE,
  "form-8960": FORM_8960,
  "form-8995": FORM_8995,
  "form-4952": FORM_4952,
  "schedule-a": SCHEDULE_A,
  "schedule-8812": SCHEDULE_8812,
  "schedule-1": SCHEDULE_1,
  "schedule-2": SCHEDULE_2,
  "form-1040": FORM_1040,
};

export function tcbUs004Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
