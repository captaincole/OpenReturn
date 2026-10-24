/*
 * Cross-check the rate-schedule lookup against the IRS-published formula
 * pieces. Each case picks a representative income inside one bracket and
 * confirms tax = income × rate − subtraction.
 */

import { describe, expect, it } from "vitest";
import { FEDERAL_RATE_SCHEDULES_2025, lookupRateSchedule } from "../../../src/data/rateSchedule.js";

describe("lookupRateSchedule — 2025 federal", () => {
  describe("single", () => {
    it("$101,000 → 22% bracket: 101,000 × 0.22 − 5,086 = 17,134", () => {
      // The single 22% bracket is narrow: $100k–$103,350.
      expect(lookupRateSchedule(2025, "single", 101000)).toBeCloseTo(17134, 2);
    });
    it("$150,000 → 24% bracket: 150,000 × 0.24 − 7,153 = 28,847", () => {
      expect(lookupRateSchedule(2025, "single", 150000)).toBeCloseTo(28847, 2);
    });
    it("$200,000 → 32% bracket: 200,000 × 0.32 − 22,937 = 41,063", () => {
      expect(lookupRateSchedule(2025, "single", 200000)).toBeCloseTo(41063, 2);
    });
    it("$700,000 → 37% bracket: 700,000 × 0.37 − 42,979.75 = 216,020.25", () => {
      expect(lookupRateSchedule(2025, "single", 700000)).toBeCloseTo(216020.25, 2);
    });
  });

  describe("married_filing_jointly", () => {
    it("$150,000 → 22% bracket", () => {
      expect(lookupRateSchedule(2025, "married_filing_jointly", 150000)).toBeCloseTo(
        150000 * 0.22 - 10172,
        2,
      );
    });
    it("$300,000 → 24% bracket", () => {
      expect(lookupRateSchedule(2025, "married_filing_jointly", 300000)).toBeCloseTo(
        300000 * 0.24 - 14306,
        2,
      );
    });
  });

  describe("head_of_household", () => {
    it("$150,000 → 24% bracket", () => {
      expect(lookupRateSchedule(2025, "head_of_household", 150000)).toBeCloseTo(
        150000 * 0.24 - 8892,
        2,
      );
    });
  });

  it("every printed constant continues the previous row (catches typos)", () => {
    /*
     * Tax is continuous at each bracket edge x: x·r₀ − d₀ = x·r₁ − d₁, so
     * d₁ = d₀ + x·(r₁ − r₀). The IRS prints the constants; this re-derives
     * each one from the row before it. The first row is checked against
     * the Tax Table in taxTable.test.ts.
     */
    for (const [status, rows] of Object.entries(FEDERAL_RATE_SCHEDULES_2025)) {
      for (let i = 1; i < rows.length; i++) {
        const prev = rows[i - 1];
        const row = rows[i];
        expect(row.overMin, `${status} row ${i} edge`).toBe(prev.overMax);
        const expected = prev.subtractAmount + row.overMin * (row.rate - prev.rate);
        expect(row.subtractAmount, `${status} row ${i}`).toBeCloseTo(expected, 2);
      }
    }
  });

  it("throws for income < $100,000 (should use tax table)", () => {
    expect(() => lookupRateSchedule(2025, "single", 50000)).toThrow(/Use lookupTax/);
  });

  it("throws on unknown tax year", () => {
    expect(() => lookupRateSchedule(2099, "single", 150000)).toThrow(/No rate schedule/);
  });
});
