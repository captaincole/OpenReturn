/*
 * Form 7218, the section 45Z clean fuel production credit. "File a separate
 * Form 7218 for each qualified facility for which you claim the section 45Z
 * credit" (irs-7218-inst-2025::sec::how-to-claim-the-credit::b02): one fact is
 * one facility, with its Part I answers and one sale for each Part III row.
 * The taxpayer states each answer from the facility's records, the producer
 * registration letter and the emissions rate table (Notice 2025-11) or a
 * provisional emissions rate. A facility of a sole proprietorship or a farm is
 * the taxpayer's own; a credit from a partnership, an S corporation, an estate
 * or a trust comes on the K-1 (box 15 or 13 code X, box 13 code L), and a
 * cooperative's (Form 1099-PATR box 12) is a stated Form 3800 line 1q credit
 * that names the cooperative's EIN.
 */

import type { CreditTransfer, PassiveCreditActivity } from "./generalBusinessCredit.js";

type FactRow = { key: string; value: unknown; category: string };

/*
 * One Part III row: one kind of fuel, from one feedstock, at one emissions
 * rate, sold in 2025 (irs-7218-inst-2025::sec::part-iii-clean-aviation-and::b01 to ::b03).
 */
export interface CleanFuelSale {
  /* Column (a): the type of fuel, as Notice 2025-10 names it ("Ethanol", "Renewable natural gas"). */
  fuelType: string;
  /* Column (a) also says SAF or non-SAF: sustainable aviation fuel sold for use in an aircraft. */
  sustainableAviationFuel: boolean;
  /* Column (b): the feedstock ("Corn", "Dairy manure"). */
  feedstock: string;
  /* Column (d): the emissions rate, or the provisional emissions rate (PER), in kg of CO2e per mmBTU. */
  emissionsRate: number;
  /* Line 6: the rate in column (d) is a PER the IRS determined on a petition. Absent: no. */
  provisionalEmissionsRate?: boolean;
  /*
   * The gallons (or gallon equivalents) produced at the facility after 2024
   * and sold by the taxpayer in 2025 to an unrelated person for use in a fuel
   * mixture or a trade or business, or for retail sale into a fuel tank
   * (irs-7218-inst-2025::sec::how-to-claim-the-credit::b01, qualified-facility::b01,
   * ::b02). With more than one owner, the taxpayer's share of them.
   */
  gallons: number;
  /*
   * The part of gallons produced before the date of the registration letter
   * (line 5b): "No clean fuel production credit can be claimed for any
   * transportation fuel unless the taxpayer is registered ... at the time of
   * production" (irs-7218-inst-2025::sec::line-5b::b01). Asked when the letter
   * is dated after January 1, 2025.
   */
  gallonsProducedBeforeRegistration?: number;
  /*
   * SAF only: the unrelated party certification that section
   * 45Z(f)(1)(A)(i)(II)(aa) requires (irs-7218-inst-2025::sec::sustainable-aviation-fuel-saf::b01).
   * Without it the row earns no credit.
   */
  unrelatedPartyCertification?: boolean;
}

export interface CleanFuelFacilityFactValue {
  /* Line 2a. */
  description: string;
  /* Line 2b: only when the owner is not the filer. */
  owner?: { name: string; tin: string };
  /* Line 2c, on its two printed lines. */
  address?: { line1: string; line2?: string };
  /* Line 2d: decimal degrees, north and east positive. */
  coordinates?: { latitude: number; longitude: number };
  /* Line 3, YYYY-MM-DD. */
  constructionBegan: string;
  /* Line 4, YYYY-MM-DD: the date the facility was originally placed in service. */
  placedInService: string;
  /* Lines 5a and 5b: the producer registration number and the date (YYYY-MM-DD) of the letter with activity letter CN or CA. */
  registration: { number: string; approvalDate: string };
  /*
   * Line 7: the facility satisfies the section 45Z(f)(6) prevailing wage and
   * 45Z(f)(7) apprenticeship requirements (irs-7218-inst-2025::sec::line-7::b01),
   * which sets the increased applicable amount in column (g).
   */
  meetsWageAndApprenticeship: boolean;
  /*
   * A credit under section 45V, 45Q, or section 48 for a specified clean
   * hydrogen facility (a section 48(a)(15) election) is allowed for the
   * facility this year: it is then not a qualified facility
   * (irs-7218-inst-2025::sec::qualified-facility::b01) and files no Form 7218.
   */
  otherFacilityCreditAllowed: boolean;
  /* Part III, one row each, in the order recorded. */
  sales: CleanFuelSale[];
  /* From an activity that is passive for the taxpayer: Form 3800 column (d), Form 8582-CR. */
  passive: boolean;
  passiveActivity?: PassiveCreditActivity;
  /* A section 6418 transfer of part of the credit (irs-7218-inst-2025::sec::emissions-factor::b03); its registration number is line 1. */
  transfer?: CreditTransfer;
}

export interface CleanFuelFacilityFact {
  key: string;
  value: CleanFuelFacilityFactValue;
}

const CREDIT_CATEGORY = "other";
const FACILITY_PREFIX = "clean_fuel_facility.";

export const makeCleanFuelFacilityFactKey = (slug: string) => `${FACILITY_PREFIX}${slug}`;

export const isCleanFuelFacilityFactKey = (key: string) =>
  key.startsWith(FACILITY_PREFIX) &&
  key.length > FACILITY_PREFIX.length &&
  !key.slice(FACILITY_PREFIX.length).includes(".");

/* Every facility fact, in the order recorded: the order of the Forms 7218. */
export function getCleanFuelFacilityFacts(facts: ReadonlyArray<FactRow>): CleanFuelFacilityFact[] {
  return facts
    .filter((row) => row.category === CREDIT_CATEGORY && isCleanFuelFacilityFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as CleanFuelFacilityFactValue }));
}
