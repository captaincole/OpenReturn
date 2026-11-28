/*
 * Form 8835 Part II lines 1 to 13, pure. The form and its instructions
 * publish no example with numbers (irs-8835-inst-2025, irs-8835-face-2025),
 * so these test each stated rate and percentage, each date edge, and the
 * limits: a total equals its parts, the bond reduction never passes 15%, a
 * gap fills every later line.
 */

import { describe, expect, it } from "vitest";
import { isGap } from "../../../../src/federal/3800/cells.js";
import {
  eligibilityGap,
  fourYearPeriodIn2025,
  productionLines,
  rateOf,
  splitByFourYears,
  type ProductionInputs,
} from "../../../../src/federal/8835/lines.js";

const WIND_2023: ProductionInputs = {
  resource: "wind",
  kilowattHours: 500_000,
  constructionBegan: "2022-09-12",
  placedInService: "2023-05-01",
  bonds: { proceeds: 40_000, capitalAccountAdditions: 500_000 },
  increased: true,
  domesticContent: true,
  energyCommunity: true,
};

const plain = (patch: Partial<ProductionInputs>): ProductionInputs => ({
  resource: "wind",
  kilowattHours: 100_000,
  constructionBegan: "2023-03-01",
  placedInService: "2024-03-01",
  increased: false,
  domesticContent: false,
  energyCommunity: false,
  ...patch,
});

describe("column (b): the 2025 credit rates (how-to-figure-the-credit::b02, ::b03)", () => {
  it("placed in service before 2022: 3.0 cents for wind, closed-loop biomass and geothermal", () => {
    expect(rateOf("wind", "2021-12-31")).toBe(0.03);
    expect(rateOf("closed_loop_biomass", "2015-06-01")).toBe(0.03);
    expect(rateOf("geothermal", "2018-01-01")).toBe(0.03);
    expect(rateOf("offshore_wind", "2020-01-01")).toBe(0.03);
  });

  it("placed in service before 2022: 1.5 cents for the other resources", () => {
    for (const resource of [
      "open_loop_biomass",
      "landfill_gas",
      "trash",
      "hydropower",
      "marine_hydrokinetic",
    ] as const) {
      expect(rateOf(resource, "2019-04-01")).toBe(0.015);
    }
  });

  it("gives no rate for solar placed in service before 2022", () => {
    expect(rateOf("solar", "2021-06-01")).toBeUndefined();
  });

  it("placed in service after 2021: the form's column (b), 0.6 and 0.3 cents", () => {
    expect(rateOf("wind", "2022-01-01")).toBe(0.006);
    expect(rateOf("solar", "2024-01-01")).toBe(0.006);
    expect(rateOf("offshore_wind", "2024-01-01")).toBe(0.006);
    expect(rateOf("open_loop_biomass", "2023-01-01")).toBe(0.003);
    expect(rateOf("landfill_gas", "2024-01-01")).toBe(0.003);
    expect(rateOf("trash", "2024-01-01")).toBe(0.003);
  });

  it("hydropower and marine: 0.3 cents in 2022, 0.6 cents after 2022 (the form's ** note)", () => {
    expect(rateOf("hydropower", "2022-12-31")).toBe(0.003);
    expect(rateOf("hydropower", "2023-01-01")).toBe(0.006);
    expect(rateOf("marine_hydrokinetic", "2022-06-01")).toBe(0.003);
    expect(rateOf("marine_hydrokinetic", "2024-06-01")).toBe(0.006);
  });
});

describe("lines 1 to 13 of one facility (face-part-ii::b01 to ::b03)", () => {
  it("the wit copy 1 facility: bonds, 8b, both bonuses", () => {
    const { lines, total } = productionLines(WIND_2023);
    expect(lines).toMatchObject({
      "1": 3_000,
      "2": 3_000,
      "3": 0,
      "4": 3_000,
      "5a": "0.08",
      "5b": 240,
      "5c": 450,
      "5d": 240,
      "6": 2_760,
      "8": 2_760,
      "9": 13_800,
      "10": 1_380,
      "11": 1_380,
      "12": 16_560,
      "13": 16_560,
    });
    expect(lines["7g"]).toBeUndefined();
    expect(total).toBe(16_560);
  });

  it("with no tax-exempt bonds, lines 5a to 5d are blank and line 6 is line 4", () => {
    const { lines } = productionLines({ ...WIND_2023, bonds: undefined });
    expect(lines["5a"]).toBeUndefined();
    expect(lines["5d"]).toBeUndefined();
    expect(lines["6"]).toBe(3_000);
  });

  it("the bond reduction is never more than 15% of line 4", () => {
    const bonds = { proceeds: 300_000, capitalAccountAdditions: 500_000 };
    const { lines } = productionLines({ ...WIND_2023, bonds });
    expect(lines).toMatchObject({ "5a": "0.6", "5b": 1_800, "5c": 450, "5d": 450, "6": 2_550 });
  });

  it("bonds for construction on or before August 16, 2022 are a gap from line 5a on", () => {
    const early = productionLines({ ...WIND_2023, constructionBegan: "2022-08-16" });
    expect(early.lines["4"]).toBe(3_000);
    expect(isGap(early.lines["5a"])).toBe(true);
    expect(isGap(early.lines["13"])).toBe(true);
    expect(isGap(early.total)).toBe(true);
    const later = productionLines({ ...WIND_2023, constructionBegan: "2022-08-17" });
    expect(later.total).toBe(16_560);
  });

  it("line 9 is line 8 when no line 8 box is checked; the bonuses are 0 when not met", () => {
    const { lines, total } = productionLines(plain({}));
    expect(lines).toMatchObject({ "1": 600, "8": 600, "9": 600, "10": 0, "11": 0, "12": 600 });
    expect(total).toBe(600);
  });

  it("line 12 is lines 9, 10 and 11; line 13 is line 12 (no elective payment)", () => {
    const { lines } = productionLines(plain({ increased: true, energyCommunity: true }));
    expect(lines["9"]).toBe(3_000);
    expect(lines["10"]).toBe(0);
    expect(lines["11"]).toBe(300);
    expect(lines["12"]).toBe(3_300);
    expect(lines["13"]).toBe(3_300);
  });

  it("the credit is at most line 9 plus 20%, and at least 85% of line 4 times 5 with no phase-down", () => {
    const { lines, total } = productionLines(WIND_2023);
    expect(total).toBeLessThanOrEqual((lines["9"] as number) * 1.2);
    expect(total).toBeGreaterThanOrEqual((lines["4"] as number) * 5 * 0.85);
  });

  it("solar placed in service before 2022 is a gap on line 1 and every line after it", () => {
    const { lines, total } = productionLines(
      plain({ resource: "solar", constructionBegan: "2020-01-01", placedInService: "2021-03-01" }),
    );
    expect(isGap(lines["1"])).toBe(true);
    expect(isGap(lines["13"])).toBe(true);
    expect(isGap(total)).toBe(true);
  });

  it("rounds column (c) to the nearest dollar", () => {
    // 1,082 × $0.006 = $6.492 (6.49 in cents) → 6; 1,084 × $0.006 = $6.504 → 7 (money.ts).
    expect(productionLines(plain({ kilowattHours: 1_082 })).lines["1"]).toBe(6);
    expect(productionLines(plain({ kilowattHours: 1_084 })).lines["1"]).toBe(7);
  });
});

describe("line 7: the wind phase-down by the year construction began (face-part-ii::b02)", () => {
  const before2022 = (constructionBegan: string) =>
    productionLines({
      ...plain({ placedInService: "2021-06-01", constructionBegan }),
      kilowattHours: 100_000,
    }).lines;

  it("2017: line 7a and 20% on line 7b", () => {
    const lines = before2022("2017-05-01");
    expect(lines).toMatchObject({ "6": 3_000, "7a": 3_000, "7b": 600, "7g": 600, "8": 2_400 });
  });

  it("2018, 2020 and 2021: line 7c and 40% on line 7d", () => {
    for (const began of ["2018-01-01", "2020-07-01", "2021-01-15"]) {
      expect(before2022(began)).toMatchObject({
        "7c": 3_000,
        "7d": 1_200,
        "7g": 1_200,
        "8": 1_800,
      });
    }
  });

  it("2019: line 7e and 60% on line 7f", () => {
    expect(before2022("2019-03-01")).toMatchObject({ "7e": 3_000, "7f": 1_800, "8": 1_200 });
  });

  it("before 2017: no line 7", () => {
    const lines = before2022("2016-11-01");
    expect(lines["7a"]).toBeUndefined();
    expect(lines["7g"]).toBeUndefined();
    expect(lines["8"]).toBe(3_000);
  });

  it("placed in service after 2021: the line 7 amount prints and its reduction is 0", () => {
    const { lines } = productionLines(
      plain({ constructionBegan: "2021-04-01", placedInService: "2022-02-01" }),
    );
    expect(lines).toMatchObject({ "7c": 600, "7d": 0, "7g": 0, "8": 600 });
  });

  it("an offshore wind facility is a wind facility; another resource has no line 7", () => {
    const offshore = productionLines(
      plain({
        resource: "offshore_wind",
        constructionBegan: "2019-01-01",
        placedInService: "2021-01-01",
      }),
    );
    expect(offshore.lines["7f"]).toBe(1_800);
    const geothermal = productionLines(
      plain({
        resource: "geothermal",
        constructionBegan: "2019-01-01",
        placedInService: "2021-01-01",
      }),
    );
    expect(geothermal.lines["7e"]).toBeUndefined();
    expect(geothermal.lines["8"]).toBe(3_000);
  });
});

describe("which facilities earn a 2025 credit", () => {
  it("construction must begin before 2025 (qualified-facilities::b01)", () => {
    expect(eligibilityGap("2024-12-31", "2025-06-01")).toBeUndefined();
    expect(eligibilityGap("2025-01-01", "2025-06-01")).toContain("Form 7211");
  });

  it("the facility must be in service by the end of 2025", () => {
    expect(eligibilityGap("2024-01-01", "2025-12-31")).toBeUndefined();
    expect(eligibilityGap("2024-01-01", "2026-01-01")).toBeDefined();
  });

  it("the 10-year credit period must reach into 2025 (how-to-figure-the-credit::b01)", () => {
    expect(eligibilityGap("2014-01-01", "2015-01-01")).toContain("10-year");
    expect(eligibilityGap("2014-01-01", "2015-01-02")).toBeUndefined();
  });
});

describe("line 15: the 4-year period (face-part-ii-2::b01)", () => {
  it("placed in service in 2022 or later: all of 2025 is in the first four years", () => {
    expect(fourYearPeriodIn2025("2022-01-01")).toBe("inside");
    expect(fourYearPeriodIn2025("2025-04-01")).toBe("inside");
  });

  it("placed in service on or before January 1, 2021: all after it", () => {
    expect(fourYearPeriodIn2025("2021-01-01")).toBe("after");
    expect(fourYearPeriodIn2025("2017-08-01")).toBe("after");
  });

  it("placed in service later in 2021: the period ends during 2025", () => {
    expect(fourYearPeriodIn2025("2021-01-02")).toBe("split");
    expect(fourYearPeriodIn2025("2021-12-31")).toBe("split");
  });

  it("splits the credit by kilowatt-hours, and the parts add up to the credit", () => {
    expect(splitByFourYears(9_000, 300_000, 100_000)).toEqual({
      firstFourYears: 3_000,
      after: 6_000,
    });
    const odd = splitByFourYears(10_001, 3, 1);
    expect(odd.firstFourYears + odd.after).toBe(10_001);
  });
});
