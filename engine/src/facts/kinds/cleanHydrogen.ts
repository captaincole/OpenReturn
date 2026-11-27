/*
 * Form 7210, the clean hydrogen production credit (section 45V). "File a
 * separate Form 7210 for each qualified clean hydrogen production facility
 * for which you claim the section 45V credit"
 * (irs-7210-inst-2025::sec::how-to-claim-the-credit::b01): one facility fact is
 * one Form 7210. The taxpayer states each answer from the facility's records,
 * its verification report and its 45VH2-GREET emissions rate; no information
 * return reports them.
 *
 * A credit on a partnership or S corporation K-1 (box 15 or box 13, code Y) is
 * not stated here: the K-1 fact holds it (passThrough, the business_credit items).
 */

import type { CreditTransfer, PassiveCreditActivity } from "./generalBusinessCredit.js";
import type { CreditFinancing } from "./investmentCredit.js";

type FactRow = { key: string; value: unknown; category: string };

/* One hydrogen production process of the facility: "Only one emissions rate should be used to calculate the credit for each hydrogen production process" (irs-7210-inst-2025::sec::line-7::b01). */
export interface HydrogenProductionProcess {
  /*
   * Line A(i): the process's lifecycle greenhouse gas emissions rate, kg of
   * CO2e per kg of hydrogen, from 45VH2-GREET or a provisional emissions rate
   * (irs-7210-inst-2025::sec::specific-instructions::b01). Above 4.0 the
   * hydrogen is not qualified clean hydrogen (apprenticeship-requirements::b02).
   */
  emissionsRate: number;
  /* Line A(ii): the DOE control number of an emissions value for a provisional rate, "if applicable". */
  doeControlNumber?: string;
  /*
   * Column (a): the kilograms of qualified clean hydrogen the process produced
   * in 2025, within the facility's 10-year credit period: produced in the
   * United States for sale or use in the taxpayer's trade or business, with the
   * production and sale or use verified by an unrelated party
   * (how-to-claim-the-credit::b01).
   */
  kilograms: number;
}

export interface CleanHydrogenFacilityFactValue {
  /* Line 2a: the facility's address. */
  address: string;
  /* Line 2a: the facility's name or a detailed technical description. */
  description: string;
  /* Line 2: only when the owner is not the filer (a disregarded entity that holds it). */
  owner?: { name: string; tin: string };
  /* Line 2b: decimal degrees, north and east positive. */
  coordinates?: { latitude: number; longitude: number };
  /* Line 1: the IRS-issued pre-filing registration number; printed with an election only. */
  registrationNumber?: string;
  /* Line 3, YYYY-MM-DD: construction began (Physical Work Test or Five Percent Safe Harbor); for a modified facility, the modification's. */
  constructionBegan: string;
  /* Line 4, YYYY-MM-DD: originally placed in service; for a facility modified under section 45V(d)(4), the modification's date (line-4::b01). */
  placedInService: string;
  processes: HydrogenProductionProcess[];
  /*
   * Line 5: the prevailing wage requirements are met for the construction and
   * for any alteration or repair in the credit period. For a facility whose
   * construction began before January 29, 2023, only for an alteration or
   * repair after that date, true when there was none
   * (irs-7210-inst-2025::sec::increased-credit-amount-for-qualified-clean::b01).
   */
  prevailingWageMet?: boolean;
  /* Line 5: the apprenticeship requirements are met; asked only for construction from January 29, 2023 (line-5::b02). */
  apprenticeshipMet?: boolean;
  /*
   * The facility includes carbon capture equipment for which a section 45Q
   * credit is allowed to any taxpayer for 2025 or any prior year (not equipment
   * that meets the 80/20 rule with no new section 45Q credit): no section 45V
   * credit (apprenticeship-requirements::b03).
   */
  carbonCaptureCredit?: boolean;
  /*
   * The taxpayer elected under section 48(a)(15) to treat the facility as
   * energy property (Form 3468 Part VI Section M): "No credit will be allowed
   * under section 45V ... for any tax year" (irs-3468-inst-2025::sec::section-m-clean-hydrogen-production::b02).
   */
  energyPropertyElection?: boolean;
  /* Line 8a; absent when no tax-exempt bond financed the facility. */
  financing?: CreditFinancing;
  /* From an activity that is passive for the taxpayer: Form 3800 column (d), Form 8582-CR. */
  passive: boolean;
  passiveActivity?: PassiveCreditActivity;
  /* A section 6418 transfer of all or part of the credit (Form 3800 Part III column (f)). */
  transfer?: CreditTransfer;
  /* A section 6417 elective payment election (Form 3800 Part III column (h)). */
  electivePayment?: { amount: number; registrationNumber: string };
}

export interface CleanHydrogenFacilityFact {
  key: string;
  value: CleanHydrogenFacilityFactValue;
}

const FACILITY_CATEGORY = "other";
const FACILITY_PREFIX = "clean_hydrogen.facility.";

export const makeCleanHydrogenFacilityFactKey = (slug: string) => `${FACILITY_PREFIX}${slug}`;

export const isCleanHydrogenFacilityFactKey = (key: string) =>
  key.startsWith(FACILITY_PREFIX) &&
  key.length > FACILITY_PREFIX.length &&
  !key.slice(FACILITY_PREFIX.length).includes(".");

/* Every facility fact, in the order recorded: the order of the Forms 7210. */
export function getCleanHydrogenFacilityFacts(
  facts: ReadonlyArray<FactRow>,
): CleanHydrogenFacilityFact[] {
  return facts
    .filter((row) => row.category === FACILITY_CATEGORY && isCleanHydrogenFacilityFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as CleanHydrogenFacilityFactValue }));
}
