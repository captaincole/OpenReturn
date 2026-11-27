/*
 * The Form 540NR fields the engine does not compute, with the reason. Most
 * are the same entries Form 540 leaves to a person (state/ca/540/bindings.ts):
 * no fact holds the answer yet, for either return.
 */

import type { FormSpec } from "../../../defineForm.js";
import type { Form540NRFilingInfo } from "./filingInfo.js";
import type { Form540NR } from "./types.js";

type Unsupported = NonNullable<FormSpec<Form540NR, Form540NRFilingInfo>["unsupported"]>;

const CONTRIBUTION =
  "Voluntary contribution: a taxpayer-elected amount with no fact or decision key, as on Form 540.";
const DEPOSIT =
  "Direct deposit details (account type, routing and account numbers, the split) have no California fact yet, as on Form 540 lines 116 and 117.";
const PREPARER =
  "Paid preparer block: no paid-preparer facts; a self-prepared return leaves it blank, as on Form 540.";
const DESIGNEE = "Third-party designee block: no designee facts, as on Form 540.";
const HOH_CREDITS =
  "Lines 51 to 55 claim the joint custody head of household, dependent parent and senior head of household credits; no fact asks whether the taxpayer qualifies (Form 540 and Schedule P (540) leave them to a person too).";

const contributions = [
  "3.line.contrib_400_ca_seniors_special_fund",
  "3.line.contrib_401_alzheimers_fund",
  "3.line.contrib_403_rare_endangered_species_fund",
  "3.line.contrib_405_breast_cancer_research_fund",
  "3.line.contrib_406_firefighters_memorial_fund",
  "3.line.contrib_407_emergency_food_for_families_fund",
  "3.line.contrib_408_peace_officer_memorial_fund",
  "3.line.contrib_413_ca_cancer_research_fund",
  "3.line.contrib_422_school_supplies_homeless_children_fund",
  "3.line.contrib_423_state_parks_protection_fund",
  "3.line.contrib_424_protect_our_coast_and_oceans_fund",
  "3.line.contrib_431_prevention_animal_homelessness_fund",
  "3.line.contrib_438_senior_citizen_advocacy_fund",
  "3.line.contrib_439_native_ca_wildlife_rehabilitation_fund",
  "3.line.contrib_445_mental_health_crisis_prevention_fund",
  "3.line.contrib_447_ca_als_research_network_fund",
  "3.line.contrib_448_ca_pediatric_cancer_research_fund",
  "3.line.contrib_449_parkinsons_disease_research_fund",
] as const;

const deposit = [
  "4.line.126_account_type_checking",
  "4.line.126_routing_number",
  "4.line.126_account_number",
  "4.line.126_direct_deposit_amount",
  "4.line.126_account_type_savings",
  "4.line.127_secondary_account_type_checking",
  "4.line.127_secondary_routing_number",
  "4.line.127_secondary_account_number",
  "4.line.127_secondary_direct_deposit_amount",
  "4.line.127_secondary_account_type_savings",
] as const;

const preparer = [
  "5.signing.preparer_name",
  "5.signing.preparer_phone",
  "5.signing.preparer_firm_name",
  "5.signing.preparer_ptin",
  "5.signing.preparer_firm_address",
  "5.signing.preparer_firm_ein",
] as const;

const designee = [
  "5.signing.third_party_designee_authorized",
  "5.signing.third_party_designee_name",
  "5.signing.third_party_designee_phone",
] as const;

const hohCredits = [
  "1.line.51_joint_custody_hoh_credit",
  "1.line.52_dependent_parent_credit",
  "1.line.53_senior_hoh_credit",
  "1.line.54_credit_percentage_whole_digit",
  "1.line.54_credit_percentage_decimal_digits",
  "1.line.55_credit_amount",
] as const;

const each = (fields: readonly string[], reason: string) =>
  Object.fromEntries(fields.map((field) => [field, reason]));

export const FORM_540NR_UNSUPPORTED: Unsupported = {
  "0.header.fiscal_year_end_month":
    "Fiscal year filers only; the engine supports calendar-year filers, as on Form 540.",
  "0.header.is_amended_return": "No amended-return facts (Schedule X), as on Form 540.",
  "0.header.suffix": "No identity.name.suffix fact exists, as on Form 540.",
  "0.header.spouse_suffix": "No spouse suffix fact exists, as on Form 540.",
  "0.header.additional_information":
    "Free-text supplemental field with no fact or decision, as on Form 540.",
  "0.header.principal_business_activity_code":
    "No principal business activity code fact, as on Form 540.",
  "0.header.private_mailbox": "No private mailbox fact in the identity facts, as on Form 540.",
  "0.header.foreign_country_name":
    "No foreign address facts; the engine supports domestic addresses only, as on Form 540.",
  "0.header.foreign_province_state_county":
    "No foreign address facts; the engine supports domestic addresses only, as on Form 540.",
  "0.header.foreign_postal_code":
    "No foreign address facts; the engine supports domestic addresses only, as on Form 540.",
  "0.header.prior_name": "No prior-name fact, as on Form 540.",
  "0.header.spouse_prior_name": "No spouse prior-name fact, as on Form 540.",
  "0.header.ca_filing_status_differs_from_federal":
    "No decision says the California filing status differs from the federal one (RDP adjustments, community property), as on Form 540.",
  "0.header.qualifying_surviving_spouse_see_instructions":
    "A reference to the instructions printed on the form; no value to compute, as on Form 540.",
  "0.line.6_claimed_as_dependent":
    "No fact says someone else can claim the taxpayer as a dependent, as on Form 540; lines 7 to 9 assume no one can.",
  ...each(hohCredits, HOH_CREDITS),
  "2.line.61_renters_credit":
    "The nonrefundable renter's credit needs the qualification record (rent paid on a California home for six months, the income limit); no fact holds it, as on Form 540 line 46.",
  "2.line.83_withholding_592b_593":
    "Withholding on Forms 592-B and 593 (a nonresident's California-source income, a California real estate sale): the engine does not read these forms yet, as on Form 540 line 73.",
  "2.line.84_motion_picture_production_credit":
    "The refundable motion picture credit (FTB 3541) needs the California Film Commission's figures; no fact holds them, as on Form 540 line 74.",
  "2.line.102_applied_to_2026_estimated_tax":
    "The amount applied to 2026 estimated tax is the taxpayer's election; no fact or decision holds it, as on Form 540 line 98.",
  ...each(contributions, CONTRIBUTION),
  "3.line.120_total_contributions":
    "Line 120 adds the voluntary contributions, which have no facts, as on Form 540 line 110.",
  "4.line.122_interest_and_late_penalties":
    "Interest and late penalties depend on the filing and payment dates; the FTB figures them, as on Form 540 line 112.",
  ...each(deposit, DEPOSIT),
  "4.signing.voter_registration_info_request":
    "A voluntary opt-in with no fact or decision, as on Form 540.",
  "4.signing.wants_health_care_coverage_info":
    "A voluntary opt-in with no fact or decision, as on Form 540.",
  "5.signing.date_signed": "The signing date is set when the taxpayer signs, as on Form 540.",
  ...each(preparer, PREPARER),
  ...each(designee, DESIGNEE),
};
