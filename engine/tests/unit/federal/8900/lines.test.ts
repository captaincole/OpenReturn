/*
 * Form 8900's arithmetic. The instructions publish no example with numbers
 * (evidence in the form's QUESTIONS.md), so these are limit tests from the
 * form's own lines.
 */

import { describe, expect, it } from "vitest";
import {
  CREDIT_RATE,
  LIMIT_PER_MILE,
  basisReductionOf,
  line1Of,
  line2Of,
  line3dOf,
  line4Of,
  line7Of,
  trackLines,
} from "../../../../src/federal/8900/lines.js";

describe("Form 8900 lines", () => {
  it("line 1 rounds once; line 2 is 40% (what-s-new::b01)", () => {
    expect(CREDIT_RATE).toBe(0.4);
    expect(line1Of(412_500.4)).toBe(412_500);
    expect(line1Of(1_000.5)).toBe(1_001);
    expect(line2Of(412_500)).toBe(165_000);
    expect(line2Of(1_001)).toBe(400);
  });

  it("line 3d combines 3a less 3b plus 3c, two decimals, never below 0", () => {
    expect(line3dOf({ ownedOrLeased: 52.5, assignedToOthers: 8, assignedToYou: 2.25 })).toBe(46.75);
    expect(line3dOf({ ownedOrLeased: 0.1, assignedToYou: 0.2 })).toBe(0.3);
    expect(line3dOf({ assignedToYou: 4 })).toBe(4);
    expect(line3dOf({})).toBe(0);
    expect(line3dOf({ ownedOrLeased: 5, assignedToOthers: 6 })).toBe(0);
  });

  it("line 4 is line 3d times $3,500", () => {
    expect(LIMIT_PER_MILE).toBe(3_500);
    expect(line4Of(46.75)).toBe(163_625);
    expect(line4Of(0.01)).toBe(35);
    expect(line4Of(0)).toBe(0);
  });

  it("line 5 is the smaller of line 2 and line 4, at each edge", () => {
    const miles = (total: number) => ({ ownedOrLeased: total });
    // Line 2 is the smaller: 40% of 100,000 = 40,000 < 20 miles × 3,500 = 70,000.
    expect(trackLines(100_000, miles(20)).line5).toBe(40_000);
    // Line 4 is the smaller: 10 miles × 3,500 = 35,000 < 40,000.
    expect(trackLines(100_000, miles(10)).line5).toBe(35_000);
    // The two are equal: 87,500 × 40% = 35,000 = 10 × 3,500.
    expect(trackLines(87_500, miles(10)).line5).toBe(35_000);
    // No miles, no credit; no expenditures, no credit.
    expect(trackLines(100_000, {}).line5).toBe(0);
    expect(trackLines(0, miles(10)).line5).toBe(0);
  });

  it("the credit is never more than either limit", () => {
    for (const expenditures of [0, 1, 999.99, 50_000, 437_500, 2_000_000]) {
      for (const owned of [0, 0.5, 12.25, 125, 1_000]) {
        const lines = trackLines(expenditures, { ownedOrLeased: owned, assignedToOthers: 0 });
        expect(lines.line5).toBeLessThanOrEqual(lines.line2);
        expect(lines.line5).toBeLessThanOrEqual(lines.line4);
        expect(lines.line5).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("a group member's line 5 is its share of the group credit (member-of-controlled-group-or::b01)", () => {
    const lines = trackLines(100_000, { ownedOrLeased: 20 }, 31_250.6);
    expect(lines.line2).toBe(40_000);
    expect(lines.line4).toBe(70_000);
    expect(lines.line5).toBe(31_251);
  });

  it("line 7 adds lines 5 and 6", () => {
    expect(line7Of(163_625, 2_450)).toBe(166_075);
    expect(line7Of(undefined, 2_450)).toBe(2_450);
    expect(line7Of(1_000, undefined)).toBe(1_000);
  });

  it("the basis goes down by the credit, at most the amount capitalized (adjustments-to-basis::b01)", () => {
    expect(basisReductionOf(163_625, 210_000)).toBe(163_625);
    expect(basisReductionOf(163_625, 100_000.4)).toBe(100_000);
    expect(basisReductionOf(0, 100_000)).toBe(0);
  });
});
