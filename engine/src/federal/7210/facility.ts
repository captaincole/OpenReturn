/*
 * One facility's Form 7210: whether it has a 2025 credit, the answers it
 * waits on, Part I (irs-7210-face-2025::sec::face-header::b01,
 * face-part-i::b01) and the lines of Parts II to IV (lines.ts).
 */

import type {
  CleanHydrogenFacilityFact,
  CleanHydrogenFacilityFactValue,
  HydrogenProductionProcess,
  InvestmentCreditFacility,
} from "../../facts/index.js";
import { roundToPlaces } from "../../money.js";
import { unsupported } from "../../types.js";
import { ISODate, isoDate } from "../../values.js";
import { ratioText } from "../3468/lines.js";
import { coordinate, LATITUDE_DIGITS, LONGITUDE_DIGITS } from "../3468/partI.js";
import type { Form7210Cells, Form7210Copy } from "./filingInfo.js";
import { form7210Lines, tierOf, type Form7210Lines } from "./lines.js";

/* "the construction of which begins before January 1, 2028" (irs-7210-inst-2025::sec::apprenticeship-requirements::b02). */
export const CONSTRUCTION_END = "2028-01-01";
/* "construction of which begins prior to January 29, 2023" (increased-credit-amount-for-qualified-clean::b01). */
export const APPRENTICESHIP_START = "2023-01-29";
/* "during the 10-year period beginning on the date the facility is originally placed in service" (general-instructions::b01). */
export const CREDIT_PERIOD_YEARS = 10;
export const FIRST_DAY_2025 = "2025-01-01";
export const FIRST_DAY_2026 = "2026-01-01";
const COORDINATE_MATCH_PLACES = 4;

const ELECTED_ENERGY_PROPERTY =
  "The facility is treated as energy property under section 48(a)(15) (Form 3468 Part VI Section M): no section 45V credit is allowed for it (irs-3468-inst-2025::sec::section-m-clean-hydrogen-production::b02).";
const CARBON_CAPTURE =
  "The facility includes carbon capture equipment for which a section 45Q credit is allowed: no section 45V credit (irs-7210-inst-2025::sec::apprenticeship-requirements::b03).";
const LATE_CONSTRUCTION =
  "Construction began after 2027: not a qualified clean hydrogen production facility (irs-7210-inst-2025::sec::apprenticeship-requirements::b02).";
const PERIOD_ENDED =
  "The facility's 10-year credit period ended before 2025 (irs-7210-inst-2025::sec::line-4::b01).";
const NOT_IN_SERVICE =
  "The facility was placed in service after 2025: no 2025 production in its credit period.";
const NO_PRODUCTION =
  "No process produced qualified clean hydrogen (a rate of 4.0 kg CO2e per kg or less) in 2025.";
const MANY_PROCESSES =
  "Line A takes the emissions rate and DOE control number 'for each hydrogen production process' (irs-7210-inst-2025::sec::specific-instructions::b01), and its box holds one; the instructions do not say where a second process's rate goes.";
const ON_FORM_3468 =
  "A Form 3468 Section M property on this return has the facility's registration number, address or coordinates: a facility treated as energy property takes no section 45V credit (irs-3468-inst-2025::sec::section-m-clean-hydrogen-production::b02). State energyPropertyElection true on the hydrogen facility, or correct the property.";
const PURCHASED =
  "A purchased credit is the transferee's, reported on Form 3800 Part III line 1g (irs-7210-inst-2025::sec::line-11::b01, the Caution), not figured on the seller's Form 7210.";
const BOTH_ELECTIONS =
  "Taxpayers 'that don't elect payment can elect to transfer' (irs-7210-inst-2025::sec::applicable-amount::b04): a facility's credit takes one election, not both.";
const OVER_CREDIT = "The election's amount is more than the facility's credit on line 10.";

const usDate = (date: string) => ISODate.usSlash(isoDate(date));

/* The day the 10-year credit period ends (the first day after it). */
export function creditPeriodEnd(placedInService: string): string {
  const [year, month, day] = placedInService.split("-");
  return `${Number(year) + CREDIT_PERIOD_YEARS}-${month}-${day}`;
}

/* The processes with a credit: a rate of 4.0 or less and kilograms above 0. */
export const qualifiedProcesses = (value: CleanHydrogenFacilityFactValue) =>
  value.processes.filter(
    (process) => tierOf(process.emissionsRate) !== undefined && process.kilograms > 0,
  );

/* Why the facility has no 2025 credit (it files no Form 7210); undefined when it may have one. */
export function noCreditReason(value: CleanHydrogenFacilityFactValue): string | undefined {
  if (value.energyPropertyElection === true) return ELECTED_ENERGY_PROPERTY;
  if (value.carbonCaptureCredit === true) return CARBON_CAPTURE;
  if (value.constructionBegan >= CONSTRUCTION_END) return LATE_CONSTRUCTION;
  if (creditPeriodEnd(value.placedInService) <= FIRST_DAY_2025) return PERIOD_ENDED;
  if (value.placedInService >= FIRST_DAY_2026) return NOT_IN_SERVICE;
  if (qualifiedProcesses(value).length === 0) return NO_PRODUCTION;
  return undefined;
}

/*
 * Line 5, the increased credit amount (increased-credit-amount-for-qualified-clean::b01,
 * line-5::b02): construction before January 29, 2023 with the prevailing wage
 * requirements met for its later alterations or repairs, or the prevailing wage
 * and apprenticeship requirements both met. Undefined while an answer is missing.
 */
export function increasedCredit(value: CleanHydrogenFacilityFactValue): boolean | undefined {
  if (value.prevailingWageMet === undefined) return undefined;
  if (!value.prevailingWageMet) return false;
  if (value.constructionBegan < APPRENTICESHIP_START) return true;
  return value.apprenticeshipMet;
}

/* The facility waits on an answer: the two no-credit questions or line 5's. */
export const waitsOnAnswer = (value: CleanHydrogenFacilityFactValue): boolean =>
  value.energyPropertyElection === undefined ||
  value.carbonCaptureCredit === undefined ||
  increasedCredit(value) === undefined;

const sameText = (first: string | undefined, second: string | undefined) =>
  first !== undefined &&
  second !== undefined &&
  first.trim().toLowerCase() === second.trim().toLowerCase();

type Coordinates = { latitude: number; longitude: number };
const sameDegrees = (first: number, second: number) =>
  roundToPlaces(first, COORDINATE_MATCH_PLACES) === roundToPlaces(second, COORDINATE_MATCH_PLACES);

const sameCoordinates = (first: Coordinates | undefined, second: Coordinates | undefined) =>
  first !== undefined &&
  second !== undefined &&
  sameDegrees(first.latitude, second.latitude) &&
  sameDegrees(first.longitude, second.longitude);

/* A Form 3468 facility that is this hydrogen facility: the same registration number, address or coordinates. */
export const sameFacility = (
  hydrogen: CleanHydrogenFacilityFactValue,
  property: InvestmentCreditFacility,
): boolean =>
  sameText(hydrogen.registrationNumber, property.registrationNumber) ||
  sameText(hydrogen.address, property.address) ||
  sameCoordinates(hydrogen.coordinates, property.coordinates);

/* Line A: one process prints its rate and control number; more than one is a gap. */
function lineACells(processes: HydrogenProductionProcess[]): Form7210Cells {
  const [only] = processes;
  if (processes.length === 1 && only !== undefined) {
    return {
      "0.header.a_i_emissions_value_rate": String(only.emissionsRate),
      "0.header.a_ii_doe_control_number": only.doeControlNumber,
    };
  }
  const anyControl = processes.some((process) => process.doeControlNumber !== undefined);
  return {
    "0.header.a_i_emissions_value_rate": unsupported(MANY_PROCESSES),
    "0.header.a_ii_doe_control_number": anyControl ? unsupported(MANY_PROCESSES) : undefined,
  };
}

/*
 * Line 1: "If making an elective payment election or transfer election, enter
 * the IRS-issued registration number of the facility" (face-part-i::b01): blank
 * with no election.
 */
function registrationOf(value: CleanHydrogenFacilityFactValue): string | undefined {
  const election = value.transfer ?? value.electivePayment;
  if (election === undefined) return undefined;
  return value.registrationNumber ?? election.registrationNumber;
}

/* Line A and Part I lines 1 to 4. */
export function partICells(value: CleanHydrogenFacilityFactValue): Form7210Cells {
  const coordinates = value.coordinates;
  return {
    ...lineACells(qualifiedProcesses(value)),
    "0.line.1_irs_registration_number": registrationOf(value),
    "0.line.2_i_owner_name": value.owner?.name,
    "0.line.2_ii_owner_tin": value.owner?.tin,
    "0.line.2a_facility_address_description": value.address,
    "0.line.2a_facility_address_description_cont": value.description,
    ...(coordinates && coordinate("0.line.2b_i_latitude", coordinates.latitude, LATITUDE_DIGITS)),
    ...(coordinates &&
      coordinate("0.line.2b_ii_longitude", coordinates.longitude, LONGITUDE_DIGITS)),
    "0.line.3_date_construction_began": usDate(value.constructionBegan),
    "0.line.4_date_placed_in_service": usDate(value.placedInService),
  };
}

/* Lines 6a to 10 as cells; every amount the gap when one stops the credit. */
export function amountCells(lines: Form7210Lines, gap: string | undefined): Form7210Cells {
  const value = (amount: number) => (gap === undefined ? amount : unsupported(gap));
  const { rows, bonds } = lines;
  return {
    "0.line.6a_less_than_0_45_col_a": rows["6a"]?.kilograms,
    "0.line.6a_less_than_0_45_col_c": rows["6a"] && value(rows["6a"].credit),
    "0.line.6b_0_45_to_1_5_col_a": rows["6b"]?.kilograms,
    "0.line.6b_0_45_to_1_5_col_c": rows["6b"] && value(rows["6b"].credit),
    "0.line.6c_1_5_to_2_5_col_a": rows["6c"]?.kilograms,
    "0.line.6c_1_5_to_2_5_col_c": rows["6c"] && value(rows["6c"].credit),
    "0.line.6d_2_5_to_4_0_col_a": rows["6d"]?.kilograms,
    "0.line.6d_2_5_to_4_0_col_c": rows["6d"] && value(rows["6d"].credit),
    "0.line.7_credit_before_reduction": value(lines.line7),
    "0.line.8a_tax_exempt_bond_ratio": bonds && ratioText(bonds.ratio),
    "0.line.8b_line_7_times_8a": bonds && value(bonds.line8b),
    "0.line.8c_line_7_times_15_percent": bonds && value(bonds.line8c),
    "0.line.8d_smaller_of_8b_8c": bonds && value(bonds.line8d),
    "0.line.9_credit_after_bond_reduction": value(lines.line9),
    "0.line.10_increased_credit_amount": value(lines.line10),
  };
}

/* Why the credit cannot reach Form 3800 with its election as stated; undefined when it can. */
export function electionGap(
  value: CleanHydrogenFacilityFactValue,
  line10: number,
): string | undefined {
  const { transfer, electivePayment } = value;
  if (transfer?.direction === "purchased") return PURCHASED;
  if (transfer !== undefined && electivePayment !== undefined) return BOTH_ELECTIONS;
  const elected = transfer?.amount ?? electivePayment?.amount;
  if (elected !== undefined && elected > line10) return OVER_CREDIT;
  return undefined;
}

/* One facility's copy; onForm3468: a Section M property of the return is this facility. */
export function facilityCopy(fact: CleanHydrogenFacilityFact, onForm3468: boolean): Form7210Copy {
  const { key, value } = fact;
  const partI = partICells(value);
  if (waitsOnAnswer(value)) return { key, cells: partI, facility: value, waiting: true };
  const increased = increasedCredit(value) === true;
  const lines = form7210Lines(qualifiedProcesses(value), value.financing, increased);
  const gap = onForm3468 ? ON_FORM_3468 : undefined;
  const cells: Form7210Cells = {
    ...partI,
    "0.line.5_increased_credit_eligible": increased ? true : undefined,
    ...amountCells(lines, gap),
  };
  const reason = gap ?? electionGap(value, lines.line10);
  const line10 = reason === undefined ? lines.line10 : unsupported(reason);
  return { key, cells, facility: value, line10, waiting: false };
}
