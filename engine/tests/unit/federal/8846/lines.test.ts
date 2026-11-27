/*
 * Form 8846 arithmetic: the published examples, then limit tests that need no
 * source (the lines add up, the credit never passes 7.65% of line 3, each
 * edge of the minimum rate).
 */

import { describe, expect, it } from "vitest";
import {
  BEAUTY_SERVICE_RATE,
  FOOD_OR_BEVERAGE_RATE,
  MEDICARE_ONLY_RATE,
  SOCIAL_SECURITY_AND_MEDICARE_RATE,
  creditLines,
  line4Unrounded,
  line6Of,
  nonCreditableTipsOfMonth,
} from "../../../../src/federal/8846/lines.js";

describe("published examples", () => {
  it("Form 8846 instructions (2025), How the Credit Is Figured, Example: $450 of tips less $140 leaves $310", () => {
    const month = { hoursWorked: 100, wagesExcludingTips: 375, tips: 450 };
    const notCreditable = nonCreditableTipsOfMonth(month, FOOD_OR_BEVERAGE_RATE);
    expect(notCreditable).toBeCloseTo(140, 9);
    expect(month.tips - notCreditable).toBeCloseTo(310, 9);
  });

  it("Fit Small Business, Form 8846 instructions walkthrough: $10,000 of tips, $1,150 not creditable, $677 credit", () => {
    const month = { hoursWorked: 1000, wagesExcludingTips: 4000, tips: 10000 };
    const notCreditable = nonCreditableTipsOfMonth(month, FOOD_OR_BEVERAGE_RATE);
    expect(notCreditable).toBeCloseTo(1150, 9);
    expect(creditLines(10000, notCreditable, 0)).toEqual({
      line1: 10000,
      line2: 1150,
      line3: 8850,
      medicareOnlyTips: 0,
      line4: 677,
    });
  });
});

describe("line 2, one employee month", () => {
  it("a beauty service employee uses $7.25, a food or beverage employee $5.15", () => {
    const month = { hoursWorked: 100, wagesExcludingTips: 375, tips: 450 };
    expect(nonCreditableTipsOfMonth(month, BEAUTY_SERVICE_RATE)).toBeCloseTo(350, 9);
    expect(nonCreditableTipsOfMonth(month, FOOD_OR_BEVERAGE_RATE)).toBeCloseTo(140, 9);
  });

  it("wages exactly at the rate: zero", () => {
    const month = { hoursWorked: 100, wagesExcludingTips: 515, tips: 450 };
    expect(nonCreditableTipsOfMonth(month, FOOD_OR_BEVERAGE_RATE)).toBe(0);
  });

  it("wages above the rate: zero, never negative", () => {
    const month = { hoursWorked: 100, wagesExcludingTips: 900, tips: 450 };
    expect(nonCreditableTipsOfMonth(month, BEAUTY_SERVICE_RATE)).toBe(0);
  });

  it("a shortfall above the month's tips takes only the tips", () => {
    const month = { hoursWorked: 80, wagesExcludingTips: 170.4, tips: 300 };
    expect(nonCreditableTipsOfMonth(month, BEAUTY_SERVICE_RATE)).toBe(300);
  });
});

describe("lines 1 to 4 and 6", () => {
  it("line 3 is line 1 less line 2, each rounded once", () => {
    const lines = creditLines(184600.4, 1362.5, 0);
    expect(lines.line1).toBe(184600);
    expect(lines.line2).toBe(1363);
    expect(lines.line3).toBe(lines.line1 - lines.line2);
  });

  it("with the box: Medicare-only tips at 1.45%, the rest at 7.65%", () => {
    const lines = creditLines(184600.4, 1362.5, 21480);
    // (183,237 − 21,480) × 0.0765 + 21,480 × 0.0145 = 12,374.41 + 311.46
    expect(lines.line4).toBe(12686);
  });

  it("all of line 3 Medicare-only: line 3 × 1.45%", () => {
    expect(line4Unrounded(10000, 10000)).toBeCloseTo(10000 * MEDICARE_ONLY_RATE, 9);
  });

  it("the credit never passes 7.65% of line 3 and never falls below 1.45% of it", () => {
    for (const medicareOnly of [0, 1, 2500, 9999, 10000]) {
      const credit = line4Unrounded(10000, medicareOnly);
      expect(credit).toBeLessThanOrEqual(10000 * SOCIAL_SECURITY_AND_MEDICARE_RATE + 1e-9);
      expect(credit).toBeGreaterThanOrEqual(10000 * MEDICARE_ONLY_RATE - 1e-9);
    }
  });

  it("line 2 above line 1: line 3 is 0, not negative", () => {
    expect(creditLines(100, 250, 0).line3).toBe(0);
    expect(creditLines(100, 250, 0).line4).toBe(0);
  });

  it("line 6 adds line 4 and line 5, a blank counting 0", () => {
    expect(line6Of(12686, 2350)).toBe(15036);
    expect(line6Of(undefined, 2350)).toBe(2350);
    expect(line6Of(677, undefined)).toBe(677);
  });
});
