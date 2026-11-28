/*
 * Part I of one facility's Form 7211 (irs-7211-face-2025::sec::face-part-i::b01,
 * ::b02), as cells keyed by the catalog field after "form-7211.". The line
 * instructions: irs-7211-inst-2025::sec::line-1::b01 to ::line-9::b01.
 */

import type { CleanElectricityFacilityFactValue } from "../../facts/index.js";
import type { Cells } from "../3468/cells.js";
import { coordinate, LATITUDE_DIGITS, LONGITUDE_DIGITS, usDate } from "../3468/partI.js";
import { alternativeBoxes } from "./lines.js";

const PART_I = "0.part1.";

/* Line 2a(i) of the separate form for pass-through credits (irs-7211-inst-2025::sec::line-10::b01). */
export const PASS_THROUGH_OWNER = "Credits From Pass-Through Entities";

/* The keys of Part I, prefixed with the page and the part. */
const inPartI = (lines: Cells): Cells =>
  Object.fromEntries(
    Object.entries(lines)
      .filter(([, value]) => value !== undefined)
      .map(([line, value]) => [`${PART_I}${line}`, value]),
  );

/* A Yes/No pair: the box that applies is checked, the other left blank. */
const yesOrNo = (yes: string, no: string, answer: boolean): Cells =>
  answer ? { [yes]: true } : { [no]: true };

/*
 * Line 1: "If making an elective payment election or transfer election, enter
 * the IRS-issued registration number" (face-part-i::b01); the election names it.
 */
const registrationOf = (value: CleanElectricityFacilityFactValue) =>
  value.transfer?.registrationNumber ?? value.electivePayment?.registrationNumber;

/* Lines 1 to 4. */
function identityLines(value: CleanElectricityFacilityFactValue): Cells {
  const coordinates = value.coordinates;
  return {
    "1_irs_registration_number": registrationOf(value),
    "2a_i_owner_name": value.owner?.name,
    "2a_ii_owner_tin": value.owner?.tin,
    "2b_facility_address_description": value.address,
    "2b_facility_address_description_cont": value.description,
    ...(coordinates && coordinate("2c_i_latitude", coordinates.latitude, LATITUDE_DIGITS)),
    ...(coordinates && coordinate("2c_ii_longitude", coordinates.longitude, LONGITUDE_DIGITS)),
    "3_date_construction_began": usDate(value.constructionBegan),
    "4_date_placed_in_service": usDate(value.placedInService),
  };
}

/* Lines 5 and 6: blank with no provisional emissions rate petition. */
function emissionLines(value: CleanElectricityFacilityFactValue): Cells {
  const per = value.provisionalEmissionsRate;
  if (per === undefined) return {};
  return {
    "5_i_per_doe_emissions_value": per.valueFromDoe || undefined,
    "5_ii_per_designated_lca_model": per.lcaModel || undefined,
    "6_doe_control_number": per.doeControlNumber,
  };
}

const LINE_7_BOXES = {
  a: "7a_alt_amount_under_1_megawatt",
  b: "7b_alt_amount_construction_before_2023",
  c: "7c_alt_amount_wage_apprenticeship",
} as const;

/* Line 7: every Yes box that applies (QUESTIONS.md), or 7d, No. */
function line7(value: CleanElectricityFacilityFactValue): Cells {
  const boxes = alternativeBoxes(value);
  if (boxes.length === 0) return { "7d_alt_amount_no": true };
  return Object.fromEntries(boxes.map((box) => [LINE_7_BOXES[box], true]));
}

/* Part I of one facility. */
export function partICells(value: CleanElectricityFacilityFactValue): Cells {
  return inPartI({
    ...identityLines(value),
    ...emissionLines(value),
    ...line7(value),
    ...yesOrNo(
      "8_energy_community_bonus_yes",
      "8_energy_community_bonus_no",
      value.energyCommunity,
    ),
    ...yesOrNo(
      "9_domestic_content_bonus_yes",
      "9_domestic_content_bonus_no",
      value.domesticContent,
    ),
  });
}

/* Part I of the separate form for pass-through credits: only line 2a(i). */
export const passThroughPartI = (): Cells => inPartI({ "2a_i_owner_name": PASS_THROUGH_OWNER });
