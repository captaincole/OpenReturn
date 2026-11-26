/*
 * Form 8859's arithmetic. The form and its instructions publish no example with
 * numbers (evidence search, 2026-11-26), so these are limit tests: each line
 * against the rule its own text states (irs-8859-form-2025::sec::face-page-1::b01,
 * tax-liability-limit-worksheet-line-2::b01, b02).
 */

import { describe, expect, it } from "vitest";
import {
  carryforwardFrom2024,
  form8859Lines,
  taxLiabilityLimit,
} from "../../../../src/federal/8859/lines.js";

describe("Form 8859 line 1", () => {
  it("is line 4 of the 2024 form, in whole dollars", () => {
    expect(carryforwardFrom2024(3800)).toBe(3800);
    expect(carryforwardFrom2024(1234.5)).toBe(1235);
    expect(carryforwardFrom2024(1234.49)).toBe(1234);
  });

  it("is never below 0", () => {
    expect(carryforwardFrom2024(-50)).toBe(0);
  });
});

describe("Tax Liability Limit Worksheet", () => {
  it("line 3 is line 1 less line 2", () => {
    expect(taxLiabilityLimit(3545, 500)).toEqual({ line1: 3545, line2: 500, line3: 3045 });
  });

  it("enters -0- when line 2 equals line 1", () => {
    expect(taxLiabilityLimit(2000, 2000).line3).toBe(0);
  });

  it("enters -0- when line 2 is more than line 1", () => {
    expect(taxLiabilityLimit(1500, 2200).line3).toBe(0);
  });

  it("is line 1 itself with no other credit", () => {
    expect(taxLiabilityLimit(4100, 0).line3).toBe(4100);
  });
});

describe("Form 8859 lines 2 to 4", () => {
  it("the tax limits the credit: the rest carries to 2026", () => {
    expect(form8859Lines(3800, taxLiabilityLimit(3545, 500))).toEqual({
      line1: 3800,
      line2: 3045,
      line3: 3045,
      line4: 755,
    });
  });

  it("the whole carryforward fits: line 4 is 0", () => {
    expect(form8859Lines(1000, taxLiabilityLimit(3545, 500))).toEqual({
      line1: 1000,
      line2: 3045,
      line3: 1000,
      line4: 0,
    });
  });

  it("line 1 equal to line 2 is used in full", () => {
    const lines = form8859Lines(3045, taxLiabilityLimit(3545, 500));
    expect([lines.line3, lines.line4]).toEqual([3045, 0]);
  });

  it("no tax left: lines 2 and 3 are 0, and line 4 is line 1", () => {
    const lines = form8859Lines(2500, taxLiabilityLimit(800, 1200));
    expect([lines.line2, lines.line3, lines.line4]).toEqual([0, 0, 2500]);
  });

  it("line 3 is never more than line 1 or line 2, and lines 3 and 4 add to line 1", () => {
    for (const line1 of [0, 1, 999, 3045, 3046, 10000]) {
      for (const [tax, credits] of [
        [0, 0],
        [3545, 500],
        [500, 3545],
        [12000, 0],
      ]) {
        const lines = form8859Lines(line1, taxLiabilityLimit(tax, credits));
        expect(lines.line3).toBeLessThanOrEqual(lines.line1);
        expect(lines.line3).toBeLessThanOrEqual(lines.line2);
        expect(lines.line3 + lines.line4).toBe(lines.line1);
        expect(lines.line4).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
