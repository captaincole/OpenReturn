/*
 * Form 7206's arithmetic (federal/7206/lines.ts): the published examples with
 * numbers, then limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  businessPlanLines,
  deduction,
  longTermCareLimit,
  longTermCareLine2,
  profitRatio,
  ratioText,
  sCorporationPlanLines,
} from "../../../../src/federal/7206/lines.js";

describe("Pub. 974 (2025), Carla's Worksheet W lines 4–13 (the-simplified-calculation-method-for-carla::b03–b05)", () => {
  // Worksheet W lines 4–13 are Form 7206 lines 4–13; line 1 here is her premium after APTC (Worksheet W line 3).
  const lines = businessPlanLines({
    premiums: { line1: 8800, line2: 0 },
    line4: 30000,
    line5: 30000,
    line15: 2119,
    line9: 2500,
    line12: 0,
  });

  it("lines 6 to 10 and 13", () => {
    expect(ratioText(lines.line6!)).toBe("1.0000");
    expect([lines.line7, lines.line8, lines.line9, lines.line10]).toEqual([
      2119, 27881, 2500, 25381,
    ]);
    expect([lines.line12, lines.line13]).toEqual([0, 25381]);
  });

  it("the deduction is the smaller of the premiums and line 13 (Worksheet W line 16: 8,800)", () => {
    expect(lines.line14).toBe(8800);
  });
});

describe("Pub. 502 (2025), Example 2 (health-insurance-costs-for::b05)", () => {
  it("$10,000 of premiums against a $4,000 earned income limit: $4,000 deducted, $6,000 left", () => {
    const lines = sCorporationPlanLines({ premiums: { line1: 10000, line2: 0 }, line11: 4000 });
    expect(lines.line14).toBe(4000);
    expect(lines.line3 - lines.line14).toBe(6000);
  });
});

describe("Line 2: the long-term care age limits (irs-7206-inst-2025::sec::general-instructions::b07)", () => {
  it.each([
    [40, 480],
    [41, 900],
    [50, 900],
    [51, 1800],
    [60, 1800],
    [61, 4810],
    [70, 4810],
    [71, 6020],
    [95, 6020],
  ])("age %i: %i", (age, limit) => {
    expect(longTermCareLimit(age)).toBe(limit);
  });

  it("each person counts the smaller of the payments and the limit; the total is rounded once", () => {
    const line2 = longTermCareLine2([
      { person: "A", ageAtYearEnd: 58, premiumsPaid: 2315.75 },
      { person: "B", ageAtYearEnd: 45, premiumsPaid: 600.4 },
    ]);
    expect(line2).toBe(1800 + 600);
  });

  it("a person's limit is shared by every Form 7206 (::b06)", () => {
    const used = new Map<string, number>();
    const first = longTermCareLine2([{ person: "A", ageAtYearEnd: 65, premiumsPaid: 3000 }], used);
    const second = longTermCareLine2([{ person: "A", ageAtYearEnd: 65, premiumsPaid: 3000 }], used);
    expect([first, second]).toEqual([3000, 1810]);
  });
});

describe("Lines 6 and 7", () => {
  it("line 6 keeps 4 places and prints them", () => {
    expect(profitRatio(20000, 30000)).toBe(0.6667);
    expect(ratioText(0.6667)).toBe("0.6667");
    expect(ratioText(0.05)).toBe("0.0500");
  });

  it("line 6 is never more than 1, and 0 for a business with no net profit", () => {
    expect(profitRatio(30000, 30000)).toBe(1);
    expect(profitRatio(-500, 30000)).toBe(0);
    expect(profitRatio(0, 0)).toBe(0);
  });

  it("line 7 shares line 15 by the printed line 6", () => {
    const lines = businessPlanLines({
      premiums: { line1: 5000, line2: 0 },
      line4: 20000,
      line5: 30000,
      line15: 4239,
      line9: 0,
    });
    expect(lines.line7).toBe(2826); // 4,239 × 0.6667 = 2,826.14
  });
});

describe("Line 14 limits", () => {
  it("never more than line 3, never more than line 13, never below 0", () => {
    expect(deduction(5000, 9000)).toBe(5000);
    expect(deduction(9000, 5000)).toBe(5000);
    expect(deduction(9000, -200)).toBe(0);
  });

  it("line 3 is lines 1 and 2; line 13 is line 10 less line 12", () => {
    const lines = businessPlanLines({
      premiums: { line1: 6000, line2: 900 },
      line4: 12000,
      line5: 12000,
      line15: 848,
      line9: 1000,
      line12: 4000,
    });
    expect(lines.line3).toBe(6900);
    expect(lines.line13).toBe(12000 - 848 - 1000 - 4000);
    expect(lines.line14).toBe(6152);
  });

  it("an S corporation plan skips lines 4–10", () => {
    const lines = sCorporationPlanLines({
      premiums: { line1: 8000, line2: 0 },
      line11: 60000,
      line12: 0,
    });
    expect([lines.line4, lines.line5, lines.line10, lines.line11]).toEqual([
      undefined,
      undefined,
      undefined,
      60000,
    ]);
    expect(lines.line14).toBe(8000);
  });
});
