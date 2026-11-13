/*
 * tcb-us-007 — the TaxCalcBench answer key (output.xml, ty25-us-007), typed line by
 * line. The key is Column Tax's engine output, reviewed by their tax analysts.
 * Change a value only when the IRS instructions say the key is wrong (README.md).
 */

import type { ExpectedResults } from "../../types.js";

const FORM_1040: Partial<ExpectedResults> = {
  engineFields: {
    "form-1040.line.1a": 160368, // WagesAmt
    "form-1040.line.1z": 160368, // WagesSalariesAndTipsAmt
    "form-1040.line.2b": 333, // TaxableInterestAmt
    "form-1040.line.3a": 7, // QualifiedDividendsAmt
    "form-1040.line.3b": 7, // OrdinaryDividendsAmt
    "form-1040.line.7a": 18458, // CapitalGainLossAmt (Schedule D line 16)
    "form-1040.line.8": 2557, // TotalAdditionalIncomeAmt (Schedule 1 line 10)
    "form-1040.line.9": 181723, // TotalIncomeAmt
    "form-1040.line.10": 181, // TotalAdjustmentsAmt (Schedule 1 line 26)
    "form-1040.line.11a": 181542, // AdjustedGrossIncomeAmt
    "form-1040.line.11b": 181542,
    "form-1040.line.12e": 15750, // TotalItemizedOrStandardDedAmt (MFS standard deduction)
    "form-1040.line.13a": 475, // QualifiedBusinessIncomeDedAmt (Form 8995 line 15)
    "form-1040.line.14": 16225, // TotalDeductionsAmt
    "form-1040.line.15": 165317, // TaxableIncomeAmt
    "form-1040.line.16": 30861, // TaxAmt
    "form-1040.line.17": 6000, // AdditionalTaxAmt (Schedule 2 line 3)
    "form-1040.line.18": 36861, // TotalTaxBeforeCrAndOthTaxesAmt
    "form-1040.line.22": 36861, // TaxLessCreditsAmt
    "form-1040.line.23": 1397, // TotalOtherTaxesAmt (Schedule 2 line 21)
    "form-1040.line.24": 38258, // TotalTaxAmt
    "form-1040.line.25a": 29027, // FormW2WithheldTaxAmt
    "form-1040.line.25d": 29027, // WithholdingTaxAmt
    "form-1040.line.33": 29027, // TotalPaymentsAmt
    "form-1040.line.37": 9231, // OwedAmt
  },
  renderedChecked: [
    "form-1040.header.filing_status_mfs", // IndividualReturnFilingStatusCd 3
  ],
};

const SCHEDULE_1: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-1.0.line.3": 2557, // BusinessIncomeLossAmt
    "schedule-1.0.line.10": 2557, // TotalAdditionalIncomeAmt
    "schedule-1.1.line.15": 181, // DeductibleSelfEmploymentTaxAmt
    "schedule-1.1.line.26": 181, // TotalAdjustmentsAmt
  },
};

const SCHEDULE_2: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-2.0.line.1a_excess_aptc_repayment": 6000, // PremiumTaxCreditTaxLiabAmt (Form 8962 line 29)
    "schedule-2.0.line.1z_total_lines_1a_through_1y": 6000, // TotalTaxAdditionsAmt
    "schedule-2.0.line.3_total_lines_1z_and_2": 6000, // AdditionalTaxAmt
    "schedule-2.0.line.4_self_employment_tax": 361, // SelfEmploymentTaxAmt
    "schedule-2.0.line.11_additional_medicare_tax": 379, // TotalAMRRTTaxAmt
    "schedule-2.0.line.12_net_investment_income_tax": 657, // IndivNetInvstIncomeTaxAmt
    "schedule-2.1.line.21_total_other_taxes": 1397, // TotalOtherTaxesAmt
  },
};

/* Part V is the one other expense. */
const SCHEDULE_C: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-c.0.line.1": 3882, // TotalGrossReceiptsAmt
    "schedule-c.0.line.3": 3882, // NetGrossReceiptsAmt
    "schedule-c.0.line.5": 3882, // GrossProfitAmt
    "schedule-c.0.line.7": 3882, // GrossIncomeAmt
    "schedule-c.0.line.19": 100, // PensionProfitSharingPlansAmt
    "schedule-c.0.line.22": 250, // SuppliesAmt
    "schedule-c.0.line.27b": 975, // TotalOtherExpensesAmt (Part V)
    "schedule-c.0.line.28": 1325, // TotalExpensesAmt
    "schedule-c.0.line.29": 2557, // TentativeProfitOrLossAmt
    "schedule-c.0.line.31": 2557, // NetProfitOrLossAmt
    "schedule-c.1.line.48_amount_1": 975, // OtherExpenseDetail
    "schedule-c.1.line.48": 975, // TotalOtherExpensesAmt
  },
  renderedText: {
    "schedule-c.0.line.a_principal_business": "consultant",
    "schedule-c.0.line.b_business_code": "541219",
    "schedule-c.1.line.48_description_1": "OTHER EXPENSE",
  },
  renderedChecked: [
    "schedule-c.0.line.f_cash", // MethodOfAccountingCashInd
    "schedule-c.0.line.g_yes", // MaterialParticipationInCYInd
    "schedule-c.0.line.i_no", // PaymentRqrFilingForm1099Ind false
  ],
};

const FORM_8949: Partial<ExpectedResults> = {
  engineFields: {
    "form-8949.0.part1.row1_proceeds": 216, // ProceedsSalesPriceAmt (abc stock)
    "form-8949.0.part1.row1_cost_basis": 300, // CostOrOtherBasisAmt
    "form-8949.0.part1.row1_gain_loss": -84, // GainOrLossAmt
    "form-8949.0.part1.totals_proceeds": 216,
    "form-8949.0.part1.totals_cost_basis": 300,
    "form-8949.0.part1.totals_gain_loss": -84,
    "form-8949.1.part2.row1_proceeds": 71600, // ProceedsSalesPriceAmt (intuit stock)
    "form-8949.1.part2.row1_cost_basis": 44551, // CostOrOtherBasisAmt
    "form-8949.1.part2.row1_gain_loss": 27049, // GainOrLossAmt
    "form-8949.1.part2.totals_proceeds": 71600,
    "form-8949.1.part2.totals_cost_basis": 44551,
    "form-8949.1.part2.totals_gain_loss": 27049,
  },
  renderedChecked: [
    "form-8949.0.part1.box_a_short_term_basis_reported", // TransRptOn1099BThatShowBssInd
    "form-8949.1.part2.box_d_long_term_basis_reported",
  ],
};

const SCHEDULE_D: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-d.0.line.1b_proceeds": 216, // TotalSTCGL1099ShowsBasisGrp (box A)
    "schedule-d.0.line.1b_cost": 300,
    "schedule-d.0.line.1b_gain_loss": -84,
    "schedule-d.0.line.6_short_term_loss_carryover": 8507, // STCapitalLossCarryoverAmt
    "schedule-d.0.line.7_net_short_term_gain_loss": -8591, // NetSTCapitalGainOrLossAmt
    "schedule-d.0.line.8b_proceeds": 71600, // TotalLTCGL1099ShowsBasisGrp (box D)
    "schedule-d.0.line.8b_cost": 44551,
    "schedule-d.0.line.8b_gain_loss": 27049,
    "schedule-d.0.line.15_net_long_term_gain_loss": 27049, // NetLTCapitalGainOrLossAmt
    "schedule-d.1.line.16_combined_gain_loss": 18458, // NetSTAndLTCapitalGainOrLossAmt
  },
  renderedChecked: [
    "schedule-d.1.line.17_both_gains_yes", // STAndLTGainInd
    "schedule-d.1.line.20_use_qual_div_worksheet_yes", // ZeroOrBlankInd
  ],
};

const SCHEDULE_SE: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-se.0.line.2": 2557, // NetNonFarmProfitLossAmt
    "schedule-se.0.line.3": 2557, // SETotalNetEarningsOrLossAmt
    "schedule-se.0.line.4a": 2361, // MinimumProfitForSETaxAmt
    "schedule-se.0.line.4c": 2361, // CombinedSEAmt
    "schedule-se.0.line.6": 2361, // CombinedSEAndChurchWagesAmt
    "schedule-se.0.line.8a": 164772, // SSTWagesRRTCompAmt
    "schedule-se.0.line.8d": 164772, // TotalWagesAndUnreportedTipsAmt
    "schedule-se.0.line.9": 11328, // AllowableSEAmt
    "schedule-se.0.line.10": 293, // TaxBaseAmt
    "schedule-se.0.line.11": 68, // SEBaseAmt
    "schedule-se.0.line.12": 361, // SelfEmploymentTaxAmt
    "schedule-se.0.line.13": 181, // DeductibleSelfEmploymentTaxAmt
  },
};

const FORM_8959: Partial<ExpectedResults> = {
  engineFields: {
    "form-8959.0.line.1_medicare_wages_tips": 164772, // TotalW2MedicareWagesAndTipsAmt
    "form-8959.0.line.4_total_medicare_wages": 164772, // TotalMedicareWagesAndTipsAmt
    "form-8959.0.line.5_filing_status_threshold_wages": 125000, // FilingStatusThresholdCd
    "form-8959.0.line.6_excess_medicare_wages": 39772, // WagesTipsSubjToAddlMedcrTaxAmt
    "form-8959.0.line.7_additional_medicare_tax_wages": 358, // AdditionalMedicareTaxAmt
    "form-8959.0.line.8_self_employment_income": 2361, // TotalSelfEmploymentIncomeAmt
    "form-8959.0.line.12_excess_se_income": 2361, // SEIncomeSubjToAddSETaxAmt
    "form-8959.0.line.13_additional_medicare_tax_se": 21, // AddlSelfEmploymentTaxAmt
    "form-8959.0.line.18_total_additional_medicare_tax": 379, // TotalAMRRTTaxAmt
    "form-8959.0.line.19_medicare_tax_withheld": 2389, // TotalW2MedicareTaxWithheldAmt
    "form-8959.0.line.21_regular_medicare_tax_on_wages": 2389, // TotalMedicareTaxAmt
  },
};

const FORM_8960: Partial<ExpectedResults> = {
  engineFields: {
    "form-8960.0.line.1": 333, // TaxableInterestAmt
    "form-8960.0.line.2": 7, // OrdinaryDividendsAmt
    "form-8960.0.line.4a": 2557, // NetRentalIncomeOrLossAmt (Schedule C, nonpassive)
    "form-8960.0.line.4b": -2557, // AdjNetIncmOrLossNonSect1411Amt
    "form-8960.0.line.5a": 18458, // PropertyDisposGainOrLossAmt
    "form-8960.0.line.5d": 18458, // GainOrLossFromDisposAmt
    "form-8960.0.line.8": 18798, // TotalIncomeAmt
    "form-8960.0.line.10": 1500, // AdditionalModificationAmt
    "form-8960.0.line.11": 1500, // TotalDeductionModificationAmt
    "form-8960.0.line.12": 17298, // NetInvestmentIncomeAmt
    "form-8960.0.line.13": 181542, // ModifiedAGIAmt
    "form-8960.0.line.14": 125000, // FilingThresholdAmt
    "form-8960.0.line.15": 56542, // MAGILessThresholdAmt
    "form-8960.0.line.16": 17298, // SmllrIncmOrMAGILessThrshldAmt
    "form-8960.0.line.17": 657, // IndivNetInvstIncomeTaxAmt
  },
};

/* One business on line 1i; QBI is Schedule C line 31 less the deductible part of SE tax. */
const FORM_8995: Partial<ExpectedResults> = {
  engineFields: {
    "form-8995.0.line.1i_c": 2376, // QlfyBusinessIncomeOrLossAmt (2,557 − 181)
    "form-8995.0.line.2": 2376, // TotQlfyBusinessIncomeOrLossAmt
    "form-8995.0.line.4": 2376, // TotQualifiedBusinessIncomeAmt
    "form-8995.0.line.5": 475, // QBIComponentAmt
    "form-8995.0.line.10": 475, // QBIDedBfrIncomeLimitationAmt
    "form-8995.0.line.11": 165792, // TaxableIncomeBeforeQBIDedAmt
    "form-8995.0.line.12": 18465, // NetCapitalGainAmt (qualified dividends 7 + 18,458)
    "form-8995.0.line.13": 147327, // AdjustedTaxableIncomeAmt
    "form-8995.0.line.14": 29465, // IncomeLimitationAmt
    "form-8995.0.line.15": 475, // QualifiedBusinessIncomeDedAmt
  },
};

/*
 * MFS with no exception: not an applicable taxpayer. Lines 1–5, then only column (f)
 * of line 11; line 24 is 0 and the whole advance payment is repaid (line 5 is over 400,
 * so line 28 is blank). Line 4 is a known mismatch (README).
 */
const FORM_8962: Partial<ExpectedResults> = {
  engineFields: {
    "form-8962.0.line.1_tax_family_size": 1, // TotalExemptionsCnt
    "form-8962.0.line.2a_modified_agi": 181542, // ModifiedAGIAmt
    "form-8962.0.line.3_household_income": 181542, // HouseholdIncomeAmt
    "form-8962.0.line.4_federal_poverty_line": 14580, // PovertyLevelAmt (known mismatch: 15,060)
    "form-8962.0.line.5_household_income_percent_fpl": 401, // FederalPovertyLevelPct
    "form-8962.0.line.11_col_f": 6000, // AnnualAdvancedPTCAmt
    "form-8962.0.line.25_advance_payment_ptc": 6000, // TotalAdvancedPTCAmt
    "form-8962.0.line.27_excess_advance_ptc": 6000, // ExcessAdvncPaymentAmt
    "form-8962.0.line.29_excess_advance_ptc_repayment": 6000, // PremiumTaxCreditTaxLiabAmt
  },
  renderedChecked: [
    "form-8962.0.line.4_other_48_states_dc", // FederalPovertyTableLocCd C
    "form-8962.0.line.9_allocate_or_alt_calc_no", // SharePolicyMarriedAltCalcInd false
    "form-8962.0.line.10_use_annual_calc_yes", // FullYrCoverage1095AInd true
  ],
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-1040": FORM_1040,
  "schedule-1": SCHEDULE_1,
  "schedule-2": SCHEDULE_2,
  "schedule-c": SCHEDULE_C,
  "schedule-d": SCHEDULE_D,
  "schedule-se": SCHEDULE_SE,
  "form-8949": FORM_8949,
  "form-8959": FORM_8959,
  "form-8960": FORM_8960,
  "form-8995": FORM_8995,
  "form-8962": FORM_8962,
};

export function tcbUs007Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
