/*
 * tcb-us-006 — the TaxCalcBench answer key (output.xml, ty25-us-006), typed line by
 * line. The key is Column Tax's engine output, reviewed by their tax analysts.
 * Change a value only when the IRS instructions say the key is wrong (README.md).
 */

import type { ExpectedResults } from "../../types.js";

const FORM_1040: Partial<ExpectedResults> = {
  engineFields: {
    "form-1040.line.1a": 80000, // WagesAmt
    "form-1040.line.1z": 80000, // WagesSalariesAndTipsAmt
    "form-1040.line.2b": 15000, // TaxableInterestAmt
    "form-1040.line.3a": 12000, // QualifiedDividendsAmt
    "form-1040.line.3b": 12000, // OrdinaryDividendsAmt
    "form-1040.line.8": 150000, // TotalAdditionalIncomeAmt (Schedule 1 line 10)
    "form-1040.line.9": 257000, // TotalIncomeAmt
    "form-1040.line.10": 7065, // TotalAdjustmentsAmt (Schedule 1 line 26)
    "form-1040.line.11a": 249935, // AdjustedGrossIncomeAmt
    "form-1040.line.11b": 249935,
    "form-1040.line.12e": 15750, // TotalItemizedOrStandardDedAmt
    "form-1040.line.13a": 4875, // QualifiedBusinessIncomeDedAmt
    "form-1040.line.14": 20625, // TotalDeductionsAmt
    "form-1040.line.15": 229310, // TaxableIncomeAmt
    "form-1040.line.16": 48402, // TaxAmt
    "form-1040.line.18": 48402, // TotalTaxBeforeCrAndOthTaxesAmt
    "form-1040.line.22": 48402, // TaxLessCreditsAmt
    "form-1040.line.23": 15581, // TotalOtherTaxesAmt (Schedule 2 line 21)
    "form-1040.line.24": 63983, // TotalTaxAmt
    "form-1040.line.25a": 2000, // FormW2WithheldTaxAmt
    "form-1040.line.25d": 2000, // WithholdingTaxAmt
    "form-1040.line.33": 2000, // TotalPaymentsAmt
    "form-1040.line.37": 61983, // OwedAmt
  },
};

const SCHEDULE_1: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-1.0.line.3": 100000, // BusinessIncomeLossAmt
    "schedule-1.0.line.8b": 50000, // GamblingReportableWinningAmt
    "schedule-1.0.line.9": 50000, // TotalOtherIncomeAmt
    "schedule-1.0.line.10": 150000, // TotalAdditionalIncomeAmt
    "schedule-1.1.line.15": 7065, // DeductibleSelfEmploymentTaxAmt
    "schedule-1.1.line.26": 7065, // TotalAdjustmentsAmt
  },
};

const SCHEDULE_2: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-2.0.line.4_self_employment_tax": 14129, // SelfEmploymentTaxAmt
    "schedule-2.0.line.11_additional_medicare_tax": 426, // TotalAMRRTTaxAmt
    "schedule-2.0.line.12_net_investment_income_tax": 1026, // IndivNetInvstIncomeTaxAmt
    "schedule-2.1.line.21_total_other_taxes": 15581, // TotalOtherTaxesAmt
  },
};

const SCHEDULE_B: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-b.0.line.1_amount_1": 15000, // Azure & Co
    "schedule-b.0.line.2_total_interest": 15000, // InterestSubtotalAmt
    "schedule-b.0.line.4_taxable_interest": 15000, // TaxableInterestSubtotalAmt
    "schedule-b.0.line.5_amount_1": 12000, // Azure & Co
    "schedule-b.0.line.6_total_ordinary_dividends": 12000, // TotalOrdinaryDividendsAmt
  },
  renderedText: {
    "schedule-b.0.line.1_payer_name_1": "Azure & Co",
    "schedule-b.0.line.5_payer_name_1": "Azure & Co",
  },
};

/* Self-only HDHP coverage for 6 months; the only contribution is the employer's (W-2 code W). */
const FORM_8889: Partial<ExpectedResults> = {
  engineFields: {
    "form-8889.0.line.3_annual_hsa_contribution_limit": 2150, // HSALimitedAnnualDeductibleAmt
    "form-8889.0.line.5_subtract_line4_from_line3": 2150, // HSALimitedDeductibleAllwdAmt
    "form-8889.0.line.6_adjusted_limit_separate_hsa": 2150, // HSAFamilyDeductibleAmt
    "form-8889.0.line.8_add_lines_6_and_7": 2150, // HSALimitedGrossContributionAmt
    "form-8889.0.line.9_employer_contributions": 2000, // HSAEmployerContributionAmt
    "form-8889.0.line.11_add_lines_9_and_10": 2000, // TotalHSAContributionAmt
    "form-8889.0.line.12_subtract_line11_from_line8": 150, // HSALimitedContributionAmt
  },
  renderedChecked: ["form-8889.0.line.1_self_only_coverage"],
};

const FORM_8959: Partial<ExpectedResults> = {
  engineFields: {
    "form-8959.0.line.1_medicare_wages_tips": 80000,
    "form-8959.0.line.4_total_medicare_wages": 80000,
    "form-8959.0.line.5_filing_status_threshold_wages": 125000,
    "form-8959.0.line.6_excess_medicare_wages": 0,
    "form-8959.0.line.7_additional_medicare_tax_wages": 0,
    "form-8959.0.line.8_self_employment_income": 92350,
    "form-8959.0.line.9_filing_status_threshold_se": 125000,
    "form-8959.0.line.11_threshold_reduced_by_wages": 45000,
    "form-8959.0.line.12_excess_se_income": 47350,
    "form-8959.0.line.13_additional_medicare_tax_se": 426,
    "form-8959.0.line.18_total_additional_medicare_tax": 426,
    "form-8959.0.line.19_medicare_tax_withheld": 200,
    "form-8959.0.line.20_medicare_wages_from_line1": 80000,
    "form-8959.0.line.21_regular_medicare_tax_on_wages": 1160,
  },
};

const FORM_8960: Partial<ExpectedResults> = {
  engineFields: {
    "form-8960.0.line.1": 15000, // TaxableInterestAmt
    "form-8960.0.line.2": 12000, // OrdinaryDividendsAmt
    "form-8960.0.line.4a": 100000, // NetRentalIncomeOrLossAmt
    "form-8960.0.line.4b": -100000, // AdjNetIncmOrLossNonSect1411Amt
    "form-8960.0.line.8": 27000, // TotalIncomeAmt
    "form-8960.0.line.12": 27000, // NetInvestmentIncomeAmt
    "form-8960.0.line.13": 249935, // ModifiedAGIAmt
    "form-8960.0.line.14": 125000, // FilingThresholdAmt
    "form-8960.0.line.15": 124935, // MAGILessThresholdAmt
    "form-8960.0.line.16": 27000, // SmllrIncmOrMAGILessThrshldAmt
    "form-8960.0.line.17": 1026, // IndivNetInvstIncomeTaxAmt
  },
};

/* One business (column A), no W-2 wages or property, in the phase-in range (Part III). */
const FORM_8995A: Partial<ExpectedResults> = {
  engineFields: {
    "form-8995-a.0.line.2_a": 92935, // QualifiedBusinessIncomeAmt
    "form-8995-a.0.line.3_a": 18587, // QlfyBusinessIncome20PctAmt
    "form-8995-a.0.line.13_a": 4875, // QBIDedBeforePatronReductionAmt
    "form-8995-a.0.line.15_a": 4875, // QBIComponentAmt
    "form-8995-a.0.line.16": 4875, // TotalQBIComponentAmt
    "form-8995-a.1.line.19_a": 18587, // QBI20PctLessGrtrAllcblShareAmt
    "form-8995-a.1.line.20": 234185, // TaxableIncomeBeforeQBIDedAmt
    "form-8995-a.1.line.21": 197300, // FilingStatusThresholdCd
    "form-8995-a.1.line.22": 36885, // TXIBfrQBIDedLessThresholdAmt
    "form-8995-a.1.line.23": 50000, // FilingStatusPhaseInRangeCd
    "form-8995-a.1.line.25_a": 13712, // TotalPhaseInReductionAmt
    "form-8995-a.1.line.26_a": 4875, // QBIAfterPhaseInReductionAmt
    "form-8995-a.1.line.27": 4875, // TotalQBIComponentAmt
    "form-8995-a.1.line.32": 4875, // QBIDedBfrIncomeLimitationAmt
    "form-8995-a.1.line.33": 234185, // TaxableIncomeBeforeQBIDedAmt
    "form-8995-a.1.line.34": 12000, // NetCapitalGainAmt
    "form-8995-a.1.line.35": 222185, // AdjustedTaxableIncomeAmt
    "form-8995-a.1.line.36": 44437, // IncomeLimitationAmt
    "form-8995-a.1.line.37": 4875, // QBIDedBeforeDPADSect199AgAmt
    "form-8995-a.1.line.39": 4875, // QualifiedBusinessIncomeDedAmt
  },
  renderedText: {
    "form-8995-a.0.part1.business_a_name": "Rideshare",
  },
};

/* No expenses: the key leaves line 28 blank. */
const SCHEDULE_C: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-c.0.line.1": 100000, // TotalGrossReceiptsAmt
    "schedule-c.0.line.3": 100000, // NetGrossReceiptsAmt
    "schedule-c.0.line.5": 100000, // GrossProfitAmt
    "schedule-c.0.line.7": 100000, // GrossIncomeAmt
    "schedule-c.0.line.29": 100000, // TentativeProfitOrLossAmt
    "schedule-c.0.line.31": 100000, // NetProfitOrLossAmt
  },
  renderedText: {
    "schedule-c.0.header.name": "Haizen Rath",
    "schedule-c.0.line.a_principal_business": "Rideshare",
    "schedule-c.0.line.b_business_code": "721310",
    "schedule-c.0.line.c_business_name": "Rideshare",
    "schedule-c.0.line.e_business_address": "20100 S western ave",
  },
  renderedChecked: [
    "schedule-c.0.line.f_cash",
    "schedule-c.0.line.g_yes",
    "schedule-c.0.line.i_no",
  ],
};

const SCHEDULE_SE: Partial<ExpectedResults> = {
  engineFields: {
    "schedule-se.0.line.2": 100000, // NetNonFarmProfitLossAmt
    "schedule-se.0.line.3": 100000, // SETotalNetEarningsOrLossAmt
    "schedule-se.0.line.4a": 92350, // MinimumProfitForSETaxAmt
    "schedule-se.0.line.4c": 92350, // CombinedSEAmt
    "schedule-se.0.line.6": 92350, // CombinedSEAndChurchWagesAmt
    "schedule-se.0.line.8a": 80000, // SSTWagesRRTCompAmt
    "schedule-se.0.line.8d": 80000, // TotalWagesAndUnreportedTipsAmt
    "schedule-se.0.line.9": 96100, // AllowableSEAmt
    "schedule-se.0.line.10": 11451, // TaxBaseAmt
    "schedule-se.0.line.11": 2678, // SEBaseAmt
    "schedule-se.0.line.12": 14129, // SelfEmploymentTaxAmt
    "schedule-se.0.line.13": 7065, // DeductibleSelfEmploymentTaxAmt
  },
  renderedText: { "schedule-se.0.header.name": "Haizen Rath" },
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "schedule-c": SCHEDULE_C,
  "schedule-se": SCHEDULE_SE,
  "form-1040": FORM_1040,
  "schedule-1": SCHEDULE_1,
  "schedule-2": SCHEDULE_2,
  "schedule-b": SCHEDULE_B,
  "form-8889": FORM_8889,
  "form-8959": FORM_8959,
  "form-8960": FORM_8960,
  "form-8995-a": FORM_8995A,
};

export function tcbUs006Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
