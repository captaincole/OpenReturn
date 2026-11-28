/*
 * Part I, the facility (irs-7218-face-2025::sec::face-part-i::b01, ::b02;
 * irs-7218-inst-2025::sec::specific-instructions::b01 to line-7::b01). Every
 * cell is keyed by its catalog field.
 */

import type { CleanFuelFacilityFactValue } from "../../facts/index.js";
import { roundToPlaces, wholePart } from "../../money.js";
import { ISODate, isoDate } from "../../values.js";
import { PART_I, type Cells } from "./cells.js";

/* "On a separate Form 7218 enter 'Credits from Pass-Through Entities' on line 2a" (part-ii-clean-aviation-and::b01). */
export const PASS_THROUGH_DESCRIPTION = "Credits from Pass-Through Entities";

const COORDINATE_PLACES = 6;
/* The comb boxes of line 2d: 2 for the latitude's degrees, 3 for the longitude's, 6 after the point. */
const LATITUDE_DIGITS = 2;
const LONGITUDE_DIGITS = 3;

const usDate = (date: string) => ISODate.usSlash(isoDate(date));

/* Line 2d: the sign box, the whole degrees filling their boxes, and the digits after the point. */
function coordinate(name: string, degrees: number, wholeDigits: number): Cells {
  const size = roundToPlaces(Math.abs(degrees), COORDINATE_PLACES);
  const [, decimal] = String(size).split(".");
  const prefix = `${PART_I}2d_${name}`;
  return {
    [`${prefix}_sign`]: degrees < 0 ? "-" : "+",
    [`${prefix}_degrees`]: String(wholePart(size)).padStart(wholeDigits, "0"),
    [`${prefix}_decimal`]: (decimal ?? "").padEnd(COORDINATE_PLACES, "0"),
  };
}

/*
 * Line 1: "If applicable, enter the IRS-issued registration number for the
 * facility" for an elective payment or transfer election (specific-instructions::b01);
 * an individual makes only the transfer election (QUESTIONS.md item 6).
 */
function registrationNumberOf(facility: CleanFuelFacilityFactValue): string | undefined {
  return facility.transfer?.direction === "sold" ? facility.transfer.registrationNumber : undefined;
}

/* Lines 1 to 7 of one facility; line 6 when a printed row uses a provisional emissions rate. */
export function partIOf(facility: CleanFuelFacilityFactValue, provisional: boolean): Cells {
  const { owner, address, coordinates } = facility;
  const wageRules = facility.meetsWageAndApprenticeship ? "yes" : "no";
  return {
    [`${PART_I}1_facility_registration_number`]: registrationNumberOf(facility),
    [`${PART_I}2a_facility_description`]: facility.description,
    [`${PART_I}2b_owner_name`]: owner?.name,
    [`${PART_I}2b_owner_tin`]: owner?.tin,
    [`${PART_I}2c_facility_address_line1`]: address?.line1,
    [`${PART_I}2c_facility_address_line2`]: address?.line2,
    ...(coordinates && coordinate("latitude", coordinates.latitude, LATITUDE_DIGITS)),
    ...(coordinates && coordinate("longitude", coordinates.longitude, LONGITUDE_DIGITS)),
    [`${PART_I}3_date_construction_began`]: usDate(facility.constructionBegan),
    [`${PART_I}4_date_placed_in_service`]: usDate(facility.placedInService),
    [`${PART_I}5a_producer_registration_number`]: facility.registration.number,
    [`${PART_I}5b_registration_approval_date`]: usDate(facility.registration.approvalDate),
    [`${PART_I}6_provisional_emissions_rate`]: provisional || undefined,
    [`${PART_I}7_prevailing_wage_apprenticeship_${wageRules}`]: true,
  };
}

/* Part I of the separate form for the pass-through credits: line 2a only. */
export const passThroughPartI = (): Cells => ({
  [`${PART_I}2a_facility_description`]: PASS_THROUGH_DESCRIPTION,
});
