/*
 * Form 3468 Part VI, the energy credit: each section's rate and caps, the
 * rate tables by the beginning of construction, the low-income bonus and
 * section N. The instructions publish no example with numbers for Part VI;
 * these follow the form's lines (irs-3468-face-2025::sec::face-part-vi::b01
 * to face-part-vi-7::b03).
 */

import { describe, expect, it } from "vitest";
import { chpRatio, phasedRate, ratioParts } from "../../../../src/federal/3468/energySections.js";
import { copyOf, energy, FACILITY } from "./fixtures.js";

describe("the rate tables", () => {
  it("geothermal and solar energy 3: 30%/6% before 2025, 10%/2% to June 15, 2025, 0% after", () => {
    const meets = { ...FACILITY, prevailingWage: "yes_48_48e" as const };
    expect(phasedRate({ ...meets, constructionBegan: "2024-12-31" })).toBe(0.3);
    expect(phasedRate({ ...FACILITY, constructionBegan: "2024-12-31" })).toBe(0.06);
    expect(phasedRate({ ...meets, constructionBegan: "2025-01-01" })).toBe(0.1);
    expect(phasedRate({ ...FACILITY, constructionBegan: "2025-06-15" })).toBe(0.02);
    expect(phasedRate({ ...meets, constructionBegan: "2025-06-16" })).toBe(0);
  });

  it("a 0% rate gives no credit and no bonus", () => {
    const copy = copyOf(energy({ section: "geothermal", basis: 100_000 }), {
      constructionBegan: "2025-07-01",
      domesticContent: "ten_percent",
    });
    expect(copy.cell("part6.1b")).toBe("0");
    expect(copy.cell("part6.1d")).toBeUndefined();
    expect(copy.cell("part6.2")).toBe(0);
    expect(copy.cell("part6.32")).toBe(0);
  });
});

describe("Part VI sections", () => {
  it("A, geothermal: 1c, 1e, 1g and line 2", () => {
    const copy = copyOf(energy({ section: "geothermal", basis: 100_000 }), {
      netOutputUnder1Mw: "yes",
      domesticContent: "ten_percent",
      energyCommunity: "two_percent",
    });
    expect([
      copy.cell("part6.1c"),
      copy.cell("part6.1e"),
      copy.cell("part6.1g"),
      copy.cell("part6.2"),
    ]).toEqual([30_000, 10_000, 2_000, 42_000]);
    expect(copy.cell("part6.27")).toBe(42_000);
  });

  it("B, solar illumination: 30%/6% before 2025 and lines 3d to 3j skipped", () => {
    const copy = copyOf(energy({ section: "solar", basis: 10_000, kind: "illumination" }), {
      lowIncome: { category: "indian_land", controlNumber: "C" },
    });
    expect(copy.cell("part6.3b")).toBe("6");
    expect(copy.cell("part6.3d")).toBeUndefined();
    expect(copy.cell("part6.4")).toBe(600);
    expect(
      copyOf(energy({ section: "solar", basis: 10_000, kind: "illumination" }), {
        constructionBegan: "2025-01-02",
      }).cell("part6.4"),
    ).toBe(0);
  });

  it("B, solar with 11g: line 3d is 0% and line 3j -0-", () => {
    const copy = copyOf(energy({ section: "solar", basis: 10_000, kind: "electricity_or_heat" }));
    expect(copy.cell("part6.3d")).toBe("0");
    expect(copy.cell("part6.3j")).toBe(0);
    expect(copy.cell("part6.3e")).toBeUndefined();
  });

  it("B, solar with the capacity equal to the allocation: line 3f", () => {
    const copy = copyOf(
      energy({
        section: "solar",
        basis: 50_000,
        kind: "electricity_or_heat",
        allocatedCapacityKwDc: 20,
      }),
      {
        lowIncome: { category: "economic_benefit", controlNumber: "C" },
        capacity: { solar: { dcKw: 20, acKw: 18 } },
      },
    );
    expect(copy.cell("part6.3f")).toBe(10_000);
    expect(copy.cell("part6.3g")).toBeUndefined();
    expect(copy.cell("part6.3j")).toBe(10_000);
    expect(copy.cell("part6.4")).toBe(13_000);
  });

  it("C, fuel cell: the smaller of the credit and $1,000 or $3,000 a kW", () => {
    const copy = copyOf(
      energy({
        section: "fuel_cell",
        before2008: { basis: 10_000, capacityKw: 2 },
        after2008: { basis: 100_000, capacityKw: 5 },
      }),
      { prevailingWage: "yes_48_48e" },
    );
    expect([copy.cell("part6.5b"), copy.cell("part6.5d"), copy.cell("part6.5e")]).toEqual([
      3_000, 2_000, 2_000,
    ]);
    expect([copy.cell("part6.5n"), copy.cell("part6.5p"), copy.cell("part6.5q")]).toEqual([
      30_000, 15_000, 15_000,
    ]);
    expect(copy.cell("part6.6")).toBe(17_000);
  });

  it("D, microturbine: 10%/2% and $200 a kW", () => {
    const copy = copyOf(energy({ section: "microturbine", basis: 200_000, capacityKw: 50 }), {
      netOutputUnder1Mw: "yes",
    });
    expect([
      copy.cell("part6.7b"),
      copy.cell("part6.7c"),
      copy.cell("part6.7l"),
      copy.cell("part6.8"),
    ]).toEqual(["10", 20_000, 10_000, 10_000]);
  });

  it("E, combined heat and power: line 9b and the 50 MW limit", () => {
    expect(chpRatio({ megawatts: 15 })).toBe(1);
    expect(chpRatio({ megawatts: 20 })).toBe(0.75);
    expect(chpRatio({ horsepower: 40_000 })).toBe(0.5);
    expect(chpRatio({ megawatts: 51 })).toBeUndefined();
    expect(ratioParts(1)).toEqual({ whole: "1", decimal: "0" });
    expect(ratioParts(0.75)).toEqual({ whole: "0", decimal: "75" });
    const copy = copyOf(
      energy({ section: "combined_heat_and_power", basis: 400_000, capacity: { megawatts: 20 } }),
    );
    expect([copy.cell("part6.9c"), copy.cell("part6.9e"), copy.cell("part6.10")]).toEqual([
      300_000, 18_000, 18_000,
    ]);
  });

  it("F, small wind with more capacity than the allocation: lines 11j to 11m", () => {
    const copy = copyOf(energy({ section: "small_wind", basis: 80_000, allocatedCapacityKw: 50 }), {
      lowIncome: { category: "low_income_community", controlNumber: "C" },
      capacity: { windAcKw: 100 },
    });
    expect([
      copy.cell("part6.11j"),
      copy.cell("part6.11k"),
      copy.cell("part6.11l"),
      copy.cell("part6.11m"),
    ]).toEqual(["0.5", "5%", 4_000, 4_000]);
    expect(copy.cell("part6.12")).toBe(8_800);
  });

  it("G, H, J, K: the standard lines", () => {
    const sections = [
      ["waste_energy_recovery", "13c", "14"],
      ["geothermal_heat_pump", "15c", "16"],
      ["biogas", "19c", "20"],
      ["microgrid_controller", "21c", "22"],
    ] as const;
    for (const [section, product, total] of sections) {
      const copy = copyOf(energy({ section, basis: 10_000 }), { energyCommunity: "two_percent" });
      expect(copy.cell(`part6.${product}`)).toBe(600);
      expect(copy.cell(`part6.${total}`)).toBe(800);
    }
    const lateGhp = copyOf(energy({ section: "geothermal_heat_pump", basis: 10_000 }), {
      constructionBegan: "2025-03-01",
    });
    expect(lateGhp.cell("part6.16")).toBe(600);
    const lateBiogas = copyOf(energy({ section: "biogas", basis: 10_000 }), {
      constructionBegan: "2025-03-01",
    });
    expect(lateBiogas.cell("part6.20")).toBe(0);
  });

  it("I, storage: lines 17d to 17j only with a low-income solar or wind facility", () => {
    const alone = copyOf(energy({ section: "energy_storage", basis: 10_000 }));
    expect(alone.cell("part6.17d")).toBeUndefined();
    const linked = copyOf(
      energy({
        section: "energy_storage",
        basis: 10_000,
        withLowIncomeFacility: { facility: "wind", allocatedCapacityKw: 30 },
      }),
      {
        lowIncome: { category: "residential_building", controlNumber: "C" },
        capacity: { windAcKw: 30 },
      },
    );
    expect(linked.cell("part6.17f")).toBe(2_000);
    expect(linked.cell("part6.18")).toBe(2_600);
  });

  it("L, facility: lines 23d to 23j only for a wind facility", () => {
    const solar = copyOf(
      energy({ section: "investment_credit_facility", basis: 10_000, windFacility: false }),
    );
    expect(solar.cell("part6.23d")).toBeUndefined();
    const wind = copyOf(
      energy({
        section: "investment_credit_facility",
        basis: 10_000,
        windFacility: true,
        allocatedCapacityKw: 10,
      }),
      {
        lowIncome: { category: "indian_land", controlNumber: "C" },
        capacity: { windAcKw: 10 },
      },
    );
    expect(wind.cell("part6.23f")).toBe(1_000);
    expect(wind.cell("part6.24")).toBe(1_600);
  });

  it("M, clean hydrogen: line 8b takes the higher rate of each tier, 8c the lower", () => {
    const tiers = [
      ["a", "25c", 6_000, 1_200],
      ["b", "25f", 7_500, 1_500],
      ["c", "25i", 10_000, 2_000],
      ["d", "25l", 30_000, 6_000],
    ] as const;
    for (const [tier, line, increased, base] of tiers) {
      const hydrogen = energy({ section: "clean_hydrogen", basis: 100_000, tier });
      expect(
        copyOf(hydrogen, { prevailingWage: "yes_48_48e", domesticContent: undefined }).cell(
          `part6.${line}`,
        ),
      ).toBe(increased);
      expect(copyOf(hydrogen, { prevailingWage: "no" }).cell(`part6.${line}`)).toBe(base);
    }
    const hydrogen = copyOf(energy({ section: "clean_hydrogen", basis: 1, tier: "a" }), {
      emissions: { valueOrRate: "3.1" },
    });
    expect(hydrogen.cell("part1.7c_net_output_not_applicable")).toBe(true);
    expect(hydrogen.cell("part1.2a_i_emissions_value_or_rate")).toBe("3.1");
  });
});

describe("section N", () => {
  it("tax-exempt bonds reduce the credit only for construction after August 16, 2022", () => {
    const financed = energy(
      { section: "geothermal_heat_pump", basis: 100_000 },
      { proceeds: 50_000, capitalAccountAdditions: 100_000 },
    );
    const after = copyOf(financed, { constructionBegan: "2022-08-17" });
    expect([
      after.cell("part6.28a"),
      after.cell("part6.28d"),
      after.cell("part6.29"),
      after.cell("part6.32"),
    ]).toEqual(["0.5", 900, 5_100, 5_100]);
    const before = copyOf(financed, { constructionBegan: "2022-08-16" });
    expect(before.cell("part6.28a")).toBeUndefined();
    expect(before.cell("part6.32")).toBe(6_000);
  });

  it("waits while lines 7 to 10 or line 11 are missing", () => {
    expect(
      copyOf(energy({ section: "geothermal", basis: 1 }), { domesticContent: undefined }).waiting,
    ).toBe(true);
    expect(
      copyOf(energy({ section: "small_wind", basis: 1 }), { lowIncome: undefined }).waiting,
    ).toBe(true);
  });
});
