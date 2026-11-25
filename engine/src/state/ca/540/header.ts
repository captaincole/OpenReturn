/*
 * Form 540 header: names, SSNs, address, residence, filing status (lines 1
 * to 5), and the page-2 name and SSN.
 */

import type { FilingStatus } from "../../../values.js";
import type { Form540Line } from "./form540Binding.js";

const CA_FILING_STATUS_OPTION = {
  single: "single",
  married_filing_jointly: "married_rdp_filing_jointly",
  married_filing_separately: "married_rdp_filing_separately",
  head_of_household: "head_of_household",
  qualifying_surviving_spouse: "qualifying_surviving_spouse_rdp",
} as const satisfies Record<FilingStatus, string>;

export const headerFirstName: Form540Line<"header.first_name"> = (_, info) =>
  info.taxpayerFirstName;

/*
 * MANUAL EDIT: the header's spouse name is for a joint return ("If joint tax return").
 * The middle initials come from the identity facts when stated (filingInfoResolvers reads them).
 */
export const headerMiddleInitial: Form540Line<"header.middle_initial"> = (_, info) =>
  info.taxpayerMiddleInitial;
export const headerSpouseMiddleInitial: Form540Line<"header.spouse_middle_initial"> = (_, info) =>
  info.filingStatus === "married_filing_jointly" ? info.spouseMiddleInitial : undefined;
export const headerSpouseFirstName: Form540Line<"header.spouse_first_name"> = (_, info) =>
  info.filingStatus === "married_filing_jointly" ? info.spouseFirstName : undefined;
export const headerSpouseLastName: Form540Line<"header.spouse_last_name"> = (_, info) =>
  info.filingStatus === "married_filing_jointly" ? info.spouseLastName : undefined;

export const headerLastName: Form540Line<"header.last_name"> = (_, info) => info.taxpayerLastName;
export const headerSsn: Form540Line<"header.ssn"> = (_, info) => info.taxpayerSSN;

// MANUAL EDIT: MFS puts the spouse's SSN in the header and full name on line 3.
export const headerSpouseSsn: Form540Line<"header.spouse_ssn"> = (_, info) =>
  info.filingStatus === "married_filing_separately" ||
  info.filingStatus === "married_filing_jointly"
    ? info.spouseSSN
    : undefined;

export const headerHomeAddress: Form540Line<"header.home_address"> = (_, info) =>
  info.homeAddressLine1;
export const headerApartment: Form540Line<"header.apartment"> = (_, info) => info.homeAddressApt;
export const headerCity: Form540Line<"header.city"> = (_, info) => info.homeAddressCity;
export const headerState: Form540Line<"header.state"> = (_, info) => info.homeAddressState;
export const headerZip: Form540Line<"header.zip"> = (_, info) => info.homeAddressZip;
export const headerDateOfBirth: Form540Line<"header.date_of_birth"> = (_, info) =>
  info.taxpayerDateOfBirth;

/*
 * MANUAL EDIT: "enter the DOBs in the same order as the names"
 * (ca-540-inst-2025::sec::date-of-birth-dob::b01). The spouse's DOB prints
 * next to the spouse's header name, which is for a joint return only.
 */
export const headerSpouseDateOfBirth: Form540Line<"header.spouse_date_of_birth"> = (_, info) =>
  info.filingStatus === "married_filing_jointly" ? info.spouseDateOfBirth : undefined;
export const headerCountyAtFiling: Form540Line<"header.county_at_filing"> = (_, info) =>
  info.homeAddressCounty;

// MANUAL EDIT: compare with boolean `true`, not the string "true".
export const headerMailingSameAsResidence: Form540Line<"header.mailing_same_as_residence"> = (
  _,
  info,
) => info.mailingSameAsResidence === true;

// MANUAL EDIT: FTB fills the residence block only when it differs from the mailing address.
export const headerResidenceApartment: Form540Line<"header.residence_apartment"> = (_, info) =>
  info.mailingSameAsResidence ? undefined : info.homeAddressApt;
export const headerResidenceCity: Form540Line<"header.residence_city"> = (_, info) =>
  info.mailingSameAsResidence ? undefined : info.homeAddressCity;
export const headerResidenceState: Form540Line<"header.residence_state"> = (_, info) =>
  info.mailingSameAsResidence ? undefined : info.homeAddressState;
export const headerResidenceZip: Form540Line<"header.residence_zip"> = (_, info) =>
  info.mailingSameAsResidence ? undefined : info.homeAddressZip;

// MANUAL EDIT: the 540 catalog's married and QSS options carry "rdp".
export const headerFilingStatus: Form540Line<"header.filing_status"> = (_, info) =>
  info.filingStatus ? CA_FILING_STATUS_OPTION[info.filingStatus] : undefined;

// MANUAL EDIT: line 5, the year the spouse/RDP died (identity.spouse.year_of_death).
export const line5SpouseRdpYearOfDeath: Form540Line<"header.spouse_rdp_year_of_death"> = (
  _,
  info,
) => (info.filingStatus === "qualifying_surviving_spouse" ? info.spouseYearOfDeath : undefined);

export const line3MfsSpouseRdpName: Form540Line<"header.mfs_spouse_rdp_name_and_ssn"> = (
  _,
  info,
) =>
  info.filingStatus === "married_filing_separately" && info.spouseFirstName && info.spouseLastName
    ? `${info.spouseFirstName} ${info.spouseLastName}`
    : undefined;

// MANUAL EDIT: page 2 reprints the taxpayer's full name.
export const page2TaxpayerName: Form540Line<"page2.taxpayer_name"> = (_, info) =>
  info.taxpayerFirstName && info.taxpayerLastName
    ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
    : undefined;
export const page2TaxpayerSsn: Form540Line<"page2.taxpayer_ssn"> = (_, info) => info.taxpayerSSN;
