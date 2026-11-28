/*
 * Section 1 of each part: the facility (irs-7213-face-2025::sec::face-part-i::b01,
 * face-part-ii::b01). Part I lines 1a to 9 (line-1a::b01 to line-9::b01),
 * Part II lines 1 to 4 (line-1-2::b01 to line-4-2::b01). Every cell is keyed
 * by its field's short key in catalog.json.
 */

import type {
  AdvancedNuclearCredit,
  NuclearFacilityIdentity,
  ZeroEmissionNuclearCredit,
} from "../../facts/index.js";
import { roundToPlaces, wholePart } from "../../money.js";
import { withPrefix, type Cells } from "./cells.js";

export const PART_I_SECTION_1 = "0.part1_sec1.";
export const PART_II_SECTION_1 = "1.part2_sec1.";

/* The comb boxes of the coordinates: 2 for the latitude's degrees, 3 for the longitude's, 6 after the point. */
const LATITUDE_DIGITS = 2;
const LONGITUDE_DIGITS = 3;
const COORDINATE_PLACES = 6;
/* The first line of a name or address entry holds about this many characters; the rest goes on the second. */
const FIRST_LINE_CHARACTERS = 50;

/* A text in two lines: whole words on the first up to its width, the rest on the second. */
export function twoLines(text: string): [string, string | undefined] {
  const words = text.split(" ");
  let first = "";
  let index = 0;
  for (; index < words.length; index += 1) {
    const next = first === "" ? words[index]! : `${first} ${words[index]}`;
    if (next.length > FIRST_LINE_CHARACTERS && first !== "") break;
    first = next;
  }
  const rest = words.slice(index).join(" ");
  return [first, rest === "" ? undefined : rest];
}

/* A YYYY-MM-DD date in the form's three boxes. */
function dateBoxes(prefix: string, date: string): Cells {
  const [year, month, day] = date.split("-");
  return { [`${prefix}_month`]: month, [`${prefix}_day`]: day, [`${prefix}_year`]: year };
}

/* A coordinate: the sign box, the whole degrees filling their boxes, and the digits after the point. */
function coordinate(prefix: string, degrees: number, wholeDigits: number): Cells {
  const size = roundToPlaces(Math.abs(degrees), COORDINATE_PLACES);
  const [, decimal] = String(size).split(".");
  return {
    [`${prefix}_sign`]: degrees < 0 ? "-" : "+",
    [`${prefix}_degrees`]: String(wholePart(size)).padStart(wholeDigits, "0"),
    [`${prefix}_decimal`]: (decimal ?? "").padEnd(COORDINATE_PLACES, "0"),
  };
}

/* The name, owner, address and coordinates of a facility, with each line's key. */
function identityCells(
  prefix: string,
  facility: NuclearFacilityIdentity,
  keys: { name: [string, string]; owner: string; address: [string, string]; coordinates: string },
): Cells {
  const [name1, name2] = twoLines(facility.name);
  const address = facility.address;
  const coordinates = facility.coordinates;
  const cells: Cells = {
    [keys.name[0]]: name1,
    [keys.name[1]]: name2,
    [`${keys.owner}_i_owner_name`]: facility.owner?.name,
    [`${keys.owner}_ii_owner_tin`]: facility.owner?.tin,
    [keys.address[0]]: address?.street,
    [keys.address[1]]: address && `${address.city}, ${address.state} ${address.zip}`,
    ...(coordinates &&
      coordinate(`${keys.coordinates}_i_latitude`, coordinates.latitude, LATITUDE_DIGITS)),
    ...(coordinates &&
      coordinate(`${keys.coordinates}_ii_longitude`, coordinates.longitude, LONGITUDE_DIGITS)),
  };
  return withPrefix(prefix, cells);
}

/* A capacity in megawatts as lines 5 and 6 print it ("1,100 MW" prints "1100 MW"). */
const megawatts = (value: number) => `${roundToPlaces(value, 3)} MW`;

/* Part I Section 1, lines 1a to 9 (irs-7213-inst-2025::sec::section-1-information-on-advanced-nuclear::b01). */
export function partISectionOne(
  facility: NuclearFacilityIdentity,
  credit: AdvancedNuclearCredit,
): Cells {
  const identity = identityCells(PART_I_SECTION_1, facility, {
    name: ["1a_facility_name_line1", "1a_facility_name_line2"],
    owner: "1b",
    address: ["2a_facility_address_line1", "2a_facility_address_line2"],
    coordinates: "2b",
  });
  const lines: Cells = {
    ...dateBoxes("3_construction_start", credit.constructionBegan),
    ...dateBoxes("4_placed_in_service", credit.placedInService),
    "5_facility_nameplate_capacity": megawatts(credit.nameplateCapacityMw),
    "6_nameplate_capacity_allocated": megawatts(credit.ownedNameplateCapacityMw),
    ...dateBoxes("7_irs_acceptance_letter", credit.acceptanceLetterDate),
    // Line 8: "Check one" (line-8::b01).
    [credit.role === "owner" ? "8_owner_of_facility" : "8_eligible_project_partner"]: true,
    // Line 9: Yes or No (line-9::b01).
    [credit.section761aElection ? "9_section_761a_election_yes" : "9_section_761a_election_no"]:
      true,
  };
  return { ...identity, ...withPrefix(PART_I_SECTION_1, lines) };
}

/* Part II Section 1, lines 1 to 4 (irs-7213-inst-2025::sec::part-ii-credit-for-zero-emission::b01). */
export function partIISectionOne(
  facility: NuclearFacilityIdentity,
  credit: ZeroEmissionNuclearCredit,
): Cells {
  const identity = identityCells(PART_II_SECTION_1, facility, {
    name: ["2a_facility_name_description", "2a_facility_name_description_cont"],
    owner: "2b",
    address: ["3a_facility_address", "3a_facility_address_cont"],
    coordinates: "3b",
  });
  // Line 1: "If making an elective payment election or transfer election" (line-1-2::b01).
  const registration =
    credit.transfer?.registrationNumber ?? credit.electivePayment?.registrationNumber;
  const lines: Cells = {
    "1_irs_registration_number": registration,
    "4_nrc_permit_license_number": credit.nrcLicenseNumber,
  };
  return { ...identity, ...withPrefix(PART_II_SECTION_1, lines) };
}
