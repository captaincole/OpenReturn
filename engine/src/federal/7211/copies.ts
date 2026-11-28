/*
 * The copies of Form 7211 a return files: "a separate Form 7211 for each
 * qualified facility" (irs-7211-inst-2025::sec::general-instructions::b01), one
 * for each facility fact in the order recorded, then the separate form for the
 * credits from pass-through entities when the return has one
 * (irs-7211-inst-2025::sec::line-10::b01). Each copy is a set of cells keyed by
 * the catalog field after "form-7211."; bindings.ts reads them.
 *
 * Line 2 is blank: an individual's tax year is calendar year 2025, so every kWh
 * is on line 1. Lines 12 and 13 are blank: they are for cooperatives, estates
 * and trusts (irs-7211-inst-2025::sec::line-12::b01, ::line-13::b01); an
 * individual stops at line 11.
 */

import {
  getCleanElectricityFacilityFacts,
  getInvestmentCreditPropertyFacts,
  type CleanElectricityFacilityFact,
  type CleanElectricityFacilityFactValue,
} from "../../facts/index.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Cells } from "../3468/cells.js";
import type { Cell } from "../3800/cells.js";
import { BOTH_PRODUCTION_CREDITS_GAP, cleanFacilityOnForm8835 } from "../electricityFacilities.js";
import {
  alternativeBoxes,
  CALENDAR_YEAR,
  FIRST_DAY_2025,
  FIRST_DAY_2026,
  partIILines,
  type PartIILines,
} from "./lines.js";
import { partICells, passThroughPartI } from "./partI.js";
import { passThroughCreditOf } from "./passThroughCredits.js";

export interface Form7211Copy {
  /* The facility fact, or PASS_THROUGH_COPY for the separate form. */
  key: string;
  cells: Cells;
  /* Line 11 of a facility, for Form 3800; undefined for the separate form and while waiting. */
  total?: number | Unsupported;
  waiting: boolean;
}

export const PASS_THROUGH_COPY = "pass_through_credits";

const BEFORE_2025 =
  "A qualified facility is placed in service after 2024; one placed in service earlier qualifies only for a new unit or an addition of capacity placed in service after 2024, to the extent of its increased output (irs-7211-inst-2025::sec::applicable-amount::b04), which the engine does not model.";
const AFTER_2025 =
  "The facility was placed in service after 2025, so it produced no electricity in the tax year.";
const OTHER_CREDIT =
  "You can't claim a section 45Y credit for a facility that had a credit under section 45, 45J, 45Q, 45U, 48, 48A, or 48E this year or any prior year (irs-7211-inst-2025::sec::how-to-claim-the-credit::b01); the facility fact says one was claimed.";
const SAME_FACILITY =
  "A Form 3468 property has this facility's address, coordinates or registration number, and a facility cannot take the section 45Y credit and the section 48 or 48E investment credit (irs-7211-inst-2025::sec::how-to-claim-the-credit::b01): state only one of them.";
const ELECTIVE_GAP =
  "The section 6417 elective payment of the clean electricity production credit is for applicable entities; an individual cannot make it for this credit (irs-3800-inst-2025::sec::elective-payment-of-certain-business-credits::b01, ::b03).";

/* The answers a copy reads; a fact that lacks one waits (resolveInfo.ts lists it). */
export function answered(value: Partial<CleanElectricityFacilityFactValue>): boolean {
  const flags = [
    value.netOutputUnder1Mw,
    value.prevailingWageAndApprenticeship,
    value.energyCommunity,
    value.domesticContent,
    value.otherCreditClaimed,
  ];
  return (
    flags.every((flag) => typeof flag === "boolean") &&
    typeof value.kilowattHours === "number" &&
    typeof value.constructionBegan === "string" &&
    typeof value.placedInService === "string"
  );
}

const sameText = (left: string | undefined, right: string | undefined) =>
  left !== undefined &&
  right !== undefined &&
  left.trim().toLowerCase() === right.trim().toLowerCase();

/* A Form 3468 property (Part V or Part VI) at the same place, or with the same registration number. */
function claimedOnForm3468(inputs: ResolverInputs, value: CleanElectricityFacilityFactValue) {
  const registration = value.transfer?.registrationNumber;
  return getInvestmentCreditPropertyFacts(inputs.facts).some(({ value: property }) => {
    const part = property.credit.part;
    if (part !== "clean_electricity" && part !== "energy") return false;
    const { facility } = property;
    const here = value.coordinates;
    const there = facility.coordinates;
    const samePlace =
      here !== undefined &&
      there !== undefined &&
      here.latitude === there.latitude &&
      here.longitude === there.longitude;
    const sameRegistration =
      sameText(registration, facility.registrationNumber) ||
      sameText(registration, property.transfer?.registrationNumber);
    return samePlace || sameRegistration || sameText(value.address, facility.address);
  });
}

/* Why line 11 cannot reach Form 3800 as figured; undefined when it can. */
function facilityGap(inputs: ResolverInputs, value: CleanElectricityFacilityFactValue) {
  if (value.placedInService < FIRST_DAY_2025) return BEFORE_2025;
  if (value.placedInService >= FIRST_DAY_2026) return AFTER_2025;
  if (value.otherCreditClaimed) return OTHER_CREDIT;
  if (claimedOnForm3468(inputs, value)) return SAME_FACILITY;
  if (cleanFacilityOnForm8835(inputs, value)) return BOTH_PRODUCTION_CREDITS_GAP;
  return undefined;
}

const PART_II_FIELDS: Record<Exclude<keyof PartIILines, "line9">, string> = {
  line1a: "0.part2.1_kwh_col_a",
  line1b: "0.part2.1_applicable_amount_col_b",
  line1c: "0.part2.1_credit_amount_col_c",
  line3: "0.part2.3_total_lines_1c_2c",
  line5a: "0.part2.5a_energy_community_bonus",
  line5b: "0.part2.5b_add_lines_3_5a",
  line6a: "1.part2.6a_tax_exempt_bond_ratio",
  line6b: "1.part2.6b_bond_reduction_amount",
  line6c: "1.part2.6c_bond_reduction_cap",
  line6d: "1.part2.6d_smaller_bond_reduction",
  line7: "1.part2.7_credit_after_bond_reduction",
  line8a: "1.part2.8a_domestic_content_bonus",
  line8b: "1.part2.8b_add_lines_7_8a",
};
const LINE_9 = "1.part2.9_elective_payment_phaseout";
const LINE_10 = "1.part2.10_passthrough_credit";
const LINE_11 = "1.part2.11_add_lines_9_10";

/* Part II of one facility: lines 1 to 9, and line 11 (line 9 with no line 10 on this form). */
function partIICells(value: CleanElectricityFacilityFactValue, gap: string | undefined): Cells {
  const lines = partIILines({
    kilowattHours: value.kilowattHours,
    alternative: alternativeBoxes(value).length > 0,
    energyCommunity: value.energyCommunity,
    domesticContent: value.domesticContent,
    financing: value.financing,
  });
  const cells: Cells = { "0.part2.1_calendar_year": String(CALENDAR_YEAR) };
  for (const [line, field] of Object.entries(PART_II_FIELDS)) {
    const cell = lines[line as keyof typeof PART_II_FIELDS];
    if (cell !== undefined) cells[field] = cell;
  }
  const line9: Cell = value.electivePayment ? unsupported(ELECTIVE_GAP) : lines.line9;
  cells[LINE_9] = line9;
  cells[LINE_11] = gap === undefined ? line9 : unsupported(gap);
  return cells;
}

/* One facility's Form 7211. */
export function facilityCopy(
  inputs: ResolverInputs,
  fact: CleanElectricityFacilityFact,
): Form7211Copy {
  const { key, value } = fact;
  if (!answered(value)) return { key, cells: {}, waiting: true };
  const cells = { ...partICells(value), ...partIICells(value, facilityGap(inputs, value)) };
  return { key, cells, total: cells[LINE_11] as number | Unsupported, waiting: false };
}

/* The separate form for pass-through credits: lines 10 and 11, or undefined with none. */
export function passThroughCopy(inputs: ResolverInputs): Form7211Copy | undefined {
  const line10 = passThroughCreditOf(inputs);
  if (line10 === undefined) return undefined;
  const cells = { ...passThroughPartI(), [LINE_10]: line10, [LINE_11]: line10 };
  return { key: PASS_THROUGH_COPY, cells, waiting: false };
}

/*
 * Every copy: the facilities in the order recorded, then the separate form. A
 * return with no facility files no Form 7211: its pass-through credit goes
 * "directly on Form 3800, Part III, line 1gg" (irs-7211-inst-2025::sec::line-10::b01).
 */
export function form7211Copies(inputs: ResolverInputs): Form7211Copy[] {
  const facilities = getCleanElectricityFacilityFacts(inputs.facts).map((fact) =>
    facilityCopy(inputs, fact),
  );
  if (facilities.length === 0) return [];
  const separate = passThroughCopy(inputs);
  return separate === undefined ? facilities : [...facilities, separate];
}
