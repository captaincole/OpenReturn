/*
 * Form 8915-F Parts II to IV and Worksheets 2 to 5, from the published
 * examples of the instructions (irs-8915f-inst-2025) and limit tests.
 */

import { describe, expect, it } from "vitest";
import { partIIILines, partIILines, partIVLines } from "../../../../src/federal/8915-f/parts.js";
import { priorYearIncome, totalRepayment } from "../../../../src/federal/8915-f/worksheets.js";

const partII = (over: Partial<Parameters<typeof partIILines>[0]> = {}) =>
  partIILines({
    partICompleted: true,
    cost: 0,
    electNotToSpread: false,
    priorYearIncome: 0,
    totalRepayment: 0,
    ...over,
  });

const partIII = (over: Partial<Parameters<typeof partIIILines>[0]> = {}) =>
  partIIILines({
    partICompleted: true,
    iraColumnB: 0,
    line20: 0,
    electNotToSpread: false,
    priorYearIncome: 0,
    totalRepayment: 0,
    ...over,
  });

describe("Form 8915-F Part II", () => {
  it("lines 8 to 15: cost, a third, earlier income and a repayment", () => {
    expect(
      partII({ line2ColumnB: 15_000, cost: 1_200, priorYearIncome: 2_000, totalRepayment: 1_500 }),
    ).toEqual({
      line8: "yes",
      line8Amount: 15_000,
      line9: 1_200,
      line10: 13_800,
      line11Checked: undefined,
      line11: 4_600,
      line12: 2_000,
      line13: 6_600,
      line14: 1_500,
      line15: 5_100,
    });
  });

  it("carryback Example 3 (file-form-1040-x…::b07): no income, an $11,000 repayment → line 15 is 0", () => {
    const lines = partII({ partICompleted: false, totalRepayment: 11_000 });
    expect(lines).toMatchObject({ line13: 0, line14: 11_000, line15: 0 });
    expect(lines.line8).toBeUndefined();
  });

  it("Example 3 (file-form-1040-x…::b03): $7,000 of income in 2027 and a $10,000 repayment → 0", () => {
    expect(
      partII({ partICompleted: false, priorYearIncome: 7_000, totalRepayment: 10_000 }).line15,
    ).toBe(0);
  });

  it("No on line 8 skips lines 8 to 11; nothing from earlier years leaves 12 to 15 blank", () => {
    expect(partII({ line2ColumnB: 0 })).toEqual({ line8: "no" });
  });

  it("the box on line 11 puts the whole taxable amount in this year", () => {
    expect(partII({ line2ColumnB: 9_000, electNotToSpread: true })).toMatchObject({
      line11Checked: true,
      line11: 9_000,
      line15: 9_000,
    });
  });

  it("line 15 is never below 0 and never above line 13", () => {
    for (const repayment of [0, 1, 4_599, 4_600, 50_000]) {
      const lines = partII({ line2ColumnB: 13_800, totalRepayment: repayment });
      expect(lines.line15).toBeGreaterThanOrEqual(0);
      expect(lines.line15).toBeLessThanOrEqual(lines.line13 ?? 0);
    }
  });
});

describe("Form 8915-F Part III", () => {
  it("Form 8606 Example 1 (irs-8606-inst-2025::sec::example-1-in-february-2025-an-11-000::b01): line 18 $20,000", () => {
    const lines = partIII({
      iraColumnB: 22_000,
      form8606: { line18: 20_000, waiting: false },
    });
    expect(lines).toMatchObject({
      line16: "yes",
      line17: "yes",
      line18: 20_000,
      line20: undefined,
      line21: 20_000,
      line22: 6_667,
      line24: 6_667,
      line26: 6_667,
    });
  });

  it("carryback Example 2 (file-form-1040-x…::b05): $6,000 of income and a $15,000 repayment → 0", () => {
    expect(
      partIII({ partICompleted: false, priorYearIncome: 6_000, totalRepayment: 15_000 }),
    ).toEqual({ line16: undefined, line23: 6_000, line24: 6_000, line25: 15_000, line26: 0 });
  });

  it("a Roth IRA amount with no taxable part: Yes on line 16, No on line 17, line 21 of 0", () => {
    expect(partIII({ iraColumnB: 5_000, line20: 0 })).toMatchObject({
      line16: "yes",
      line17: "no",
      line21: 0,
      line26: 0,
    });
  });

  it("waits while Form 8606 has not given line 18", () => {
    const lines = partIII({ iraColumnB: 22_000, form8606: { waiting: true } });
    expect([lines.line21, lines.line26]).toEqual([undefined, undefined]);
  });
});

describe("Form 8915-F Part IV", () => {
  it("line-7::b04 and the form: $12,000, $600 cost, $5,000 repaid → line 32 $6,400 from a plan", () => {
    expect(partIVLines([{ amount: 12_000, cost: 600, repaid: 5_000, fromIra: false }])).toEqual({
      line27: "no",
      line28: 12_000,
      line29: 600,
      line30: 11_400,
      line31: 5_000,
      line32: 6_400,
      line32FromIra: 0,
      line32FromPlan: 6_400,
    });
  });

  it("an IRA has no cost on line 29, and line 32 splits by source", () => {
    const lines = partIVLines([
      { amount: 10_000, cost: 0, repaid: 4_000, fromIra: true },
      { amount: 8_000, cost: 0, repaid: 0, fromIra: false },
    ]);
    expect(lines).toMatchObject({
      line29: undefined,
      line32: 14_000,
      line32FromIra: 6_000,
      line32FromPlan: 8_000,
    });
  });

  it("a repayment counts only up to the taxable part: line 32 is never below 0", () => {
    const lines = partIVLines([{ amount: 5_000, cost: 1_000, repaid: 9_000, fromIra: false }]);
    expect([lines.line31, lines.line32]).toEqual([4_000, 0]);
  });
});

describe("Form 8915-F Worksheets 2 and 4: the 2025 row of each table", () => {
  const earlier = {
    lastYear: { line11: 2_000, line22: 700 },
    twoYearsAgo: { line11: 3_000, line22: 800 },
  };
  it.each([
    [2021, 0, 3_000],
    [2022, 2_000, 3_000],
    [2023, 2_000, 3_000],
    [2024, 2_000, 0],
    [2025, 0, 0],
    [2026, 0, 0],
  ])("item B %i: line 1 %i, line 2 %i", (disasterYear, line1, line2) => {
    const income = priorYearIncome({ disasterYear, taxYear: 2025, ...earlier, part: "plan" });
    expect(income).toEqual({ line1, line2, line3: line1 + line2 });
  });

  it("a checked box on that year's line enters 0; Worksheet 4 reads line 22", () => {
    const income = priorYearIncome({
      disasterYear: 2023,
      taxYear: 2025,
      lastYear: { line22: 700, line22Checked: true },
      twoYearsAgo: { line22: 800 },
      part: "ira",
    });
    expect(income).toEqual({ line1: 0, line2: 800, line3: 800 });
  });
});

describe("Form 8915-F Worksheets 3 and 5", () => {
  it("last year's excess repayment carries to this year, less what was carried back", () => {
    expect(
      totalRepayment({
        lastYear: { line24: 667, line25: 1_000 },
        carriedBack: { ira: 100 },
        thisYear: { ira: 50 },
        part: "ira",
      }),
    ).toEqual({
      line1: 1_000,
      line2: 667,
      line3a: 333,
      line3b: 100,
      line3c: 233,
      line4: 50,
      line5: 283,
    });
  });

  it("no excess last year: only this year's repayments", () => {
    expect(
      totalRepayment({ lastYear: { line13: 2_000 }, thisYear: { plan: 1_500 }, part: "plan" })
        .line5,
    ).toBe(1_500);
  });
});
