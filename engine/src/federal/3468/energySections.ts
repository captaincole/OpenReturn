/*
 * Part VI, sections A to M: one energy property's lines
 * (irs-3468-face-2025::sec::face-part-vi::b01 to face-part-vi-7::b02). Each
 * property fills its own section; section N (energy.ts) totals it.
 */

import type { EnergyProperty, InvestmentCreditFacility } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import { textOf } from "./cells.js";
import {
  baseRate,
  FIRST_DAY_2025,
  LAST_DAY_FIRST_RATE_2025,
  MICROTURBINE_BASE_RATE,
  MICROTURBINE_INCREASED_RATE,
  printedRatio,
  ratioOf,
  times,
} from "./lines.js";
import {
  bonusLines,
  joined,
  rateAndProduct,
  type Lines,
  type SectionResult,
} from "./sectionLines.js";

/*
 * Sections C to G and I to L: "These credits cannot be claimed for qualified
 * property whose construction began after 2024" (irs-3468-inst-2025::sec::section-d-qualified-microturbine-property::b01
 * and the same caution in each). Such a property's rate is 0%.
 *
 * DECISION (2026-11-27, by the author): a section whose base percentage is 0%
 * has no credit, so its domestic content and energy community lines stay blank.
 * - The form: "If you checked the box in Part I, line 9a, enter 10%" and "Multiply
 *   line 1a by line 1d" (irs-3468-face-2025::sec::face-part-vi::b01), with no
 *   condition on the base percentage.
 * - The instructions: "These credits cannot be claimed for qualified property
 *   whose construction began after 2024" (::section-d-qualified-microturbine-property::b01),
 *   and the rate tables give "0%" for construction after June 15, 2025
 *   (::line-1b-4::b01, ::beginning-of-construction::b01).
 * A bonus increases the credit of energy property, and property the
 * instructions say cannot be claimed has no credit to increase.
 */
export const constructionAfter2024 = (facility: InvestmentCreditFacility) =>
  facility.constructionBegan >= FIRST_DAY_2025;

/*
 * Lines 1b and 3b (solar energy 3): the table by the beginning of construction:
 * before 2025 30% or 6%, January 1 to June 15, 2025 10% or 2%, after June 15,
 * 2025 0% (irs-3468-inst-2025::sec::line-1b-4::b01, ::beginning-of-construction::b01).
 */
export const PHASED_RATES = { before2025: [0.3, 0.06], firstHalf2025: [0.1, 0.02] } as const;

export function phasedRate(facility: InvestmentCreditFacility): number {
  const began = facility.constructionBegan;
  if (began < FIRST_DAY_2025) return baseRate(facility, ...PHASED_RATES.before2025);
  if (began <= LAST_DAY_FIRST_RATE_2025) return baseRate(facility, ...PHASED_RATES.firstHalf2025);
  return 0;
}

/* Line 3b, solar energy 1 or 2 (illumination, electrochromic glass): 30% or 6% before 2025, else 0% (beginning-of-construction::b01). */
const illuminationRate = (facility: InvestmentCreditFacility) =>
  constructionAfter2024(facility) ? 0 : baseRate(facility);

/* A section with no credit: its basis, a 0% rate and a 0 product and total (QUESTIONS.md). */
function noCredit(basis: [string, number], rateLine: string, productLine: string, total: string) {
  return {
    lines: { [basis[0]]: basis[1], [rateLine]: "0", [productLine]: 0, [total]: 0 },
    total: 0,
  };
}

interface StandardLetters {
  basis: string;
  rate: string;
  product: string;
  bonus: [string, string, string, string];
  total: string;
}

/* A section of basis, rate, product and the two bonuses (sections A, G, H, J, K). */
function standardSection(
  basis: number,
  rate: number,
  facility: InvestmentCreditFacility,
  letters: StandardLetters,
): SectionResult {
  if (rate === 0)
    return noCredit([letters.basis, basis], letters.rate, letters.product, letters.total);
  const base = rateAndProduct(basis, rate, letters.rate, letters.product);
  const result = joined([base, bonusLines(basis, facility, letters.bonus)], letters.total);
  return { lines: { [letters.basis]: basis, ...result.lines }, total: result.total };
}

const sectionLetters = (line: number, total: number): StandardLetters => ({
  basis: `${line}a`,
  rate: `${line}b`,
  product: `${line}c`,
  bonus: [`${line}d`, `${line}e`, `${line}f`, `${line}g`],
  total: String(total),
});

/* Section D (face-part-vi-2::b02): 10% or 2%, and the smaller of line 7i and $200 per kW (line 7l). */
export const MICROTURBINE_DOLLARS_PER_KW = 200;

function microturbine(
  basis: number,
  kw: number,
  facility: InvestmentCreditFacility,
): SectionResult {
  const rate = constructionAfter2024(facility)
    ? 0
    : baseRate(facility, MICROTURBINE_INCREASED_RATE, MICROTURBINE_BASE_RATE);
  const base = rateAndProduct(basis, rate, "7b", "7c");
  const bonus =
    rate === 0 ? { lines: {}, amount: 0 } : bonusLines(basis, facility, ["7d", "7e", "7g", "7h"]);
  const line7i = base.amount + bonus.amount;
  const line7l = kw * MICROTURBINE_DOLLARS_PER_KW;
  const line8 = Math.min(line7i, line7l);
  const lines: Lines = {
    "7a": basis,
    ...base.lines,
    ...bonus.lines,
    "7i": line7i,
    "7j": textOf(kw),
    "7l": line7l,
    "8": line8,
  };
  return { lines, total: line8 };
}

/* Section C (face-part-vi-2::b01, ::b02): 30% before October 4, 2008, capped at $1,000 a kW; after it, the rate, capped at $3,000 a kW. */
export const FUEL_CELL_EARLY_RATE = 0.3;
export const FUEL_CELL_EARLY_DOLLARS_PER_KW = 1_000;
export const FUEL_CELL_DOLLARS_PER_KW = 3_000;

function fuelCell(
  property: Extract<EnergyProperty, { section: "fuel_cell" }>,
  facility: InvestmentCreditFacility,
): SectionResult {
  const lines: Lines = {};
  let line5e = 0;
  if (property.before2008) {
    const { basis, capacityKw } = property.before2008;
    const line5b = times(basis, FUEL_CELL_EARLY_RATE);
    const line5d = capacityKw * FUEL_CELL_EARLY_DOLLARS_PER_KW;
    line5e = Math.min(line5b, line5d);
    Object.assign(lines, {
      "5a": basis,
      "5b": line5b,
      "5c": textOf(capacityKw),
      "5d": line5d,
      "5e": line5e,
    });
  }
  let line5q = 0;
  if (property.after2008) {
    const { basis, capacityKw } = property.after2008;
    const rate = constructionAfter2024(facility) ? 0 : baseRate(facility);
    const base = rateAndProduct(basis, rate, "5g", "5h");
    const bonus =
      rate === 0 ? { lines: {}, amount: 0 } : bonusLines(basis, facility, ["5i", "5j", "5l", "5m"]);
    const line5n = base.amount + bonus.amount;
    const line5p = capacityKw * FUEL_CELL_DOLLARS_PER_KW;
    line5q = Math.min(line5n, line5p);
    Object.assign(lines, { "5f": basis, ...base.lines, ...bonus.lines, "5n": line5n });
    Object.assign(lines, { "5o": textOf(capacityKw), "5p": line5p, "5q": line5q });
  }
  lines["6"] = line5e + line5q;
  return { lines, total: line5e + line5q };
}

/*
 * Section E (face-part-vi-3::b01): line 9b is 15 over the MW capacity, or 20,000
 * over the horsepower, and 1.0 at or under them; over 50 MW or 67,000
 * horsepower the property is not combined heat and power system property
 * (section-e-combined-heat-and-power-system::b03).
 */
export const CHP_APPLICABLE_MW = 15;
export const CHP_APPLICABLE_HORSEPOWER = 20_000;
export const CHP_MAXIMUM_MW = 50;
export const CHP_MAXIMUM_HORSEPOWER = 67_000;

export function chpRatio(
  capacity: { megawatts: number } | { horsepower: number },
): number | undefined {
  const [size, applicable, maximum] =
    "megawatts" in capacity
      ? [capacity.megawatts, CHP_APPLICABLE_MW, CHP_MAXIMUM_MW]
      : [capacity.horsepower, CHP_APPLICABLE_HORSEPOWER, CHP_MAXIMUM_HORSEPOWER];
  if (size > maximum) return undefined;
  return size <= applicable ? 1 : ratioOf(applicable, size);
}

/* Line 9b in its two boxes: the digit before the point and the digits after it. */
export function ratioParts(ratio: number): { whole: string; decimal: string } {
  const [whole, decimal] = String(printedRatio(ratio)).split(".");
  return { whole: whole ?? "0", decimal: decimal ?? "0" };
}

function combinedHeatAndPower(
  property: Extract<EnergyProperty, { section: "combined_heat_and_power" }>,
  facility: InvestmentCreditFacility,
): SectionResult {
  const ratio = chpRatio(property.capacity);
  const line9c = ratio === undefined ? 0 : roundDollars(property.basis * ratio);
  const parts = ratioParts(ratio ?? 0);
  const ratioLines: Lines = {
    "9a": property.basis,
    "9b_capacity_ratio_whole": parts.whole,
    "9b_capacity_ratio_decimal": parts.decimal,
    "9c": line9c,
  };
  const rate = ratio === undefined || constructionAfter2024(facility) ? 0 : baseRate(facility);
  if (rate === 0) return { lines: { ...ratioLines, "9d": "0", "9e": 0, "10": 0 }, total: 0 };
  const base = rateAndProduct(line9c, rate, "9d", "9e");
  const result = joined([base, bonusLines(line9c, facility, ["9f", "9g", "9h", "9i"])], "10");
  return { lines: { ...ratioLines, ...result.lines }, total: result.total };
}

export {
  combinedHeatAndPower,
  fuelCell,
  illuminationRate,
  microturbine,
  noCredit,
  sectionLetters,
  standardSection,
};
