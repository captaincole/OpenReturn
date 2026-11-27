/*
 * FTB 3807 arithmetic. Each published example of the 2025 booklet
 * (ca-3807-booklet-2025) is a test named by its section; then limit tests
 * that need no source: totals equal their parts, a credit never passes its
 * limits, and each edge.
 */

import { describe, expect, it } from "vitest";
import {
  BUSINESS_CREDIT_LIMIT,
  LAMBRA_CREDIT_CODE,
  WHOLLY_WITHIN_LAMBRA,
  apportioned,
  averageApportionment,
  creditOffered,
  lambraBusinessIncome,
  line1c,
  modifiedTaxableIncome,
  scheduleZPartI,
  scheduleZPartII,
  worksheetII,
} from "../../../../../src/state/ca/3807/lines.js";

describe("booklet examples with numbers", () => {
  it("corporations-filing-a-combined-report::b03: A 100%, B 73.33% and $183,325", () => {
    const corporationA = averageApportionment([
      { california: 1_000_000, lambra: 1_000_000 },
      { california: 800_000, lambra: 800_000 },
    ]);
    const corporationB = averageApportionment([
      { california: 1_200_000, lambra: 800_000 },
      { california: 1_000_000, lambra: 800_000 },
    ]);
    expect(corporationA).toBe(1);
    expect(corporationB).toBe(0.7333);
    expect(lambraBusinessIncome([apportioned(228_000, corporationA)])).toBe(228_000);
    expect(lambraBusinessIncome([apportioned(250_000, corporationB)])).toBe(183_325);
  });

  it("example-determination-of-lambra-business-income-...::b02: the Andersons' $156,000", () => {
    const rows = [
      apportioned(100_000, 0.5), // John's salary, half his time in the former LAMBRA
      apportioned(75_000, 1), // Jackie's salary, all of it
      apportioned(40_000, 0.8), // ABC, Inc.'s K-1, its 80% share
      apportioned(-2_000, 0.5), // John's employee business expenses
    ];
    expect(rows).toEqual([50_000, 75_000, 32_000, -1_000]);
    expect(lambraBusinessIncome(rows)).toBe(156_000);
  });

  it("part-ii-pass-through-income-or-loss::b02: three entities give $40,000", () => {
    const rows = [apportioned(40_000, 0.8), apportioned(30_000, 0.1), apportioned(10_000, 0.5)];
    expect(rows).toEqual([32_000, 3_000, 5_000]);
    expect(lambraBusinessIncome(rows)).toBe(40_000);
  });

  it("instructions-for-worksheet-ii-...::b03: $500 against a $5,000 balance", () => {
    const sheet = worksheetII(5_000, [{ yearOfLoss: 2013, carryover: 500 }], false);
    expect(sheet.rows).toEqual([
      { yearOfLoss: 2013, carryover: 500, deducted: 500, balance: 4_500, future: 0 },
    ]);
    expect([sheet.totalCarryover, sheet.totalDeducted, sheet.totalFuture]).toEqual([500, 500, 0]);
  });

  it("example-part-ii::b01 to ::b03: $7,000 limit, $500 hiring and $9,000 sales or use tax", () => {
    // "the ABC Business has $8,000 of tax": Schedule P lets it use all it is offered.
    const offered = creditOffered(7_000, 500, 9_000);
    expect(offered).toBe(7_000);
    const used = Math.min(offered, 8_000);
    expect(scheduleZPartII(7_000, 500, 9_000, used)).toEqual({
      line8Ae: 7_000,
      line8Af: 500,
      line8Bb: 500,
      line8Bd: 500,
      line8Be: 500,
      line8Bg: 0,
      line9Ae: 6_500,
      line9Af: 6_500,
      line9Bb: 9_000,
      line9Bd: 9_000,
      line9Be: 6_500,
      line9Bg: 2_500,
    });
    expect(line1c(500, 6_500)).toBe(7_000);
  });
});

describe("Worksheet I, Section A edges", () => {
  it("leaves out a factor whose California total is 0: the line divides by one", () => {
    const share = averageApportionment([
      { california: 250_000, lambra: 150_000 },
      { california: 0, lambra: 0 },
    ]);
    expect(share).toBe(0.6);
  });

  it("is 0 with no factor, and never above 1", () => {
    expect(averageApportionment([])).toBe(0);
    expect(averageApportionment([{ california: 100, lambra: 300 }])).toBe(1);
    expect(WHOLLY_WITHIN_LAMBRA).toBe(1);
  });

  it("keeps four places, the half up", () => {
    // (1/3 + 1/2) / 2 = 0.416666… → 0.4167
    const share = averageApportionment([
      { california: 300, lambra: 100 },
      { california: 200, lambra: 100 },
    ]);
    expect(share).toBe(0.4167);
  });
});

describe("Section B line 14", () => {
  it("keeps the cents while adding and rounds the total", () => {
    expect(lambraBusinessIncome([apportioned(1_000.4, 0.5), apportioned(1_000.6, 0.5)])).toBe(
      1_001,
    );
  });

  it("can be a loss", () => {
    expect(lambraBusinessIncome([apportioned(-10_000, 0.6)])).toBe(-6_000);
  });
});

describe("Worksheet II", () => {
  const rows = [
    { yearOfLoss: 2012, carryover: 50_000 },
    { yearOfLoss: 2011, carryover: 20_000 },
  ];

  it("uses the oldest loss first and carries the rest", () => {
    const sheet = worksheetII(54_000, rows, false);
    expect(sheet.rows.map((row) => [row.yearOfLoss, row.deducted, row.future])).toEqual([
      [2011, 20_000, 0],
      [2012, 34_000, 16_000],
    ]);
    expect([sheet.totalCarryover, sheet.totalDeducted, sheet.totalFuture]).toEqual([
      70_000, 54_000, 16_000,
    ]);
  });

  it("never deducts more than the modified taxable income, and column (b) is (c) plus (e)", () => {
    for (const mti of [0, 1, 19_999, 20_000, 69_999, 70_000, 500_000]) {
      const sheet = worksheetII(mti, rows, false);
      expect(sheet.totalDeducted).toBe(Math.min(mti, 70_000));
      expect(sheet.totalCarryover).toBe(sheet.totalDeducted + sheet.totalFuture);
    }
  });

  it("deducts nothing while suspended and carries column (b) to column (e)", () => {
    const sheet = worksheetII(54_000, rows, true);
    expect([sheet.totalDeducted, sheet.totalFuture]).toEqual([0, 70_000]);
  });

  it("enters 0 on line 6 for a line 14 of zero or less", () => {
    expect(modifiedTaxableIncome(-5_000)).toBe(0);
    expect(modifiedTaxableIncome(0)).toBe(0);
    expect(modifiedTaxableIncome(42)).toBe(42);
  });
});

describe("Schedule Z, Part I", () => {
  const flatTax = (amount: number) => Math.min(amount, 100_000) / 10;

  it("takes the smaller of the tax on LAMBRA income and line 35", () => {
    expect(scheduleZPartI(124_000, 0, 11_312, () => 7_971)).toEqual({
      line1: 124_000,
      line3: 124_000,
      line4: 0,
      line5: 124_000,
      line6a: 7_971,
      line6b: 11_312,
      line7: 7_971,
    });
    expect(scheduleZPartI(124_000, 0, 5_000, () => 7_971).line7).toBe(5_000);
  });

  it("subtracts the NOL deduction before the tax", () => {
    const partI = scheduleZPartI(50_000, 20_000, 9_000, flatTax);
    expect([partI.line5, partI.line6a, partI.line7]).toEqual([30_000, 3_000, 3_000]);
  });

  it("has no LAMBRA business income when line 14 is zero or less", () => {
    const partI = scheduleZPartI(-8_000, 0, 9_000, flatTax);
    expect([partI.line1, partI.line3, partI.line5, partI.line7]).toEqual([0, 0, 0, 0]);
  });
});

describe("Schedule Z, Part II limits", () => {
  const cases: Array<[number, number, number, number]> = [
    [7_971, 2_000, 9_000, 6_095],
    [7_971, 2_000, 9_000, 1_500],
    [7_971, 2_000, 9_000, 7_971],
    [3_000, 8_000, 9_000, 3_000],
    [0, 2_000, 9_000, 0],
    [10_000, 0, 4_000, 4_000],
  ];

  it.each(cases)(
    "line 7 %i, carryovers %i and %i, %i used: no credit passes its limits",
    (line7, hiring, salesUse, used) => {
      const partII = scheduleZPartII(line7, hiring, salesUse, used);
      expect(partII.line8Af).toBeLessThanOrEqual(Math.min(partII.line8Ae, partII.line8Bd));
      expect(partII.line9Af).toBeLessThanOrEqual(Math.min(partII.line9Ae, partII.line9Bd));
      expect(partII.line8Af + partII.line9Af).toBe(used);
      expect(partII.line8Bd).toBe(partII.line8Be + partII.line8Bg);
      expect(partII.line9Bd).toBe(partII.line9Be + partII.line9Bg);
      expect(partII.line9Ae).toBe(partII.line8Ae - partII.line8Be);
    },
  );

  it("takes the hiring credit first", () => {
    const partII = scheduleZPartII(7_971, 2_000, 9_000, 1_500);
    expect([partII.line8Af, partII.line9Af, partII.line8Bg, partII.line9Bg]).toEqual([
      1_500, 0, 500, 9_000,
    ]);
  });

  it("offers the smaller of line 7 and the two carryovers", () => {
    expect(creditOffered(7_971, 2_000, 9_000)).toBe(7_971);
    expect(creditOffered(20_000, 2_000, 9_000)).toBe(11_000);
    expect(creditOffered(0, 2_000, 9_000)).toBe(0);
    expect(creditOffered(-5, 2_000, 9_000)).toBe(0);
  });

  it("is code 198 under a $5,000,000 limit", () => {
    expect(LAMBRA_CREDIT_CODE).toBe("198");
    expect(BUSINESS_CREDIT_LIMIT).toBe(5_000_000);
  });
});
