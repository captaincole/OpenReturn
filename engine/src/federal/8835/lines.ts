/*
 * Form 8835 Part II, lines 1 to 13, for one facility: pure arithmetic on the
 * facility's answers. One facility uses one qualified energy resource, so one
 * of lines 1a to 1j holds its kilowatt-hours. Money is whole dollars, rounded
 * to the nearest dollar (money.ts). The tax-exempt bond lines reuse Form
 * 3468's arithmetic (3468/lines.ts): both texts reduce the credit by "the
 * lesser of 15% or a fraction" of tax-exempt bond proceeds over additions to
 * the capital account (irs-8835-inst-2025::sec::credit-reduced-for-tax-exempt-bonds::b01,
 * irs-3468-inst-2025::sec::section-n-totals-and-credit-reduction-for::b01).
 */

import type { CreditFinancing, RenewableResource } from "../../facts/index.js";
import { prorateDollars, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { BOND_REDUCTION_START, financingLines, ratioText, times } from "../3468/lines.js";
import { isGap } from "../3800/cells.js";

export type LineValue = number | string | boolean | Unsupported | undefined;
export type Lines = Record<string, LineValue>;

/*
 * "Qualified facilities placed in service before 2022. From qualified energy
 * resources of wind, closed-loop biomass, and geothermal energy, 3.0 cents per
 * kWh; and 1.5 cents per kWh on the sale of electricity produced from the
 * qualified energy resources of open-loop biomass, landfill gas, trash,
 * qualified hydropower, and marine and hydrokinetic energy"
 * (irs-8835-inst-2025::sec::how-to-figure-the-credit::b02). The list has no
 * solar rate: solar qualifies only "for solar energy facilities placed in
 * service after 2021" (qualified-facilities::b03).
 */
export const RATES_BEFORE_2022: Readonly<Record<RenewableResource, number | undefined>> = {
  wind: 0.03,
  closed_loop_biomass: 0.03,
  geothermal: 0.03,
  solar: undefined,
  offshore_wind: 0.03,
  open_loop_biomass: 0.015,
  landfill_gas: 0.015,
  trash: 0.015,
  hydropower: 0.015,
  marine_hydrokinetic: 0.015,
};

/* "Qualified facilities placed in service after 2021": 0.6 cents and 0.3 cents (how-to-figure-the-credit::b02; the form's column (b), face-part-ii::b01). */
export const RATES_AFTER_2021: Readonly<Record<RenewableResource, number>> = {
  wind: 0.006,
  closed_loop_biomass: 0.006,
  geothermal: 0.006,
  solar: 0.006,
  offshore_wind: 0.006,
  open_loop_biomass: 0.003,
  landfill_gas: 0.003,
  trash: 0.003,
  hydropower: 0.003,
  marine_hydrokinetic: 0.003,
};

/* "Qualified facilities placed in service after 2022. From ... qualified hydropower and marine and hydrokinetic renewable energy, 0.6 cents per kWh" (how-to-figure-the-credit::b03). */
export const HYDRO_AND_MARINE_RATE_AFTER_2022 = 0.006;

export const FIRST_DAY_2022 = "2022-01-01";
export const FIRST_DAY_2023 = "2023-01-01";
export const FIRST_DAY_2025 = "2025-01-01";
export const FIRST_DAY_2026 = "2026-01-01";
/* Line 8b: "the facility's construction began before January 29, 2023" (irs-8835-face-2025::sec::face-part-i::b02). */
export const INCREASED_CREDIT_CONSTRUCTION_CUTOFF = "2023-01-29";
/* The credit period: "the 10-year period beginning on the date the facility was originally placed in service" (how-to-figure-the-credit::b01; wind-10::b01). */
export const CREDIT_PERIOD_YEARS = 10;
/* Line 15: "the 4-year period beginning on the date the facility was placed in service" goes to Form 3800 line 4e (face-part-ii-2::b01). */
export const SPECIFIED_CREDIT_YEARS = 4;
/* Line 3: "Calendar year filers enter -0- on line 3" (line-3::b01). */
export const PHASEOUT_ADJUSTMENT = 0;
/* Line 9: "multiply the amount in Part II, line 8, by 5.0" (face-part-ii::b02; line-9-2::b01). */
export const INCREASED_CREDIT_MULTIPLIER = 5;
/* Lines 10 and 11: "multiply the amount on line 9 by 10% (0.10)" (face-part-ii::b02, ::b03). */
export const BONUS_RATE = 0.1;

/*
 * Line 7: the wind facility phase-down by the year construction began, and
 * the line that holds the amount: 7a and 20% for 2017, 7c and 40% for 2018,
 * 2020 and 2021, 7e and 60% for 2019 (face-part-ii::b02).
 */
const WIND_PHASE_DOWN: Readonly<Record<string, { line: string; reduction: string; rate: number }>> =
  {
    "2017": { line: "7a", reduction: "7b", rate: 0.2 },
    "2018": { line: "7c", reduction: "7d", rate: 0.4 },
    "2019": { line: "7e", reduction: "7f", rate: 0.6 },
    "2020": { line: "7c", reduction: "7d", rate: 0.4 },
    "2021": { line: "7c", reduction: "7d", rate: 0.4 },
  };

const NO_SOLAR_RATE_GAP =
  "The 2025 credit rates give no rate for a solar facility placed in service before 2022 (irs-8835-inst-2025::sec::how-to-figure-the-credit::b02): solar qualifies only for facilities placed in service after 2021 (qualified-facilities::b03).";
const PRE_IRA_BOND_GAP =
  "Lines 5a to 5d reflect the IRA 2022 amendments for facilities whose construction began after August 16, 2022 (irs-8835-inst-2025::sec::line-3::b01, Lines 5a–5d); the instructions do not give the reduction for an earlier facility financed with tax-exempt bonds.";

export interface ProductionInputs {
  resource: RenewableResource;
  /* Column (a). */
  kilowattHours: number;
  constructionBegan: string;
  placedInService: string;
  bonds?: CreditFinancing;
  /* A "Yes" box of Part I line 8 is checked. */
  increased: boolean;
  /* Part I box 9a and box 10a. */
  domesticContent: boolean;
  energyCommunity: boolean;
}

/* The date `years` after an ISO date (the same month and day). */
export const yearsAfter = (date: string, years: number): string =>
  `${Number(date.slice(0, 4)) + years}${date.slice(4)}`;

export const placedInServiceAfter2021 = (placedInService: string): boolean =>
  placedInService >= FIRST_DAY_2022;

export const isWind = (resource: RenewableResource): boolean =>
  resource === "wind" || resource === "offshore_wind";

export const isBiomass = (resource: RenewableResource): boolean =>
  resource === "closed_loop_biomass" || resource === "open_loop_biomass";

/* Column (b): the rate for the resource and the year placed in service; undefined with no rate. */
export function rateOf(resource: RenewableResource, placedInService: string): number | undefined {
  if (!placedInServiceAfter2021(placedInService)) return RATES_BEFORE_2022[resource];
  const hydroOrMarine = resource === "hydropower" || resource === "marine_hydrokinetic";
  if (hydroOrMarine && placedInService >= FIRST_DAY_2023) return HYDRO_AND_MARINE_RATE_AFTER_2022;
  return RATES_AFTER_2021[resource];
}

/* Why the facility earns no 2025 credit the form can figure; undefined when it can. */
export function eligibilityGap(
  constructionBegan: string,
  placedInService: string,
): string | undefined {
  if (constructionBegan >= FIRST_DAY_2025) {
    return "Only a facility whose construction began before 2025 is a qualified facility (irs-8835-inst-2025::sec::qualified-facilities::b01); a later one takes the clean electricity production credit, Form 7211.";
  }
  if (placedInService >= FIRST_DAY_2026) {
    return "The facility was not placed in service by the end of 2025, so it produced no electricity for the credit in 2025 (Part I line 5).";
  }
  if (yearsAfter(placedInService, CREDIT_PERIOD_YEARS) <= FIRST_DAY_2025) {
    return "The 10-year credit period beginning on the date the facility was placed in service ended before 2025 (irs-8835-inst-2025::sec::how-to-figure-the-credit::b01), so no 2025 electricity earns the credit.";
  }
  return undefined;
}

/* Where the 2025 production falls against the 4-year period: all inside it, all after it, or split. */
export function fourYearPeriodIn2025(placedInService: string): "inside" | "after" | "split" {
  const end = yearsAfter(placedInService, SPECIFIED_CREDIT_YEARS);
  if (end >= FIRST_DAY_2026) return "inside";
  if (end <= FIRST_DAY_2025) return "after";
  return "split";
}

/* Line 15's "applicable part" of each line: the credit in proportion to the kilowatt-hours of each period. */
export function splitByFourYears(
  credit: number,
  kilowattHours: number,
  inFirstFourYears: number,
): { firstFourYears: number; after: number } {
  const [firstFourYears, after] = prorateDollars(credit, [
    inFirstFourYears,
    kilowattHours - inFirstFourYears,
  ]);
  return { firstFourYears, after };
}

const gapLines = (keys: ReadonlyArray<string>, gap: Unsupported): Lines =>
  Object.fromEntries(keys.map((key) => [key, gap]));

const LINES_5_TO_13 = ["5a", "5b", "5c", "5d", "6", "7g", "8", "9", "10", "11", "12", "13"];

/*
 * Lines 5a to 6: "If you used proceeds of tax-exempt bonds to finance your
 * facility, continue to line 5a; otherwise, enter the amount from line 4 on
 * line 6" (face-part-ii::b01). The ratio keeps every digit and prints 6
 * places, as Form 3468's ratio lines (rule-decisions row A99).
 */
function bondLines(inputs: ProductionInputs, line4: number): Lines | Unsupported {
  const bonds = inputs.bonds;
  if (bonds === undefined) return { "6": line4 };
  if (inputs.constructionBegan <= BOND_REDUCTION_START) return unsupported(PRE_IRA_BOND_GAP);
  const reduced = financingLines(line4, bonds.proceeds, bonds.capitalAccountAdditions);
  return {
    "5a": ratioText(reduced.ratio),
    "5b": reduced.byRatio,
    "5c": reduced.byCap,
    "5d": reduced.reduction,
    "6": reduced.reduced,
  };
}

/* Lines 7a to 7g: a wind facility begun 2017 to 2021; blank for every other facility. */
function phaseDownLines(inputs: ProductionInputs, line6: number): Lines {
  const step = isWind(inputs.resource)
    ? WIND_PHASE_DOWN[inputs.constructionBegan.slice(0, 4)]
    : undefined;
  if (step === undefined) return {};
  // "For facilities placed in service after 2021, enter -0-".
  const reduction = placedInServiceAfter2021(inputs.placedInService) ? 0 : times(line6, step.rate);
  return { [step.line]: line6, [step.reduction]: reduction, "7g": reduction };
}

/* Lines 9 to 13 from line 8. */
function bonusLines(inputs: ProductionInputs, line8: number): Lines {
  const line9 = inputs.increased ? line8 * INCREASED_CREDIT_MULTIPLIER : line8;
  const line10 = inputs.domesticContent ? times(line9, BONUS_RATE) : 0;
  const line11 = inputs.energyCommunity ? times(line9, BONUS_RATE) : 0;
  const line12 = sum(line9, line10, line11);
  // Line 13: the 90% applies only to an elective payment election, which an individual cannot make for this credit (QUESTIONS.md).
  return { "9": line9, "10": line10, "11": line11, "12": line12, "13": line12 };
}

/*
 * Lines 1 to 13 of one facility, keyed by line ("1" is column (c) of its
 * line 1a to 1j), and line 13, the facility's credit. A gap fills its line and
 * every line after it.
 */
export function productionLines(inputs: ProductionInputs): {
  lines: Lines;
  total: number | Unsupported;
} {
  const rate = rateOf(inputs.resource, inputs.placedInService);
  if (rate === undefined) {
    const gap = unsupported(NO_SOLAR_RATE_GAP);
    const lines = gapLines(["1", "2", "4", ...LINES_5_TO_13], gap);
    return { lines: { ...lines, "3": PHASEOUT_ADJUSTMENT }, total: gap };
  }
  const line1 = times(inputs.kilowattHours, rate);
  const line4 = line1 - PHASEOUT_ADJUSTMENT;
  const lines: Lines = { "1": line1, "2": line1, "3": PHASEOUT_ADJUSTMENT, "4": line4 };
  const bonds = bondLines(inputs, line4);
  if (isGap(bonds)) {
    return { lines: { ...lines, ...gapLines(LINES_5_TO_13, bonds) }, total: bonds };
  }
  Object.assign(lines, bonds);
  const line6 = bonds["6"] as number;
  const phaseDown = phaseDownLines(inputs, line6);
  const line8 = line6 - ((phaseDown["7g"] as number | undefined) ?? 0);
  const bonus = bonusLines(inputs, line8);
  return { lines: { ...lines, ...phaseDown, "8": line8, ...bonus }, total: bonus["13"] as number };
}
