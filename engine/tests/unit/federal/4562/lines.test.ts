/* Source: 2025 Instructions for Form 4562 (lines 14, 19, 22, 42–44). */

import { describe, expect, it } from "vitest";
import type { DepreciableAsset } from "../../../../src/facts/index.js";
import { federalAssetFigures, firstYearRate } from "../../../../src/federal/4562/assets.js";
import { form4562Figures, line44, mustFile4562 } from "../../../../src/federal/4562/lines.js";

const asset = (overrides: Partial<DepreciableAsset>): DepreciableAsset => ({
  description: "Equipment",
  placedInService: "2025-01-01",
  cost: 10000,
  recoveryClass: "5_year",
  method: "200DB",
  convention: "HY",
  ...overrides,
});

describe("first-year MACRS rate (Step 1–3)", () => {
  it.each([
    ["5-year 200DB HY", asset({}), 0.2],
    ["7-year 200DB HY", asset({ recoveryClass: "7_year" }), (2 / 7) * 0.5],
    [
      "5-year 200DB MQ, 4th quarter",
      asset({ convention: "MQ", placedInService: "2025-11-02" }),
      0.4 * 0.125,
    ],
    ["15-year 150DB HY", asset({ recoveryClass: "15_year", method: "150DB" }), 0.05],
    [
      "residential rental SL MM, March",
      asset({
        recoveryClass: "residential_rental",
        method: "SL",
        convention: "MM",
        placedInService: "2025-03-10",
      }),
      (1 / 27.5) * (9.5 / 12),
    ],
  ])("%s", (_, input, rate) => {
    expect(firstYearRate(input)).toBeCloseTo(rate, 10);
  });
});

describe("special depreciation allowance (line 14)", () => {
  it("is 40% for property placed in service before January 20, 2025", () => {
    expect(federalAssetFigures(asset({})).specialAllowance).toBe(4000);
  });
  it("waits for the acquisition answer after January 19", () => {
    expect(
      federalAssetFigures(asset({ placedInService: "2025-03-01" })).specialAllowance,
    ).toBeUndefined();
  });
  it("is 100% for property acquired after January 19, unless the 40% election", () => {
    const later = { placedInService: "2025-03-01", acquiredAfterJanuary19: true };
    expect(federalAssetFigures(asset(later)).specialAllowance).toBe(10000);
    expect(
      federalAssetFigures(asset({ ...later, elected40PercentAllowance: true })).specialAllowance,
    ).toBe(4000);
  });
  it("is 0 for real property and when elected out", () => {
    const real = asset({ recoveryClass: "nonresidential_real", method: "SL", convention: "MM" });
    expect(federalAssetFigures(real).specialAllowance).toBe(0);
    expect(
      federalAssetFigures(asset({ electedOutOfSpecialAllowance: true })).specialAllowance,
    ).toBe(0);
  });
});

describe("Form 4562 totals", () => {
  it("line 22 adds the special allowance, older MACRS and line 19", () => {
    const figures = form4562Figures({ assets: [asset({})], priorYearMacrs: 300 });
    expect(figures.line14).toBe(4000);
    expect(figures.line19).toEqual([
      expect.objectContaining({ row: "19b", basis: 6000, deduction: 1200 }),
    ]);
    expect(figures.line22).toBe(5500);
  });
  it("line 22 is a gap with a section 179 election (line 11 is not modeled)", () => {
    expect(form4562Figures({ assets: [asset({ section179Elected: 1000 })] }).gap).toBeDefined();
  });
  it("line 44 adds line 42 with its cents and line 43, then rounds", () => {
    const costs = [
      {
        description: "a",
        beginsOn: "2025-03-03",
        amount: 200,
        codeSection: "195",
        periodMonths: 12,
      },
      {
        description: "b",
        beginsOn: "2025-05-05",
        amount: 400,
        codeSection: "195",
        periodMonths: 12,
      },
    ];
    expect(line44({ amortizedCosts: costs, priorYearAmortization: 2600 })).toBe(3033);
  });
  it("is a gap when the stated convention fails the mid-quarter test", () => {
    const late = asset({ placedInService: "2025-11-02", electedOutOfSpecialAllowance: true });
    expect(form4562Figures({ assets: [late] }).gap).toContain("mid-quarter");
    expect(form4562Figures({ assets: [{ ...late, convention: "MQ" }] }).line22).toBe(500);
  });
  it("older depreciation or amortization alone files no Form 4562", () => {
    expect(mustFile4562({ priorYearMacrs: 1000, priorYearAmortization: 100 })).toBe(false);
  });
});
