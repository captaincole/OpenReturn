/*
 * Parts II to V of Form 3468 (irs-3468-face-2025::sec::face-part-ii::b01 to
 * face-part-v-2::b03): each takes one property's investment and returns its
 * lines and its total, the amount Form 3800 Part III takes.
 */

import type {
  AdvancedEnergyInvestment,
  AdvancedManufacturingInvestment,
  CleanElectricityInvestment,
  CoalGasificationInvestment,
  InvestmentCreditFacility,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import { yesNo } from "./cells.js";
import {
  answersLines7And8,
  baseRate,
  financingLines,
  FIRST_DAY_2026,
  INCREASED_RATE,
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
} from "./sectionLines.js";

/* A part's lines and total; `gap` when the engine cannot figure the total (it reaches Form 3800 as a gap). */
export type PartResult = { lines: Lines; total: number; gap?: string } | Waiting;

/* Part II (face-part-ii::b01, ::b02): each qualified investment times its rate. */
export const COAL_GASIFICATION_RATES: ReadonlyArray<
  [key: keyof CoalGasificationInvestment, basis: string, credit: string, rate: number]
> = [
  ["integratedGasification", "1a", "1b", 0.2],
  ["advancedCoal", "2a", "2b", 0.15],
  ["advancedCoalSequestration", "3a", "3b", 0.3],
  ["gasificationSequestration", "4a", "4b", 0.3],
  ["otherGasification", "5a", "5b", 0.2],
];

export function coalGasificationLines(investment: CoalGasificationInvestment): PartResult {
  const lines: Lines = {};
  const credits: number[] = [];
  for (const [key, basisLine, creditLine, rate] of COAL_GASIFICATION_RATES) {
    const basis = investment[key];
    if (basis === undefined) continue;
    lines[basisLine] = basis;
    lines[creditLine] = times(basis, rate);
    credits.push(times(basis, rate));
  }
  lines["7"] = sum(...credits);
  return { lines, total: sum(...credits) };
}

/*
 * Part III line 1b: "If you met the PWA requirements described in Part I, lines
 * 7 and 8 ... then enter 30%. Otherwise, enter 6%" (irs-3468-inst-2025::sec::line-1b::b01);
 * line 1f, the originating entity's EIN, only when it differs from line 3b(ii) (line-1f::b01).
 */
export const ADVANCED_ENERGY_BASE_RATE = 0.06;

export function advancedEnergyLines(
  investment: AdvancedEnergyInvestment,
  facility: InvestmentCreditFacility,
  passThroughEin: string | undefined,
): PartResult {
  if (facility.prevailingWage === undefined) return WAITING;
  const rate = facility.prevailingWage === "yes_48c" ? INCREASED_RATE : ADVANCED_ENERGY_BASE_RATE;
  const line1c = times(investment.qualifiedInvestment, rate);
  const ein = passThroughEin !== facility.owner?.tin ? passThroughEin : undefined;
  const lines: Lines = {
    "1a": investment.qualifiedInvestment,
    "1b": percentText(rate),
    "1c": line1c,
    "1d": investment.allocationControlNumber,
    ...yesNo("1e_energy_community_tract", investment.energyCommunityCensusTract),
    "1f": ein,
    "3": line1c,
  };
  return { lines, total: line1c };
}

/* Part IV line 1c: 25% for property placed in service before 2026, else 35% (irs-3468-inst-2025::sec::line-1c::b01). */
export const MANUFACTURING_RATE_BEFORE_2026 = 0.25;
export const MANUFACTURING_RATE = 0.35;

export function advancedManufacturingLines(
  investment: AdvancedManufacturingInvestment,
  facility: InvestmentCreditFacility,
): PartResult {
  const rate =
    facility.placedInService < FIRST_DAY_2026 ? MANUFACTURING_RATE_BEFORE_2026 : MANUFACTURING_RATE;
  const line1c = times(investment.basis, rate);
  const box =
    investment.facility === "semiconductor"
      ? "1a_semiconductor_manufacturing_facility"
      : "1a_semiconductor_equipment_facility";
  return {
    lines: { [box]: true, "1b": investment.basis, "1c": line1c, "3": line1c },
    total: line1c,
  };
}

/* Part V Section A line 1b for qualified fuel cell property: "Enter 30% ... no other increases" (line-1b-3::b02). */
function facilityLines(
  basis: number,
  investment: CleanElectricityInvestment,
  facility: InvestmentCreditFacility,
): { lines: Lines; amount: number } | Waiting {
  if (investment.fuelCell === true) {
    const base = rateAndProduct(basis, INCREASED_RATE, "1b", "1c");
    return { lines: { "1a": basis, ...base.lines, "2": base.amount }, amount: base.amount };
  }
  const capacity = facility.capacity;
  const kw = capacity?.solar?.dcKw ?? capacity?.windAcKw ?? capacity?.other?.kw;
  const acKw = capacity?.solar?.acKw ?? capacity?.windAcKw ?? capacity?.other?.kw;
  const lowIncome = lowIncomeBlock(basis, facility, { kw, acKw }, investment.allocatedCapacityKw, [
    "1h",
    "1i",
    "1j",
    "1k",
    "1l",
    "1m",
    "1n",
  ]);
  if (lowIncome === WAITING) return WAITING;
  const base = rateAndProduct(basis, baseRate(facility), "1b", "1c");
  const bonus = bonusLines(basis, facility, ["1d", "1e", "1f", "1g"]);
  const result = joined([base, bonus, lowIncome], "2");
  return { lines: { "1a": basis, ...result.lines }, amount: result.total };
}

/* Section B (face-part-v-2::b01): the storage technology's rate and bonuses; line 4 adds them. */
function storageLines(basis: number, facility: InvestmentCreditFacility) {
  const base = rateAndProduct(basis, baseRate(facility), "3b", "3c");
  const result = joined([base, bonusLines(basis, facility, ["3d", "3e", "3f", "3g"])], "4");
  return { lines: { "3a": basis, ...result.lines }, amount: result.total };
}

/*
 * Part V (face-part-v::b01 to face-part-v-2::b03): sections A and B, line 5,
 * the financing reduction (6a to 7), and line 8, which is line 7 for an
 * individual: the elective payment phaseout is for applicable entities (line-8::b01).
 */
export function cleanElectricityLines(
  investment: CleanElectricityInvestment,
  facility: InvestmentCreditFacility,
): PartResult {
  if (!answersLines7And8(facility) || !answersBonuses(facility)) return WAITING;
  const lines: Lines = {};
  const amounts: number[] = [];
  if (investment.facilityBasis !== undefined) {
    const sectionA = facilityLines(investment.facilityBasis, investment, facility);
    if (sectionA === WAITING) return WAITING;
    Object.assign(lines, sectionA.lines);
    amounts.push(sectionA.amount);
  }
  if (investment.storageBasis !== undefined) {
    const sectionB = storageLines(investment.storageBasis, facility);
    Object.assign(lines, sectionB.lines);
    amounts.push(sectionB.amount);
  }
  const line5 = sum(...amounts);
  let line7 = line5;
  if (investment.financing !== undefined) {
    const { proceeds, capitalAccountAdditions } = investment.financing;
    const reduced = financingLines(line5, proceeds, capitalAccountAdditions);
    Object.assign(lines, {
      "6a": ratioText(reduced.ratio),
      "6b": reduced.byRatio,
      "6c": reduced.byCap,
      "6d": reduced.reduction,
      "6e": reduced.reduced,
    });
    line7 = reduced.reduced;
  }
  Object.assign(lines, { "5": line5, "7": line7, "8": line7, "11": line7 });
  return { lines, total: line7 };
}
