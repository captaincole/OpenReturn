/*
 * tcb-ca-006 — the TaxCalcBench answer key (output.xml, ty25-ca-006), typed line by
 * line. The key is the California return (Form 540); the federal Form 1040 is an
 * input, not checked. Change a value only when the FTB instructions say the key is
 * wrong (README.md).
 */

import type { ExpectedResults } from "../../types.js";

const FORM_540: Partial<ExpectedResults> = {
  engineFields: {
    "form-540.line.7_personal_exemption_count": 2, // Exemptions/Personal/Count
    "form-540.line.7_personal_exemption_amount": 306, // Exemptions/Personal/Amount
    "form-540.line.11_total_exemption_amount": 306, // TotalExemptionAmt
    "form-540.line.12_state_wages": 98100, // StateWages
    "form-540.line.13_federal_agi": 98100, // FederalAGI
    "form-540.line.15_ca_agi_before_additions": 98100, // SubtotalAfterCASubtractions
    "form-540.line.17_ca_agi": 98100, // CAAGI
    "form-540.line.18_deductions": 11412, // CADeductions (standard deduction)
    "form-540.line.19_taxable_income": 86688, // CATaxableIncome
    "form-540.line.31_tax_amount": 2272, // StateIncomeTax (Tax Table)
    "form-540.line.32_exemption_credits": 306, // ExemptionCredits
    "form-540.line.33_tax_after_exemption_credits": 1966, // TaxAfterExemptions
    "form-540.line.35_total_tax_after_credits": 1966, // Tax/TotalTax
    "form-540.line.48_tax_after_credits": 1966, // SpecialCredits/TotalTaxAfterCredits
    "form-540.line.64_total_tax": 1966, // OtherTaxes/TotalTax
    "form-540.line.71_ca_income_tax_withheld": 4260, // CAWithholding
    "form-540.line.78_total_payments": 4260, // TotalPayments
    "form-540.line.91_use_tax": 12, // UseTax
    "form-540.line.93_payments_balance": 4248, // PaymentsBalance
    "form-540.line.95_payments_after_isr_penalty": 4248, // PaymentsAfterISRPenalty
    "form-540.line.97_overpaid_tax": 2282, // OverpaidTax
    "form-540.line.99_overpaid_tax_available": 2282, // OverpaidTaxAvailable
    "form-540.line.115_refund_or_no_amount_due": 2282, // Refund
  },
  /* The key omits these: the use tax is less than the payments, and the return gets a refund. */
  renderedBlank: [
    "form-540.line.91_no_use_tax_owed", // no NoUseTaxOwed box: line 91 has an amount
    "form-540.line.94_use_tax_balance", // line 91 is not more than line 78
    "form-540.line.100_tax_due",
    "form-540.line.111_amount_you_owe",
  ],
  renderedChecked: [
    "form-540.header.filing_status", // FilerStatus MarriedOrRDPFilingJointly (single-select)
    "form-540.header.mailing_same_as_residence", // PrincipalResidence/SameAddress X
    "form-540.line.31_tax_from_tax_table", // ComputationMethod Tax Table
    "form-540.line.92_full_year_health_coverage", // FullYearHealthCareCoverage X
  ],
  renderedText: {
    "form-540.header.first_name": "Jimmy", // Filer/Primary/FirstName
    "form-540.header.middle_initial": "T", // Filer/Primary/MiddleInitial
    "form-540.header.last_name": "Jones", // Filer/Primary/LastName
    "form-540.header.ssn": "900456789", // Filer/Primary/SSN
    "form-540.header.date_of_birth": "02/01/1992", // Filer/Primary/DateOfBirth
    "form-540.header.spouse_first_name": "Debbie", // Filer/SpouseRDP/FirstName
    "form-540.header.spouse_last_name": "Jones", // Filer/SpouseRDP/LastName
    "form-540.header.spouse_ssn": "900456789", // Filer/SpouseRDP/SSN
    "form-540.header.home_address": "389 Davant Street", // Filer/USAddress/StreetAddress
    "form-540.header.apartment": "10B", // Filer/USAddress/AptNumber
    "form-540.header.city": "Cape Canaveral", // Filer/USAddress/City
    "form-540.header.state": "CA", // Filer/USAddress/State
    "form-540.header.zip": "94117", // Filer/USAddress/ZIPCode
    "form-540.header.county_at_filing": "Sacramento", // PrincipalResidence/CountyInCalifornia
  },
};

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-540": FORM_540,
};

export function tcbCa006Expected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
