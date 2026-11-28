/*
 * Form 7211 Part II arithmetic (federal/7211/lines.ts). The instructions print
 * no worked example; the one published set of numbers is the Federal Register
 * notice the instructions point to (90 FR 41477), which gives the 2025 factor
 * and both applicable amounts. The rest are limit and edge tests.
 */

import { describe, expect, it } from "vitest";
import {
  adjustedAmount,
  alternativeBoxes,
  applicableAmount,
  BASE_AMOUNT_CENTS,
  BASE_ROUNDING_CENTS,
  domesticContentBonus,
  INFLATION_FACTOR_2025,
  partIILines,
  type PartIIInputs,
} from "../../../../src/federal/7211/lines.js";

const FACILITY: PartIIInputs = {
  kilowattHours: 1_000_000,
  alternative: true,
  energyCommunity: false,
  domesticContent: false,
};

describe("90 FR 41477 (FR Doc. 2025-16249): the 2025 applicable amounts", () => {
  it("the factor 1.9971 gives 0.6 cents ($0.006) and 3 cents ($0.03)", () => {
    expect(INFLATION_FACTOR_2025).toBe(1.9971);
    expect(applicableAmount(false)).toBe(0.006);
    expect(applicableAmount(true)).toBe(0.03);
  });
});

describe("the rounding to a multiple of 0.05 cent and 0.1 cent (applicable-amount::b01, ::b02)", () => {
  it("with no inflation the amounts are 0.3 and 1.5 cents", () => {
    expect(applicableAmount(false, 1)).toBe(0.003);
    expect(applicableAmount(true, 1)).toBe(0.015);
  });

  it("0.33 cents rounds to 0.35; 1.65 cents rounds up to 1.7", () => {
    expect(applicableAmount(false, 1.1)).toBe(0.0035);
    expect(applicableAmount(true, 1.1)).toBe(0.017);
  });

  it("0.32 cents rounds down to 0.30 cents", () => {
    expect(adjustedAmount(BASE_AMOUNT_CENTS, 1.0611, BASE_ROUNDING_CENTS)).toBe(0.003);
  });
});

describe("line 7: the alternative amount boxes", () => {
  const answers = { netOutputUnder1Mw: false, prevailingWageAndApprenticeship: false };

  it("each reason checks its box; none is 7d", () => {
    expect(alternativeBoxes({ ...answers, constructionBegan: "2024-01-01" })).toEqual([]);
    expect(
      alternativeBoxes({
        netOutputUnder1Mw: true,
        prevailingWageAndApprenticeship: true,
        constructionBegan: "2024-01-01",
      }),
    ).toEqual(["a", "c"]);
  });

  it("construction on January 28, 2023 checks 7b; on January 29 it does not", () => {
    expect(alternativeBoxes({ ...answers, constructionBegan: "2023-01-28" })).toEqual(["b"]);
    expect(alternativeBoxes({ ...answers, constructionBegan: "2023-01-29" })).toEqual([]);
  });
});

describe("Part II lines", () => {
  it("no bonus and no bond: line 3 is the product, and lines 6a to 6d are blank", () => {
    const lines = partIILines(FACILITY);
    expect(lines).toMatchObject({ line1c: 30_000, line3: 30_000, line5a: 0, line5b: 30_000 });
    expect(lines.line6a).toBeUndefined();
    expect(lines.line6d).toBeUndefined();
    expect(lines).toMatchObject({ line7: 30_000, line8a: 0, line8b: 30_000, line9: 30_000 });
  });

  it("the base amount: 1,000,000 kWh at $0.006 is $6,000", () => {
    expect(partIILines({ ...FACILITY, alternative: false }).line1c).toBe(6_000);
  });

  it("column (c) rounds to the dollar: 12,345 kWh × $0.03 = $370.35 → 370; 12,350 × 0.03 = 370.50 → 371", () => {
    expect(partIILines({ ...FACILITY, kilowattHours: 12_345 }).line1c).toBe(370);
    expect(partIILines({ ...FACILITY, kilowattHours: 12_350 }).line1c).toBe(371);
  });

  it("both bonuses and a bond under 15%: the tad facility", () => {
    const lines = partIILines({
      kilowattHours: 1_284_500,
      alternative: true,
      energyCommunity: true,
      domesticContent: true,
      financing: { proceeds: 180_000, capitalAccountAdditions: 1_440_000 },
    });
    expect(lines).toEqual({
      line1a: 1_284_500,
      line1b: 0.03,
      line1c: 38_535,
      line3: 38_535,
      line5a: 3_854,
      line5b: 42_389,
      line6a: "0.125",
      line6b: 5_299,
      line6c: 6_358,
      line6d: 5_299,
      line7: 37_090,
      line8a: 3_372,
      line8b: 40_462,
      line9: 40_462,
    });
  });

  it("a bond over 15% of the capital account: line 6d is the 15% cap", () => {
    const lines = partIILines({
      ...FACILITY,
      financing: { proceeds: 400_000, capitalAccountAdditions: 1_000_000 },
    });
    expect(lines).toMatchObject({ line6a: "0.4", line6b: 12_000, line6c: 4_500, line6d: 4_500 });
    expect(lines.line7).toBe(25_500);
  });

  it("a bond of exactly 15%: lines 6b and 6c are equal", () => {
    const lines = partIILines({
      ...FACILITY,
      financing: { proceeds: 150_000, capitalAccountAdditions: 1_000_000 },
    });
    expect(lines).toMatchObject({ line6b: 4_500, line6c: 4_500, line6d: 4_500, line7: 25_500 });
  });

  it("domestic content without the energy community bonus is 10% of line 7", () => {
    expect(partIILines({ ...FACILITY, domesticContent: true }).line8a).toBe(3_000);
  });

  it("domestic content after the energy community bonus is 10% of the amount before it", () => {
    const lines = partIILines({ ...FACILITY, energyCommunity: true, domesticContent: true });
    expect(lines).toMatchObject({ line5a: 3_000, line5b: 33_000, line8a: 3_000, line8b: 36_000 });
  });
});

describe("limits", () => {
  it("line 8a is never more than 10% of line 7, and 0 without domestic content", () => {
    for (const line7 of [0, 1, 999, 37_090, 1_234_567]) {
      expect(domesticContentBonus(line7, true, true)).toBeLessThanOrEqual(line7 * 0.1 + 0.5);
      expect(domesticContentBonus(line7, true, false)).toBeLessThanOrEqual(line7 * 0.1 + 0.5);
      expect(domesticContentBonus(line7, false, true)).toBe(0);
    }
  });

  it("the bond reduction is never more than 15% of line 5b, and line 7 is never below 85% of it", () => {
    for (const proceeds of [0, 50_000, 150_000, 999_999]) {
      const lines = partIILines({
        ...FACILITY,
        financing: { proceeds, capitalAccountAdditions: 1_000_000 },
      });
      expect(lines.line6d!).toBeLessThanOrEqual(lines.line6c!);
      expect(lines.line7).toBe(lines.line5b - lines.line6d!);
      expect(lines.line7).toBeGreaterThanOrEqual(lines.line5b * 0.85 - 0.5);
    }
  });

  it("no capital account additions: the ratio is 0 and nothing is taken off", () => {
    const lines = partIILines({
      ...FACILITY,
      financing: { proceeds: 10_000, capitalAccountAdditions: 0 },
    });
    expect(lines).toMatchObject({ line6a: "0", line6b: 0, line6d: 0, line7: 30_000 });
  });

  it("no kWh: every amount is 0", () => {
    const lines = partIILines({ ...FACILITY, kilowattHours: 0, energyCommunity: true });
    expect(lines).toMatchObject({ line1c: 0, line5a: 0, line8b: 0, line9: 0 });
  });
});
