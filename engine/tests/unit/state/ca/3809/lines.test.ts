/*
 * FTB 3809's arithmetic: each example with numbers in the 2025 TTA booklet
 * (ca-3809-booklet-2025), named by its block, then limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import { roundDollars } from "../../../../../src/money.js";
import {
  averageApportionment,
  BUSINESS_CREDIT_LIMIT,
  creditAvailableToOffsetTax,
  limitCanBind,
  line14,
  scheduleZPartI,
  scheduleZPartII,
  truncatedRatio,
  ttaShare,
  worksheetII,
} from "../../../../../src/state/ca/3809/lines.js";

const factors = (propertyTta: number, propertyCa: number, payrollTta: number, payrollCa: number) =>
  averageApportionment({
    whollyWithinTta: false,
    propertyCalifornia: propertyCa,
    propertyTta,
    payrollCalifornia: payrollCa,
    payrollTta,
  });

describe("booklet examples", () => {
  it("Schedule Z Part II (example-part-ii::b01): $7,000 limit, $300 hiring, $9,000 sales or use tax", () => {
    const used = creditAvailableToOffsetTax(300, 9000, 7000);
    expect(used).toBe(7000);
    expect(scheduleZPartII(7000, 300, 9000, used)).toEqual({
      line8aColE: 7000,
      line8aColF: 300,
      line8bColB: 300,
      line8bColD: 300,
      line8bColE: 300,
      line8bColG: 0,
      line9aColE: 6700,
      line9aColF: 6700,
      line9bColB: 9000,
      line9bColD: 9000,
      line9bColE: 6700,
      line9bColG: 2300,
    });
  });

  it("combined report (corporations-filing-a-combined-report::b03): corporation B at 73.33%", () => {
    expect(truncatedRatio(800000, 1200000)).toBe(0.6666);
    expect(truncatedRatio(800000, 1000000)).toBe(0.8);
    const average = factors(800000, 1200000, 800000, 1000000);
    expect(average).toBe(0.7333);
    expect(ttaShare(250000, average)).toBe(183325);
  });

  it("combined report (::b03): corporation A at 100%", () => {
    const average = factors(1000000, 1000000, 800000, 800000);
    expect(average).toBe(1);
    expect(ttaShare(228000, average)).toBe(228000);
  });

  it("the Andersons (corporations-and-s-corporations::b02): $156,000 of TTA business income", () => {
    const shares = [
      ttaShare(100000, 0.5),
      ttaShare(75000, 1),
      ttaShare(40000, 0.8),
      ttaShare(-2000, 0.5),
    ];
    expect(shares).toEqual([50000, 75000, 32000, -1000]);
    expect(line14(shares)).toBe(156000);
  });

  it("multiple pass-through entities (part-ii-pass-through-income-or-loss::b02): $40,000", () => {
    const shares = [ttaShare(40000, 0.8), ttaShare(30000, 0.1), ttaShare(10000, 0.5)];
    expect(shares).toEqual([32000, 3000, 5000]);
    expect(line14(shares)).toBe(40000);
  });

  it("Worksheet II (example-2::b01): $5,000 of MTI and a $500 carryover", () => {
    const worksheet = worksheetII(5000, [{ lossYear: 2005, carryover: 500 }], false);
    expect(worksheet.line7).toBe(5000);
    expect(worksheet.rows[0]).toEqual({
      lossYear: 2005,
      carryover: 500,
      deducted: 500,
      balance: 4500,
      carriedForward: 0,
    });
  });
});

describe("Worksheet I, Section A", () => {
  it("wholly within the TTA is 1, whatever the amounts", () => {
    expect(
      averageApportionment({
        whollyWithinTta: true,
        propertyCalifornia: 0,
        propertyTta: 0,
        payrollCalifornia: 0,
        payrollTta: 0,
      }),
    ).toBe(1);
  });

  it("a factor with no California total is left out: line 3 divided by one (::section-a-income-apportionment-2::b04)", () => {
    expect(factors(300000, 400000, 0, 0)).toBe(0.75);
    expect(factors(0, 0, 50000, 200000)).toBe(0.25);
  });

  it("no factor at all is 0", () => {
    expect(factors(0, 0, 0, 0)).toBe(0);
  });

  it("a ratio never goes above 1 and keeps four places", () => {
    expect(truncatedRatio(5, 4)).toBe(1);
    expect(truncatedRatio(1, 3)).toBe(0.3333);
    expect(truncatedRatio(2, 3)).toBe(0.6666);
    expect(truncatedRatio(0, 3)).toBe(0);
  });
});

describe("Worksheet II", () => {
  const rows = [
    { lossYear: 2011, carryover: 14000 },
    { lossYear: 2009, carryover: 9000 },
  ];

  it("takes the oldest loss first and never more than the MTI", () => {
    const worksheet = worksheetII(15000, rows, false);
    expect(worksheet.rows.map((row) => row.lossYear)).toEqual([2009, 2011]);
    expect(worksheet.rows.map((row) => row.deducted)).toEqual([9000, 6000]);
    expect(worksheet.totalCarryover).toBe(23000);
    expect(worksheet.totalDeducted).toBe(15000);
    expect(worksheet.totalCarriedForward).toBe(8000);
  });

  it("columns (c) and (e) add to column (b)", () => {
    for (const income of [0, 5000, 9000, 23000, 50000]) {
      const worksheet = worksheetII(income, rows, false);
      expect(worksheet.totalDeducted + worksheet.totalCarriedForward).toBe(
        worksheet.totalCarryover,
      );
      expect(worksheet.totalDeducted).toBeLessThanOrEqual(Math.max(0, income));
    }
  });

  it("a negative line 14 deducts nothing", () => {
    const worksheet = worksheetII(-4000, rows, false);
    expect(worksheet.line7).toBe(0);
    expect(worksheet.totalDeducted).toBe(0);
    expect(worksheet.totalCarriedForward).toBe(23000);
  });

  it("suspended: nothing in column (c), all of column (b) carries", () => {
    const worksheet = worksheetII(500000, rows, true);
    expect(worksheet.totalDeducted).toBe(0);
    expect(worksheet.totalCarriedForward).toBe(23000);
  });
});

describe("Schedule Z", () => {
  const flat = (rate: number) => (income: number) => roundDollars(income * rate);

  it("line 7 is the smaller of 6a and 6b", () => {
    expect(scheduleZPartI(100000, 0, 50000, flat(0.05)).line7).toBe(5000);
    expect(scheduleZPartI(100000, 0, 3000, flat(0.05)).line7).toBe(3000);
  });

  it("line 5 is line 3 less the NOL deduction; no tax on no income", () => {
    const lines = scheduleZPartI(20000, 20000, 9000, flat(0.05));
    expect(lines.line5).toBe(0);
    expect(lines.line6a).toBe(0);
    expect(lines.line7).toBe(0);
    expect(scheduleZPartI(-5000, 0, 9000, flat(0.05)).line6a).toBe(0);
  });

  it("a negative line 14 is no TTA business income: lines 1, 3 and 5 are 0", () => {
    const lines = scheduleZPartI(-20000, 0, 6000, flat(0.05));
    expect(lines.line1).toBe(0);
    expect(lines.line3).toBe(0);
    expect(lines.line5).toBe(0);
    expect(lines.line7).toBe(0);
  });

  it("the two credits together never pass line 7", () => {
    for (const [hiring, sales, limit] of [
      [300, 9000, 7000],
      [8000, 0, 7000],
      [0, 0, 7000],
      [500, 400, 7000],
      [500, 400, 0],
    ]) {
      const available = creditAvailableToOffsetTax(hiring, sales, limit);
      expect(available).toBe(Math.min(hiring + sales, limit));
      const lines = scheduleZPartII(limit, hiring, sales, available);
      expect(lines.line8aColF + lines.line9aColF).toBe(available);
      expect(lines.line8aColF).toBeLessThanOrEqual(Math.min(hiring, limit));
      expect(lines.line9aColF).toBeLessThanOrEqual(lines.line9aColE);
      expect(lines.line8bColG + lines.line9bColG).toBe(hiring + sales - available);
    }
  });

  it("a credit the tax left cannot take carries over: the hiring credit first", () => {
    const lines = scheduleZPartII(7000, 3000, 5000, 4000);
    expect(lines.line8aColF).toBe(3000);
    expect(lines.line9aColF).toBe(1000);
    expect(lines.line9aColE).toBe(4000);
    expect(lines.line8bColG).toBe(0);
    expect(lines.line9bColG).toBe(4000);
  });

  it("the $5,000,000 limit can bind only above it", () => {
    expect(limitCanBind(BUSINESS_CREDIT_LIMIT)).toBe(false);
    expect(limitCanBind(BUSINESS_CREDIT_LIMIT + 1)).toBe(true);
  });
});
