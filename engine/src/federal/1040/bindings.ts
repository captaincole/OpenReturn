/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

/*
 * The Form 1040 index: one entry per field, in the order of the paper form.
 * Each line's rule is in the section file that its import names.
 */

import { defineForm } from "../../defineForm.js";
import {
  line10,
  line11a,
  line11b,
  line12bSpouseItemizesSeparate,
  line12dSpouseBlind,
  line12dSpouseBornBeforeJan2_1961,
  line12dYouBlind,
  line12dYouBornBeforeJan2_1961,
  line12e,
  line13a,
  line13b,
  line14,
  line15,
} from "./adjustmentsAndDeductions.js";
import type { Form1040FilingInfo } from "./filingInfo.js";
import {
  childDividendsIncluded,
  line16FromForm8814,
  line3b,
  line7bBindings,
} from "./form8814Lines.js";
import {
  dependentRowBindings,
  filingStatusHoh,
  filingStatusMfj,
  filingStatusMfs,
  filingStatusQss,
  filingStatusSingle,
  headerApartment,
  headerCity,
  headerDigitalAssetsNo,
  headerDigitalAssetsYes,
  headerFirstNameMi,
  headerHomeAddress,
  headerLastName,
  headerLivedApartMfsHoh,
  headerMainHomeUsOverHalfYear,
  headerMfsSpouseFullName,
  headerSpouseSsn,
  headerSsn,
  headerState,
  headerZip,
  moreThanFourDependents,
} from "./header.js";
import {
  line1a,
  line1c,
  line1e,
  line1f,
  line1hAmount,
  line1z,
  line2a,
  line2b,
  line3aQualifiedDividends,
  line4a,
  line4b,
  line4cRollover,
  line5a,
  line5b,
  line5cRollover,
  line6a,
  line6b,
  line6dMfsLivedApart,
  line7a,
  line8,
  line9,
} from "./income.js";
import {
  line25a,
  line25b,
  line25c,
  line25d,
  line27a,
  line27cNoEicClaim,
  line28,
  line30,
  line32,
  line33,
  line34,
  line35a,
  line35aForm8888Attached,
  line37,
} from "./payments.js";
import {
  signingTaxpayerEmail,
  signingTaxpayerOccupation,
  signingTaxpayerPhone,
} from "./signing.js";
import {
  line16,
  line17,
  line18,
  line19,
  line20,
  line21,
  line22,
  line23,
  line24,
} from "./taxAndCredits.js";
import type { Form1040 } from "./types.js";

export function register(): void {
  defineForm<Form1040, Form1040FilingInfo>("form-1040", {
    bindings: {
      "header.first_name_mi": headerFirstNameMi,
      "header.last_name": headerLastName,
      "header.ssn": headerSsn,
      "header.spouse_ssn": headerSpouseSsn,
      "header.home_address": headerHomeAddress,
      "header.apartment": headerApartment,
      "header.main_home_us_over_half_year": headerMainHomeUsOverHalfYear,
      "header.city": headerCity,
      "header.state": headerState,
      "header.zip": headerZip,
      "header.filing_status_single": filingStatusSingle,
      "header.filing_status_hoh": filingStatusHoh,
      "header.filing_status_mfj": filingStatusMfj,
      "header.filing_status_qss": filingStatusQss,
      "header.filing_status_mfs": filingStatusMfs,
      "header.mfs_spouse_full_name": headerMfsSpouseFullName,
      "header.digital_assets_yes": headerDigitalAssetsYes,
      "header.digital_assets_no": headerDigitalAssetsNo,
      ...dependentRowBindings(),
      "dependents.more_than_four_dependents": moreThanFourDependents,
      "header.lived_apart_mfs_hoh": headerLivedApartMfsHoh,
      "line.1a": line1a,
      "line.1c": line1c,
      "line.1e": line1e,
      "line.1f": line1f,
      "line.1h_amount": line1hAmount,
      "line.1z": line1z,
      "line.2a": line2a,
      "line.2b": line2b,
      "line.3a": line3aQualifiedDividends,
      "line.3b": line3b,
      "line.3c_box1": childDividendsIncluded,
      "line.3c_box2": childDividendsIncluded,
      "line.4a": line4a,
      "line.4b": line4b,
      "line.4c_rollover": line4cRollover,
      "line.5a": line5a,
      "line.5b": line5b,
      "line.5c_rollover": line5cRollover,
      "line.6a": line6a,
      "line.6b": line6b,
      "line.6d_mfs_lived_apart": line6dMfsLivedApart,
      "line.7a": line7a,
      ...line7bBindings,
      "line.8": line8,
      "line.9": line9,
      "line.10": line10,
      "line.11a": line11a,
      "line.11b": line11b,
      "line.12b_spouse_itemizes_separate": line12bSpouseItemizesSeparate,
      "line.12d_you_born_before_jan2_1961": line12dYouBornBeforeJan2_1961,
      "line.12d_you_blind": line12dYouBlind,
      "line.12d_spouse_born_before_jan2_1961": line12dSpouseBornBeforeJan2_1961,
      "line.12d_spouse_blind": line12dSpouseBlind,
      "line.12e": line12e,
      "line.13a": line13a,
      "line.13b": line13b,
      "line.14": line14,
      "line.15": line15,
      "line.16_from_form_8814": line16FromForm8814,
      "line.16": line16,
      "line.17": line17,
      "line.18": line18,
      "line.19": line19,
      "line.20": line20,
      "line.21": line21,
      "line.22": line22,
      "line.23": line23,
      "line.24": line24,
      "line.25a": line25a,
      "line.25b": line25b,
      "line.25c": line25c,
      "line.25d": line25d,
      "line.27a": line27a,
      "line.27c_no_eic_claim": line27cNoEicClaim,
      "line.28": line28,
      "line.30": line30,
      "line.32": line32,
      "line.33": line33,
      "line.34": line34,
      "line.35a": line35a,
      "line.35a_form_8888_attached": line35aForm8888Attached,
      "line.37": line37,
      "signing.taxpayer_occupation": signingTaxpayerOccupation,
      "signing.taxpayer_phone": signingTaxpayerPhone,
      "signing.taxpayer_email": signingTaxpayerEmail,
    },

    unsupported: {
      // MANUAL EDIT: only fiscal-year filers fill these; calendar-year filers leave them blank.
      "header.tax_year_beginning":
        "Calendar-year filers leave this blank; only fiscal-year filers fill it. No fiscal-year scenario built yet.",
      "header.tax_year_ending_md":
        "Calendar-year filers leave this blank; only fiscal-year filers fill it. No fiscal-year scenario built yet.",
      "header.tax_year_ending_year":
        "Calendar-year filers leave this blank; only fiscal-year filers fill it. No fiscal-year scenario built yet.",
      "header.filed_pursuant_9100_2":
        "No scenario or fact ingested for section 301.9100-2 election (late election relief); this is a rare regulatory checkbox with no current data path.",
      "header.combat_zone_checkbox":
        "No combat zone fact or decision has been ingested; no military/combat zone scenario exists in the current MVP.",
      "header.combat_zone_text":
        "No combat zone fact or decision has been ingested; no military/combat zone scenario exists in the current MVP.",
      "header.taxpayer_deceased_checkbox":
        "No deceased-taxpayer scenario or fact has been ingested; deceased filer handling requires a dedicated data path not yet built.",
      "header.taxpayer_deceased_month":
        "No deceased-taxpayer scenario or fact has been ingested; date-of-death fields require a dedicated ingestion path not yet built.",
      "header.taxpayer_deceased_day":
        "No deceased-taxpayer scenario or fact has been ingested; date-of-death fields require a dedicated ingestion path not yet built.",
      "header.taxpayer_deceased_year":
        "No deceased-taxpayer scenario or fact has been ingested; date-of-death fields require a dedicated ingestion path not yet built.",
      "header.spouse_deceased_month":
        "No deceased-spouse scenario ingested yet; spouse date-of-death fields require a MFJ/surviving-spouse scenario we haven't built.",
      "header.spouse_deceased_day":
        "No deceased-spouse scenario ingested yet; spouse date-of-death fields require a MFJ/surviving-spouse scenario we haven't built.",
      "header.spouse_deceased_year":
        "No deceased-spouse scenario ingested yet; spouse date-of-death fields require a MFJ/surviving-spouse scenario we haven't built.",
      "header.other_checkbox":
        "This 'Other' header checkbox covers edge cases (fiscal year, combat zone extension, etc.) with no fact or decision key defined for it yet.",
      "header.other_description":
        "Free-text description for the 'Other' header checkbox; no fact/decision key defined for this edge-case scenario.",
      "header.other_amount":
        "Numeric amount for the 'Other' header block; no fact/decision key defined for this edge-case scenario.",
      "header.other_additional":
        "Additional text field for the 'Other' header block; no fact/decision key defined for this edge-case scenario.",
      "header.spouse_first_name_mi":
        "No MFJ scenario yet — spouse identity facts are not ingested. Will support when a married_filing_jointly scenario is built.",
      "header.spouse_last_name":
        "No MFJ scenario yet — spouse identity facts are not ingested. Will support when a married_filing_jointly scenario is built.",
      "header.foreign_country_name":
        "No foreign address scenario modeled yet — no fact key exists for a foreign country name. Relevant only for taxpayers with a foreign address.",
      "header.foreign_province_state_county":
        "No foreign address scenario or fact key exists for foreign province/state/county; we only model U.S. domestic addresses.",
      "header.foreign_postal_code":
        "No foreign address scenario or fact key exists for foreign postal code; we only model U.S. domestic addresses.",
      "header.presidential_campaign_you":
        "No fact or decision models the taxpayer's voluntary Presidential Election Campaign Fund $3 designation; no intake question captures this.",
      "header.presidential_campaign_spouse":
        "No fact or decision models the spouse's voluntary Presidential Election Campaign Fund $3 designation; no MFJ/spouse scenario ingested.",
      "header.hoh_qss_qualifying_child_name":
        "No dependent/qualifying-child ingestion scenario yet — this field is only filled when the HOH/QSS qualifying person is a child who is NOT the taxpayer's dependent, requiring dependent relationship data we haven't modeled.",
      "header.nonresident_alien_spouse_checkbox":
        "No nonresident/dual-status alien spouse scenario modeled yet — requires a specific MFJ+NRA-spouse fact we haven't ingested.",
      "header.nonresident_alien_spouse_name":
        "No nonresident/dual-status alien spouse scenario modeled yet — spouse name field only applies when the NRA-spouse checkbox is checked, which has no ingestion path.",
      "line.1b":
        "Household employee wages not reported on W-2 require a separate household-employer intake scenario not yet built; no fact key exists for this.",
      "line.1d":
        "No ingestion path for Medicaid waiver payments not reported on W-2 — no scenario built for this income type yet.",
      "line.1g":
        "Requires Form 8919 (Uncollected SS/Medicare Tax on Wages) — no Form 8919 ingestion or scenario built yet.",
      "line.1h_type":
        "Free-text label describing the type of other earned income on line 1h — no fact or decision maps to this descriptor field; no other-earned-income scenario built yet.",
      "line.1i":
        "Nontaxable combat pay election — no combat pay fact ingestion or military-taxpayer scenario built yet.",
      "line.4c_qcd":
        "IRA QCD checkbox (Exception 3) — requires 1099-R ingestion and qualified-charitable-distribution scenario. No QCD scenario built yet.",
      "line.4c_box3":
        "IRA exception box 3 checkbox (e.g. HFD or other special codes) — requires 1099-R ingestion and specific exception scenarios. No such scenario built yet.",
      "line.4c_box3_amount":
        "Amount associated with IRA line 4c box 3 exception — requires 1099-R ingestion and exception-specific amount tracking. No such scenario built yet.",
      "line.5c_pso":
        "No PSO (Public Safety Officer insurance premium exclusion) scenario or decision ingested; cannot determine whether this election applies.",
      "line.5c_box3":
        "No scenario requiring a special code/annotation next to line 5b; this checkbox is for edge cases referenced by other publications.",
      "line.5c_box3_amount":
        "Companion amount field to line 5c box 3; no scenario requiring this annotation amount has been modeled.",
      "line.6c_lump_sum_election":
        "No lump-sum social security benefit scenario or decision modeled; this checkbox requires knowing whether the taxpayer received a prior-year lump-sum SS payment and elected the special treatment.",
      "line.12a_you_as_dependent":
        "Whether the taxpayer can be claimed as a dependent on someone else's return requires a dependent-status decision not yet modeled in the decision set.",
      "line.12a_spouse_as_dependent":
        "No MFJ scenario ingested yet — spouse-as-dependent checkbox requires a joint-return scenario where the spouse can be claimed by a third party.",
      "line.12b_dual_status_alien":
        "No dual-status alien scenario ingested yet — this checkbox requires a residency/immigration-status fact we don't model.",
      "line.16_from_form_4972":
        "Checkbox indicating tax includes amounts from Form 4972 (lump-sum distribution). No Form 4972 ingestion scenario built yet.",
      "line.16_from_other_form":
        "Checkbox indicating tax includes amounts from a third special form (e.g. section 962 election, recapture). No ingestion scenario built for these edge cases.",
      "line.16_other_form_number":
        "Free-text entry for the form number associated with the third checkbox on line 16. Tied to special-form tax scenarios not yet ingested.",
      "line.26":
        "Estimated tax payments and prior-year overpayment applied forward have no ingestion path yet — no estimated_payments fact category exists.",
      "line.former_spouse_ssn":
        "Former spouse SSN for joint estimated tax split — no MFS/divorce scenario with prior joint estimated payments modeled yet; requires separate fact ingestion for former spouse identity.",
      "line.27b_clergy_schedule_se":
        "Clergy/minister checkbox for Schedule SE filing — no clergy occupation scenario or Schedule SE ingestion built yet.",
      "line.28_no_actc_claim":
        "Opt-out checkbox for ACTC claim — no ACTC eligibility or opt-out decision modeled yet; requires taxpayer election fact.",
      "line.29":
        "American Opportunity Credit from Form 8863 line 8 — Form 8863 not ingested and no education-credit scenario built yet.",
      "line.31":
        "Amount from Schedule 3 line 15 (additional refundable credits/payments) — Schedule 3 not ingested as a separate form catalog yet.",
      "line.35b_routing_number":
        "Bank routing number for direct deposit refund — no banking fact category ingested; taxpayer must enter this manually.",
      "line.35c_checking":
        "Account type (checking) checkbox for direct deposit — no bank account type fact ingested; taxpayer must select manually.",
      "line.35c_savings":
        "Account type (savings) checkbox for direct deposit — no bank account type fact ingested; taxpayer must select manually.",
      "line.35d_account_number":
        "Bank account number for direct deposit refund — no banking fact category ingested; taxpayer must enter this manually.",
      "line.36":
        "Amount of overpayment (line 34) to apply to 2026 estimated tax — a taxpayer election with no corresponding fact or decision in the ingestion model.",
      "line.38":
        "Estimated tax penalty requires Form 2210 calculation (prior-year tax liability, installment due dates, underpayment amounts) — no penalty-calculation engine or prior-year facts ingested yet.",
      "page2.third_party_designee_yes":
        "No fact or decision models whether the taxpayer designates a third party — no third-party-designee scenario built yet.",
      "page2.third_party_designee_no":
        "No fact or decision models the third-party designee election — no scenario built yet.",
      "page2.designee_name":
        "Third-party designee name — no fact or decision models designee info; no scenario built yet.",
      "page2.designee_phone":
        "Third-party designee phone — no fact or decision models designee info; no scenario built yet.",
      "page2.designee_pin":
        "Third-party designee PIN — no fact or decision models designee info; no scenario built yet.",
      "signing.taxpayer_ip_pin":
        "IRS Identity Protection PIN is not part of current fact ingestion — no identity.ip_pin fact key exists yet.",
      "signing.spouse_occupation":
        "No MFJ scenario built yet — spouse facts (including occupation) are not ingested.",
      "signing.spouse_ip_pin":
        "No MFJ scenario built yet — spouse IP PIN fact not ingested; also no identity.spouse_ip_pin fact key exists.",
      "signing.preparer_self_employed":
        "No paid-preparer ingestion path exists; this checkbox applies only when a paid preparer prepares the return, which is outside the current self-filing scenario.",
      "signing.preparer_name":
        "No paid-preparer ingestion path exists; preparer name is supplied by a third-party tax professional, not a taxpayer fact.",
      "signing.preparer_ptin":
        "No paid-preparer ingestion path exists; PTIN is the preparer's IRS-issued identifier, not a taxpayer fact.",
      "signing.preparer_firm_name":
        "No paid-preparer ingestion path exists; firm name belongs to the paid preparer's practice, not the taxpayer.",
      "signing.preparer_phone":
        "No paid-preparer ingestion path exists; this is the preparer's firm phone, distinct from the taxpayer's phone.",
      "signing.preparer_firm_address":
        "No paid-preparer ingestion path exists; firm address belongs to the paid preparer's practice, not the taxpayer.",
      "signing.preparer_firm_ein":
        "No paid-preparer ingestion path exists; firm EIN belongs to the paid preparer's practice, not the taxpayer.",
    },
  });
}
