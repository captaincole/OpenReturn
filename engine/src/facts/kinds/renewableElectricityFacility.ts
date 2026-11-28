/*
 * Form 8835, the renewable electricity production credit (section 45). "Use a
 * separate Form 8835 to claim the credit for electricity that you produced
 * from certain renewable resources at each qualified facility"
 * (irs-8835-inst-2025::sec::general-instructions::b01): one fact is one
 * facility the taxpayer owns (or, for biomass, leases or operates) through a
 * sole proprietorship, a farm or a rental. The taxpayer states each answer
 * from the facility's records; no official document reports them.
 *
 * A credit allocated on a K-1 is not stated here: the K-1 fact holds it
 * (partnership box 15 and S corporation box 13 code AB), and Form 8835 line 14
 * adds it on a separate copy (irs-8835-inst-2025::sec::line-14::b01).
 */

import type { CreditTransfer, PassiveCreditActivity } from "./generalBusinessCredit.js";
import type { CreditFinancing } from "./investmentCredit.js";

type FactRow = { key: string; value: unknown; category: string };

/* The qualified energy resource: one of Part II lines 1a to 1j (irs-8835-face-2025::sec::face-part-ii::b01). */
export type RenewableResource =
  | "wind"
  | "closed_loop_biomass"
  | "geothermal"
  | "solar"
  | "offshore_wind"
  | "open_loop_biomass"
  | "landfill_gas"
  | "trash"
  | "hydropower"
  | "marine_hydrokinetic";

/* Part I lines 11 and 12, in kW; absent means not applicable (11b, 12d). */
export interface RenewableFacilityCapacity {
  solarDcKw?: number;
  solarAcKw?: number;
  windAcKw?: number;
  otherAcKw?: number;
}

export interface RenewableElectricityFacilityFactValue {
  resource: RenewableResource;
  /* Line 2a: "a technical description of the facility" (lines-2a-and-2b::b01); absent prints the resource. */
  description?: string;
  /* Line 2b: only when the owner is not the filer (a biomass lessee or operator). */
  owner?: { name: string; tin: string };
  /* Line 3a. */
  address?: string;
  /* Line 3b: decimal degrees, north and east positive. */
  coordinates?: { latitude: number; longitude: number };
  /* Line 4, YYYY-MM-DD: the physical work test or the 5% safe harbor (how-to-figure-the-credit::b05). */
  constructionBegan: string;
  /* Line 5, YYYY-MM-DD: the date the facility was originally placed in service. */
  placedInService: string;
  /* Line 6, closed-loop or open-loop biomass only: an expansion of an existing biomass facility. */
  biomassExpansion?: boolean;
  /* Line 8a: maximum net output under 1 megawatt (ac). Asked when line 8b does not apply. */
  netOutputUnder1Mw?: boolean;
  /* Line 8c: the prevailing wage and apprenticeship requirements are met (Form 7220 attached). */
  meetsPrevailingWageAndApprenticeship?: boolean;
  /* Line 9a: the domestic content requirement of section 45(b)(9)(B) is met. */
  domesticContent?: boolean;
  /* Line 10: the facility is in an energy community (section 45(b)(11)(B)). */
  energyCommunity?: "yes" | "no" | "not_applicable";
  capacity?: RenewableFacilityCapacity;
  /*
   * Part II column (a): kilowatt-hours produced at the facility during its
   * 10-year credit period and sold to an unrelated person in 2025
   * (how-to-figure-the-credit::b01).
   */
  kilowattHoursSold: number;
  /*
   * Asked only when the facility's 4-year period from its placed-in-service
   * date ends during 2025: the kilowatt-hours of kilowattHoursSold produced
   * in that period. Line 15 sends that part to Form 3800 line 4e, the rest to
   * line 1f (irs-8835-face-2025::sec::face-part-ii-2::b01).
   */
  kilowattHoursSoldInFirstFourYears?: number;
  /* Line 5a: tax-exempt bonds (section 103) that financed the facility; absent means none. */
  taxExemptBondFinancing?: CreditFinancing;
  /*
   * A section 1603 grant was paid for the facility: "no production credit
   * under section 45 ... is allowed for the property for the tax year in which
   * the grant is made or any subsequent tax year"
   * (coordination-with-department-of-treasury::b01). Such a facility files no Form 8835.
   */
  section1603Grant?: boolean;
  /* From an activity that is passive for the taxpayer: Form 3800 column (d), Form 8582-CR. */
  passive: boolean;
  passiveActivity?: PassiveCreditActivity;
  /* A section 6418 transfer of the credit to an unrelated party (Part I line 1 takes its registration number). */
  transfer?: CreditTransfer;
}

export interface RenewableElectricityFacilityFact {
  key: string;
  value: RenewableElectricityFacilityFactValue;
}

const CREDIT_CATEGORY = "other";
const FACILITY_PREFIX = "renewable_electricity.facility.";

export const makeRenewableElectricityFacilityFactKey = (slug: string) =>
  `${FACILITY_PREFIX}${slug}`;

export const isRenewableElectricityFacilityFactKey = (key: string) =>
  key.startsWith(FACILITY_PREFIX) &&
  key.length > FACILITY_PREFIX.length &&
  !key.slice(FACILITY_PREFIX.length).includes(".");

/* Every facility fact, in the order recorded: the order of the Forms 8835. */
export function getRenewableElectricityFacilityFacts(
  facts: ReadonlyArray<FactRow>,
): RenewableElectricityFacilityFact[] {
  return facts
    .filter(
      (row) => row.category === CREDIT_CATEGORY && isRenewableElectricityFacilityFactKey(row.key),
    )
    .map((row) => ({ key: row.key, value: row.value as RenewableElectricityFacilityFactValue }));
}
