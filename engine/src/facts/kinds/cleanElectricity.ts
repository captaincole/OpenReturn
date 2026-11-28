/*
 * Form 7211, the section 45Y clean electricity production credit. "Taxpayers
 * ... that own and operate a qualified facility must file a separate Form 7211
 * for each qualified facility" (irs-7211-inst-2025::sec::general-instructions::b01):
 * one facility fact is one Form 7211, with its Part I answers and the
 * electricity it produced and sold in 2025. The taxpayer states each answer
 * from the facility's records (meter readings, the utility's statements, the
 * bond loan statement); no IRS form reports them.
 *
 * A credit from a partnership, S corporation, estate or trust is not a facility
 * fact: it is the K-1's box (code W, or code E for a trust), and Form 7211
 * prints it on a separate form's line 10 only next to a facility the taxpayer
 * owns (irs-7211-inst-2025::sec::line-10::b01).
 */

import type { CreditTransfer, PassiveCreditActivity } from "./generalBusinessCredit.js";
import type { CreditFinancing } from "./investmentCredit.js";

type FactRow = { key: string; value: unknown; category: string };

/* Line 5: a provisional emissions rate petition (irs-7211-inst-2025::sec::process-for-filing-a-provisional::b01). */
export interface ProvisionalEmissionsRate {
  /* Line 5(i): DOE gave an emissions value. */
  valueFromDoe: boolean;
  /* Line 5(ii): a designated LCA model recommended one. */
  lcaModel: boolean;
  /* Line 6. */
  doeControlNumber?: string;
}

export interface CleanElectricityFacilityFactValue {
  /* Line 2b: the technical description ("900 kW ac ground-mounted solar array"). */
  description: string;
  /* Line 2b: the facility's address. */
  address: string;
  /* Line 2c: decimal degrees, north and east positive. */
  coordinates?: { latitude: number; longitude: number };
  /* Line 2a: only when the owner is not the filer. */
  owner?: { name: string; tin: string };
  /* Line 3, YYYY-MM-DD: the beginning of construction (physical work test or 5% safe harbor). */
  constructionBegan: string;
  /* Line 4, YYYY-MM-DD: the date the facility was originally placed in service. */
  placedInService: string;
  /* Lines 5 and 6; absent when the taxpayer filed no petition. */
  provisionalEmissionsRate?: ProvisionalEmissionsRate;
  /* Line 7a: the maximum net output is less than 1 megawatt (ac). */
  netOutputUnder1Mw: boolean;
  /* Line 7c: the prevailing wage and apprenticeship requirements are met (Form 7220 is filed). */
  prevailingWageAndApprenticeship: boolean;
  /* Line 8: the facility is in an energy community (section 45Y(g)(7)). */
  energyCommunity: boolean;
  /* Line 9: the domestic content requirement is met and certified (section 45Y(g)(11)). */
  domesticContent: boolean;
  /*
   * Part II line 1, column (a): the kWh produced at the facility and sold to an
   * unrelated person in calendar year 2025, or, with a meter an unrelated person
   * owns and operates, sold, consumed or stored in 2025
   * (irs-7211-inst-2025::sec::how-to-claim-the-credit::b01).
   */
  kilowattHours: number;
  /* Line 6a; absent when no tax-exempt bond financed the facility. */
  financing?: CreditFinancing;
  /*
   * "You can't claim a section 45Y credit for the same qualified facility for
   * which you are claiming a credit under section 45, 45J, 45Q, 45U, 48, 48A,
   * or 48E for the tax year or any prior tax year"
   * (irs-7211-inst-2025::sec::how-to-claim-the-credit::b01): true when one was
   * claimed for this facility.
   */
  otherCreditClaimed: boolean;
  /* From an activity that is passive for the taxpayer: Form 3800 column (d), Form 8582-CR. */
  passive: boolean;
  passiveActivity?: PassiveCreditActivity;
  /*
   * A section 6418 transfer of the credit (irs-7211-inst-2025::sec::applicable-amount::b07).
   * Line 1 prints its registration number (irs-7211-inst-2025::sec::line-1::b01).
   */
  transfer?: CreditTransfer;
  /* A section 6417 elective payment election: for applicable entities only. */
  electivePayment?: { amount: number; registrationNumber: string };
}

export interface CleanElectricityFacilityFact {
  key: string;
  value: CleanElectricityFacilityFactValue;
}

const FACILITY_CATEGORY = "other";
const FACILITY_PREFIX = "clean_electricity.facility.";

export const makeCleanElectricityFacilityFactKey = (slug: string) => `${FACILITY_PREFIX}${slug}`;

export const isCleanElectricityFacilityFactKey = (key: string) =>
  key.startsWith(FACILITY_PREFIX) &&
  key.length > FACILITY_PREFIX.length &&
  !key.slice(FACILITY_PREFIX.length).includes(".");

/* Every facility fact, in the order recorded: the order of the Forms 7211. */
export function getCleanElectricityFacilityFacts(
  facts: ReadonlyArray<FactRow>,
): CleanElectricityFacilityFact[] {
  return facts
    .filter(
      (row) => row.category === FACILITY_CATEGORY && isCleanElectricityFacilityFactKey(row.key),
    )
    .map((row) => ({ key: row.key, value: row.value as CleanElectricityFacilityFactValue }));
}
