/*
 * Form 540NR header, filing status, exemptions (lines 1 to 11) and signing:
 * the same entries as Form 540, by Form 540's rules
 * (ca-540nr-booklet-2025::sec::before-you-begin::b02, ::filing-status-2::b01,
 * ::line-7-personal-exemptions::b01 to ::line-11-exemption-amount::b01).
 */

import * as exemptions from "../540/exemptions.js";
import * as header from "../540/header.js";
import * as signing from "../540/signing.js";
import { fromForm540 } from "./fromForm540.js";

export const headerFirstName = fromForm540<"0.header.first_name", "header.first_name">(
  header.headerFirstName,
);
export const headerMiddleInitial = fromForm540<"0.header.middle_initial", "header.middle_initial">(
  header.headerMiddleInitial,
);
export const headerLastName = fromForm540<"0.header.last_name", "header.last_name">(
  header.headerLastName,
);
export const headerSsn = fromForm540<"0.header.ssn", "header.ssn">(header.headerSsn);
export const headerSpouseFirstName = fromForm540<
  "0.header.spouse_first_name",
  "header.spouse_first_name"
>(header.headerSpouseFirstName);
export const headerSpouseMiddleInitial = fromForm540<
  "0.header.spouse_middle_initial",
  "header.spouse_middle_initial"
>(header.headerSpouseMiddleInitial);
export const headerSpouseLastName = fromForm540<
  "0.header.spouse_last_name",
  "header.spouse_last_name"
>(header.headerSpouseLastName);
export const headerSpouseSsn = fromForm540<"0.header.spouse_ssn", "header.spouse_ssn">(
  header.headerSpouseSsn,
);
export const headerHomeAddress = fromForm540<"0.header.home_address", "header.home_address">(
  header.headerHomeAddress,
);
export const headerApartment = fromForm540<"0.header.apartment", "header.apartment">(
  header.headerApartment,
);
export const headerCity = fromForm540<"0.header.city", "header.city">(header.headerCity);
export const headerState = fromForm540<"0.header.state", "header.state">(header.headerState);
export const headerZip = fromForm540<"0.header.zip", "header.zip">(header.headerZip);
export const headerDateOfBirth = fromForm540<"0.header.date_of_birth", "header.date_of_birth">(
  header.headerDateOfBirth,
);
export const headerSpouseDateOfBirth = fromForm540<
  "0.header.spouse_date_of_birth",
  "header.spouse_date_of_birth"
>(header.headerSpouseDateOfBirth);
export const headerFilingStatus = fromForm540<"0.header.filing_status", "header.filing_status">(
  header.headerFilingStatus,
);
export const line5SpouseRdpYearOfDeath = fromForm540<
  "0.header.spouse_rdp_year_of_death",
  "header.spouse_rdp_year_of_death"
>(header.line5SpouseRdpYearOfDeath);
export const line3MfsSpouseRdpName = fromForm540<
  "0.header.mfs_spouse_rdp_full_name",
  "header.mfs_spouse_rdp_name_and_ssn"
>(header.line3MfsSpouseRdpName);
export const page2TaxpayerName = fromForm540<"1.header.taxpayer_name", "page2.taxpayer_name">(
  header.page2TaxpayerName,
);
export const page2TaxpayerSsn = fromForm540<"1.header.taxpayer_ssn", "page2.taxpayer_ssn">(
  header.page2TaxpayerSsn,
);

export const line7PersonalExemptionCount = fromForm540<
  "0.line.7_personal_exemption_count",
  "line.7_personal_exemption_count"
>(exemptions.line7PersonalExemptionCount);
export const line7PersonalExemptionAmount = fromForm540<
  "0.line.7_personal_exemption_amount",
  "line.7_personal_exemption_amount"
>(exemptions.line7PersonalExemptionAmount);
export const line8BlindExemptionCount = fromForm540<
  "0.line.8_blind_exemption_count",
  "line.8_blind_exemption_count"
>(exemptions.line8BlindExemptionCount);
export const line8BlindExemptionAmount = fromForm540<
  "0.line.8_blind_exemption_amount",
  "line.8_blind_exemption_amount"
>(exemptions.line8BlindExemptionAmount);
export const line9SeniorExemptionCount = fromForm540<
  "0.line.9_senior_exemption_count",
  "line.9_senior_exemption_count"
>(exemptions.line9SeniorExemptionCount);
export const line9SeniorExemptionAmount = fromForm540<
  "0.line.9_senior_exemption_amount",
  "line.9_senior_exemption_amount"
>(exemptions.line9SeniorExemptionAmount);
export const line10DependentExemptionCount = fromForm540<
  "0.line.10_dependent_exemption_count",
  "line.10_dependent_exemption_count"
>(exemptions.line10DependentExemptionCount);
export const line10DependentExemptionAmount = fromForm540<
  "0.line.10_dependent_exemption_amount",
  "line.10_dependent_exemption_amount"
>(exemptions.line10DependentExemptionAmount);
export const line11TotalExemptionAmount = fromForm540<
  "1.line.11_total_exemption_amount",
  "line.11_total_exemption_amount"
>(exemptions.line11TotalExemptionAmount);

/* Line 10's Dependents table, rows 1 to 3, by Form 540's rule (the same persons as the federal return). */
type Row = 1 | 2 | 3;
export const line10DependentFirstName = (row: Row) =>
  fromForm540<`0.line.10_dependent_${Row}_first_name`, `dependents.dep${Row}_first_name`>(
    exemptions.line10DependentFirstName(row),
  );
export const line10DependentLastName = (row: Row) =>
  fromForm540<`0.line.10_dependent_${Row}_last_name`, `dependents.dep${Row}_last_name`>(
    exemptions.line10DependentLastName(row),
  );
export const line10DependentSsn = (row: Row) =>
  fromForm540<`0.line.10_dependent_${Row}_ssn`, `dependents.dep${Row}_ssn`>(
    exemptions.line10DependentSsn(row),
  );
export const line10DependentRelationship = (row: Row) =>
  fromForm540<`0.line.10_dependent_${Row}_relationship`, `dependents.dep${Row}_relationship`>(
    exemptions.line10DependentRelationship(row),
  );

export const signingTaxpayerEmail = fromForm540<
  "5.signing.taxpayer_email",
  "signing.taxpayer_email"
>(signing.signingTaxpayerEmail);
export const signingTaxpayerPhone = fromForm540<
  "5.signing.taxpayer_phone",
  "signing.taxpayer_phone"
>(signing.signingTaxpayerPhone);
