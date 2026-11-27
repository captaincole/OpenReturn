/*
 * Part VI, the energy credit under section 48: the sections with the
 * low-income communities bonus (B, F, I, L), clean hydrogen (M), and section N,
 * the total and the reduction for tax-exempt bonds
 * (irs-3468-face-2025::sec::face-part-vi::b01 to face-part-vi-7::b03).
 */

import type {
  EnergyInvestment,
  EnergyProperty,
  InvestmentCreditFacility,
} from "../../facts/index.js";
import {
  combinedHeatAndPower,
  constructionAfter2024,
  fuelCell,
  illuminationRate,
  microturbine,
  noCredit,
  phasedRate,
  sectionLetters,
  standardSection,
} from "./energySections.js";
import {
  answersLines7And8,
  baseRate,
  BOND_REDUCTION_START,
  financingLines,
  percentText,
  ratioText,
  times,
  WAITING,
  type Waiting,
} from "./lines.js";
import {
  answersBonuses,
  bonusLines,
  joined,
  lowIncomeBlock,
  rateAndProduct,
  type Lines,
  type SectionResult,
} from "./sectionLines.js";

type Capacity = { kw: number | undefined; acKw: number | undefined };

interface LowIncomeLetters {
  basis: string;
  rate: string;
  product: string;
  lowIncome: [string, string, string, string, string, string, string];
  bonus: [string, string, string, string];
  total: string;
}

const LETTERS = "abcdefghijklmn";

/* The letters of a section whose lines run from <line>a: the low-income lines d to j, the bonuses from k. */
const letters = (line: number, total: number, bonusFrom: number): LowIncomeLetters => {
  const at = (offset: number) => `${line}${LETTERS[offset]}`;
  return {
    basis: at(0),
    rate: at(1),
    product: at(2),
    lowIncome: [at(3), at(4), at(5), at(6), at(7), at(8), at(9)],
    bonus: [at(bonusFrom), at(bonusFrom + 1), at(bonusFrom + 2), at(bonusFrom + 3)],
    total: String(total),
  };
};

/* Solar (3a to 4), small wind (11d to 12), storage (17a to 18), facility (23a to 24). */
const SOLAR = letters(3, 4, 10);
const STORAGE = letters(17, 18, 10);
const FACILITY = letters(23, 24, 10);
const SMALL_WIND: LowIncomeLetters = {
  basis: "11d",
  rate: "11e",
  product: "11f",
  lowIncome: ["11g", "11h", "11i", "11j", "11k", "11l", "11m"],
  bonus: ["11n", "11o", "11p", "11q"],
  total: "12",
};

/* A section with the low-income bonus; no capacity skips its lines (the Cautions over lines 3d, 17d, 23d). */
function lowIncomeSection(
  basis: number,
  rate: number,
  facility: InvestmentCreditFacility,
  bonus: { capacity: Capacity; allocatedKw: number | undefined } | undefined,
  at: LowIncomeLetters,
): SectionResult {
  if (rate === 0) return noCredit([at.basis, basis], at.rate, at.product, at.total);
  const base = rateAndProduct(basis, rate, at.rate, at.product);
  const lowIncome =
    bonus === undefined
      ? { lines: {}, amount: 0 }
      : lowIncomeBlock(basis, facility, bonus.capacity, bonus.allocatedKw, at.lowIncome);
  if (lowIncome === WAITING) return WAITING;
  const result = joined([base, lowIncome, bonusLines(basis, facility, at.bonus)], at.total);
  return { lines: { [at.basis]: basis, ...result.lines }, total: result.total };
}

const solarCapacity = (facility: InvestmentCreditFacility): Capacity => ({
  kw: facility.capacity?.solar?.dcKw,
  acKw: facility.capacity?.solar?.acKw,
});
const windCapacity = (facility: InvestmentCreditFacility): Capacity => ({
  kw: facility.capacity?.windAcKw,
  acKw: facility.capacity?.windAcKw,
});

/* The rate of the sections that end for construction after 2024 (energySections.ts). */
const rateUntil2024 = (facility: InvestmentCreditFacility) =>
  constructionAfter2024(facility) ? 0 : baseRate(facility);

/*
 * Section M (face-part-vi-7::b01, ::b02): line 8b takes the higher rate, line
 * 8c the lower, for the tier of clean hydrogen the facility is designed to
 * produce; construction must begin before 2028 (section-m-clean-hydrogen-production::b02).
 */
export const HYDROGEN_RATES = {
  a: { lines: ["25a", "25b", "25c"], increased: 0.06, base: 0.012 },
  b: { lines: ["25d", "25e", "25f"], increased: 0.075, base: 0.015 },
  c: { lines: ["25g", "25h", "25i"], increased: 0.1, base: 0.02 },
  d: { lines: ["25j", "25k", "25l"], increased: 0.3, base: 0.06 },
} as const;
export const HYDROGEN_CONSTRUCTION_END = "2028-01-01";

function cleanHydrogen(
  property: Extract<EnergyProperty, { section: "clean_hydrogen" }>,
  facility: InvestmentCreditFacility,
): SectionResult {
  const tier = HYDROGEN_RATES[property.tier];
  const [basisLine, rateLine, productLine] = tier.lines;
  const ended = facility.constructionBegan >= HYDROGEN_CONSTRUCTION_END;
  const increased = facility.prevailingWage === "yes_48_48e";
  const rate = ended ? 0 : increased ? tier.increased : tier.base;
  const product = times(property.basis, rate);
  const lines: Lines = {
    [basisLine]: property.basis,
    [rateLine]: percentText(rate),
    [productLine]: product,
    "26": product,
  };
  return { lines, total: product };
}

/* The lines of the property's own section. */
function sectionOf(property: EnergyProperty, facility: InvestmentCreditFacility): SectionResult {
  switch (property.section) {
    case "geothermal":
      return standardSection(property.basis, phasedRate(facility), facility, sectionLetters(1, 2));
    case "solar": {
      const illumination = property.kind === "illumination";
      const rate = illumination ? illuminationRate(facility) : phasedRate(facility);
      const bonus = illumination
        ? undefined
        : { capacity: solarCapacity(facility), allocatedKw: property.allocatedCapacityKwDc };
      return lowIncomeSection(property.basis, rate, facility, bonus, SOLAR);
    }
    case "fuel_cell":
      return fuelCell(property, facility);
    case "microturbine":
      return microturbine(property.basis, property.capacityKw, facility);
    case "combined_heat_and_power":
      return combinedHeatAndPower(property, facility);
    case "small_wind": {
      const bonus = { capacity: windCapacity(facility), allocatedKw: property.allocatedCapacityKw };
      return lowIncomeSection(property.basis, rateUntil2024(facility), facility, bonus, SMALL_WIND);
    }
    default:
      return otherSectionOf(property, facility);
  }
}

function otherSectionOf(
  property: EnergyProperty,
  facility: InvestmentCreditFacility,
): SectionResult {
  switch (property.section) {
    case "waste_energy_recovery":
      return standardSection(
        property.basis,
        rateUntil2024(facility),
        facility,
        sectionLetters(13, 14),
      );
    case "geothermal_heat_pump":
      return standardSection(property.basis, baseRate(facility), facility, sectionLetters(15, 16));
    case "energy_storage": {
      const linked = property.withLowIncomeFacility;
      const bonus = linked && {
        capacity: linked.facility === "solar" ? solarCapacity(facility) : windCapacity(facility),
        allocatedKw: linked.allocatedCapacityKw,
      };
      return lowIncomeSection(property.basis, rateUntil2024(facility), facility, bonus, STORAGE);
    }
    case "biogas":
      return standardSection(
        property.basis,
        rateUntil2024(facility),
        facility,
        sectionLetters(19, 20),
      );
    case "microgrid_controller":
      return standardSection(
        property.basis,
        rateUntil2024(facility),
        facility,
        sectionLetters(21, 22),
      );
    case "investment_credit_facility": {
      const bonus = property.windFacility
        ? { capacity: windCapacity(facility), allocatedKw: property.allocatedCapacityKw }
        : undefined;
      return lowIncomeSection(property.basis, rateUntil2024(facility), facility, bonus, FACILITY);
    }
    case "clean_hydrogen":
      return cleanHydrogen(property, facility);
    default:
      return WAITING;
  }
}

/* The Part I answers a section reads: lines 7 to 10, or only line 8 for clean hydrogen. */
export function energyAnswersMissing(
  investment: EnergyInvestment,
  facility: InvestmentCreditFacility,
) {
  if (investment.property.section === "clean_hydrogen")
    return facility.prevailingWage === undefined;
  return !answersLines7And8(facility) || !answersBonuses(facility);
}

/*
 * Section N: line 27 is the section's total; tax-exempt bonds reduce it for
 * construction after August 16, 2022 (lines 28a to 28e); line 30 is line 29
 * for an individual, who makes no elective payment election under section
 * 6417 (QUESTIONS.md); line 32 adds the cooperatives' line 31 (none here).
 */
export function energyLines(
  investment: EnergyInvestment,
  facility: InvestmentCreditFacility,
): { lines: Lines; total: number } | Waiting {
  if (energyAnswersMissing(investment, facility)) return WAITING;
  const section = sectionOf(investment.property, facility);
  if (section === WAITING) return WAITING;
  const line27 = section.total;
  const lines: Lines = { ...section.lines, "27": line27 };
  const financing = investment.financing;
  let line29 = line27;
  if (financing !== undefined && facility.constructionBegan > BOND_REDUCTION_START) {
    const reduced = financingLines(line27, financing.proceeds, financing.capitalAccountAdditions);
    Object.assign(lines, {
      "28a": ratioText(reduced.ratio),
      "28b": reduced.byRatio,
      "28c": reduced.byCap,
      "28d": reduced.reduction,
      "28e": reduced.reduced,
    });
    line29 = reduced.reduced;
  }
  Object.assign(lines, { "29": line29, "30": line29, "32": line29 });
  return { lines, total: line29 };
}
