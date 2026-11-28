/*
 * The copies of Form 8835 a return files: one for each facility, "a separate
 * Form 8835 ... at each qualified facility"
 * (irs-8835-inst-2025::sec::general-instructions::b01), then the separate
 * form for credits from pass-through entities (line-14::b01). Each copy is a
 * set of cells keyed by the catalog field after "form-8835.", so Form 3800 and
 * the bindings read the same figures.
 */

import {
  getInvestmentCreditPropertyFacts,
  getRenewableElectricityFacilityFacts,
  type InvestmentCreditFacility,
  type RenewableElectricityFacilityFact,
  type RenewableElectricityFacilityFactValue,
  type RenewableResource,
} from "../../facts/index.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import { isGap, type Cell } from "../3800/cells.js";
import {
  BOTH_PRODUCTION_CREDITS_GAP,
  renewableFacilityOnForm7211,
} from "../electricityFacilities.js";
import {
  eligibilityGap,
  fourYearPeriodIn2025,
  isBiomass,
  placedInServiceAfter2021,
  productionLines,
  splitByFourYears,
  type Lines,
} from "./lines.js";
import {
  domesticContentApplies,
  increasedCredit,
  line8AnswerMissing,
  partILines,
  PASS_THROUGH_TYPE,
  qualifiesDomesticContent,
  qualifiesEnergyCommunity,
} from "./partI.js";
import { passThroughCreditOf } from "./passThroughCredits.js";

/* Line 15 of a facility, and its parts for Form 3800 lines 4e (the first 4 years) and 1f (later). */
export interface FacilityCredit {
  total: number | Unsupported;
  firstFourYears?: number | Unsupported;
  later?: number | Unsupported;
}

export interface Form8835Copy {
  /* The facility fact, or PASS_THROUGH_COPY for the separate form. */
  key: string;
  cells: Lines;
  /* An answer the copy reads is missing: the fact is listed in missingInputs. */
  waiting: boolean;
  /* A facility's credit; undefined for the pass-through copy and while waiting. */
  credit?: FacilityCredit;
}

export const PASS_THROUGH_COPY = "pass_through";

/* Part II line 1 row of each resource: "<row>_kwh_col_a" and "<row>_credit_col_c". */
const LINE_1_ROWS: Readonly<Record<RenewableResource, string>> = {
  wind: "1a_wind",
  closed_loop_biomass: "1b_closed_loop_biomass",
  geothermal: "1c_geothermal",
  solar: "1d_solar",
  offshore_wind: "1e_offshore_wind_facility",
  open_loop_biomass: "1f_open_loop_biomass",
  landfill_gas: "1g_landfill_gas",
  trash: "1h_trash",
  hydropower: "1i_hydropower",
  marine_hydrokinetic: "1j_marine_hydrokinetic",
};

/* The catalog field of each Part II line after line 1. */
const PART_II_FIELDS: Readonly<Record<string, string>> = {
  "2": "1.part2.2_total_column_c",
  "3": "1.part2.3_phaseout_adjustment",
  "4": "1.part2.4_credit_before_reduction",
  "5a": "1.part2.5a_tax_exempt_bond_ratio",
  "5b": "1.part2.5b_line4_times_line5a",
  "5c": "1.part2.5c_line4_times_15_percent",
  "5d": "1.part2.5d_smaller_of_5b_5c",
  "6": "1.part2.6_line4_less_line5d",
  "7a": "1.part2.7a_wind_began_2017",
  "7b": "1.part2.7b_line7a_times_20_percent",
  "7c": "1.part2.7c_wind_began_2018_2020_2021",
  "7d": "1.part2.7d_line7c_times_40_percent",
  "7e": "1.part2.7e_wind_began_2019",
  "7f": "1.part2.7f_line7e_times_60_percent",
  "7g": "1.part2.7g_add_7b_7d_7f",
  "8": "1.part2.8_line6_less_line7g",
  "9": "1.part2.9_increased_credit_amount",
  "10": "1.part2.10_domestic_content_bonus",
  "11": "1.part2.11_energy_community_bonus",
  "12": "1.part2.12_add_lines_9_10_11",
  "13": "1.part2.13_elective_payment_adjusted_credit",
};
export const LINE_14_FIELD = "2.part2.14_credit_from_pass_through_entities";
export const LINE_15_FIELD = "2.part2.15_add_lines_13_14";

const SAME_FACILITY_GAP =
  'A Form 3468 property on this return is a qualified investment credit facility (the section 48(a)(5) election), and the facts do not show it is another facility: an elected facility is one "for which no credit has been allowed under section 45" (irs-8835-inst-2025::sec::election-to-treat-a-qualified-facility-as-energy::b01).';

const withPrefix = (prefix: string, lines: Lines): Lines =>
  Object.fromEntries(
    Object.entries(lines)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [`${prefix}${key}`, value]),
  );

/* An answer the facility's lines read is missing (Part I lines 6, 8 to 10, or the 4-year split). */
export function facilityAnswersMissing(value: RenewableElectricityFacilityFactValue): boolean {
  if (isBiomass(value.resource) && value.biomassExpansion === undefined) return true;
  if (line8AnswerMissing(value)) return true;
  if (domesticContentApplies(value) && value.domesticContent === undefined) return true;
  const after2021 = placedInServiceAfter2021(value.placedInService);
  if (after2021 && value.energyCommunity === undefined) return true;
  const split = fourYearPeriodIn2025(value.placedInService) === "split";
  return split && value.kilowattHoursSoldInFirstFourYears === undefined;
}

/* Two facilities the facts show apart: different addresses or different coordinates. */
function differs(value: RenewableElectricityFacilityFactValue, other: InvestmentCreditFacility) {
  const addresses = value.address !== undefined && other.address !== undefined;
  if (addresses && value.address !== other.address) return true;
  const [mine, theirs] = [value.coordinates, other.coordinates];
  if (mine === undefined || theirs === undefined) return false;
  return mine.latitude !== theirs.latitude || mine.longitude !== theirs.longitude;
}

/* The section 48(a)(5) election on Form 3468 (Part VI section L) may name this facility. */
function electedInvestmentCredit(
  inputs: ResolverInputs,
  value: RenewableElectricityFacilityFactValue,
): boolean {
  return getInvestmentCreditPropertyFacts(inputs.facts).some(({ value: property }) => {
    const credit = property.credit;
    const elected =
      credit.part === "energy" &&
      credit.investment.property.section === "investment_credit_facility";
    return elected && !differs(value, property.facility);
  });
}

/* Line 15's parts by the 4-year period; a gap goes on the line the period names. */
export function facilityCreditOf(
  value: RenewableElectricityFacilityFactValue,
  total: number | Unsupported,
): FacilityCredit {
  const period = fourYearPeriodIn2025(value.placedInService);
  if (period === "after") return { total, later: total };
  if (period === "inside" || isGap(total)) return { total, firstFourYears: total };
  const inFirst = value.kilowattHoursSoldInFirstFourYears ?? 0;
  const parts = splitByFourYears(total, value.kilowattHoursSold, inFirst);
  return { total, firstFourYears: parts.firstFourYears, later: parts.after };
}

/* Part II cells of a facility whose lines are figured, or every line a gap. */
function partIICells(value: RenewableElectricityFacilityFactValue, lines: Lines): Lines {
  const row = LINE_1_ROWS[value.resource];
  const cells: Lines = {
    [`1.part2.${row}_kwh_col_a`]: value.kilowattHoursSold,
    [`1.part2.${row}_credit_col_c`]: lines["1"],
  };
  for (const [line, field] of Object.entries(PART_II_FIELDS)) cells[field] = lines[line];
  return cells;
}

const GAP_LINES = [
  "1",
  "2",
  "4",
  "5a",
  "5b",
  "5c",
  "5d",
  "6",
  "7g",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
];

/* One facility's Form 8835. */
export function facilityCopy(
  inputs: ResolverInputs,
  fact: RenewableElectricityFacilityFact,
): Form8835Copy {
  const value = fact.value;
  const partI = withPrefix("0.part1.", partILines(value));
  const reason =
    eligibilityGap(value.constructionBegan, value.placedInService) ??
    (electedInvestmentCredit(inputs, value) ? SAME_FACILITY_GAP : undefined) ??
    (renewableFacilityOnForm7211(inputs, value) ? BOTH_PRODUCTION_CREDITS_GAP : undefined);
  if (reason !== undefined) {
    const gap = unsupported(reason);
    const lines = Object.fromEntries(GAP_LINES.map((line) => [line, gap]));
    const cells = { ...partI, ...partIICells(value, lines), [LINE_15_FIELD]: gap };
    return { key: fact.key, cells, waiting: false, credit: facilityCreditOf(value, gap) };
  }
  if (facilityAnswersMissing(value)) return { key: fact.key, cells: partI, waiting: true };
  const { lines, total } = productionLines({
    resource: value.resource,
    kilowattHours: value.kilowattHoursSold,
    constructionBegan: value.constructionBegan,
    placedInService: value.placedInService,
    bonds: value.taxExemptBondFinancing,
    increased: increasedCredit(value),
    domesticContent: qualifiesDomesticContent(value),
    energyCommunity: qualifiesEnergyCommunity(value),
  });
  // Line 15: "Add lines 13 and 14"; a facility's copy has no line 14.
  const cells = { ...partI, ...partIICells(value, lines), [LINE_15_FIELD]: total };
  return { key: fact.key, cells, waiting: false, credit: facilityCreditOf(value, total) };
}

/* The separate form for credits from pass-through entities, or undefined with none. */
export function passThroughCopy(inputs: ResolverInputs): Form8835Copy | undefined {
  const line14: Cell = passThroughCreditOf(inputs);
  if (line14 === undefined || line14 === 0) return undefined;
  const cells: Lines = {
    "0.part1.2a_facility_type": PASS_THROUGH_TYPE,
    [LINE_14_FIELD]: line14,
    [LINE_15_FIELD]: line14,
  };
  return { key: PASS_THROUGH_COPY, cells, waiting: false };
}

/* The facilities that can file: a section 1603 grant allows no credit (coordination-with-department-of-treasury::b01). */
export const facilityFactsOnForm8835 = (inputs: ResolverInputs) =>
  getRenewableElectricityFacilityFacts(inputs.facts).filter(
    (fact) => fact.value.section1603Grant !== true,
  );

/* Every copy: the facilities in the order recorded, the pass-through form last. */
export function form8835Copies(inputs: ResolverInputs): Form8835Copy[] {
  const facilities = facilityFactsOnForm8835(inputs).map((fact) => facilityCopy(inputs, fact));
  const passThrough = passThroughCopy(inputs);
  return passThrough === undefined ? facilities : [...facilities, passThrough];
}
