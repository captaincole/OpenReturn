/*
 * Form 8815 pure rules: each published example with numbers (named by its
 * source), then limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import type { SavingsBondCashedFactValue } from "../../../../src/facts/index.js";
import {
  bondQualifies,
  expenseLines,
  line6Worksheet,
  line9Worksheet,
  PHASE_OUT_2025,
  phaseOutLines,
  ratioDigits,
  scaledRatio,
} from "../../../../src/federal/8815/lines.js";

const bond = (overrides: Partial<SavingsBondCashedFactValue>): SavingsBondCashedFactValue => ({
  series: "EE",
  format: "electronic",
  issueDate: "2010-01-01",
  faceValue: 1000,
  proceeds: 1000,
  ownerQualifies: true,
  ...overrides,
});

describe("published examples", () => {
  it("8815 instructions, line 3 example (irs-8815-form-2025::sec::line-3::b01, b02): line 2 10,000, line 3 2,000", () => {
    const worksheet = line6Worksheet([bond({ faceValue: 6000, proceeds: 9000 })]);
    expect(expenseLines(10000, 2000, worksheet).line4).toBe(8000);
  });

  it("Pub. 970 (2025), Figuring the Tax-Free Amount (who-can-cash-in-bonds-tax::b07): 2,550 excluded", () => {
    // Proceeds 9,000 of which principal 6,000: an electronic EE bond bought at face.
    const worksheet = line6Worksheet([bond({ faceValue: 6000, proceeds: 9000 })]);
    expect(worksheet.formLine6).toBe(3000);
    const lines = expenseLines(7650, 0, worksheet);
    expect(lines).toEqual({ line4: 7650, line5: 9000, line6: 3000, line7: 850, line8: 2550 });
    // Joint, MAGI 90,000: below line 10, so nothing phases out.
    expect(phaseOutLines(2550, 90000, PHASE_OUT_2025.joint)).toEqual({
      line10: 149250,
      line11: 0,
      line13: 0,
      line14: 2550,
    });
  });

  it("Pub. 550 (2025) and Pub. 17 (2025), Max and Helene (education-savings-bond-program::b04): 746.90, 747 on the form", () => {
    // A $10,000 paper EE bond bought for $5,000, cashed for $6,148.
    const worksheet = line6Worksheet([
      bond({ format: "paper", issueDate: "2009-01-01", faceValue: 10000, proceeds: 6148 }),
    ]);
    expect(worksheet).toMatchObject({ line1: 6148, line2: 10000, line3: 5000, line5: 5000 });
    expect(worksheet.formLine6).toBe(1148);
    const lines = expenseLines(4000, 0, worksheet);
    expect(lines.line7).toBe(651); // 4,000 / 6,148 = 0.6506
    expect(lines.line8).toBe(747); // 1,148 × .651 = 747.35; the exact 746.90 also rounds to 747
  });

  it("Pub. 970 (2007), Illustrated Example, Mark and Joan Washington: line 14 1,377 (2007 limits)", () => {
    const lines = expenseLines(
      7650,
      0,
      line6Worksheet([bond({ faceValue: 6000, proceeds: 9000 })]),
    );
    expect(lines.line8).toBe(2550);
    // The logic only: the 2007 joint line 10 was $98,400; the $30,000 divisor is the same.
    expect(phaseOutLines(2550, 112200, { start: 98400, range: 30000 })).toEqual({
      line10: 98400,
      line11: 13800,
      line12: 460,
      line13: 1173,
      line14: 1377,
    });
  });
});

describe("Line 6 Worksheet", () => {
  it("adds paper EE at half of face and electronic EE and I at face", () => {
    const worksheet = line6Worksheet([
      bond({ format: "paper", faceValue: 1000, proceeds: 900 }),
      bond({ series: "I", faceValue: 2000, proceeds: 2600 }),
    ]);
    expect(worksheet).toEqual({
      line1: 3500,
      line2: 1000,
      line3: 500,
      line4: 2000,
      line5: 2500,
      line6: 1000,
      formLine6: 1000,
    });
  });

  it("fills lines 7 and 8 only when interest was reported before", () => {
    const worksheet = line6Worksheet([
      bond({ series: "I", faceValue: 2000, proceeds: 2600, interestReportedInPriorYears: 150 }),
    ]);
    expect(worksheet).toMatchObject({ line6: 600, line7: 150, line8: 450, formLine6: 450 });
  });

  it("leaves lines 2 and 3 blank with no paper EE bond, line 4 blank with no other bond", () => {
    expect(line6Worksheet([bond({ faceValue: 500, proceeds: 700 })])).toMatchObject({
      line2: undefined,
      line3: undefined,
      line4: 500,
    });
    expect(
      line6Worksheet([bond({ format: "paper", faceValue: 500, proceeds: 400 })]),
    ).toMatchObject({ line3: 250, line4: undefined, line5: 250 });
  });

  it("keeps the cents while adding and rounds each line", () => {
    const worksheet = line6Worksheet([
      bond({ proceeds: 1000.3, faceValue: 500 }),
      bond({ proceeds: 1000.3, faceValue: 500 }),
    ]);
    expect(worksheet.line1).toBe(2001);
  });
});

describe("qualified bonds", () => {
  it("a bond issued in 1989 does not qualify; one issued January 1990 does", () => {
    expect(bondQualifies(bond({ issueDate: "1989-12-01" }))).toBe(false);
    expect(bondQualifies(bond({ issueDate: "1990-01-01" }))).toBe(true);
  });

  it("a bond that fails the ownership test does not qualify", () => {
    expect(bondQualifies(bond({ ownerQualifies: false }))).toBe(false);
  });
});

describe("lines 4 through 8", () => {
  it("stops at line 4 when it is zero or less", () => {
    const worksheet = line6Worksheet([bond({ proceeds: 1500 })]);
    expect(expenseLines(2000, 2000, worksheet)).toEqual({ line4: 0 });
    expect(expenseLines(1000, 2500, worksheet)).toEqual({ line4: -1500 });
  });

  it("stops after line 4 when no qualified bond was cashed", () => {
    expect(expenseLines(2000, 0, undefined)).toEqual({ line4: 2000 });
  });

  it("line 7 is 1.000 when line 4 equals or exceeds line 5", () => {
    const worksheet = line6Worksheet([bond({ faceValue: 1000, proceeds: 1500 })]);
    expect(expenseLines(1500, 0, worksheet)).toMatchObject({ line7: 1000, line8: 500 });
    expect(expenseLines(9000, 0, worksheet)).toMatchObject({ line7: 1000, line8: 500 });
  });

  it("line 8 is never more than line 6", () => {
    const worksheet = line6Worksheet([bond({ faceValue: 1000, proceeds: 3001 })]);
    for (const expenses of [1, 999, 3000, 3001, 50000]) {
      const lines = expenseLines(expenses, 0, worksheet);
      expect(lines.line8).toBeLessThanOrEqual(worksheet.formLine6);
    }
  });
});

describe("lines 10 through 14", () => {
  const single = PHASE_OUT_2025.single;
  const joint = PHASE_OUT_2025.joint;

  it("uses $99,500 and $15,000 single, $149,250 and $30,000 joint", () => {
    expect(phaseOutLines(1000, 100000, single)).toMatchObject({ line10: 99500, line12: 33 });
    expect(phaseOutLines(1000, 150000, joint)).toMatchObject({ line10: 149250, line12: 25 });
  });

  it("stops at the Note's limits: $114,500 single, $179,250 joint", () => {
    expect(phaseOutLines(1000, 114500, single)).toBeUndefined();
    expect(phaseOutLines(1000, 179250, joint)).toBeUndefined();
    expect(phaseOutLines(1000, 114499, single)).toMatchObject({ line12: 1000, line14: 0 });
    expect(phaseOutLines(1000, 179249, joint)?.line14).toBe(0);
  });

  it("line 11 of zero skips line 12 and enters 0 on line 13", () => {
    expect(phaseOutLines(800, 99500, single)).toEqual({
      line10: 99500,
      line11: 0,
      line13: 0,
      line14: 800,
    });
    expect(phaseOutLines(800, 99501, single)).toMatchObject({ line11: 1, line12: 0, line14: 800 });
  });

  it("line 13 plus line 14 is line 8, and line 14 is never negative", () => {
    for (const magi of [99500, 102000, 107000, 110250, 114000]) {
      const lines = phaseOutLines(2345, magi, single)!;
      expect(lines.line13 + lines.line14).toBe(2345);
      expect(lines.line14).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("ratio and worksheet arithmetic", () => {
  it("rounds a ratio to three places", () => {
    expect(scaledRatio(15000, 28010)).toBe(536);
    expect(scaledRatio(1, 3)).toBe(333);
    expect(scaledRatio(2, 3)).toBe(667);
  });

  it("prints 1.000, or an empty digit before the point below 1", () => {
    expect(ratioDigits(1000)).toEqual({ whole: "1", decimal: "000" });
    expect(ratioDigits(46)).toEqual({ whole: "", decimal: "046" });
  });

  it("Line 9 Worksheet line 5 is lines 1 and 2 less line 4", () => {
    expect(line9Worksheet(14042, 154700, 45)).toEqual({
      line1: 14042,
      line2: 154700,
      line3: 168742,
      line4: 45,
      line5: 168697,
    });
  });
});
