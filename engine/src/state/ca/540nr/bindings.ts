/*
 * Form 540NR: one entry per field, in the order of the paper form. Each
 * line's method lives in the file for its section of the form; a line that
 * Form 540 figures the same way is Form 540's method (fromForm540.ts).
 */

import { defineForm } from "../../../defineForm.js";
import { SSN } from "../../../values.js";
import {
  line50ChildDependentCareCredit,
  line58CreditAmount,
  line58CreditCode,
  line58CreditName,
  line59CreditAmount,
  line59CreditCode,
  line59CreditName,
  line60SchedulePCredits,
  line62TotalCredits,
  line63TaxAfterCredits,
} from "./credits.js";
import type { Form540NRFilingInfo } from "./filingInfo.js";
import * as header from "./header.js";
import {
  line71AlternativeMinimumTax,
  line72BehavioralHealthServicesTax,
  line73OtherTaxes,
  line74TotalTax,
} from "./otherTaxes.js";
import {
  line81CaIncomeTaxWithheld,
  line82CaEstimatedTaxPayments,
  line85Eitc,
  line86YoungChildTaxCredit,
  line87FosterYouthTaxCredit,
  line88TotalPayments,
} from "./payments.js";
import * as refund from "./refundOrAmountDue.js";
import * as tax from "./tax.js";
import * as taxableIncome from "./taxableIncome.js";
import type { Form540NR } from "./types.js";
import { FORM_540NR_UNSUPPORTED } from "./unsupported.js";

const formatSsn = (value: unknown) => SSN.format(value as Parameters<typeof SSN.format>[0]);

export function register(): void {
  defineForm<Form540NR, Form540NRFilingInfo>("form-540nr", {
    bindings: {
      // Header, filing status (lines 1 to 5) and exemptions (lines 7 to 11): header.ts.
      "0.header.first_name": header.headerFirstName,
      "0.header.middle_initial": header.headerMiddleInitial,
      "0.header.last_name": header.headerLastName,
      "0.header.ssn": header.headerSsn,
      "0.header.spouse_first_name": header.headerSpouseFirstName,
      "0.header.spouse_middle_initial": header.headerSpouseMiddleInitial,
      "0.header.spouse_last_name": header.headerSpouseLastName,
      "0.header.spouse_ssn": header.headerSpouseSsn,
      "0.header.home_address": header.headerHomeAddress,
      "0.header.apartment": header.headerApartment,
      "0.header.city": header.headerCity,
      "0.header.state": header.headerState,
      "0.header.zip": header.headerZip,
      "0.header.date_of_birth": header.headerDateOfBirth,
      "0.header.spouse_date_of_birth": header.headerSpouseDateOfBirth,
      "0.header.filing_status": header.headerFilingStatus,
      "0.header.spouse_rdp_year_of_death": header.line5SpouseRdpYearOfDeath,
      "0.header.mfs_spouse_rdp_full_name": header.line3MfsSpouseRdpName,
      "0.line.7_personal_exemption_count": header.line7PersonalExemptionCount,
      "0.line.7_personal_exemption_amount": header.line7PersonalExemptionAmount,
      "0.line.8_blind_exemption_count": header.line8BlindExemptionCount,
      "0.line.8_blind_exemption_amount": header.line8BlindExemptionAmount,
      "0.line.9_senior_exemption_count": header.line9SeniorExemptionCount,
      "0.line.9_senior_exemption_amount": header.line9SeniorExemptionAmount,
      "0.line.10_dependent_1_first_name": header.line10DependentFirstName(1),
      "0.line.10_dependent_2_first_name": header.line10DependentFirstName(2),
      "0.line.10_dependent_3_first_name": header.line10DependentFirstName(3),
      "0.line.10_dependent_1_last_name": header.line10DependentLastName(1),
      "0.line.10_dependent_2_last_name": header.line10DependentLastName(2),
      "0.line.10_dependent_3_last_name": header.line10DependentLastName(3),
      "0.line.10_dependent_1_ssn": header.line10DependentSsn(1),
      "0.line.10_dependent_2_ssn": header.line10DependentSsn(2),
      "0.line.10_dependent_3_ssn": header.line10DependentSsn(3),
      "0.line.10_dependent_1_relationship": header.line10DependentRelationship(1),
      "0.line.10_dependent_2_relationship": header.line10DependentRelationship(2),
      "0.line.10_dependent_3_relationship": header.line10DependentRelationship(3),
      "0.line.10_dependent_exemption_count": header.line10DependentExemptionCount,
      "0.line.10_dependent_exemption_amount": header.line10DependentExemptionAmount,
      "1.header.taxpayer_name": header.page2TaxpayerName,
      "1.header.taxpayer_ssn": header.page2TaxpayerSsn,
      "1.line.11_total_exemption_amount": header.line11TotalExemptionAmount,

      // Total taxable income, lines 12 to 19 (taxableIncome.ts; Form 540's lines 13 to 17 and 19).
      "1.line.12_state_wages": taxableIncome.line12StateWages,
      "1.line.13_federal_agi": taxableIncome.line13FederalAgi,
      "1.line.14_ca_adjustments_subtractions": taxableIncome.line14CaAdjustmentsSubtractions,
      "1.line.15_agi_before_additions": taxableIncome.line15AgiBeforeAdditions,
      "1.line.16_ca_adjustments_additions": taxableIncome.line16CaAdjustmentsAdditions,
      "1.line.17_agi_all_sources": taxableIncome.line17AgiAllSources,
      "1.line.18_deductions": taxableIncome.line18Deductions,
      "1.line.19_total_taxable_income": taxableIncome.line19TotalTaxableIncome,

      // California taxable income and tax, lines 31 to 42 (tax.ts).
      "1.line.31_tax_from_tax_table": tax.line31TaxFromTaxTable,
      "1.line.31_tax_from_rate_schedule": tax.line31TaxFromRateSchedule,
      "1.line.31_tax_from_ftb_3800": tax.line31TaxFromFtb3800,
      "1.line.31_tax_from_ftb_3803": tax.line31TaxFromFtb3803,
      "1.line.31_tax_amount": tax.line31TaxAmount,
      "1.line.32_ca_agi": tax.line32CaAgi,
      "1.line.35_ca_taxable_income": tax.line35CaTaxableIncome,
      "1.line.36_ca_tax_rate_whole_digit": tax.line36RateWholeDigit,
      "1.line.36_ca_tax_rate_decimal_digits": tax.line36RateDecimalDigits,
      "1.line.37_ca_tax_before_exemption_credits": tax.line37TaxBeforeExemptionCredits,
      "1.line.38_exemption_credit_percentage_whole_digit": tax.line38PercentageWholeDigit,
      "1.line.38_exemption_credit_percentage_decimal_digits": tax.line38PercentageDecimalDigits,
      "1.line.39_ca_prorated_exemption_credits": tax.line39ProratedExemptionCredits,
      "1.line.40_ca_regular_tax_before_credits": tax.line40RegularTaxBeforeCredits,
      "1.line.41_tax_from_schedule_g1": tax.line41TaxFromScheduleG1,
      "1.line.41_tax_from_ftb_5870a": tax.line41TaxFromFtb5870A,
      "1.line.41_tax_amount": tax.line41TaxAmount,
      "1.line.42_tax_before_special_credits": tax.line42TaxBeforeSpecialCredits,

      // Special credits, lines 50 to 63 (credits.ts).
      "1.line.50_child_dependent_care_credit": line50ChildDependentCareCredit,
      "2.line.58_credit_name": line58CreditName,
      "2.line.58_credit_code": line58CreditCode,
      "2.line.58_credit_amount": line58CreditAmount,
      "2.line.59_credit_name": line59CreditName,
      "2.line.59_credit_code": line59CreditCode,
      "2.line.59_credit_amount": line59CreditAmount,
      "2.line.60_schedule_p_credits": line60SchedulePCredits,
      "2.line.62_total_credits": line62TotalCredits,
      "2.line.63_tax_after_credits": line63TaxAfterCredits,

      // Other taxes, lines 71 to 74 (otherTaxes.ts).
      "2.line.71_alternative_minimum_tax": line71AlternativeMinimumTax,
      "2.line.72_behavioral_health_services_tax": line72BehavioralHealthServicesTax,
      "2.line.73_other_taxes_credit_recapture": line73OtherTaxes,
      "2.line.74_total_tax": line74TotalTax,

      // Payments, lines 81 to 88 (payments.ts).
      "2.line.81_ca_income_tax_withheld": line81CaIncomeTaxWithheld,
      "2.line.82_ca_estimated_tax_payments": line82CaEstimatedTaxPayments,
      "2.line.85_eitc": line85Eitc,
      "2.line.86_young_child_tax_credit": line86YoungChildTaxCredit,
      "2.line.87_foster_youth_tax_credit": line87FosterYouthTaxCredit,
      "2.line.88_total_payments": line88TotalPayments,

      // Health coverage, overpaid tax or tax due, amount you owe, refund: lines 91 to 125 (refundOrAmountDue.ts).
      "2.line.91_full_year_health_coverage": refund.line91FullYearHealthCoverage,
      "2.line.91_isr_penalty": refund.line91IsrPenalty,
      "2.line.92_payments_after_isr_penalty": refund.line92PaymentsAfterIsrPenalty,
      "2.line.93_isr_penalty_balance": refund.line93IsrPenaltyBalance,
      "2.line.101_overpaid_tax": refund.line101OverpaidTax,
      "2.line.103_overpaid_tax_available": refund.line103OverpaidTaxAvailable,
      "3.line.104_tax_due": refund.line104TaxDue,
      "4.line.121_amount_you_owe": refund.line121AmountYouOwe,
      "4.line.123_ftb_5805_attached": refund.line123Ftb5805Attached,
      "4.line.123_ftb_5805f_attached": refund.line123Ftb5805FAttached,
      "4.line.123_underpayment_estimated_tax": refund.line123UnderpaymentEstimatedTax,
      "4.line.124_total_amount_due": refund.line124TotalAmountDue,
      "4.line.125_refund_or_no_amount_due": refund.line125RefundOrNoAmountDue,

      // Signing (header.ts).
      "5.signing.taxpayer_email": header.signingTaxpayerEmail,
      "5.signing.taxpayer_phone": header.signingTaxpayerPhone,
    },

    // As on Form 540: the SSNs print dashed.
    formatters: {
      "1.header.taxpayer_ssn": formatSsn,
      "0.line.10_dependent_1_ssn": formatSsn,
      "0.line.10_dependent_2_ssn": formatSsn,
      "0.line.10_dependent_3_ssn": formatSsn,
    },

    unsupported: FORM_540NR_UNSUPPORTED,
  });
}
