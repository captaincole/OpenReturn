/*
 * Form 8864 arithmetic (lines.ts). Neither the instructions nor a publication
 * has an example with numbers (.scratch evidence search, 2026-11-27), so these
 * are rule and limit tests: each rate, the rounding, the totals and each limit
 * edge.
 */

import { describe, expect, it } from "vitest";
import {
  PRODUCTIVE_CAPACITY_LIMIT_GALLONS,
  QUALIFIED_PRODUCTION_LIMIT_GALLONS,
  RATE_AFTER_JUNE,
  RATE_BEFORE_JULY,
  columnC,
  line10Of,
  line11Of,
  line9Shares,
  ownProductionLines,
  unroundedCredit,
  withinCombinedLimits,
} from "../../../../src/federal/8864/lines.js";

describe("the rates printed in column (b)", () => {
  it("are $.10 before July 1 and $.20 after June 30 (line-7::b01, line-8::b01)", () => {
    expect(RATE_BEFORE_JULY).toBe(0.1);
    expect(RATE_AFTER_JUNE).toBe(0.2);
  });

  it("the limits are 15 million gallons and 60 million gallons of capacity", () => {
    expect(QUALIFIED_PRODUCTION_LIMIT_GALLONS).toBe(15_000_000);
    expect(PRODUCTIVE_CAPACITY_LIMIT_GALLONS).toBe(60_000_000);
  });
});

describe("column (c)", () => {
  it("multiplies the gallons by the rate, in whole dollars", () => {
    expect(columnC(61480, RATE_BEFORE_JULY)).toBe(6148);
    expect(columnC(74215, RATE_AFTER_JUNE)).toBe(14843);
  });

  it("rounds to the nearest dollar: 50 cents up, 40 cents down", () => {
    expect(columnC(5, RATE_BEFORE_JULY)).toBe(1);
    expect(columnC(4, RATE_BEFORE_JULY)).toBe(0);
    expect(columnC(12_345_678, RATE_AFTER_JUNE)).toBe(2_469_136);
  });
});

describe("lines 7 to 9", () => {
  it("line 9 adds the two rounded column (c) amounts", () => {
    const lines = ownProductionLines(61480, 74215);
    expect(lines).toEqual({
      line7a: 61480,
      line7c: 6148,
      line8a: 74215,
      line8c: 14843,
      line9: 20991,
    });
  });

  it("a year with no production after June 30 leaves line 8 at 0", () => {
    const lines = ownProductionLines(1000, 0);
    expect(lines.line8c).toBe(0);
    expect(lines.line9).toBe(lines.line7c);
  });

  it("the credit is never more than $.20 for each gallon (limit)", () => {
    for (const [before, after] of [
      [0, 15_000_000],
      [7_500_000, 7_500_000],
      [1, 1],
    ]) {
      expect(ownProductionLines(before, after).line9).toBeLessThanOrEqual(
        RATE_AFTER_JUNE * (before + after) + 1,
      );
    }
    expect(ownProductionLines(0, 15_000_000).line9).toBe(3_000_000);
  });
});

describe("each business's part of line 9", () => {
  it("one business takes all of line 9", () => {
    expect(line9Shares(20991, [unroundedCredit(61480, 74215)])).toEqual([20991]);
  });

  it("two businesses split line 9 by their own credit and add to it exactly", () => {
    const credits = [unroundedCredit(1005, 0), unroundedCredit(0, 1003)];
    const line9 = ownProductionLines(1005, 1003).line9;
    const shares = line9Shares(line9, credits);
    expect(shares.reduce((total, share) => total + share, 0)).toBe(line9);
    expect(shares).toEqual([101, 201]);
  });
});

describe("the limits of more than one source", () => {
  const source = (gallons: number, productiveCapacityGallons: number) => ({
    gallons,
    productiveCapacityGallons,
  });

  it("one source is held to its own limits, so the combined test passes", () => {
    expect(withinCombinedLimits([source(20_000_000, 70_000_000)])).toBe(true);
    expect(withinCombinedLimits([])).toBe(true);
  });

  it("two sources pass at exactly 15 million gallons and 60 million of capacity", () => {
    expect(
      withinCombinedLimits([source(10_000_000, 30_000_000), source(5_000_000, 30_000_000)]),
    ).toBe(true);
  });

  it("one gallon over 15 million fails", () => {
    expect(withinCombinedLimits([source(10_000_000, 1), source(5_000_001, 1)])).toBe(false);
  });

  it("one gallon of capacity over 60 million fails", () => {
    expect(withinCombinedLimits([source(1, 30_000_000), source(1, 30_000_001)])).toBe(false);
  });
});

describe("lines 10 and 11", () => {
  it("line 10 rounds each pass-through credit before the add", () => {
    // 101 + 201, not 301 from the unrounded sum.
    expect(line10Of([100.5, 200.5])).toBe(302);
    expect(line10Of([])).toBeUndefined();
  });

  it("line 11 adds lines 9 and 10, and is blank while both are", () => {
    expect(line11Of(20991, 4180)).toBe(25171);
    expect(line11Of(undefined, 4180)).toBe(4180);
    expect(line11Of(20991, undefined)).toBe(20991);
    expect(line11Of(undefined, undefined)).toBeUndefined();
  });
});
