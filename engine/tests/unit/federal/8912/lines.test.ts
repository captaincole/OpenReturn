/*
 * Form 8912 arithmetic: the published examples of line 18 column (e), and limit
 * tests that need no source.
 */

import { describe, expect, it } from "vitest";
import { form8912CopyCount } from "../../../../src/federal/8912/copies.js";
import {
  CALENDAR_2025,
  allowanceShares,
  line12,
  line14,
  line18Row,
  line20,
  partI,
  partII,
  passThroughLimit,
  proratedPercent,
  rowPercent,
  type AllowanceCalendar,
} from "../../../../src/federal/8912/lines.js";

/* The tax year of Examples 1 and 2: December 1, 2017 to November 30, 2018. */
const FISCAL_2018: AllowanceCalendar = {
  previous: "2017-09-15",
  dates: ["2017-12-15", "2018-03-15", "2018-06-15", "2018-09-15"],
  next: "2018-12-15",
  yearEnd: "2018-11-30",
};

/* The tax year of the 2011 instructions' example: December 1, 2011 to November 30, 2012. */
const FISCAL_2012: AllowanceCalendar = {
  previous: "2011-09-15",
  dates: ["2011-12-15", "2012-03-15", "2012-06-15", "2012-09-15"],
  next: "2012-12-15",
  yearEnd: "2012-11-30",
};

describe("Form 8912 line 18 column (e): the published examples", () => {
  it("Example 1 (irs-8912-inst-2025::sec::line-18-column-a::b02): bought March 16, 2018 → 50%", () => {
    const shares = allowanceShares(FISCAL_2018, { issued: "2017-06-30", acquired: "2018-03-16" });
    expect(shares).toEqual([
      { date: "2018-06-15", percent: 25 },
      { date: "2018-09-15", percent: 25 },
    ]);
    expect(rowPercent(shares)).toBe(50);
  });

  it("Example 2 (line-18-column-a::b03): 38/92 = 0.413 x 25% = 10%", () => {
    expect(proratedPercent("2018-06-15", "2018-06-15", "2018-07-23", "2018-09-15")).toBe(10);
  });

  it("Example 2: the dates the table lists, March 15, June 15 and September 15, add to 60%", () => {
    const shares = allowanceShares(FISCAL_2018, { issued: "2010-07-23", ended: "2018-07-23" });
    expect(shares.slice(1)).toEqual([
      { date: "2018-03-15", percent: 25 },
      { date: "2018-06-15", percent: 25 },
      { date: "2018-09-15", percent: 10 },
    ]);
    expect(rowPercent(shares, ["2018-03-15", "2018-06-15", "2018-09-15"])).toBe(60);
  });

  it("2011 instructions example: bought on its issue date, March 23, 2012 → 84/92 = .913 x 25% = 23%, total 48%", () => {
    const shares = allowanceShares(FISCAL_2012, { issued: "2012-03-23", acquired: "2012-03-23" });
    expect(shares).toEqual([
      { date: "2012-06-15", percent: 23 },
      { date: "2012-09-15", percent: 25 },
    ]);
    expect(rowPercent(shares)).toBe(48);
  });
});

describe("Form 8912 line 18 column (e) in 2025", () => {
  const percent = (holding: Parameters<typeof allowanceShares>[1]) =>
    rowPercent(allowanceShares(CALENDAR_2025, holding));

  it("held all year: 25% for each of the four dates", () => {
    expect(percent({ issued: "2010-01-01", ended: "2030-01-01" })).toBe(100);
  });

  it("matured July 23, 2025: 25 + 25 + 10", () => {
    expect(percent({ issued: "2012-05-01", ended: "2025-07-23" })).toBe(60);
  });

  it("matured on a credit allowance date: that date counts in full, none after", () => {
    expect(percent({ ended: "2025-06-15" })).toBe(50);
  });

  it("matured before 2025: no credit", () => {
    expect(percent({ ended: "2024-12-15" })).toBe(0);
    expect(percent({ ended: "2024-11-01" })).toBe(0);
  });

  it("sold on June 15: the buyer holds it that day; the seller keeps March 15 only", () => {
    expect(percent({ sold: "2025-06-15" })).toBe(25);
    expect(percent({ acquired: "2025-06-15" })).toBe(75);
  });

  it("redeemed December 20, 2025: the last day outstanding is a credit allowance date (5/90 of 25%)", () => {
    expect(percent({ ended: "2025-12-20" })).toBe(101);
  });

  it("a row covers only the dates it names", () => {
    const shares = allowanceShares(CALENDAR_2025, {});
    expect(rowPercent(shares, ["2025-03-15", "2025-06-15"])).toBe(50);
    expect(rowPercent(shares, [])).toBe(0);
  });
});

describe("Form 8912 lines 18 to 20 and Part I", () => {
  it("column (d) is (b) x (c), column (f) is the rounded (d) x (e)", () => {
    expect(line18Row({ outstandingAmount: 50000, creditRate: 0.0478, percent: 60 })).toEqual({
      b: 50000,
      c: 0.0478,
      d: 2390,
      e: 60,
      f: 1434,
    });
    expect(line18Row({ outstandingAmount: 20000, creditRate: 0.0455, percent: 75 }).f).toBe(683);
  });

  it("line 20 takes 70% only for a new CREB or a QECB", () => {
    expect(line20(1434, true)).toBe(1004);
    expect(line20(1434, false)).toBe(1434);
  });

  it("line 14 keeps the cents until the total", () => {
    expect(line14([1420.36, 612.48])).toBe(2033);
  });

  it("line 4 is lines 1 + 2 + 3; a part with no entries is blank", () => {
    expect(partI([2033], [1004, 1120], 275)).toEqual({
      line1: 2033,
      line2: 2124,
      line3: 275,
      line4: 4432,
    });
    expect(partI([], [910], undefined)).toEqual({
      line1: undefined,
      line2: 910,
      line3: undefined,
      line4: 910,
    });
  });

  it("copies: one per Part IV, and one per 20 rows of Part III", () => {
    expect(form8912CopyCount(undefined)).toBe(1);
    expect(form8912CopyCount({ partIII: [], partIV: [] })).toBe(1);
    const row = { filerName: "A", amount: 1 };
    expect(form8912CopyCount({ partIII: Array(21).fill(row), partIV: [] })).toBe(2);
    expect(
      form8912CopyCount({
        partIII: [row],
        partIV: Array(3).fill({ factKey: "k", issuer: "i", issuerEin: "e" }),
      }),
    ).toBe(3);
  });
});

describe("Form 8912 Part II and line 12", () => {
  const none = { line10a: undefined, line10b: undefined, line10c: undefined, line10d: undefined };

  it("line 9 adds lines 7 and 8; line 10e adds 10a to 10d; line 11 is line 9 less 10e", () => {
    const lines = partII(20000, 1500, { line10a: 100, line10b: 2000, line10c: 300, line10d: 50 });
    expect(lines.line9).toBe(21500);
    expect(lines.line10e).toBe(2450);
    expect(lines.line11).toBe(19050);
  });

  it("line 11 is never below 0", () => {
    expect(partII(1000, undefined, { ...none, line10b: 1500 }).line11).toBe(0);
  });

  it("line 12 is the smaller of line 4 and line 11", () => {
    expect(line12(4432, 31271, [], 160907)).toBe(4432);
    expect(line12(4432, 3000, [], 160907)).toBe(3000);
    expect(line12(4432, 0, [], 160907)).toBe(0);
  });

  it("the pass-through formula limits a CREB credit to line 11 x its share of taxable income", () => {
    // 30,000 x 2,000 / 160,000 = 375, less than the 612 credit.
    expect(passThroughLimit(30000, { credit: 612, attributableTaxableIncome: 2000 }, 160000)).toBe(
      375,
    );
    expect(line12(3000, 30000, [{ credit: 612, attributableTaxableIncome: 2000 }], 160000)).toBe(
      2763,
    );
  });

  it("the formula never raises a credit, and no taxable income from the interest allows none", () => {
    expect(
      passThroughLimit(30000, { credit: 612, attributableTaxableIncome: 200000 }, 160000),
    ).toBe(612);
    expect(passThroughLimit(30000, { credit: 612, attributableTaxableIncome: 0 }, 160000)).toBe(0);
    expect(passThroughLimit(30000, { credit: 612, attributableTaxableIncome: -500 }, 160000)).toBe(
      0,
    );
    expect(passThroughLimit(30000, { credit: 612, attributableTaxableIncome: 2000 }, 0)).toBe(0);
  });

  it("line 12 is never more than line 4 or line 11", () => {
    const interests = [{ credit: 500, attributableTaxableIncome: 10000 }];
    for (const line11 of [0, 100, 2000, 50000]) {
      const credit = line12(1500, line11, interests, 40000);
      expect(credit).toBeLessThanOrEqual(1500);
      expect(credit).toBeLessThanOrEqual(line11);
    }
  });
});
