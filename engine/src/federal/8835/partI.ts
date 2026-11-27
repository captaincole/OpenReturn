/*
 * Form 8835 Part I, the facility (irs-8835-face-2025::sec::face-part-i::b01,
 * ::b02). "If you are claiming a production credit for a qualified facility
 * ... on Part II, lines 1a–1j, you must complete Part I"
 * (irs-8835-inst-2025::sec::specific-instructions::b01). Every cell is keyed
 * by its widget name after "0.part1.".
 */

import type {
  RenewableElectricityFacilityFactValue,
  RenewableFacilityCapacity,
  RenewableResource,
} from "../../facts/index.js";
import { ISODate, isoDate } from "../../values.js";
import { coordinate, LATITUDE_DIGITS, LONGITUDE_DIGITS } from "../3468/partI.js";
import {
  FIRST_DAY_2023,
  INCREASED_CREDIT_CONSTRUCTION_CUTOFF,
  isBiomass,
  placedInServiceAfter2021,
  type Lines,
} from "./lines.js";

/* Line 2a of the separate form for K-1 credits: "enter 'Credits From Pass-Through Entities' on line 2a of Part I" (line-14::b01). */
export const PASS_THROUGH_TYPE = "Credits From Pass-Through Entities";

/* Line 2a when the fact gives no description: the resource as Part II names it (face-part-ii::b01). */
export const RESOURCE_NAMES: Readonly<Record<RenewableResource, string>> = {
  wind: "Wind",
  closed_loop_biomass: "Closed-loop biomass",
  geothermal: "Geothermal",
  solar: "Solar",
  offshore_wind: "Offshore wind facility",
  open_loop_biomass: "Open-loop biomass",
  landfill_gas: "Landfill gas",
  trash: "Trash",
  hydropower: "Hydropower",
  marine_hydrokinetic: "Marine and hydrokinetic renewables",
};

const usDate = (date: string) => ISODate.usSlash(isoDate(date));
const kwText = (kw: number | undefined) => (kw === undefined ? undefined : String(kw));

/* Line 8b applies by the date on line 4. */
export const beganBeforeIncreasedCutoff = (value: RenewableElectricityFacilityFactValue) =>
  value.constructionBegan < INCREASED_CREDIT_CONSTRUCTION_CUTOFF;

/* Domestic content: "For qualified facilities placed in service after 2022" (irs-8835-inst-2025::sec::domestic-content::b01). */
export const domesticContentApplies = (value: RenewableElectricityFacilityFactValue) =>
  value.placedInService >= FIRST_DAY_2023;

/*
 * Line 8, which "Applies to facilities placed in service after December 31,
 * 2021" (line-8::b01): each "Yes" box the answers show (8a, 8b, 8c), or 8d
 * when none does. Undefined for an earlier facility.
 */
export function line8Boxes(value: RenewableElectricityFacilityFactValue): Lines | undefined {
  if (!placedInServiceAfter2021(value.placedInService)) return undefined;
  const boxes: Lines = {
    "8a_output_under_1_megawatt": value.netOutputUnder1Mw === true ? true : undefined,
    "8b_construction_before_2023_01_29": beganBeforeIncreasedCutoff(value) ? true : undefined,
    "8c_meets_wage_apprenticeship":
      value.meetsPrevailingWageAndApprenticeship === true ? true : undefined,
  };
  if (Object.values(boxes).some((box) => box === true)) return boxes;
  // No box yet while an answer that could check 8a or 8c is missing (the copy waits).
  if (line8AnswerMissing(value)) return {};
  return { "8d_not_qualified_facility": true };
}

/* Line 8 waits: 8b does not apply and the 8a or 8c answer that decides it is missing. */
export function line8AnswerMissing(value: RenewableElectricityFacilityFactValue): boolean {
  if (!placedInServiceAfter2021(value.placedInService) || beganBeforeIncreasedCutoff(value)) {
    return false;
  }
  if (value.netOutputUnder1Mw === undefined) return true;
  return (
    value.netOutputUnder1Mw === false && value.meetsPrevailingWageAndApprenticeship === undefined
  );
}

/* A "Yes" box of line 8 is checked: line 9 multiplies by 5. */
export function increasedCredit(value: RenewableElectricityFacilityFactValue): boolean {
  const boxes = line8Boxes(value);
  return (
    boxes !== undefined &&
    Object.values(boxes).some((box) => box === true) &&
    boxes["8d_not_qualified_facility"] === undefined
  );
}

/* Line 9a or 9b: the bonus only after 2022, and then by the answer. */
export const qualifiesDomesticContent = (value: RenewableElectricityFacilityFactValue): boolean =>
  domesticContentApplies(value) && value.domesticContent === true;

/*
 * DECISION (2026-11-27, by the author): a facility placed in service before
 * 2022 checks line 10c, Not applicable, and takes no energy community bonus.
 * - The instructions give the bonus with no date: "In the case of any
 *   qualified facility that is located in an energy community, the amount of
 *   the credit ... is increased by 10%"
 *   (irs-8835-inst-2025::sec::increased-credit-in-energy-communities::b01).
 * - The same instructions: "IRA 2022 generally provides that the amendments to
 *   section 45 apply to facilities placed in service after 2021"
 *   (irs-8835-inst-2025::sec::qualified-facilities::b01); the bonus is one of
 *   them, and line 8 next to it "Applies to facilities placed in service after
 *   December 31, 2021" (line-8::b01).
 * The engine follows the general rule of the instructions for every IRA
 * bonus, so a pre-2022 facility at the full 3.0-cent rate takes no 10% on top.
 */
export const qualifiesEnergyCommunity = (value: RenewableElectricityFacilityFactValue): boolean =>
  placedInServiceAfter2021(value.placedInService) && value.energyCommunity === "yes";

/* Line 9: 9a when the bonus applies and is met; 9b for "No" and for a facility placed in service before 2023. */
function line9Box(value: RenewableElectricityFacilityFactValue): Lines {
  if (qualifiesDomesticContent(value)) return { "9a_domestic_content_bonus_yes": true };
  if (domesticContentApplies(value) && value.domesticContent === undefined) return {};
  return { "9b_domestic_content_bonus_no": true };
}

function line10Box(value: RenewableElectricityFacilityFactValue): Lines {
  if (!placedInServiceAfter2021(value.placedInService)) {
    return { "10c_energy_community_not_applicable": true };
  }
  const table: Record<string, string> = {
    yes: "10a_energy_community_bonus_yes",
    no: "10b_energy_community_bonus_no",
    not_applicable: "10c_energy_community_not_applicable",
  };
  const answer = value.energyCommunity;
  return answer === undefined ? {} : { [table[answer]!]: true };
}

/* Lines 11 and 12: each capacity stated, or the Not applicable box. */
function capacityLines(capacity: RenewableFacilityCapacity | undefined): Lines {
  const { solarDcKw, solarAcKw, windAcKw, otherAcKw } = capacity ?? {};
  const line11: Lines =
    solarDcKw === undefined
      ? { "11b_dc_capacity_not_applicable": true }
      : { "11a_solar_dc_capacity_checkbox": true, "11a_solar_dc_capacity_kw": kwText(solarDcKw) };
  const none = [solarAcKw, windAcKw, otherAcKw].every((kw) => kw === undefined);
  if (none) return { ...line11, "12d_ac_capacity_not_applicable": true };
  const box = (kw: number | undefined) => (kw === undefined ? undefined : true);
  return {
    ...line11,
    "12a_solar_ac_capacity_checkbox": box(solarAcKw),
    "12a_solar_ac_capacity_kw": kwText(solarAcKw),
    "12b_wind_ac_capacity_checkbox": box(windAcKw),
    "12b_wind_ac_capacity_kw": kwText(windAcKw),
    "12c_other_ac_capacity_checkbox": box(otherAcKw),
    "12c_other_ac_capacity_kw": kwText(otherAcKw),
  };
}

/* Line 6: the stated answer for a biomass facility; "No" for every other resource. */
function line6Box(value: RenewableElectricityFacilityFactValue): Lines {
  const answer = isBiomass(value.resource) ? value.biomassExpansion : false;
  if (answer === undefined) return {};
  return answer ? { "6_biomass_expansion_yes": true } : { "6_biomass_expansion_no": true };
}

/* Part I of one facility's copy. */
export function partILines(value: RenewableElectricityFacilityFactValue): Lines {
  const coordinates = value.coordinates;
  return {
    // Line 1: the pre-filing registration number of a transfer election (line-1::b01).
    "1_irs_registration_number": value.transfer?.registrationNumber,
    "2a_facility_type": value.description ?? RESOURCE_NAMES[value.resource],
    "2b_owner_name": value.owner?.name,
    "2b_owner_tin": value.owner?.tin,
    "3a_facility_address": value.address,
    ...(coordinates && coordinate("3b_latitude", coordinates.latitude, LATITUDE_DIGITS)),
    ...(coordinates && coordinate("3b_longitude", coordinates.longitude, LONGITUDE_DIGITS)),
    "4_date_construction_began": usDate(value.constructionBegan),
    "5_date_placed_in_service": usDate(value.placedInService),
    ...line6Box(value),
    ...line8Boxes(value),
    ...line9Box(value),
    ...line10Box(value),
    ...capacityLines(value.capacity),
  };
}
