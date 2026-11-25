/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

/*
 * Form 540: one entry per field, in the order of the paper form. Each line's
 * method lives in the file for its section of the form.
 */

import { defineForm } from "../../../defineForm.js";
import { SSN } from "../../../values.js";
import {
  line40ChildDependentCareCredit,
  line43CreditAmount,
  line43CreditCode,
  line43CreditName,
  line47TotalCredits,
  line48TaxAfterCredits,
} from "./credits.js";
import {
  line10DependentExemptionAmount,
  line10DependentExemptionCount,
  line10DependentFirstName,
  line10DependentLastName,
  line10DependentRelationship,
  line10DependentSsn,
  line11TotalExemptionAmount,
  line7PersonalExemptionAmount,
  line7PersonalExemptionCount,
  line8BlindExemptionAmount,
  line8BlindExemptionCount,
  line9SeniorExemptionAmount,
  line9SeniorExemptionCount,
} from "./exemptions.js";
import type { Form540FilingInfo } from "./filingInfo.js";
import {
  headerApartment,
  headerCity,
  headerCountyAtFiling,
  headerDateOfBirth,
  headerFilingStatus,
  headerFirstName,
  headerHomeAddress,
  headerLastName,
  headerMailingSameAsResidence,
  headerMiddleInitial,
  headerResidenceApartment,
  headerResidenceCity,
  headerResidenceState,
  headerResidenceZip,
  headerSpouseDateOfBirth,
  headerSpouseFirstName,
  headerSpouseLastName,
  headerSpouseMiddleInitial,
  headerSpouseSsn,
  headerSsn,
  headerState,
  headerZip,
  line3MfsSpouseRdpName,
  line5SpouseRdpYearOfDeath,
  page2TaxpayerName,
  page2TaxpayerSsn,
} from "./header.js";
import {
  line61AlternativeMinimumTax,
  line62BehavioralHealthServicesTax,
  line63OtherTaxesCreditRecapture,
  line64TotalTax,
} from "./otherTaxes.js";
import {
  line71CaIncomeTaxWithheld,
  line72CaEstimatedTaxPayments,
  line75Eitc,
  line76YoungChildTaxCredit,
  line77FosterYouthTaxCredit,
  line78TotalPayments,
} from "./payments.js";
import {
  line100TaxDue,
  line111AmountYouOwe,
  line113UnderpaymentEstimatedTax,
  line114TotalAmountDue,
  line115RefundOrNoAmountDue,
  line91NoUseTaxOwed,
  line91UseTax,
  line92FullYearHealthCoverage,
  line93PaymentsBalance,
  line95PaymentsAfterIsrPenalty,
  line97OverpaidTax,
  line99OverpaidTaxAvailable,
} from "./refundOrAmountDue.js";
import { signingTaxpayerEmail, signingTaxpayerPhone } from "./signing.js";
import {
  line31TaxAmount,
  line31TaxFromFtb3803,
  line31TaxFromRateSchedule,
  line31TaxFromTaxTable,
  line32ExemptionCredits,
  line33TaxAfterExemptionCredits,
  line34TaxAmount,
  line34TaxFromScheduleG1,
  line35TotalTaxAfterCredits,
} from "./tax.js";
import {
  line12StateWages,
  line13FederalAgi,
  line14CaAdjustmentsSubtractions,
  line15CaAgiBeforeAdditions,
  line16CaAdjustmentsAdditions,
  line17CaAgi,
  line18Deductions,
  line19TaxableIncome,
} from "./taxableIncome.js";
import type { Form540 } from "./types.js";

export function register(): void {
  defineForm<Form540, Form540FilingInfo>("form-540", {
    bindings: {
      // Header: names, SSNs, address and residence (header.ts).
      "header.first_name": headerFirstName,
      "header.middle_initial": headerMiddleInitial,
      "header.last_name": headerLastName,
      "header.ssn": headerSsn,
      "header.spouse_first_name": headerSpouseFirstName,
      "header.spouse_middle_initial": headerSpouseMiddleInitial,
      "header.spouse_last_name": headerSpouseLastName,
      "header.spouse_ssn": headerSpouseSsn,
      "header.home_address": headerHomeAddress,
      "header.apartment": headerApartment,
      "header.city": headerCity,
      "header.state": headerState,
      "header.zip": headerZip,
      "header.date_of_birth": headerDateOfBirth,
      "header.spouse_date_of_birth": headerSpouseDateOfBirth,
      "header.county_at_filing": headerCountyAtFiling,
      "header.mailing_same_as_residence": headerMailingSameAsResidence,
      "header.residence_apartment": headerResidenceApartment,
      "header.residence_city": headerResidenceCity,
      "header.residence_state": headerResidenceState,
      "header.residence_zip": headerResidenceZip,

      // Filing status, lines 1 to 5 (header.ts).
      "header.filing_status": headerFilingStatus,
      "header.spouse_rdp_year_of_death": line5SpouseRdpYearOfDeath,
      "header.mfs_spouse_rdp_name_and_ssn": line3MfsSpouseRdpName,

      // Exemptions, lines 7 to 9 (exemptions.ts).
      "line.7_personal_exemption_count": line7PersonalExemptionCount,
      "line.7_personal_exemption_amount": line7PersonalExemptionAmount,
      "line.8_blind_exemption_count": line8BlindExemptionCount,
      "line.8_blind_exemption_amount": line8BlindExemptionAmount,
      "line.9_senior_exemption_count": line9SeniorExemptionCount,
      "line.9_senior_exemption_amount": line9SeniorExemptionAmount,

      // Page 2 header (header.ts).
      "page2.taxpayer_name": page2TaxpayerName,
      "page2.taxpayer_ssn": page2TaxpayerSsn,

      // Exemptions, line 10's Dependents table and lines 10 to 11 (exemptions.ts).
      "dependents.dep1_first_name": line10DependentFirstName(1),
      "dependents.dep2_first_name": line10DependentFirstName(2),
      "dependents.dep3_first_name": line10DependentFirstName(3),
      "dependents.dep1_last_name": line10DependentLastName(1),
      "dependents.dep2_last_name": line10DependentLastName(2),
      "dependents.dep3_last_name": line10DependentLastName(3),
      "dependents.dep1_ssn": line10DependentSsn(1),
      "dependents.dep2_ssn": line10DependentSsn(2),
      "dependents.dep3_ssn": line10DependentSsn(3),
      "dependents.dep1_relationship": line10DependentRelationship(1),
      "dependents.dep2_relationship": line10DependentRelationship(2),
      "dependents.dep3_relationship": line10DependentRelationship(3),
      "line.10_dependent_exemption_count": line10DependentExemptionCount,
      "line.10_dependent_exemption_amount": line10DependentExemptionAmount,
      "line.11_total_exemption_amount": line11TotalExemptionAmount,

      // Taxable income, lines 12 to 19 (taxableIncome.ts).
      "line.12_state_wages": line12StateWages,
      "line.13_federal_agi": line13FederalAgi,
      "line.14_ca_adjustments_subtractions": line14CaAdjustmentsSubtractions,
      "line.15_ca_agi_before_additions": line15CaAgiBeforeAdditions,
      "line.16_ca_adjustments_additions": line16CaAdjustmentsAdditions,
      "line.17_ca_agi": line17CaAgi,
      "line.18_deductions": line18Deductions,
      "line.19_taxable_income": line19TaxableIncome,

      // Tax, lines 31 to 35 (tax.ts).
      "line.31_tax_from_tax_table": line31TaxFromTaxTable,
      "line.31_tax_from_rate_schedule": line31TaxFromRateSchedule,
      "line.31_tax_from_ftb_3803": line31TaxFromFtb3803,
      "line.31_tax_amount": line31TaxAmount,
      "line.32_exemption_credits": line32ExemptionCredits,
      "line.33_tax_after_exemption_credits": line33TaxAfterExemptionCredits,
      "line.34_tax_from_schedule_g1": line34TaxFromScheduleG1,
      "line.34_tax_amount": line34TaxAmount,
      "line.35_total_tax_after_credits": line35TotalTaxAfterCredits,

      // Special credits. MANUAL EDIT: lines 40, 43, 47 and 48 (FTB 3506 and FTB 3510) are in credits.ts.
      "line.40_child_dependent_care_credit": line40ChildDependentCareCredit,
      "line.43_credit_name": line43CreditName,
      "line.43_credit_code": line43CreditCode,
      "line.43_credit_amount": line43CreditAmount,
      "line.47_total_credits": line47TotalCredits,
      "line.48_tax_after_credits": line48TaxAfterCredits,

      // Other taxes, lines 61 to 64 (otherTaxes.ts).
      "line.61_alternative_minimum_tax": line61AlternativeMinimumTax,
      "line.62_behavioral_health_services_tax": line62BehavioralHealthServicesTax,
      "line.63_other_taxes_credit_recapture": line63OtherTaxesCreditRecapture,
      "line.64_total_tax": line64TotalTax,

      // Payments, lines 71 to 78 (payments.ts).
      "line.71_ca_income_tax_withheld": line71CaIncomeTaxWithheld,
      "line.72_ca_estimated_tax_payments": line72CaEstimatedTaxPayments,
      "line.75_eitc": line75Eitc,
      "line.76_young_child_tax_credit": line76YoungChildTaxCredit,
      "line.77_foster_youth_tax_credit": line77FosterYouthTaxCredit,
      "line.78_total_payments": line78TotalPayments,

      // Use tax, overpaid tax or tax due, amount you owe, refund: lines 91 to 115 (refundOrAmountDue.ts).
      "line.91_use_tax": line91UseTax,
      "line.91_no_use_tax_owed": line91NoUseTaxOwed,
      "line.92_full_year_health_coverage": line92FullYearHealthCoverage,
      "line.93_payments_balance": line93PaymentsBalance,
      "line.95_payments_after_isr_penalty": line95PaymentsAfterIsrPenalty,
      "line.97_overpaid_tax": line97OverpaidTax,
      "line.99_overpaid_tax_available": line99OverpaidTaxAvailable,
      "line.100_tax_due": line100TaxDue,
      "line.111_amount_you_owe": line111AmountYouOwe,
      "line.113_underpayment_estimated_tax": line113UnderpaymentEstimatedTax,
      "line.114_total_amount_due": line114TotalAmountDue,
      "line.115_refund_or_no_amount_due": line115RefundOrNoAmountDue,

      // Signing (signing.ts).
      "signing.taxpayer_email": signingTaxpayerEmail,
      "signing.taxpayer_phone": signingTaxpayerPhone,
    },

    /*
     * MANUAL EDIT: FTB prints the page-2 SSN dashed (maxLength 11). The cast
     * is needed: the typed binding declares this slot as `string`.
     */
    formatters: {
      "page2.taxpayer_ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
      "dependents.dep1_ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
      "dependents.dep2_ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
      "dependents.dep3_ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },

    unsupported: {
      "line.94_use_tax_balance":
        "Form 540 line 94 (use tax balance) — no scenario has use tax above its payments (line 91 more than line 78), and the corpus has no FTB text for line 94 to ground the rule.",
      "line.96_isr_penalty_balance":
        "Form 540 line 96 (individual shared responsibility penalty balance) — ISR penalty / health-coverage-gap scenario not modeled yet.",
      "line.110_total_contributions":
        "Form 540 line 110 (total voluntary contributions, codes 400-449) — no voluntary-contribution fact ingestion path built yet.",
      "header.is_amended_return":
        "No amended-return scenario yet — we don't model Schedule X / amended filing triggers.",
      "header.fiscal_year_end_month":
        "Fiscal year filers only — MVP only supports calendar-year (Jan–Dec) filers; no fiscal-year scenario ingested.",
      "header.suffix": "No identity.name.suffix fact exists in the available fact catalog.",
      "header.spouse_suffix":
        "No MFJ/RDP scenario yet — spouse suffix field unsupported until we ingest spouse identity facts.",
      "header.additional_information":
        "Free-text supplemental field with no defined fact or decision mapping; rarely populated and scenario-dependent.",
      "header.principal_business_activity_code":
        "No self-employment / business-activity fact ingested yet; this field is only relevant for business-income filers.",
      "header.private_mailbox":
        "No private mailbox fact key exists in the identity schema; this is an edge-case address field not yet modeled.",
      "header.foreign_country_name":
        "No foreign address facts are ingested; MVP supports domestic US addresses only. This field is only relevant for taxpayers with a foreign mailing address.",
      "header.foreign_province_state_county":
        "No foreign address facts are ingested; MVP supports domestic US addresses only.",
      "header.foreign_postal_code":
        "No foreign address facts are ingested; MVP supports domestic US addresses only.",
      "header.prior_name":
        "No prior-name fact key exists in the identity category; taxpayer name-change scenario not modeled.",
      "header.spouse_prior_name":
        "No MFJ scenario ingested, and no prior-name fact key exists for the spouse.",
      "header.residence_street_address":
        "No separate principal-residence street address fact exists; the identity address facts represent the mailing address. A distinct principal-residence address scenario has no ingestion path yet.",
      "header.ca_filing_status_differs_from_federal":
        "No scenario yet where CA filing status differs from federal (e.g. RDP adjustments, community property MFS). MVP only handles matching statuses; this checkbox would require a dedicated ca_filing_status_differs decision.",
      "header.qualifying_surviving_spouse_instructions_ref":
        "Static instructions reference label on the form; no computable value — no scenario for QSS filing status with deceased spouse data ingested.",
      "header.claimed_as_dependent":
        "No scenario yet where the taxpayer themselves is claimed as a dependent by another person — no fact or decision models this.",
      "line.31_tax_from_ftb_3800":
        "Checkbox indicating tax includes FTB 3800 (tax on child's unearned income). No FTB 3800 scenario or fact-ingestion path exists yet.",
      "line.34_tax_from_ftb_5870a":
        "Checkbox indicating line 34 tax is from FTB 5870A (tax on accumulation distribution of trusts). No FTB 5870A scenario or fact-ingestion path exists yet.",
      "line.44_credit_name":
        "Free-text credit name for an additional special credit on line 44. No ingestion path for user-supplied special credits exists yet.",
      "line.44_credit_code":
        "Credit code for additional special credit on line 44. No ingestion path for user-supplied special credits exists yet.",
      "line.44_credit_amount":
        "Credit amount for additional special credit on line 44. No ingestion path for user-supplied special credits (requires supporting schedules/FTB forms) exists yet.",
      "line.45_schedule_p_credits":
        "Line 45 is for additional credits claimed via Schedule P (540). No ingestion path for Schedule P credits exists yet — would require a separate Schedule P catalog and credit data.",
      "line.46_renters_credit":
        "Nonrefundable Renter's Credit eligibility requires income limits, rent paid, landlord details, and rental address data — no fact ingestion path or scenario built for this yet.",
      "line.73_withholding_592b_593":
        "Form 592-B and 593 withholding (partnership/LLC/real estate withholding) requires separate fact ingestion — no ingestion path or scenario built yet.",
      "line.74_motion_picture_production_credit":
        "CA Motion Picture and Television Production Credit (FTB 3541) requires allocation/certification data from the California Film Commission — no ingestion path or scenario built yet.",
      "line.92_isr_penalty":
        "ISR penalty amount requires FTB 3853 computation (months without coverage × penalty rate per household member) — no FTB 3853 ingestion or partial-coverage scenario built yet.",
      "line.98_applied_to_2026_estimated_tax":
        "Taxpayer-elected amount applied to 2026 estimated tax — this is a discretionary user input with no fact or decision key; we'd need an estimated-tax-election intake flow to support it.",
      "line.contrib_400_ca_seniors_special_fund":
        "Voluntary charitable contribution — taxpayer-elected dollar amount with no fact or decision key. Would require a voluntary-contributions intake flow and senior-status verification to support.",
      "line.contrib_401_alzheimers_fund":
        "Voluntary charitable contribution — taxpayer-elected dollar amount with no fact or decision key. Would require a voluntary-contributions intake flow to support.",
      "line.contrib_403_rare_endangered_species_fund":
        "Voluntary charitable contribution — taxpayer-elected dollar amount with no fact or decision key. Would require a voluntary-contributions intake flow to support.",
      "line.contrib_405_breast_cancer_research_fund":
        "Voluntary contribution amount elected by the taxpayer — no fact ingestion path exists for charitable donation elections on CA 540 contribution lines.",
      "line.contrib_406_firefighters_memorial_fund":
        "Voluntary contribution amount elected by the taxpayer — no fact ingestion path exists for charitable donation elections on CA 540 contribution lines.",
      "line.contrib_407_emergency_food_for_families_fund":
        "Voluntary contribution amount elected by the taxpayer — no fact ingestion path exists for charitable donation elections on CA 540 contribution lines.",
      "line.contrib_408_peace_officer_memorial_fund":
        "Voluntary contribution amount elected by the taxpayer — no fact ingestion path exists for charitable donation elections on CA 540 contribution lines.",
      "line.contrib_413_ca_cancer_research_fund":
        "Voluntary contribution amount elected by the taxpayer — no fact ingestion path exists for charitable donation elections on CA 540 contribution lines.",
      "line.contrib_422_school_supplies_homeless_children_fund":
        "Voluntary contribution amount elected by the taxpayer — no fact ingestion path exists for charitable donation elections on CA 540 contribution lines.",
      "line.contrib_423_state_parks_protection_fund":
        "Voluntary contribution amount elected by the taxpayer — no fact ingestion path exists for charitable donation elections on CA 540 contribution lines.",
      "line.contrib_424_protect_our_coast_and_oceans_fund":
        "Voluntary contribution amount elected by the taxpayer — no fact ingestion path exists for charitable donation elections on CA 540 contribution lines.",
      "line.contrib_431_prevention_animal_homelessness_fund":
        "Voluntary contribution amount elected by the taxpayer — no fact ingestion path exists for charitable donation elections on CA 540 contribution lines.",
      "line.contrib_438_senior_citizen_advocacy_fund":
        "Voluntary contribution amount elected by the taxpayer — no fact ingestion path exists for charitable donation elections on CA 540 contribution lines.",
      "line.contrib_439_native_ca_wildlife_rehabilitation_fund":
        "Voluntary charitable contribution — no fact ingestion path for taxpayer donation amounts; unsupported until a voluntary-contributions scenario is built.",
      "line.contrib_445_mental_health_crisis_prevention_fund":
        "Voluntary charitable contribution — no fact ingestion path for taxpayer donation amounts; unsupported until a voluntary-contributions scenario is built.",
      "line.contrib_447_ca_als_research_network_fund":
        "Voluntary charitable contribution — no fact ingestion path for taxpayer donation amounts; unsupported until a voluntary-contributions scenario is built.",
      "line.contrib_448_ca_pediatric_cancer_research_fund":
        "Voluntary charitable contribution — no fact ingestion path for taxpayer donation amounts; unsupported until a voluntary-contributions scenario is built.",
      "line.contrib_449_parkinsons_disease_research_fund":
        "Voluntary charitable contribution — no fact ingestion path for taxpayer donation amounts; unsupported until a voluntary-contributions scenario is built.",
      "line.112_interest_and_late_penalties":
        "Interest and penalty calculations require FTB-computed penalty amounts based on filing date, payment history, and underpayment rules — no fact ingestion path or scenario for this yet.",
      "line.112_ftb_5805_attached":
        "FTB 5805 attachment flag depends on underpayment of estimated tax — no scenario or decision models whether this form is attached.",
      "line.112_ftb_5805f_attached":
        "FTB 5805F attachment flag depends on underpayment of estimated tax for farmers/fishermen — no scenario or decision models whether this form is attached.",
      "line.116_account_type_checking":
        "Bank account type (checking) is taxpayer-provided direct-deposit preference — no fact ingestion path built for banking details.",
      "line.116_routing_number":
        "Bank routing number is taxpayer-provided direct-deposit preference — no fact ingestion path built for banking details.",
      "line.116_account_number":
        "Bank account number is taxpayer-provided direct-deposit preference — no fact ingestion path built for banking details.",
      "line.116_direct_deposit_amount":
        "Direct deposit split amount is a taxpayer allocation choice (all or partial of line 115) — no fact or decision models this preference yet.",
      "line.116_account_type_savings":
        "Bank account type (savings) is taxpayer-provided direct-deposit preference — no fact ingestion path built for banking details.",
      "line.117_secondary_account_type_checking":
        "Secondary bank account type (checking) is a taxpayer-provided direct-deposit split preference — no fact ingestion path built for banking details.",
      "line.117_secondary_routing_number":
        "Secondary bank routing number is a taxpayer-provided direct-deposit split detail — no fact ingestion path built for banking details.",
      "line.117_secondary_account_number":
        "No fact key exists for a secondary bank account number; bank account data is not ingested.",
      "line.117_secondary_direct_deposit_amount":
        "No fact or decision captures the taxpayer's chosen split amount for a secondary direct deposit account.",
      "line.117_secondary_account_type_savings":
        "No fact key exists for secondary bank account type (checking vs. savings); bank account data is not ingested.",
      "signing.voter_registration_info_request":
        "Voluntary voter registration opt-in checkbox — no fact or decision models this taxpayer preference.",
      "signing.wants_health_care_coverage_info":
        "Voluntary single_select asking if taxpayer wants health care coverage info — no decision models this preference.",
      "signing.organ_donor_primary_taxpayer":
        "Voluntary organ donor registry opt-in for primary taxpayer — no fact or decision models this election.",
      "signing.organ_donor_spouse_rdp":
        "Voluntary organ donor registry opt-in for spouse/RDP — no MFJ scenario built and no fact models this election.",
      "signing.date_signed":
        "Signing date is set at the moment the taxpayer executes the return — no static fact captures it and it is not a fixed value.",
      "signing.preparer_name":
        "Paid preparer block — no paid-preparer ingestion scenario built yet. Self-filed returns leave this blank.",
      "signing.preparer_phone":
        "Paid preparer block — no paid-preparer ingestion scenario built yet. Self-filed returns leave this blank.",
      "signing.preparer_firm_name":
        "Paid preparer block — no paid-preparer ingestion scenario built yet. Self-filed returns leave this blank.",
      "signing.preparer_ptin":
        "Paid preparer block — no paid-preparer ingestion scenario built yet. Self-filed returns leave this blank.",
      "signing.preparer_firm_address":
        "Paid preparer block — no paid-preparer ingestion scenario built yet. Self-filed returns leave this blank.",
      "signing.preparer_firm_ein":
        "Paid preparer block — no paid-preparer ingestion scenario built yet. Self-filed returns leave this blank.",
      "signing.third_party_designee_authorized":
        "Third-party designee authorization — no designee ingestion scenario built yet. Most self-filed returns do not authorize a third-party designee.",
      "signing.third_party_designee_name":
        "Third-party designee block — no designee ingestion scenario built yet.",
      "signing.third_party_designee_phone":
        "Third-party designee block — no designee ingestion scenario built yet.",
    },
  });
}
