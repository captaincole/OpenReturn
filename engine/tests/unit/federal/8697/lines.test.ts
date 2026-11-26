/*
 * Form 8697 arithmetic, rates and interest, with no return around them. The
 * instructions have one example with numbers, the accrual periods and rates of
 * "Example of Applicable Interest Rates for Look-back Interest"
 * (irs-8697-inst-2025::sec::line-11::b03), and the rate tables of Part II and
 * Table 1. The other tests are limits that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  accrualPeriods,
  interestEndDate,
  lookBackInterest,
} from "../../../../src/federal/8697/interest.js";
import {
  columnInterest,
  columnTotal,
  largerOfLine2OrLine4,
  netInterest,
  regularColumnLines,
  simplifiedColumnLines,
} from "../../../../src/federal/8697/lines.js";
import {
  lookBackRateOn,
  smimAmtRate,
  smimRegularRate,
} from "../../../../src/federal/8697/rates.js";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);

describe("accrual periods: the example of applicable interest rates (instructions, line-11::b03)", () => {
  // A calendar-year taxpayer completes contracts in 2024; 2022 and 2023 are redetermination years.
  const end = day("2025-04-15");

  it("the 2022 year has two periods: 4/16/2023–4/15/2024 and 4/16/2024–4/15/2025", () => {
    const periods = accrualPeriods(2022, end)!;
    expect(periods.map((period) => [iso(period.firstDay), iso(period.lastDay)])).toEqual([
      ["2023-04-16", "2024-04-15"],
      ["2024-04-16", "2025-04-15"],
    ]);
  });

  it("the 2023 year has one period: 4/16/2024–4/15/2025", () => {
    const periods = accrualPeriods(2023, end)!;
    expect(periods.map((period) => [iso(period.firstDay), iso(period.lastDay)])).toEqual([
      ["2024-04-16", "2025-04-15"],
    ]);
  });

  it("each period keeps the rate of its first day: Table 1's 7% (1/1/23–9/30/23) and 8% (2024)", () => {
    expect(accrualPeriods(2022, end)!.map((period) => period.rate)).toEqual([0.07, 0.08]);
  });
});

describe("rates: Table 1 (instructions, line-11::b02) against the section 6621 table", () => {
  // Each Table 1 row: its first day and rate. The engine's rate on that day must agree.
  const TABLE_1: Array<[string, number]> = [
    ["2015-01-01", 0.03],
    ["2016-01-01", 0.03],
    ["2016-04-01", 0.04],
    ["2017-01-01", 0.04],
    ["2018-04-01", 0.05],
    ["2019-07-01", 0.05],
    ["2020-01-01", 0.05],
    ["2020-07-01", 0.03],
    ["2021-01-01", 0.03],
    ["2022-07-01", 0.05],
    ["2022-10-01", 0.06],
    ["2023-01-01", 0.07],
    ["2023-10-01", 0.08],
    ["2024-01-01", 0.08],
    ["2025-01-01", 0.07],
  ];

  it.each(TABLE_1)("Table 1 row from %s: %s", (first, rate) => {
    expect(lookBackRateOn(day(first))).toBe(rate);
  });

  it("the decided quarters: 6% from April 1, 2019 (Table 1 says 5%), 4% from April 1, 2022 (no row)", () => {
    expect(lookBackRateOn(day("2019-04-16"))).toBe(0.06);
    expect(lookBackRateOn(day("2022-04-16"))).toBe(0.04);
  });

  it("no rate before 1999, when the overpayment rate was below the underpayment rate", () => {
    expect(lookBackRateOn(day("1998-04-16"))).toBeUndefined();
    expect(lookBackRateOn(day("1999-01-01"))).toBe(0.07);
  });
});

describe("Part II rates (instructions, line-2-2::b01 and line-4::b01)", () => {
  it.each([
    [1986, 0.5],
    [1987, 0.385],
    [1988, 0.28],
    [1990, 0.28],
    [1991, 0.31],
    [1992, 0.31],
    [1993, 0.396],
    [2000, 0.396],
    [2001, 0.391],
    [2002, 0.386],
    [2003, 0.35],
    [2012, 0.35],
    [2013, 0.396],
    [2017, 0.396],
    [2018, 0.37],
    [2024, 0.37],
  ])("regular rate for %s: %s", (year, rate) => {
    expect(smimRegularRate(year)).toBe(rate);
  });

  it.each([
    [1987, 0.21],
    [1990, 0.21],
    [1991, 0.24],
    [1992, 0.24],
    [1993, 0.28],
    [2024, 0.28],
  ])("AMT rate for %s: %s", (year, rate) => {
    expect(smimAmtRate(year)).toBe(rate);
  });

  it("no AMT rate before 1987", () => {
    expect(smimAmtRate(1986)).toBeUndefined();
  });
});

describe("interest compounded daily", () => {
  it("one non-leap accrual period at 7% grows by (1 + 0.07/365)^365 − 1", () => {
    const interest = lookBackInterest(10_000, 2024, day("2026-04-15"))!;
    expect(interest).toBeCloseTo(10_000 * ((1 + 0.07 / 365) ** 365 - 1), 6);
  });

  it("a leap-year day grows by the rate over 366", () => {
    // 2023 year, end 4/16/2024 + 0: one day, April 16, 2024, at 8%.
    expect(lookBackInterest(366_000, 2023, day("2024-04-16"))).toBeCloseTo(80, 6);
  });

  it("no interest when the end comes before the first period", () => {
    expect(lookBackInterest(5_000, 2024, day("2025-04-15"))).toBe(0);
  });

  it("an earlier filed-and-paid date ends the interest; a later one does not", () => {
    expect(iso(interestEndDate(2025, "2026-03-02"))).toBe("2026-03-02");
    expect(iso(interestEndDate(2025, "2026-06-30"))).toBe("2026-04-15");
    expect(iso(interestEndDate(2025, undefined))).toBe("2026-04-15");
  });

  it("past the rate table: undefined", () => {
    expect(lookBackInterest(1_000, 1996, day("2026-04-15"))).toBeUndefined();
  });
});

describe("Part I column arithmetic", () => {
  const lines = regularColumnLines({
    taxableIncome: 120_000,
    incomeAdjustment: 40_000,
    taxOnAdjustedIncome: 31_800,
    taxAsReported: 22_200,
  });

  it("line 3 is line 1 + line 2, and line 6 is line 4 − line 5", () => {
    expect(lines.line3).toBe(lines.line1 + lines.line2);
    expect(lines.line6).toBe(lines.line4 - lines.line5);
    expect(lines).toEqual({
      line1: 120_000,
      line2: 40_000,
      line3: 160_000,
      line4: 31_800,
      line5: 22_200,
      line6: 9_600,
    });
  });

  it("stated amounts round to the nearest dollar", () => {
    const rounded = regularColumnLines({
      taxableIncome: 100.5,
      incomeAdjustment: -0.6,
      taxOnAdjustedIncome: 10.49,
      taxAsReported: 0,
    });
    expect([rounded.line1, rounded.line2, rounded.line4]).toEqual([101, -1, 10]);
  });

  it("an increase is interest due, a decrease interest refunded, no change neither", () => {
    expect(columnInterest(9_600, 1_551.7)).toEqual({ due: 1_551.7 });
    expect(columnInterest(-3_600, 261)).toEqual({ refunded: 261 });
    expect(columnInterest(0, 0)).toEqual({});
  });
});

describe("Part II line 5: the larger of line 2 or line 4 (line-5::b01)", () => {
  it("both positive: the larger", () => expect(largerOfLine2OrLine4(2_220, 2_800)).toBe(2_800));
  it("both negative: the larger by size, entered as negative", () =>
    expect(largerOfLine2OrLine4(-7_400, -5_600)).toBe(-7_400));
  it("one negative, one positive: the positive", () => {
    expect(largerOfLine2OrLine4(-3_700, 280)).toBe(280);
    expect(largerOfLine2OrLine4(370, -2_800)).toBe(370);
  });
  it("zero and a negative: zero, the larger", () => expect(largerOfLine2OrLine4(0, -500)).toBe(0));
});

describe("Part II lines 6 and 7: the overpayment ceiling", () => {
  const base = { regularRate: 0.37, amtRate: 0.28 };

  it("line 5 positive: line 6 blank, line 7 is line 5", () => {
    const lines = simplifiedColumnLines({
      ...base,
      incomeAdjustment: 6_000,
      amtiAdjustment: 10_000,
      totalTaxLiability: 38_000,
    });
    expect(lines).toEqual({
      line1: 6_000,
      line2: 2_220,
      line3: 10_000,
      line4: 2_800,
      line5: 2_800,
      line7: 2_800,
    });
  });

  it("line 5 negative and smaller than the ceiling: line 7 is line 5", () => {
    const lines = simplifiedColumnLines({
      ...base,
      incomeAdjustment: -30_000,
      amtiAdjustment: -30_000,
      totalTaxLiability: 40_000,
    });
    expect([lines.line5, lines.line6, lines.line7]).toEqual([-11_100, 40_000, -11_100]);
  });

  it("the ceiling binds: line 7 is minus line 6, never more than the year's tax", () => {
    const lines = simplifiedColumnLines({
      ...base,
      incomeAdjustment: -20_000,
      amtiAdjustment: -20_000,
      totalTaxLiability: 5_000,
    });
    expect([lines.line5, lines.line6, lines.line7]).toEqual([-7_400, 5_000, -5_000]);
  });

  it("a zero ceiling: line 7 is 0", () => {
    const lines = simplifiedColumnLines({
      ...base,
      incomeAdjustment: -1_000,
      amtiAdjustment: 0,
      totalTaxLiability: 0,
    });
    expect(lines.line5).toBe(0);
    const negative = simplifiedColumnLines({
      ...base,
      incomeAdjustment: -1_000,
      amtiAdjustment: -1_000,
      totalTaxLiability: 0,
    });
    expect(Object.is(negative.line7, 0)).toBe(true);
  });
});

describe("totals and the net line", () => {
  it("a total keeps the columns' cents and rounds once; blank with no amount", () => {
    expect(columnTotal([1_429.9, 2_614.7])).toBe(4_045);
    expect(columnTotal([undefined, undefined])).toBeUndefined();
  });

  it("more refunded than due: line 9a; more due: line 10; equal: neither", () => {
    expect(netInterest(425, 4_045)).toEqual({ refund: 3_620 });
    expect(netInterest(1_552, 261)).toEqual({ owed: 1_291 });
    expect(netInterest(300, 300)).toEqual({});
    expect(netInterest(undefined, 50)).toEqual({ refund: 50 });
  });

  it("the net line is the difference of the totals", () => {
    const net = netInterest(1_552, 261);
    expect(net.owed).toBe(1_552 - 261);
  });
});
