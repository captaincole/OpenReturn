/*
 * Form 7213 Section 2 arithmetic (lines.ts). The instructions publish no
 * example with numbers (QUESTIONS.md), so these are the form's own lines
 * applied to round amounts, and limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  advancedNuclearLines,
  percentText,
  ZEC_THRESHOLD_RATE,
  ZERO_EMISSION_RATE,
  zeroEmissionLines,
} from "../../../../src/federal/7213/lines.js";

const zeroEmission = (overrides: Partial<Parameters<typeof zeroEmissionLines>[0]> = {}) =>
  zeroEmissionLines({
    kwhProducedAndSold: 6_000_000,
    grossReceipts: 210_000,
    zecPayments: 30_000,
    zecPaymentsReducedByFullCredit: false,
    prevailingWage: false,
    ...overrides,
  });

describe("Form 7213 Part I, section 45J (face-part-i::b02)", () => {
  it("a sole owner with the whole facility limitation: line 3 is 100% and the tentative credit stands", () => {
    const lines = advancedNuclearLines({
      facilityLimitationMw: 1100,
      nameplateCapacityMw: 1100,
      kwhProducedAndSold: 1_000_000_000,
    });
    expect(lines.line3).toBe(1);
    expect(percentText(lines.line3)).toBe("100");
    expect(lines.line5a).toBe(1_000_000_000);
    // 1,000,000,000 kWh × $0.018.
    expect(lines.line5b).toBe(18_000_000);
    expect(lines.line6a).toBe(1.1);
    // 1.1 × $125,000,000.
    expect(lines.line6b).toBe(137_500_000);
    expect(lines.line7).toBe(18_000_000);
  });

  it("a partial allocation (the dain scenario): 80% of the kWh, and the annual limit binds", () => {
    const lines = advancedNuclearLines({
      facilityLimitationMw: 0.4,
      nameplateCapacityMw: 0.5,
      kwhProducedAndSold: 4_000_000,
    });
    expect(percentText(lines.line3)).toBe("80");
    expect(lines.line5a).toBe(3_200_000);
    expect(lines.line5b).toBe(57_600);
    expect(lines.line6a).toBeCloseTo(0.0004, 10);
    expect(lines.line6b).toBe(50_000);
    expect(lines.line7).toBe(50_000);
  });

  it("line 3 keeps 4 places of the ratio, and line 5a multiplies by the printed value", () => {
    const lines = advancedNuclearLines({
      facilityLimitationMw: 1,
      nameplateCapacityMw: 3,
      kwhProducedAndSold: 3_000_000,
    });
    expect(lines.line3).toBe(0.3333);
    expect(percentText(lines.line3)).toBe("33.33");
    expect(lines.line5a).toBe(999_900);
    expect(lines.line5b).toBe(17_998);
  });

  it("line 7 is never more than either line 5b or line 6b", () => {
    for (const kwh of [0, 1, 500_000, 2_777_778, 9_000_000, 50_000_000]) {
      const lines = advancedNuclearLines({
        facilityLimitationMw: 0.4,
        nameplateCapacityMw: 0.5,
        kwhProducedAndSold: kwh,
      });
      expect(lines.line7).toBeLessThanOrEqual(lines.line5b);
      expect(lines.line7).toBeLessThanOrEqual(lines.line6b);
      expect([lines.line5b, lines.line6b]).toContain(lines.line7);
    }
  });

  it("at the edge where 5b equals 6b, line 7 is that amount", () => {
    // 0.4 MW → $50,000; $50,000 / 0.018 / 0.8 = 3,472,222.2 kWh: 3,472,222 → 2,777,778 × 0.018 = 50,000.
    const lines = advancedNuclearLines({
      facilityLimitationMw: 0.4,
      nameplateCapacityMw: 0.5,
      kwhProducedAndSold: 3_472_222,
    });
    expect(lines.line5a).toBe(2_777_778);
    expect(lines.line5b).toBe(50_000);
    expect(lines.line7).toBe(50_000);
  });

  it("no nameplate capacity: line 3 is 0 and so is the credit", () => {
    const lines = advancedNuclearLines({
      facilityLimitationMw: 0,
      nameplateCapacityMw: 0,
      kwhProducedAndSold: 1_000_000,
    });
    expect(lines.line3).toBe(0);
    expect(lines.line7).toBe(0);
  });
});

describe("Form 7213 Part II, section 45U (face-part-ii::b02)", () => {
  it("the 2025 rates: $0.003 on line 2 and $0.026 on line 7 (the DECISION in lines.ts)", () => {
    expect(ZERO_EMISSION_RATE).toBe(0.003);
    expect(ZEC_THRESHOLD_RATE).toBe(0.026);
  });

  it("the dain scenario: ZEC payments kept on line 6, the 16% reduction, prevailing wage × 5", () => {
    const lines = zeroEmission({ prevailingWage: true });
    expect(lines).toEqual({
      line1: 6_000_000,
      line3: 18_000,
      line4: 210_000,
      line5: 30_000,
      line6: 210_000,
      line7: 156_000,
      line8: 54_000,
      line9: 8_640,
      line10: 9_360,
      line11: 46_800,
    });
  });

  it("without the prevailing wage requirements, line 11 is line 10", () => {
    const lines = zeroEmission();
    expect(lines.line11).toBe(lines.line10);
    expect(lines.line11).toBe(9_360);
  });

  it("the full credit reduces the ZEC payments: line 6 is line 4 less line 5", () => {
    const lines = zeroEmission({ zecPaymentsReducedByFullCredit: true });
    expect(lines.line6).toBe(180_000);
    expect(lines.line8).toBe(24_000);
    expect(lines.line9).toBe(3_840);
    expect(lines.line10).toBe(14_160);
  });

  it("receipts at or under line 7: line 8 is 0, nothing is reduced", () => {
    const atEdge = zeroEmission({ grossReceipts: 156_000, zecPayments: 0 });
    expect(atEdge.line8).toBe(0);
    expect(atEdge.line9).toBe(0);
    expect(atEdge.line10).toBe(18_000);
    const under = zeroEmission({ grossReceipts: 100_000, zecPayments: 0 });
    expect(under.line8).toBe(0);
    expect(under.line10).toBe(18_000);
  });

  it("high receipts: line 9 stops at line 3, so the credit is 0 (the phase-out end)", () => {
    // 16% of (line 6 − 156,000) reaches 18,000 at line 6 = 268,500.
    const atEnd = zeroEmission({ grossReceipts: 268_500, zecPayments: 0 });
    expect(atEnd.line9).toBe(18_000);
    expect(atEnd.line10).toBe(0);
    const above = zeroEmission({ grossReceipts: 900_000, zecPayments: 0, prevailingWage: true });
    expect(above.line9).toBe(above.line3);
    expect(above.line11).toBe(0);
  });

  it("the credit is never negative and never more than 5 × line 3", () => {
    for (const grossReceipts of [0, 150_000, 156_000, 200_000, 268_500, 1_000_000]) {
      for (const prevailingWage of [false, true]) {
        const lines = zeroEmission({ grossReceipts, zecPayments: 0, prevailingWage });
        expect(lines.line11).toBeGreaterThanOrEqual(0);
        expect(lines.line11).toBeLessThanOrEqual(5 * lines.line3);
        expect(lines.line9 + lines.line10).toBe(lines.line3);
      }
    }
  });

  it("kWh with a fraction print whole, and each money line rounds to the dollar", () => {
    const lines = zeroEmission({ kwhProducedAndSold: 1_234_567.6, grossReceipts: 40_000.49 });
    expect(lines.line1).toBe(1_234_568);
    // 1,234,568 × 0.003 = 3,703.704.
    expect(lines.line3).toBe(3_704);
    expect(lines.line4).toBe(40_000);
    // 1,234,568 × 0.026 = 32,098.768.
    expect(lines.line7).toBe(32_099);
  });
});
