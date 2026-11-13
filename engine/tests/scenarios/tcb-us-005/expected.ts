/*
 * tcb-us-005 — the TaxCalcBench answer key (output.xml, ty25-us-005), typed line by
 * line. The key is Column Tax's engine output, reviewed by their tax analysts.
 * Change a value only when the IRS instructions say the key is wrong (README.md).
 * A line printed in parentheses holds a positive amount, as the key does.
 */

import type { ExpectedResults } from "../../types.js";

const FORM_1040: Partial<ExpectedResults> = {
  engineFields: {
    "form-1040.line.1a": 420000, // WagesAmt
    "form-1040.line.1z": 420000, // WagesSalariesAndTipsAmt
    "form-1040.line.2b": 600, // TaxableInterestAmt
    "form-1040.line.3a": 1500, // QualifiedDividendsAmt
    "form-1040.line.3b": 1500, // OrdinaryDividendsAmt
    "form-1040.line.8": 21000, // TotalAdditionalIncomeAmt (Schedule 1 line 10)
    "form-1040.line.9": 443100, // TotalIncomeAmt
    "form-1040.line.10": 1135, // TotalAdjustmentsAmt (Schedule 1 line 26)
    "form-1040.line.11a": 441965, // AdjustedGrossIncomeAmt
    "form-1040.line.11b": 441965,
    "form-1040.line.12e": 31500, // TotalItemizedOrStandardDedAmt
    "form-1040.line.13a": 3973, // QualifiedBusinessIncomeDedAmt (Form 8995-A)
    "form-1040.line.14": 35473, // TotalDeductionsAmt
    "form-1040.line.15": 406492, // TaxableIncomeAmt
    "form-1040.line.16": 83948, // TaxAmt
    "form-1040.line.18": 83948, // TotalTaxBeforeCrAndOthTaxesAmt
    "form-1040.line.19": 100, // CTCODCAmt (Schedule 8812)
    "form-1040.line.21": 100, // TotalCreditsAmt
    "form-1040.line.22": 83848, // TaxLessCreditsAmt
    "form-1040.line.23": 4295, // TotalOtherTaxesAmt (Schedule 2 line 21)
    "form-1040.line.24": 88143, // TotalTaxAmt
    "form-1040.line.25a": 5000, // FormW2WithheldTaxAmt
    "form-1040.line.25c": 1980, // TaxWithheldOtherAmt (Form 8959 line 24)
    "form-1040.line.25d": 6980, // WithholdingTaxAmt
    "form-1040.line.33": 6980, // TotalPaymentsAmt
    "form-1040.line.37": 81163, // OwedAmt
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
    "schedule-1.0.line.3": 50000, // BusinessIncomeLossAmt
    "schedule-1.0.line.5": -29000, // RentalRealEstateIncomeLossAmt (Schedule E line 41)
    "schedule-1.0.line.10": 21000, // TotalAdditionalIncomeAmt
    "schedule-1.1.line.15": 1135, // DeductibleSelfEmploymentTaxAmt
    "schedule-1.1.line.26": 1135, // TotalAdjustmentsAmt
  },
};

const SCHEDULE_2: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-2.0.line.4_self_employment_tax": 2269, // SelfEmploymentTaxAmt
    "schedule-2.0.line.11_additional_medicare_tax": 1946, // TotalAMRRTTaxAmt
    "schedule-2.0.line.12_net_investment_income_tax": 80, // IndivNetInvstIncomeTaxAmt
    "schedule-2.1.line.21_total_other_taxes": 4295, // TotalOtherTaxesAmt
  },
};

/* One child under 17 with an SSN; the credit phases out to $100. */
const SCHEDULE_8812: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-8812.0.line.1_form_1040_line_11a": 441965, // AdjustedGrossIncomeAmt
    "schedule-8812.0.line.3_modified_agi": 441965, // ModifiedAGIAmt
    "schedule-8812.0.line.4_qualifying_children_under_17": 1, // QlfyChildUnderAgeSSNCnt
    "schedule-8812.0.line.5_qualifying_children_times_2200": 2200, // QlfyChildUnderAgeSSNLimtAmt
    "schedule-8812.0.line.8_total_credit_before_limit": 2200, // InitialCTCODCAmt
    "schedule-8812.0.line.9_filing_status_threshold": 400000, // FilingStatusThresholdCd
    "schedule-8812.0.line.10_excess_over_threshold": 42000, // ExcessAdjGrossIncomeAmt
    "schedule-8812.0.line.11_phaseout_amount": 2100, // ModifiedAGIPhaseOutAmt
    "schedule-8812.0.line.12_credit_after_phaseout": 100, // CTCODCAfterAGILimitAmt
    "schedule-8812.0.line.13_credit_limit_worksheet_a": 83948, // ACTCTaxLiabiltyLimitAmt
    "schedule-8812.0.line.14_child_tax_credit_and_other_dependents": 100, // CTCODCAmt
  },
  renderedChecked: [
    // CTCODCOverAGILimitInd true: line 8 is more than line 11
    "schedule-8812.0.line.12_line8_more_than_line11_yes",
  ],
};

/* No expenses: the key leaves line 28 blank. */
const SCHEDULE_C: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-c.0.line.1": 50000, // TotalGrossReceiptsAmt
    "schedule-c.0.line.3": 50000, // NetGrossReceiptsAmt
    "schedule-c.0.line.5": 50000, // GrossProfitAmt
    "schedule-c.0.line.7": 50000, // GrossIncomeAmt
    "schedule-c.0.line.29": 50000, // TentativeProfitOrLossAmt
    "schedule-c.0.line.31": 50000, // NetProfitOrLossAmt
  },
  renderedText: {
    "schedule-c.0.header.name": "Real Professional",
    "schedule-c.0.line.a_principal_business": "business",
    "schedule-c.0.line.b_business_code": "999000",
    "schedule-c.0.line.e_business_address": "1 address",
  },
  renderedChecked: ["schedule-c.0.line.f_cash", "schedule-c.0.line.g_yes"],
};

const SCHEDULE_SE: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-se.0.line.2": 50000, // NetNonFarmProfitLossAmt
    "schedule-se.0.line.3": 50000, // SETotalNetEarningsOrLossAmt
    "schedule-se.0.line.4a": 46175, // MinimumProfitForSETaxAmt
    "schedule-se.0.line.4c": 46175, // CombinedSEAmt
    "schedule-se.0.line.6": 46175, // CombinedSEAndChurchWagesAmt
    "schedule-se.0.line.8a": 168600, // SSTWagesRRTCompAmt
    "schedule-se.0.line.8d": 168600, // TotalWagesAndUnreportedTipsAmt
    "schedule-se.0.line.9": 7500, // AllowableSEAmt
    "schedule-se.0.line.10": 930, // TaxBaseAmt
    "schedule-se.0.line.11": 1339, // SEBaseAmt
    "schedule-se.0.line.12": 2269, // SelfEmploymentTaxAmt
    "schedule-se.0.line.13": 1135, // DeductibleSelfEmploymentTaxAmt
  },
  renderedText: { "schedule-se.0.header.name": "Real Professional" },
};

/*
 * Property A: the joint multi-family rental, nonpassive (real estate professional).
 * Property B: the spouse's passive royalty; its $3,000 loss is not allowed (Form 8582).
 */
const SCHEDULE_E: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-e.0.line.2_fair_rental_days_a": 365, // FairRentalDaysCnt
    "schedule-e.0.line.2_personal_use_days_a": 0, // PersonalUseDaysCnt
    "schedule-e.0.line.3_rents_received_a": 1000, // RentsReceivedAmt
    "schedule-e.0.line.4_royalties_received_b": 2000, // TotalRoyaltiesReceivedAmt
    "schedule-e.0.line.5_advertising_a": 30000, // AdvertisingAmt
    "schedule-e.0.line.10_legal_professional_fees_b": 5000, // LegalAndOtherProfFeesAmt
    "schedule-e.0.line.20_total_expenses_a": 30000, // TotalExpensesAmt
    "schedule-e.0.line.20_total_expenses_b": 5000, // TotalExpensesAmt
    "schedule-e.0.line.21_income_or_loss_a": -29000, // NetRentalIncomeOrLossAmt
    "schedule-e.0.line.22_deductible_loss_a": 29000, // DedRentalRealEstateLossAmt
    "schedule-e.0.line.23a_total_rents": 1000, // TotAllPaymentsAllRentalPropAmt
    "schedule-e.0.line.23b_total_royalties": 2000, // TotAllPaymentsAllRyltyPropAmt
    "schedule-e.0.line.23e_total_expenses": 35000, // TotalAllPropTotalExpensesAmt
    "schedule-e.0.line.25_losses": 29000, // LossesAmt
    "schedule-e.0.line.26_total_income_or_loss": -29000, // TotalIncomeOrLossAmt
    "schedule-e.1.line.41_total_income_or_loss": -29000, // TotalSuppIncomeOrLossAmt
    "schedule-e.1.line.43_real_estate_professional_reconciliation": -29000, // RecnclForREProfessionalsAmt
  },
  renderedText: {
    // PropertyDesc MULTI-FAMILY RESIDENCE and ROYALTIES: line 1b takes the type's code.
    "schedule-e.0.line.1b_property_type_a": "2",
    "schedule-e.0.line.1b_property_type_b": "6",
  },
  renderedChecked: [
    // PaymentRqrFilingForm1099Ind false
    "schedule-e.0.line.a_payments_require_1099_no",
    // QualifiedJointVentureInd X
    "schedule-e.0.line.2_qjv_a",
  ],
};

/* The royalty is the only passive activity: an other passive activity (Part V). */
const FORM_8582: Partial<ExpectedResults> = {
  engineFields: {
    "form-8582.0.line.2b_other_net_loss": 3000, // OtherActivityLossAmt
    "form-8582.0.line.2d_other_combined": -3000, // NetOtherActivityAmt
    "form-8582.0.line.3_combined": -3000, // TotalPassiveActivityAmt
    "form-8582.1.part5.row_1_col_b_net_loss": 3000, // CurrentYearNetLossAmt
    "form-8582.1.part5.row_1_col_e_loss": 3000, // OverallLossAmt
    "form-8582.1.part5.total_col_b_net_loss": 3000, // TotalOtherCurrentYearLossAmt
    "form-8582.1.part7.row_1_col_a_loss": 3000, // F8582WrkshtLossesAmt
    "form-8582.1.part7.row_1_col_c_unallowed_loss": 3000, // (c) unallowed loss
    "form-8582.1.part7.total_col_a_loss": 3000, // TotalAllocationLossAmt
    "form-8582.1.part7.total_col_c_unallowed_loss": 3000, // TotalLossAmt
    "form-8582.1.part8.row_1_col_a_loss": 3000, // F8582WrkshtLossesAmt
    "form-8582.1.part8.row_1_col_b_unallowed_loss": 3000, // (b) unallowed loss
    "form-8582.1.part8.total_col_a_loss": 3000, // TotalLossAmt
    "form-8582.1.part8.total_col_b_unallowed_loss": 3000, // TotalUnallowedLossAmt
  },
};

const FORM_8959: Partial<ExpectedResults> = {
  engineFields: {
    "form-8959.0.line.1_medicare_wages_tips": 420000, // TotalW2MedicareWagesAndTipsAmt
    "form-8959.0.line.4_total_medicare_wages": 420000, // TotalMedicareWagesAndTipsAmt
    "form-8959.0.line.5_filing_status_threshold_wages": 250000, // FilingStatusThresholdCd
    "form-8959.0.line.6_excess_medicare_wages": 170000, // WagesTipsSubjToAddlMedcrTaxAmt
    "form-8959.0.line.7_additional_medicare_tax_wages": 1530, // AdditionalMedicareTaxAmt
    "form-8959.0.line.8_self_employment_income": 46175, // TotalSelfEmploymentIncomeAmt
    "form-8959.0.line.9_filing_status_threshold_se": 250000, // FilingStatusThresholdCd
    "form-8959.0.line.12_excess_se_income": 46175, // SEIncomeSubjToAddSETaxAmt
    "form-8959.0.line.13_additional_medicare_tax_se": 416, // AddlSelfEmploymentTaxAmt
    "form-8959.0.line.18_total_additional_medicare_tax": 1946, // TotalAMRRTTaxAmt
    "form-8959.0.line.19_medicare_tax_withheld": 8070, // TotalW2MedicareTaxWithheldAmt
    "form-8959.0.line.20_medicare_wages_from_line1": 420000,
    "form-8959.0.line.21_regular_medicare_tax_on_wages": 6090, // TotalMedicareTaxAmt
    "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 1980, // AddnlMedicareTaxWithholdingAmt
    "form-8959.0.line.24_total_additional_medicare_tax_withholding": 1980, // AddlMedcrRRTTaxWithholdingAmt
  },
};

const FORM_8960: Partial<ExpectedResults> = {
  engineFields: {
    "form-8960.0.line.1": 600, // TaxableInterestAmt
    "form-8960.0.line.2": 1500, // OrdinaryDividendsAmt
    "form-8960.0.line.4a": 21000, // NetRentalIncomeOrLossAmt
    "form-8960.0.line.4b": -21000, // AdjNetIncmOrLossNonSect1411Amt
    "form-8960.0.line.8": 2100, // TotalIncomeAmt
    "form-8960.0.line.12": 2100, // NetInvestmentIncomeAmt
    "form-8960.0.line.13": 441965, // ModifiedAGIAmt
    "form-8960.0.line.14": 250000, // FilingThresholdAmt
    "form-8960.0.line.15": 191965, // MAGILessThresholdAmt
    "form-8960.0.line.16": 2100, // SmllrIncmOrMAGILessThrshldAmt
    "form-8960.0.line.17": 80, // IndivNetInvstIncomeTaxAmt
  },
};

/*
 * Loss netting: the rental's $29,000 QBI loss offsets the business's QBI. Row A's
 * column (c) and line 6 are 0 by the form's rule; the key leaves them blank.
 */
const FORM_8995A_SCHEDULE_C: Partial<ExpectedResults> = {
  engineFields: {
    "form-8995-a-schedule-c.0.line.1_col_a_qbi_a": -29000, // QlfyBusinessIncomeOrLossAmt
    "form-8995-a-schedule-c.0.line.1_col_a_qbi_b": 48865, // QlfyBusinessIncomeOrLossAmt
    "form-8995-a-schedule-c.0.line.1_col_b_loss_netting_b": 29000, // LossNettingReductionAmt
    "form-8995-a-schedule-c.0.line.1_col_c_adjusted_qbi_b": 19865, // AdjQualifiedBusinessIncomeAmt
    "form-8995-a-schedule-c.0.line.3_total_losses": 29000, // TotalTradeOrBusinessLossAmt
    "form-8995-a-schedule-c.0.line.4_total_income": 48865, // TotalTradeOrBusinessIncomeAmt
    "form-8995-a-schedule-c.0.line.5_losses_netted": 29000, // LossNettedIncomeOthTradeBusAmt
  },
};

/*
 * Column A: the rental, whose $29,000 QBI loss is netted against the business on
 * Form 8995-A Schedule C (no amounts in column A). Column B: the business, after
 * netting. Line 10 is more than line 3, so Part III is skipped.
 */
const FORM_8995A: Partial<ExpectedResults> = {
  engineFields: {
    "form-8995-a.0.line.2_b": 19865, // QualifiedBusinessIncomeAmt
    "form-8995-a.0.line.3_b": 3973, // QlfyBusinessIncome20PctAmt
    "form-8995-a.0.line.4_b": 200000, // AllocableShareW2WagesAmt
    "form-8995-a.0.line.5_b": 100000, // AllocableShareW2Wages50PctAmt
    "form-8995-a.0.line.6_b": 50000, // AllocableShareW2Wages25PctAmt
    "form-8995-a.0.line.9_b": 50000, // TotalAllcblW2WgsQlfyPropPctAmt
    "form-8995-a.0.line.10_b": 100000, // GrtrAllcblShrW2WageQlfyPropAmt
    "form-8995-a.0.line.11_b": 3973, // W2WageQlfyPropLimitationAmt
    "form-8995-a.0.line.13_b": 3973, // QBIDedBeforePatronReductionAmt
    "form-8995-a.0.line.15_b": 3973, // QBIComponentAmt
    "form-8995-a.0.line.16": 3973, // TotalQBIComponentAmt
    "form-8995-a.1.line.32": 3973, // QBIDedBfrIncomeLimitationAmt
    "form-8995-a.1.line.33": 410465, // TaxableIncomeBeforeQBIDedAmt
    "form-8995-a.1.line.34": 1500, // NetCapitalGainAmt
    "form-8995-a.1.line.35": 408965, // AdjustedTaxableIncomeAmt
    "form-8995-a.1.line.36": 81793, // IncomeLimitationAmt
    "form-8995-a.1.line.37": 3973, // QBIDedBeforeDPADSect199AgAmt
    "form-8995-a.1.line.39": 3973, // QualifiedBusinessIncomeDedAmt
  },
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "schedule-c": SCHEDULE_C,
  "schedule-se": SCHEDULE_SE,
  "schedule-e": SCHEDULE_E,
  "form-8582": FORM_8582,
  "form-1040": FORM_1040,
  "schedule-1": SCHEDULE_1,
  "schedule-2": SCHEDULE_2,
  "schedule-8812": SCHEDULE_8812,
  "form-8959": FORM_8959,
  "form-8960": FORM_8960,
  "form-8995-a-schedule-c": FORM_8995A_SCHEDULE_C,
  "form-8995-a": FORM_8995A,
};

export function tcbUs005Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
