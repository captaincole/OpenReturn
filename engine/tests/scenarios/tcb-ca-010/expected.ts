/*
 * tcb-ca-010 — the TaxCalcBench answer key (output.xml, ty25-ca-010), typed line by
 * line. The key is the California return (Form 540 and FTB 3514); Form 1040 is
 * an input, not checked. Change a value only when the FTB instructions say the
 * key is wrong (README.md).
 */

import type { ExpectedResults } from "../../types.js";

const FORM_540: Partial<ExpectedResults> = {
  engineFields: {
    "form-540.line.7_personal_exemption_count": 1, // Exemptions/Personal/Count
    "form-540.line.7_personal_exemption_amount": 153, // Exemptions/Personal/Amount
    "form-540.line.11_total_exemption_amount": 153, // TotalExemptionAmt
    "form-540.line.12_state_wages": 13000, // StateWages
    "form-540.line.13_federal_agi": 13000, // FederalAGI
    "form-540.line.15_ca_agi_before_additions": 13000, // SubtotalAfterCASubtractions
    "form-540.line.17_ca_agi": 13000, // CAAGI
    "form-540.line.18_deductions": 5706, // CADeductions
    "form-540.line.19_taxable_income": 7294, // CATaxableIncome
    "form-540.line.31_tax_amount": 73, // StateIncomeTax (Tax Table)
    "form-540.line.32_exemption_credits": 153, // ExemptionCredits
    "form-540.line.75_eitc": 183, // Payments/EarnedIncomeTaxCredit
    "form-540.line.78_total_payments": 183, // Payments/TotalPayments
    "form-540.line.91_use_tax": 0, // UseTax
    "form-540.line.93_payments_balance": 183, // PaymentsBalance
    "form-540.line.95_payments_after_isr_penalty": 183, // PaymentsAfterISRPenalty
    "form-540.line.97_overpaid_tax": 183, // OverpaidTax
    "form-540.line.99_overpaid_tax_available": 183, // OverpaidTaxAvailable
    "form-540.line.115_refund_or_no_amount_due": 183, // Refund
  },
  renderedChecked: [
    "form-540.header.filing_status", // FilerStatus Single (single-select)
    "form-540.header.mailing_same_as_residence", // PrincipalResidence/SameAddress X
    "form-540.line.31_tax_from_tax_table", // ComputationMethod Tax Table
    "form-540.line.91_no_use_tax_owed", // NoUseTaxOwed X
    "form-540.line.92_full_year_health_coverage", // FullYearHealthCareCoverage X
  ],
  renderedText: {
    "form-540.header.first_name": "CA",
    "form-540.header.last_name": "TEST",
    "form-540.header.county_at_filing": "Lake",
  },
};

const FORM_3514: Partial<ExpectedResults> = {
  engineFields: {
    "form-3514.0.line.2_federal_agi": 13000, // QualifyingInformation/FederalAGI
    "form-3514.1.line.13_ca_wages": 13000, // CaliforniaEarnedIncome/StateWages
    "form-3514.1.line.16_wages_less_lines_14_15": 13000, // NetCAEarnedIncome
    "form-3514.1.line.19_ca_earned_income": 13000, // CAEarnedIncome
    "form-3514.1.line.20_ca_eitc": 183, // EarnedIncomeTaxCredit
  },
  renderedChecked: [
    "form-3514.0.line.1a_irs_disallowed_federal_eic", // PreviouslyDisallowedFederalEIC false (No)
    "form-3514.0.line.1b_ftb_disallowed_ca_eitc", // PreviouslyDisallowedCAEIC false (No)
  ],
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-540": FORM_540,
  "form-3514": FORM_3514,
};

export function tcbCa010Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
