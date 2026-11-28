/*
 * Form 7213, the nuclear power production credit. "You must file a separate
 * Form 7213 for each advanced nuclear power facility or each qualified nuclear
 * power facility" (irs-7213-inst-2025::sec::who-must-file::b01): one fact is
 * one facility the taxpayer owns, or an undivided share of one, and one Form
 * 7213. Part I (section 45J) or Part II (section 45U) figures its credit. The
 * taxpayer states each answer from the facility's records, the IRS acceptance
 * letter (Notice 2023-24) and the NRC license; no official form holds them.
 *
 * A credit on a Schedule K-1 is not stated here: the K-1 fact holds it
 * (box 15 codes A and B, passThrough), and Form 3800 takes it directly
 * (who-must-file::b01).
 */

import type { CreditTransfer, PassiveCreditActivity } from "./generalBusinessCredit.js";

type FactRow = { key: string; value: unknown; category: string };

/* Part I lines 1a to 2b, Part II lines 2a to 3b. */
export interface NuclearFacilityIdentity {
  /* Line 1a (Part I) or 2a (Part II): the name, or a technical description (line-1a::b01). */
  name: string;
  /* Line 1b or 2b: only when the owner is not the filer. */
  owner?: { name: string; tin: string };
  /* Line 2a or 3a, "if applicable". */
  address?: { street: string; city: string; state: string; zip: string };
  /* Line 2b or 3b: decimal degrees, north and east positive. */
  coordinates?: { latitude: number; longitude: number };
}

/* Part I: an advanced nuclear power facility, section 45J. */
export interface AdvancedNuclearCredit {
  section: "45J";
  /* Line 3, YYYY-MM-DD. */
  constructionBegan: string;
  /* Line 4, YYYY-MM-DD: the 8-year credit period starts here. */
  placedInService: string;
  /* Line 5: the nameplate capacity of the whole facility, MW. */
  nameplateCapacityMw: number;
  /*
   * Line 6: "the portion of the total nameplate capacity of the qualified
   * facility that is equal to your ownership share" (line-6::b01), MW. The
   * whole facility for a sole owner.
   */
  ownedNameplateCapacityMw: number;
  /* Line 7, YYYY-MM-DD: the IRS acceptance letter (Notice 2023-24, section 6.05). */
  acceptanceLetterDate: string;
  /* Section 2 line 1: the facility limitation the letter allocates to the taxpayer, MW. */
  facilityLimitationMw: number;
  /* Line 8: an owner, or an eligible project partner under section 45J(e)(2)(B). */
  role: "owner" | "eligible_project_partner";
  /* Line 9: owned through an organization with a valid section 761(a) election. */
  section761aElection: boolean;
  /*
   * Section 2 line 4: the kilowatt hours the taxpayer produced at the facility
   * during its 8-year period and sold to unrelated persons during 2025 (the
   * taxpayer's share for a co-owner; qualifying electricity,
   * credit-for-the-production-of-electricity::b02).
   */
  kwhProducedAndSold: number;
}

/* Part II: a qualified nuclear power facility, section 45U. */
export interface ZeroEmissionNuclearCredit {
  section: "45U";
  /* YYYY-MM-DD: Part II is only for a facility placed in service before August 16, 2022. */
  placedInService: string;
  /* Section 1 line 4: the NRC permit or license number (line-4-2::b01). */
  nrcLicenseNumber: string;
  /* Section 2 line 1: kilowatt hours produced at the facility and sold to unrelated persons during 2025. */
  kwhProducedAndSold: number;
  /* Line 4: gross receipts from that electricity, including ZEC program payments (line-4-3::b01). */
  grossReceipts: number;
  /* Line 5: the ZEC program payments included in grossReceipts; absent means none. */
  zecPayments?: number;
  /*
   * Line 6: the full credit (figured without the ZEC exclusion) is used to
   * reduce the ZEC program payments, so line 6 leaves them out. Asked only
   * when zecPayments is above 0.
   */
  zecPaymentsReducedByFullCredit?: boolean;
  /* Line 11: the prevailing wage requirements are met for every alteration or repair (special-rule::b01). */
  prevailingWage: boolean;
  /*
   * A section 6418 transfer of the credit (Form 3800 Part III line 1u, column
   * (f)). Its registration number prints on Section 1 line 1, the facility's
   * IRS pre-filing registration number (line-1-2::b01).
   */
  transfer?: CreditTransfer;
  /* A section 6417 elective payment election: only an applicable entity makes it. */
  electivePayment?: { amount: number; registrationNumber: string };
}

export interface NuclearFacilityFactValue {
  facility: NuclearFacilityIdentity;
  credit: AdvancedNuclearCredit | ZeroEmissionNuclearCredit;
  /* From an activity that is passive for the taxpayer: Form 3800 column (d), Form 8582-CR. */
  passive: boolean;
  passiveActivity?: PassiveCreditActivity;
}

export interface NuclearFacilityFact {
  key: string;
  value: NuclearFacilityFactValue;
}

const FACILITY_CATEGORY = "other";
const FACILITY_PREFIX = "nuclear_facility.";

export const makeNuclearFacilityFactKey = (slug: string) => `${FACILITY_PREFIX}${slug}`;

export const isNuclearFacilityFactKey = (key: string) =>
  key.startsWith(FACILITY_PREFIX) &&
  key.length > FACILITY_PREFIX.length &&
  !key.slice(FACILITY_PREFIX.length).includes(".");

/* Every facility fact, in the order recorded: the order of the Forms 7213. */
export function getNuclearFacilityFacts(facts: ReadonlyArray<FactRow>): NuclearFacilityFact[] {
  return facts
    .filter((row) => row.category === FACILITY_CATEGORY && isNuclearFacilityFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as NuclearFacilityFactValue }));
}
