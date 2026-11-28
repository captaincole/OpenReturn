/*
 * One copy of Form 7207 as cells: the catalog field id after "form-7207." →
 * the value it prints ("0.part2.1a_thin_film_pv_cell_col_e" → 14000).
 * bindings.ts reads every field from these keys. This file holds Part I, the
 * facility (irs-7207-inst-2025::sec::specific-instructions::b01: "you must
 * complete Part I—Facility Information").
 */

import type { AdvancedManufacturingFacilityFactValue } from "../../facts/index.js";
import { roundToPlaces, wholePart } from "../../money.js";
import type { Unsupported } from "../../types.js";
import { ISODate, isoDate } from "../../values.js";

export type CellValue = number | string | boolean | Unsupported | undefined;
export type Cells = Record<string, CellValue>;

/* Line 2 of the separate form for pass-through credits (irs-7207-inst-2025::sec::line-7::b01). */
export const PASS_THROUGH_LINE_2 = "Credits From Pass-Through Entities";
const LINE_2_FIELD = "0.part1.2_facility_placed_in_service_date";

/* The comb boxes of line 4: 2 for the latitude's degrees, 3 for the longitude's, 6 after the point. */
const LATITUDE_DIGITS = 2;
const LONGITUDE_DIGITS = 3;
const COORDINATE_PLACES = 6;

/* Line 4 (line-4::b01, "Enter the coordinates of the facility"): the sign box, the whole degrees, the digits after the point. */
function coordinate(prefix: string, degrees: number, wholeDigits: number): Cells {
  const size = roundToPlaces(Math.abs(degrees), COORDINATE_PLACES);
  const [, decimal] = String(size).split(".");
  return {
    [`${prefix}_sign`]: degrees < 0 ? "-" : "+",
    [`${prefix}_degrees`]: String(wholePart(size)).padStart(wholeDigits, "0"),
    [`${prefix}_decimal`]: (decimal ?? "").padEnd(COORDINATE_PLACES, "0"),
  };
}

/* A Yes/No pair: the box that applies is checked, the other left blank. */
const yesNo = (prefix: string, answer: boolean): Cells =>
  answer ? { [`${prefix}_yes`]: true } : { [`${prefix}_no`]: true };

/*
 * Line 1: "If making an elective payment election or transfer election, enter
 * the IRS-issued registration number of the facility" (face Part I line 1;
 * line-1::b01). Lines 2 to 6 from the facility's answers.
 */
export function facilityPartI(facility: AdvancedManufacturingFacilityFactValue): Cells {
  const registration =
    facility.transfer?.registrationNumber ?? facility.electivePayment?.registrationNumber;
  const coordinates = facility.coordinates;
  return {
    "0.part1.1_facility_registration_number": registration,
    [LINE_2_FIELD]: ISODate.usSlash(isoDate(facility.placedInService)),
    "0.part1.3a_facility_address": facility.address,
    "0.part1.3b_owner_name": facility.owner?.name,
    "0.part1.3b_owner_tin": facility.owner?.tin,
    ...(coordinates && coordinate("0.part1.4_latitude", coordinates.latitude, LATITUDE_DIGITS)),
    ...(coordinates && coordinate("0.part1.4_longitude", coordinates.longitude, LONGITUDE_DIGITS)),
    ...yesNo("0.part1.5_section_45x_a3b_election", facility.relatedPersonElection),
    ...yesNo("0.part1.6_section_48c_facility", facility.section48cProperty),
  };
}

/* The separate form's Part I: only line 2 names it (line-7::b01). */
export const passThroughPartI = (): Cells => ({ [LINE_2_FIELD]: PASS_THROUGH_LINE_2 });
