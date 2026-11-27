/*
 * Form 3468: the shared rates and ratios, Parts II to V and VII. The one
 * published example with numbers is the basis reduction in Part II; the rest
 * are the form's own arithmetic and limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import type { RehabilitationInvestment } from "../../../../src/facts/index.js";
import {
  financingLines,
  lowIncomeLines,
  lowIncomeRate,
  percentText,
  ratioText,
  WAITING,
} from "../../../../src/federal/3468/lines.js";
import {
  inRatablePeriod,
  substantiallyRehabilitated,
} from "../../../../src/federal/3468/rehabilitation.js";
import { copyOf } from "./fixtures.js";

describe("shared rates and ratios", () => {
  it("a percentage prints the number under its %", () => {
    expect(percentText(0.3)).toBe("30");
    expect(percentText(0.075)).toBe("7.5");
    expect(percentText(0.012)).toBe("1.2");
    expect(percentText(0)).toBe("0");
  });

  it("the low-income rate: 10% for 11a and 11b, 20% for 11c and 11d, 0% for 11g or 5 MW ac", () => {
    const allocation = (
      category:
        "low_income_community" | "indian_land" | "residential_building" | "economic_benefit",
    ) => ({ category, controlNumber: "X" });
    expect(lowIncomeRate(allocation("low_income_community"), 100)).toBe(0.1);
    expect(lowIncomeRate(allocation("indian_land"), 100)).toBe(0.1);
    expect(lowIncomeRate(allocation("residential_building"), 100)).toBe(0.2);
    expect(lowIncomeRate(allocation("economic_benefit"), 100)).toBe(0.2);
    expect(lowIncomeRate("no", 100)).toBe(0);
    expect(lowIncomeRate(allocation("low_income_community"), 4_999)).toBe(0.1);
    expect(lowIncomeRate(allocation("low_income_community"), 5_000)).toBe(0);
  });

  it("the low-income lines: equal capacity takes line j, more capacity the ratio, 0% only -0-", () => {
    expect(lowIncomeLines(100_000, 0.1, 50, 50)).toMatchObject({ equal: 10_000, bonus: 10_000 });
    expect(lowIncomeLines(100_000, 0.1, 40, 50)).toMatchObject({ equal: 10_000, bonus: 10_000 });
    const over = lowIncomeLines(100_000, 0.2, 80, 60);
    expect(over).toMatchObject({ ratio: 0.75, ratioAmount: 15_000, bonus: 15_000 });
    if (over === WAITING) throw new Error("waiting");
    expect(over.ratioRate).toBeCloseTo(0.15, 12);
    expect(percentText(over.ratioRate)).toBe("15");
    expect(lowIncomeLines(100_000, 0, undefined, undefined)).toEqual({ rate: 0, bonus: 0 });
    expect(lowIncomeLines(100_000, 0.1, undefined, 50)).toBe(WAITING);
  });

  it("the bond reduction is the smaller of the ratio and 15%, and never more than the credit", () => {
    expect(financingLines(69_000, 15_000, 120_000)).toEqual({
      ratio: 0.125,
      byRatio: 8_625,
      byCap: 10_350,
      reduction: 8_625,
      reduced: 60_375,
    });
    const capped = financingLines(10_000, 90_000, 100_000);
    expect(capped).toMatchObject({
      ratio: 0.9,
      byRatio: 9_000,
      byCap: 1_500,
      reduction: 1_500,
      reduced: 8_500,
    });
    expect(financingLines(10_000, 0, 0).reduced).toBe(10_000);
  });

  it("a ratio keeps every digit and prints 6 places (rule-decisions A99)", () => {
    // Blind case 10: $25,000 of financing over $600,000 of additions, on $192,000 of credit.
    const financing = financingLines(192_000, 25_000, 600_000);
    expect(financing).toMatchObject({ byRatio: 8_000, reduction: 8_000, reduced: 184_000 });
    expect(ratioText(financing.ratio)).toBe("0.041667");
    // A 1/3 allocation at 10% on $1,000,000: $33,333, not $33,330 from 0.3333.
    const third = lowIncomeLines(1_000_000, 0.1, 3, 1);
    expect(third).toMatchObject({ ratioAmount: 33_333, bonus: 33_333 });
    if (third === WAITING) throw new Error("waiting");
    expect(ratioText(third.ratio)).toBe("0.333333");
    expect(percentText(third.ratioRate)).toBe("3.3333");
  });
});

describe("Part II, advanced coal and gasification", () => {
  /*
   * irs-3468-inst-2025::sec::part-ii-qualifying-advanced-coal::b02: "if the basis
   * of the property is $100,000 and the portion allocable to such financing or
   * bonds is $20,000, the fraction of the basis that you may claim the credit
   * on is 4/5". The fact states the $80,000; line 1b is 20% of it.
   */
  it("the basis reduction example: $100,000 with $20,000 financed claims 4/5, $80,000, and line 1b is $16,000", () => {
    const copy = copyOf({
      part: "advanced_coal_gasification",
      investment: { integratedGasification: 100_000 * (4 / 5) },
    });
    expect(copy.cell("part2.1a")).toBe(80_000);
    expect(copy.cell("part2.1b")).toBe(16_000);
    expect(copy.total).toBe(16_000);
  });

  it("each line takes its rate and line 7 adds them", () => {
    const copy = copyOf({
      part: "advanced_coal_gasification",
      investment: {
        integratedGasification: 1_000,
        advancedCoal: 1_000,
        advancedCoalSequestration: 1_000,
        gasificationSequestration: 1_000,
        otherGasification: 1_000,
      },
    });
    expect(["1b", "2b", "3b", "4b", "5b"].map((line) => copy.cell(`part2.${line}`))).toEqual([
      200, 150, 300, 300, 200,
    ]);
    expect(copy.cell("part2.7")).toBe(1_150);
  });
});

describe("Part III, advanced energy project", () => {
  const credit = {
    part: "advanced_energy" as const,
    investment: {
      qualifiedInvestment: 500_000,
      allocationControlNumber: "48C-1",
      energyCommunityCensusTract: true,
    },
  };

  it("30% with line 8a, 6% with 8c; line 7c is checked; line 3 is line 1c", () => {
    const met = copyOf(credit, { prevailingWage: "yes_48c" });
    expect(met.cell("part3.1b")).toBe("30");
    expect(met.cell("part3.1c")).toBe(150_000);
    expect(met.cell("part3.3")).toBe(150_000);
    expect(met.cell("part1.7c_net_output_not_applicable")).toBe(true);
    expect(met.cell("part3.1e_energy_community_tract_yes")).toBe(true);
    expect(copyOf(credit, { prevailingWage: "no" }).cell("part3.1c")).toBe(30_000);
  });

  it("line 1f prints the originating EIN only when it differs from line 3b(ii)", () => {
    const owner = { name: "Owner LLC", tin: "00-0000001" };
    expect(
      copyOf(credit, { owner }, { passThroughEin: "00-0000001" }).cell("part3.1f"),
    ).toBeUndefined();
    expect(copyOf(credit, { owner }, { passThroughEin: "00-0000002" }).cell("part3.1f")).toBe(
      "00-0000002",
    );
  });

  it("waits for line 8", () => {
    expect(copyOf(credit, { prevailingWage: undefined }).waiting).toBe(true);
  });
});

describe("Part IV, advanced manufacturing", () => {
  const credit = (facility: "semiconductor" | "semiconductor_equipment") => ({
    part: "advanced_manufacturing" as const,
    investment: { facility, basis: 1_000_000 },
  });

  it("25% for property placed in service before 2026, 35% after", () => {
    expect(copyOf(credit("semiconductor")).cell("part4.1c")).toBe(250_000);
    expect(
      copyOf(credit("semiconductor")).cell("part4.1a_semiconductor_manufacturing_facility"),
    ).toBe(true);
    expect(
      copyOf(credit("semiconductor_equipment")).cell("part4.1a_semiconductor_equipment_facility"),
    ).toBe(true);
  });

  it("an elective payment is for Part IV only; a transfer is not", () => {
    const election = { amount: 250_000, registrationNumber: "REG-1" };
    expect(copyOf(credit("semiconductor"), {}, { electivePayment: election }).total).toBe(250_000);
    const transfer = { direction: "sold" as const, amount: 1, registrationNumber: "REG-2" };
    expect(copyOf(credit("semiconductor"), {}, { transfer }).total).toMatchObject({
      unsupported: true,
    });
  });
});

describe("Part V, clean electricity investment", () => {
  const credit = (investment: object) => ({ part: "clean_electricity" as const, investment });

  it("6% without line 7a or 8b, 30% with either; the bonuses; line 8 is line 7 for an individual", () => {
    const base = copyOf(credit({ facilityBasis: 100_000 }));
    expect(base.cell("part5.1b")).toBe("6");
    expect(base.cell("part5.1h")).toBe("0");
    expect(base.cell("part5.1n")).toBe(0);
    expect(base.cell("part5.11")).toBe(6_000);
    const full = copyOf(credit({ facilityBasis: 100_000, storageBasis: 50_000 }), {
      prevailingWage: "yes_48_48e",
      domesticContent: "ten_percent",
      energyCommunity: "two_percent",
    });
    expect(full.cell("part5.2")).toBe(42_000);
    expect(full.cell("part5.4")).toBe(21_000);
    expect(full.cell("part5.5")).toBe(63_000);
    expect(full.cell("part5.8")).toBe(63_000);
  });

  it("qualified fuel cell property: 30% and no other increases", () => {
    const copy = copyOf(credit({ facilityBasis: 100_000, fuelCell: true }), {
      domesticContent: "ten_percent",
    });
    expect(copy.cell("part5.1b")).toBe("30");
    expect(copy.cell("part5.1d")).toBeUndefined();
    expect(copy.cell("part5.2")).toBe(30_000);
  });

  it("the low-income bonus with more capacity than the allocation, and the financing reduction", () => {
    const copy = copyOf(
      credit({
        facilityBasis: 200_000,
        allocatedCapacityKw: 300,
        financing: { proceeds: 10_000, capitalAccountAdditions: 200_000 },
      }),
      {
        lowIncome: { category: "residential_building", controlNumber: "C" },
        capacity: { solar: { dcKw: 400, acKw: 350 } },
      },
    );
    expect(copy.cell("part5.1k")).toBe("0.75");
    expect(copy.cell("part5.1l")).toBe("15%");
    expect(copy.cell("part5.1m")).toBe(30_000);
    expect(copy.cell("part5.2")).toBe(42_000);
    expect(copy.cell("part5.6a")).toBe("0.05");
    expect(copy.cell("part5.6d")).toBe(2_100);
    expect(copy.cell("part5.7")).toBe(39_900);
  });

  it("property not placed in service in 2025 is a gap on line 11", () => {
    expect(
      copyOf(credit({ facilityBasis: 1 }), { placedInService: "2024-12-31" }).total,
    ).toMatchObject({ unsupported: true });
  });
});

describe("Part VII, rehabilitation", () => {
  const investment: RehabilitationInvestment = {
    priorConservationDeduction: true,
    priorNpsNumber: "00000",
    measuringPeriod: { begin: "2023-01-01", end: "2024-12-31" },
    adjustedBasis: 100_000,
    expendituresInMeasuringPeriod: 150_000,
    qualifiedExpenditures: 150_000,
    npsProjectNumber: "NPS-1",
    certificationDate: "2025-02-01",
  };
  const credit = (overrides: Partial<RehabilitationInvestment> = {}) => ({
    part: "rehabilitation" as const,
    investment: { ...investment, ...overrides },
  });

  it("line 1j is 4% of line 1g in each of the five years", () => {
    const copy = copyOf(credit(), { placedInService: "2021-01-15" });
    expect(copy.cell("part7.1j")).toBe(6_000);
    expect(copy.cell("part7.3")).toBe(6_000);
    expect(copy.cell("part7.1a_prior_170h_deduction_yes")).toBe(true);
    expect(copy.cell("part7.1k_i_nps_project_number")).toBe("NPS-1");
    expect(inRatablePeriod("2020-12-31")).toBe(false);
    expect(inRatablePeriod("2021-01-01")).toBe(true);
    expect(inRatablePeriod("2025-12-31")).toBe(true);
  });

  it("substantially rehabilitated: more than the greater of $5,000 and the adjusted basis", () => {
    expect(
      substantiallyRehabilitated({ ...investment, expendituresInMeasuringPeriod: 100_000 }),
    ).toBe(false);
    expect(
      substantiallyRehabilitated({ ...investment, expendituresInMeasuringPeriod: 100_001 }),
    ).toBe(true);
    expect(
      substantiallyRehabilitated({
        ...investment,
        adjustedBasis: 0,
        expendituresInMeasuringPeriod: 5_000,
      }),
    ).toBe(false);
    expect(copyOf(credit({ expendituresInMeasuringPeriod: 100_000 })).cell("part7.1j")).toBe(0);
  });

  it("a building not in service with the section 47(d)(5) election is a gap", () => {
    const copy = copyOf(credit({ progressExpenditureElection: true }), {
      placedInService: "2026-03-01",
    });
    expect(copy.total).toMatchObject({ unsupported: true });
  });
});
