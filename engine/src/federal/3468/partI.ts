/*
 * Part I, the facility or property (irs-3468-face-2025::sec::face-part-i::b01
 * to face-part-i-2::b02). The instructions' table says which lines each part
 * completes (irs-3468-inst-2025::sec::part-i-information-on-qualified::b02):
 * Parts II, IV and VII lines 1, 3a to 3d, 4, 5 and 13; Part III lines 1, 3a
 * to 3d, 4, 5 and 8; Part V lines 1 and 2b to 13; Part VI lines 1 and 3 to 13
 * (and 2a for section M). Every cell is keyed by its widget's full name.
 */

import type {
  FacilityCapacity,
  InvestmentCreditFacility,
  InvestmentCreditPropertyFactValue,
} from "../../facts/index.js";
import { roundToPlaces, wholePart } from "../../money.js";
import { ISODate, isoDate } from "../../values.js";
import { textOf, yesNo, type CellValue } from "./cells.js";

type Lines = Record<string, CellValue>;

/* Line 3a of the separate form for cooperatives (irs-3468-inst-2025::sec::line-3a::b01). */
export const COOPERATIVES_TYPE = "Unused Investment Credit from Cooperatives";
const COORDINATE_PLACES = 6;

export const usDate = (date: string) => ISODate.usSlash(isoDate(date));

/* The comb boxes of line 3d: 2 for the latitude's degrees, 3 for the longitude's, 6 after the point. */
export const LATITUDE_DIGITS = 2;
export const LONGITUDE_DIGITS = 3;

/* Line 3d (Form 7211 line 2c the same): the sign box, the whole degrees filling their boxes, and the digits after the point. */
export function coordinate(prefix: string, degrees: number, wholeDigits: number): Lines {
  const size = roundToPlaces(Math.abs(degrees), COORDINATE_PLACES);
  const [, decimal] = String(size).split(".");
  return {
    [`${prefix}_sign`]: degrees < 0 ? "-" : "+",
    [`${prefix}_degrees`]: String(wholePart(size)).padStart(wholeDigits, "0"),
    [`${prefix}_decimal`]: (decimal ?? "").padEnd(COORDINATE_PLACES, "0"),
  };
}

/* Lines 1 and 3a to 5: every part. */
function identityLines(value: InvestmentCreditPropertyFactValue): Lines {
  const { facility } = value;
  const registration =
    value.transfer?.registrationNumber ??
    value.electivePayment?.registrationNumber ??
    facility.registrationNumber;
  const coordinates = facility.coordinates;
  return {
    "1_irs_registration_number": registration,
    "3a_property_type": facility.propertyType,
    "3b_i_owner_name": facility.owner?.name,
    "3b_ii_owner_tin": facility.owner?.tin,
    "3c_facility_address": facility.address,
    ...(coordinates && coordinate("3d_i_latitude", coordinates.latitude, LATITUDE_DIGITS)),
    ...(coordinates && coordinate("3d_ii_longitude", coordinates.longitude, LONGITUDE_DIGITS)),
    "4_date_construction_began": usDate(facility.constructionBegan),
    "5_date_placed_in_service": usDate(facility.placedInService),
  };
}

const LINE_7: Record<string, string> = {
  yes: "7a_net_output_under_1mw_yes",
  no: "7b_net_output_under_1mw_no",
  not_applicable: "7c_net_output_not_applicable",
};
const LINE_8: Record<string, string> = {
  yes_48c: "8a_prevailing_wage_yes_48c",
  yes_48_48e: "8b_prevailing_wage_yes_48_48e",
  no: "8c_prevailing_wage_no",
  not_applicable: "8d_prevailing_wage_not_applicable",
};
const LINE_9: Record<string, string> = {
  ten_percent: "9a_domestic_content_yes_10_percent",
  two_percent: "9b_domestic_content_yes_2_percent",
  no: "9c_domestic_content_no",
};
const LINE_10: Record<string, string> = {
  ten_percent: "10a_energy_community_yes_10_percent",
  two_percent: "10b_energy_community_yes_2_percent",
  no: "10c_energy_community_no",
};
const LINE_11: Record<string, string> = {
  low_income_community: "11a_low_income_community",
  indian_land: "11b_indian_land",
  residential_building: "11c_low_income_residential_building",
  economic_benefit: "11d_low_income_economic_benefit",
};

const box = (table: Record<string, string>, answer: string | undefined): Lines =>
  answer === undefined || table[answer] === undefined ? {} : { [table[answer]]: true };

/* Line 12: each capacity stated, or 12e, Not applicable. */
function capacityLines(capacity: FacilityCapacity | undefined): Lines {
  const { solar, windAcKw, other, storage } = capacity ?? {};
  if (!solar && windAcKw === undefined && !other && !storage) return { "12e_not_applicable": true };
  return {
    ...(solar && {
      "12a_solar": true,
      "12a_i_solar_nameplate_capacity_dc": textOf(solar.dcKw),
      "12a_ii_solar_nameplate_capacity_ac": textOf(solar.acKw),
      "12a_iii_solar_tracking_device": solar.trackingDevice === true ? true : undefined,
    }),
    ...(windAcKw !== undefined && {
      "12b_wind": true,
      "12b_wind_nameplate_capacity": textOf(windAcKw),
    }),
    ...(other && {
      "12c_other": true,
      "12c_i_other_type": other.type,
      "12c_ii_other_nameplate_capacity": textOf(other.kw),
      [`12c_iii_kilowatt_type_${other.current}`]: true,
    }),
    ...(storage && {
      "12d_energy_storage": true,
      "12d_i_power_capacity_rating": textOf(storage.powerKw),
      "12d_ii_energy_storage_capacity": textOf(storage.storageKwh),
      ...yesNo("12d_iii_thermal_storage", storage.thermal),
    }),
  };
}

/*
 * Lines 6 and 9 to 12, Parts V and VI.
 *
 * DECISION (2026-11-27, by the author): line 11f prints the originating
 * pass-through entity's EIN on an owner's return too, when an allocation box
 * (11a to 11d) is checked and the property came through an entity.
 * - The form: "Enter the originating pass-through entity's employer
 *   identification number (EIN) (if applicable)" (irs-3468-face-2025::sec::face-part-i::b04).
 * - The instructions: "If you are a pass-through entity, enter the originating
 *   pass-through entity's EIN, if applicable, on line 11f"
 *   (irs-3468-inst-2025::sec::lines-11-and-12-2::b01, ::lines-11-and-12-3::b01).
 * Part III line 1f and Part VII line 1k(ii) ask the owner for the same EIN, so
 * the form's own wording is applied the same way on every part.
 */
function bonusAnswerLines(facility: InvestmentCreditFacility, passThroughEin?: string): Lines {
  const lowIncome = facility.lowIncome;
  const allocation = lowIncome !== undefined && lowIncome !== "no" ? lowIncome : undefined;
  return {
    ...yesNo("6_expansion_existing_facility", facility.expansionOfExistingFacility),
    "3e_qualified_interconnection_property": facility.interconnectionProperty === true || undefined,
    ...box(LINE_9, facility.domesticContent),
    ...box(LINE_10, facility.energyCommunity),
    ...(lowIncome === "no" && { "11g_low_income_communities_no": true }),
    ...(allocation && {
      [LINE_11[allocation.category]]: true,
      "11e_48e_control_number": allocation.controlNumber,
      "11f_pass_through_entity_ein": passThroughEin,
    }),
    ...capacityLines(facility.capacity),
  };
}

/* Line 13: the lessee election, or No. */
function lesseeLines(facility: InvestmentCreditFacility): Lines {
  const lessee = facility.lessee;
  if (lessee === undefined) return { "13_lessee_section_48d_election_no": true };
  return {
    "13_lessee_section_48d_election_yes": true,
    "13a_lessor_name": lessee.lessorName,
    "13b_lessor_address": lessee.lessorAddress,
    "13c_property_description": lessee.propertyDescription,
    "13d_amount_treated_as_acquired": lessee.amountTreatedAsAcquired,
    "13e_income_inclusion_amount": lessee.incomeInclusion,
  };
}

/* Line 2: 2a for Part VI section M, 2b for Part V (line-2a::b01, line-2b::b01). */
function emissionLines(value: InvestmentCreditPropertyFactValue, hydrogen: boolean): Lines {
  const { emissions, provisionalEmissionsRate: per } = value.facility;
  if (hydrogen) {
    return {
      "2a_i_emissions_value_or_rate": emissions?.valueOrRate,
      "2a_ii_doe_control_number": emissions?.doeControlNumber,
    };
  }
  if (value.credit.part !== "clean_electricity" || per === undefined) return {};
  return {
    "2b_i_emissions_value_received": per.valueFromDoe || undefined,
    "2b_ii_designated_lca_model": per.lcaModel || undefined,
    "2b_iii_doe_control_number": per.doeControlNumber,
  };
}

/*
 * Lines 7 and 8: Part III checks 7c and 8a or 8c; section M checks 7c and 8b
 * or 8c (irs-3468-inst-2025::sec::lines-7-and-8-2::b01, ::lines-7-and-8-3::b01).
 *
 * DECISION (2026-11-27, by the author): a Part III form checks line 7c.
 * - The table: Part III completes "Lines 1, 3a, 3b, 3c, 3d, 4, 5, and 8"
 *   (irs-3468-inst-2025::sec::part-i-information-on-qualified::b02), not line 7.
 * - Filers completing Part III: "For line 7, check box 7c. For line 8, check
 *   box 8a or 8c, as appropriate" (::lines-7-and-8-2::b01).
 * The line's own instruction is the specific rule; it changes no amount.
 */
function lines7And8(facility: InvestmentCreditFacility, sevenC: boolean): Lines {
  const seven = sevenC ? "not_applicable" : facility.netOutputUnder1Mw;
  return { ...box(LINE_7, seven), ...box(LINE_8, facility.prevailingWage) };
}

/* Part I of one property's Form 3468, keyed `part1.<widget>`. */
export function partILines(value: InvestmentCreditPropertyFactValue): Lines {
  const { facility, credit } = value;
  const hydrogen =
    credit.part === "energy" && credit.investment.property.section === "clean_hydrogen";
  const lines: Lines = identityLines(value);
  if (credit.part === "advanced_energy") Object.assign(lines, lines7And8(facility, true));
  if (credit.part === "clean_electricity" || credit.part === "energy") {
    Object.assign(lines, emissionLines(value, hydrogen), lines7And8(facility, hydrogen));
    Object.assign(lines, bonusAnswerLines(facility, value.passThroughEin));
  }
  if (credit.part !== "advanced_energy") Object.assign(lines, lesseeLines(facility));
  const out: Lines = {};
  for (const [key, cell] of Object.entries(lines))
    if (cell !== undefined) out[`part1.${key}`] = cell;
  return out;
}

/* Part I of the separate form for cooperatives: only line 3a. */
export const cooperativePartI = (): Lines => ({ "part1.3a_property_type": COOPERATIVES_TYPE });
