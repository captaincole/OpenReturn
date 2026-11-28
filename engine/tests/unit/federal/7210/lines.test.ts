/*
 * Form 7210 Parts II to IV, pure arithmetic (federal/7210/lines.ts). The
 * instructions publish no example with numbers; the applicable amount table
 * (irs-7210-inst-2025::sec::applicable-amount::b01) is the one published
 * figure, and the rest are limit and edge tests.
 */

import { describe, expect, it } from "vitest";
import {
  APPLICABLE_AMOUNT,
  bondLines,
  form7210Lines,
  line10Of,
  line12Of,
  productionLines,
  tierOf,
} from "../../../../src/federal/7210/lines.js";
import { roundToPlaces } from "../../../../src/money.js";

describe("the applicable amount table (irs-7210-inst-2025::sec::applicable-amount::b01)", () => {
  it("each row is its applicable percentage of the 100% amount, rounded to 0.1 cent", () => {
    const full = APPLICABLE_AMOUNT["6a"];
    expect(full).toBe(0.637);
    expect(roundToPlaces(full * 0.334, 3)).toBe(APPLICABLE_AMOUNT["6b"]);
    expect(roundToPlaces(full * 0.25, 3)).toBe(APPLICABLE_AMOUNT["6c"]);
    expect(roundToPlaces(full * 0.2, 3)).toBe(APPLICABLE_AMOUNT["6d"]);
  });
});

describe("the emissions bands", () => {
  it.each([
    [0, "6a"],
    [0.4499, "6a"],
    [0.45, "6b"],
    [1.4999, "6b"],
    [1.5, "6c"],
    [2.4999, "6c"],
    [2.5, "6d"],
    [4.0, "6d"],
  ])("a rate of %s is on line %s", (rate, tier) => {
    expect(tierOf(rate)).toBe(tier);
  });

  it("a rate above 4.0 is not qualified clean hydrogen: no row", () => {
    expect(tierOf(4.0001)).toBeUndefined();
    expect(tierOf(-0.1)).toBeUndefined();
  });
});

describe("lines 6a to 7", () => {
  it("column (c) is column (a) times column (b), whole dollars", () => {
    const { rows } = productionLines([{ emissionsRate: 0.2, kilograms: 10_000 }]);
    expect(rows["6a"]).toEqual({ kilograms: 10_000, credit: 6_370 });
  });

  it("two processes in one band add their kilograms; a process above 4.0 adds nothing", () => {
    const { rows, line7 } = productionLines([
      { emissionsRate: 1.0, kilograms: 2_000 },
      { emissionsRate: 1.4, kilograms: 3_000 },
      { emissionsRate: 4.5, kilograms: 9_000 },
    ]);
    expect(rows["6b"]).toEqual({ kilograms: 5_000, credit: 1_065 });
    expect(Object.keys(rows)).toEqual(["6b"]);
    expect(line7).toBe(1_065);
  });

  it("line 7 adds the rows with their cents and rounds once", () => {
    // 3,500 × 0.127 = 444.50 → 445; 1,500 × 0.159 = 238.50 → 239; exact total 683.00.
    const { rows, line7 } = productionLines([
      { emissionsRate: 3.0, kilograms: 3_500 },
      { emissionsRate: 2.0, kilograms: 1_500 },
    ]);
    expect(rows["6d"]?.credit).toBe(445);
    expect(rows["6c"]?.credit).toBe(239);
    expect(line7).toBe(683);
  });

  it("line 7 equals the sum of column (c) to within a dollar for each row", () => {
    const { rows, line7 } = productionLines([
      { emissionsRate: 0.1, kilograms: 1_234.5 },
      { emissionsRate: 0.5, kilograms: 2_222 },
      { emissionsRate: 2.0, kilograms: 3_333 },
      { emissionsRate: 3.9, kilograms: 4_444 },
    ]);
    const rowSum = Object.values(rows).reduce((total, row) => total + (row?.credit ?? 0), 0);
    expect(Math.abs(line7 - rowSum)).toBeLessThanOrEqual(2);
  });

  it("no qualified production: line 7 is 0", () => {
    expect(productionLines([]).line7).toBe(0);
  });
});

describe("Part III, the tax-exempt bond reduction", () => {
  it("no bonds: lines 8a to 8d blank, line 9 is line 7", () => {
    expect(bondLines(10_000, undefined)).toEqual({ line9: 10_000 });
  });

  it("a fraction below 15%: line 8d is line 8b", () => {
    const lines = bondLines(8_550, { proceeds: 120_000, capitalAccountAdditions: 2_400_000 });
    expect(lines.bonds).toEqual({ ratio: 0.05, line8b: 428, line8c: 1_283, line8d: 428 });
    expect(lines.line9).toBe(8_122);
  });

  it("a fraction above 15%: line 8d is the 15% cap", () => {
    const lines = bondLines(10_000, { proceeds: 500_000, capitalAccountAdditions: 1_000_000 });
    expect(lines.bonds?.line8d).toBe(1_500);
    expect(lines.line9).toBe(8_500);
  });

  it("exactly 15%: both lines agree", () => {
    const lines = bondLines(10_000, { proceeds: 150_000, capitalAccountAdditions: 1_000_000 });
    expect(lines.bonds?.line8b).toBe(1_500);
    expect(lines.bonds?.line8c).toBe(1_500);
    expect(lines.line9).toBe(8_500);
  });

  it("the reduction never takes more than 15% of line 7", () => {
    for (const proceeds of [0, 10_000, 200_000, 2_000_000]) {
      const lines = bondLines(9_999, { proceeds, capitalAccountAdditions: 1_000_000 });
      expect(lines.line9).toBeGreaterThanOrEqual(9_999 - 1_500);
    }
  });
});

describe("Part IV", () => {
  it("line 10 is line 9 times 5.0 with line 5 checked, else line 9", () => {
    expect(line10Of(8_122, true)).toBe(40_610);
    expect(line10Of(8_122, false)).toBe(8_122);
  });

  it("line 12 adds lines 10 and 11, and is blank with neither", () => {
    expect(line12Of(40_610, 2_750)).toBe(43_360);
    expect(line12Of(undefined, 2_750)).toBe(2_750);
    expect(line12Of(40_610, undefined)).toBe(40_610);
    expect(line12Of(undefined, undefined)).toBeUndefined();
  });

  it("the whole facility: line 10 is never more than 5 times line 7", () => {
    const lines = form7210Lines(
      [{ emissionsRate: 0.3, kilograms: 50_000 }],
      { proceeds: 1, capitalAccountAdditions: 10 },
      true,
    );
    expect(lines.line10).toBeLessThanOrEqual(lines.line7 * 5);
    expect(lines.line10).toBe(lines.line9 * 5);
  });
});
