/*
 * tcb-us-008 — the TaxCalcBench answer key (output.xml, ty25-us-008), typed line by
 * line. The key is Column Tax's engine output, reviewed by their tax analysts.
 * Change a value only when the IRS instructions say the key is wrong (README.md).
 */

import type { ExpectedResults } from "../../types.js";

const FORM_1040: Partial<ExpectedResults> = {
  engineFields: {
    "form-1040.line.1a": 160368, // WagesAmt
    "form-1040.line.1z": 160368, // WagesSalariesAndTipsAmt
    "form-1040.line.7a": -1500, // CapitalGainLossAmt (Schedule D line 21)
    "form-1040.line.8": 1384, // TotalAdditionalIncomeAmt (Schedule 1 line 10)
    "form-1040.line.9": 160252, // TotalIncomeAmt
    "form-1040.line.10": 98, // TotalAdjustmentsAmt (Schedule 1 line 26)
    "form-1040.line.11a": 160154, // AdjustedGrossIncomeAmt
    "form-1040.line.11b": 160154,
    "form-1040.line.12e": 37704, // TotalItemizedOrStandardDedAmt (Schedule A line 17)
    "form-1040.line.13a": 257, // QualifiedBusinessIncomeDedAmt (Form 8995 line 15)
    "form-1040.line.14": 37961, // TotalDeductionsAmt
    "form-1040.line.15": 122193, // TaxableIncomeAmt
    "form-1040.line.16": 22173, // TaxAmt
    "form-1040.line.18": 22173, // TotalTaxBeforeCrAndOthTaxesAmt
    "form-1040.line.22": 22173, // TaxLessCreditsAmt
    "form-1040.line.23": 565, // TotalOtherTaxesAmt (Schedule 2 line 21)
    "form-1040.line.24": 22738, // TotalTaxAmt
    "form-1040.line.25a": 28026, // FormW2WithheldTaxAmt
    "form-1040.line.25d": 28026, // WithholdingTaxAmt
    "form-1040.line.33": 28026, // TotalPaymentsAmt
    "form-1040.line.34": 5288, // OverpaidAmt
    "form-1040.line.35a": 5288, // RefundAmt
  },
  renderedChecked: [
    "form-1040.header.filing_status_mfs", // IndividualReturnFilingStatusCd 3
    "form-1040.header.lived_apart_mfs_hoh", // SepdSpsFilingSepRetMeetsRqrInd
  ],
};

const SCHEDULE_1: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-1.0.line.3": 1384, // BusinessIncomeLossAmt
    "schedule-1.0.line.10": 1384, // TotalAdditionalIncomeAmt
    "schedule-1.1.line.15": 98, // DeductibleSelfEmploymentTaxAmt
    "schedule-1.1.line.26": 98, // TotalAdjustmentsAmt
  },
};

const SCHEDULE_2: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-2.0.line.4_self_employment_tax": 195, // SelfEmploymentTaxAmt
    "schedule-2.0.line.11_additional_medicare_tax": 370, // TotalAMRRTTaxAmt
    "schedule-2.1.line.21_total_other_taxes": 565, // TotalOtherTaxesAmt
  },
};

/* Taxes and gifts; the gifts are under 20% of AGI, so no Pub. 526 limit applies. */
const SCHEDULE_A: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-a.0.line.5a_state_local_income_or_sales_tax": 6794, // StateAndLocalTaxAmt (W-2 box 17)
    "schedule-a.0.line.5c_personal_property_taxes": 300, // PersonalPropertyTaxesAmt
    "schedule-a.0.line.5d_total_state_local_taxes": 7094, // TotalStateAndLocalTaxAmt
    "schedule-a.0.line.5e_salt_cap": 7094, // StateAndLocalTaxLimitationAmt
    "schedule-a.0.line.7_total_taxes": 7094, // TotalTaxesPaidAmt
    "schedule-a.0.line.11_gifts_cash_check": 30300, // GiftsByCashOrCheckAmt
    "schedule-a.0.line.12_gifts_other_than_cash": 300, // OtherThanByCashOrCheckAmt
    "schedule-a.0.line.13_gifts_carryover": 10, // CarryoverFromPriorYearAmt
    "schedule-a.0.line.14_total_gifts": 30610, // TotalCharitableContriAmt
    "schedule-a.0.line.17_total_itemized_deductions": 37704, // TotalItemizedDeductionsAmt
  },
};

/* Part IV is the one vehicle; Part V the two other expenses. */
const SCHEDULE_C: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-c.0.line.1": 3882, // TotalGrossReceiptsAmt
    "schedule-c.0.line.3": 3882, // NetGrossReceiptsAmt
    "schedule-c.0.line.5": 3882, // GrossProfitAmt
    "schedule-c.0.line.7": 3882, // GrossIncomeAmt
    "schedule-c.0.line.9": 196, // CarAndTruckExpensesAmt (280 miles × $0.70)
    "schedule-c.0.line.18": 250, // OfficeExpensesAmt
    "schedule-c.0.line.27b": 1332, // TotalOtherExpensesAmt (Part V)
    "schedule-c.0.line.28": 1778, // TotalExpensesAmt
    "schedule-c.0.line.29": 2104, // TentativeProfitOrLossAmt
    "schedule-c.0.line.30_home_sq_ft": 2950, // TotalAreaOfHomeCnt
    "schedule-c.0.line.30_business_sq_ft": 144, // HomeBusinessUseSquareFeetCnt
    "schedule-c.0.line.30": 720, // HomeBusinessExpenseAmt (144 × $5)
    "schedule-c.0.line.31": 1384, // NetProfitOrLossAmt
    "schedule-c.1.line.44a_business_miles": 280, // BusinessMilesCnt
    "schedule-c.1.line.44b_commuting_miles": 1774, // CommutingMilesCnt
    "schedule-c.1.line.44c_other_miles": 606, // OtherMilesCnt
    "schedule-c.1.line.48_amount_1": 982, // OtherExpenseDetail
    "schedule-c.1.line.48_amount_2": 350, // OtherExpenseDetail
    "schedule-c.1.line.48": 1332, // TotalOtherExpensesAmt
  },
  renderedText: {
    "schedule-c.0.line.a_principal_business": "consultant",
    "schedule-c.0.line.b_business_code": "541219",
    "schedule-c.1.line.48_description_1": "test",
    "schedule-c.1.line.48_description_2": "test",
  },
  renderedChecked: [
    "schedule-c.0.line.f_cash", // MethodOfAccountingCashInd
    "schedule-c.0.line.g_yes", // MaterialParticipationInCYInd
    "schedule-c.0.line.i_no", // PaymentRqrFilingForm1099Ind false
    "schedule-c.1.line.45_personal_use_off_duty_yes", // VehicleAvailableOffDutyHrsInd
    "schedule-c.1.line.46_another_vehicle_available_no", // AnotherVehicleForPrsnlUseInd
    "schedule-c.1.line.47a_evidence_supports_deduction_yes", // EvidenceToSupportDeductionInd
    "schedule-c.1.line.47b_evidence_written_yes", // EvidenceWrittenInd
  ],
};

/* Only the carryover: no sales. */
const SCHEDULE_D: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-d.0.line.6_short_term_loss_carryover": 8507, // STCapitalLossCarryoverAmt
    "schedule-d.0.line.7_net_short_term_gain_loss": -8507, // NetSTCapitalGainOrLossAmt
    "schedule-d.1.line.16_combined_gain_loss": -8507, // NetSTAndLTCapitalGainOrLossAmt
    "schedule-d.1.line.21_allowable_loss": 1500, // AllowableLossAmt ($1,500 MFS limit)
  },
  renderedChecked: [
    "schedule-d.1.line.22_qualified_dividends_no", // QualifiedDividendsInd false
  ],
};

const SCHEDULE_SE: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-se.0.line.2": 1384, // NetNonFarmProfitLossAmt
    "schedule-se.0.line.3": 1384, // SETotalNetEarningsOrLossAmt
    "schedule-se.0.line.4a": 1278, // MinimumProfitForSETaxAmt
    "schedule-se.0.line.4c": 1278, // CombinedSEAmt
    "schedule-se.0.line.6": 1278, // CombinedSEAndChurchWagesAmt
    "schedule-se.0.line.8a": 164772, // SSTWagesRRTCompAmt
    "schedule-se.0.line.8d": 164772, // TotalWagesAndUnreportedTipsAmt
    "schedule-se.0.line.9": 11328, // AllowableSEAmt
    "schedule-se.0.line.10": 158, // TaxBaseAmt
    "schedule-se.0.line.11": 37, // SEBaseAmt
    "schedule-se.0.line.12": 195, // SelfEmploymentTaxAmt
    "schedule-se.0.line.13": 98, // DeductibleSelfEmploymentTaxAmt
  },
};

const FORM_8959: Partial<ExpectedResults> = {
  engineFields: {
    "form-8959.0.line.1_medicare_wages_tips": 164772, // TotalW2MedicareWagesAndTipsAmt
    "form-8959.0.line.4_total_medicare_wages": 164772, // TotalMedicareWagesAndTipsAmt
    "form-8959.0.line.5_filing_status_threshold_wages": 125000, // FilingStatusThresholdCd
    "form-8959.0.line.6_excess_medicare_wages": 39772, // WagesTipsSubjToAddlMedcrTaxAmt
    "form-8959.0.line.7_additional_medicare_tax_wages": 358, // AdditionalMedicareTaxAmt
    "form-8959.0.line.8_self_employment_income": 1278, // TotalSelfEmploymentIncomeAmt
    "form-8959.0.line.12_excess_se_income": 1278, // SEIncomeSubjToAddSETaxAmt
    "form-8959.0.line.13_additional_medicare_tax_se": 12, // AddlSelfEmploymentTaxAmt
    "form-8959.0.line.18_total_additional_medicare_tax": 370, // TotalAMRRTTaxAmt
    "form-8959.0.line.19_medicare_tax_withheld": 2389, // TotalW2MedicareTaxWithheldAmt
    "form-8959.0.line.21_regular_medicare_tax_on_wages": 2389, // TotalMedicareTaxAmt
  },
};

/* Net investment income is a loss: no tax. */
const FORM_8960: Partial<ExpectedResults> = {
  engineFields: {
    "form-8960.0.line.4a": 1384, // NetRentalIncomeOrLossAmt (Schedule C)
    "form-8960.0.line.4b": -1384, // AdjNetIncmOrLossNonSect1411Amt
    "form-8960.0.line.5a": -1500, // PropertyDisposGainOrLossAmt
    "form-8960.0.line.5d": -1500, // GainOrLossFromDisposAmt
    "form-8960.0.line.8": -1500, // TotalIncomeAmt
    "form-8960.0.line.13": 160154, // ModifiedAGIAmt
    "form-8960.0.line.14": 125000, // FilingThresholdAmt
    "form-8960.0.line.15": 35154, // MAGILessThresholdAmt
  },
};

/* One business on line 1i; QBI is Schedule C line 31 less the deductible part of SE tax. */
const FORM_8995: Partial<ExpectedResults> = {
  engineFields: {
    "form-8995.0.line.1i_c": 1286, // QlfyBusinessIncomeOrLossAmt (1,384 − 98)
    "form-8995.0.line.2": 1286, // TotQlfyBusinessIncomeOrLossAmt
    "form-8995.0.line.4": 1286, // TotQualifiedBusinessIncomeAmt
    "form-8995.0.line.5": 257, // QBIComponentAmt
    "form-8995.0.line.10": 257, // QBIDedBfrIncomeLimitationAmt
    "form-8995.0.line.11": 122450, // TaxableIncomeBeforeQBIDedAmt
    "form-8995.0.line.13": 122450, // AdjustedTaxableIncomeAmt
    "form-8995.0.line.14": 24490, // IncomeLimitationAmt
    "form-8995.0.line.15": 257, // QualifiedBusinessIncomeDedAmt
  },
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-1040": FORM_1040,
  "schedule-1": SCHEDULE_1,
  "schedule-2": SCHEDULE_2,
  "schedule-a": SCHEDULE_A,
  "schedule-c": SCHEDULE_C,
  "schedule-d": SCHEDULE_D,
  "schedule-se": SCHEDULE_SE,
  "form-8959": FORM_8959,
  "form-8960": FORM_8960,
  "form-8995": FORM_8995,
};

export function tcbUs008Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
