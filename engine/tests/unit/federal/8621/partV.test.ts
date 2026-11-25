/*
 * Form 8621 Part V (lines 15 and 16) and the section 6621 interest: limit
 * tests that need no source. The leane and sheriam amounts were checked by an
 * independent script (.scratch/evidence.md).
 */

import { describe, expect, it } from "vitest";
import { underpaymentRateOn } from "../../../../src/data/underpaymentRates.js";
import { compoundedInterest, utcDate } from "../../../../src/federal/8621/interest.js";
import {
  holdingStartOf,
  line15Of,
  precedingYearsOf,
  type Line15Input,
} from "../../../../src/federal/8621/line15.js";
import { line16Of, topRateOf } from "../../../../src/federal/8621/line16.js";

const start = (acquired: string) => holdingStartOf(acquired)!;
const day = (iso: string) => utcDate(iso)!;

const rhine: Line15Input = {
  holdingStart: start("2021-03-15"),
  currencyCode: "EUR",
  distributions: [
    { date: "2025-06-20", amount: 6000, usdPerUnit: 1.15, foreignTaxWithheld: 900 },
    { date: "2025-12-12", amount: 4000, usdPerUnit: 1.17, foreignTaxWithheld: 600 },
  ],
  precedingDistributions: 9600,
};

describe("Line 15: the excess distribution", () => {
  it("lines 15a–15e(1) in euros, 15e(2) at each distribution's rate", () => {
    const lines = line15Of(rhine);
    expect(lines).toMatchObject({
      currencyCode: "EUR",
      line15a: 10000,
      line15b: 9600,
      line15c: 3200,
      line15d: 4000,
      line15e1: 6000,
      line15e2: 6948,
    });
  });

  it("the excess splits in proportion to each distribution; the rest is a dividend", () => {
    const lines = line15Of(rhine);
    if (typeof lines === "string") throw new Error(lines);
    expect(lines.events.map((event) => event.amountUsd)).toEqual([3600 * 1.15, 2400 * 1.17]);
    expect(lines.dividendsUsd).toBeCloseTo(2400 * 1.15 + 1600 * 1.17, 9);
    // The dividend and the excess together are every distribution in dollars.
    expect(lines.dividendsUsd + (lines.line15e2 ?? 0)).toBeCloseTo(6000 * 1.15 + 4000 * 1.17, 9);
  });

  it("the foreign tax splits in the same proportion as each distribution", () => {
    const lines = line15Of(rhine);
    if (typeof lines === "string") throw new Error(lines);
    expect(lines.events.map((event) => event.foreignTax)).toEqual([540, 360]);
    expect(lines.dividendForeignTax).toBeCloseTo(600, 9);
  });

  it("at exactly 125% of the average there is no excess distribution", () => {
    const lines = line15Of({
      ...rhine,
      distributions: [{ date: "2025-06-20", amount: 4000, usdPerUnit: 1.15 }],
    });
    expect(lines).toMatchObject({ line15d: 4000, line15e1: 0, line15e2: 0, events: [] });
  });

  it("below 125% line 15e(1) is 0, not negative", () => {
    const lines = line15Of({
      ...rhine,
      distributions: [{ date: "2025-06-20", amount: 100, usdPerUnit: 1 }],
    });
    expect(lines).toMatchObject({ line15e1: 0 });
  });

  it("with fewer than 3 preceding years, line 15c divides by that number", () => {
    expect(precedingYearsOf(start("2023-06-01"))).toBe(2);
    expect(precedingYearsOf(start("2024-12-30"))).toBe(1);
    const lines = line15Of({
      ...rhine,
      holdingStart: start("2023-06-01"),
      precedingDistributions: 900,
    });
    expect(lines).toMatchObject({ line15b: 900, line15c: 450 });
  });

  it("a block bought in 2025 (or on December 31, 2024): line 15a only, all of it a dividend", () => {
    expect(precedingYearsOf(start("2024-12-31"))).toBe(0);
    const lines = line15Of({ ...rhine, holdingStart: start("2025-01-10") });
    expect(lines).toMatchObject({ line15a: 10000, events: [] });
    expect(typeof lines === "string" ? 0 : lines.line15b).toBeUndefined();
  });

  it("a gain on line 15f is an excess distribution; a loss is not", () => {
    const gain = line15Of({
      holdingStart: start("2022-02-01"),
      currencyCode: "USD",
      distributions: [],
      disposition: { date: "2025-09-30", amountRealized: 48000, adjustedBasis: 39500 },
    });
    expect(gain).toMatchObject({ line15f: 8500 });
    expect(typeof gain === "string" ? [] : gain.events.map((event) => event.amountUsd)).toEqual([
      8500,
    ]);
    const loss = line15Of({
      holdingStart: start("2022-02-01"),
      currencyCode: "USD",
      distributions: [],
      disposition: { date: "2025-09-30", amountRealized: 30000, adjustedBasis: 39500 },
    });
    expect(loss).toMatchObject({ line15f: -9500, events: [] });
  });

  it("a foreign currency with no rate, or a missing line 15b, is a gap", () => {
    expect(typeof line15Of({ ...rhine, distributions: [{ date: "2025-06-20", amount: 10 }] })).toBe(
      "string",
    );
    expect(typeof line15Of({ ...rhine, precedingDistributions: undefined })).toBe("string");
  });
});

describe("Line 16: the allocation, the tax and the interest", () => {
  it("the top rate table (irs-8621-inst-2025::sec::tax-rates::b01)", () => {
    expect([topRateOf(1987), topRateOf(1990), topRateOf(2001), topRateOf(2002)]).toEqual([
      0.385, 0.28, 0.391, 0.386,
    ]);
    expect([topRateOf(2012), topRateOf(2017), topRateOf(2025), topRateOf(1986)]).toEqual([
      0.35,
      0.396,
      0.37,
      undefined,
    ]);
  });

  it("a stock held only in 2025 puts the whole gain on line 16b", () => {
    const event = {
      amountUsd: 1000,
      date: day("2025-09-30"),
      foreignTaxUsd: 0,
      foreignTax: 0,
      fromDistribution: false,
    };
    expect(line16Of([event], start("2025-01-01"), 2025)).toMatchObject({
      line16b: 1000,
      line16c: 0,
      line16e: 0,
      line16f: 0,
    });
  });

  it("days split the gain: half of 730 days in 2024 (366) and 2025 (364) at the 2024 top rate", () => {
    const event = {
      amountUsd: 7300,
      date: day("2025-12-30"),
      foreignTaxUsd: 0,
      foreignTax: 0,
      fromDistribution: false,
    };
    const lines = line16Of([event], day("2024-01-01"), 2024);
    expect(lines).toMatchObject({ line16b: 3640, line16c: 1354 }); // 7,300 × 366/730 × 37% = 1,354.20
  });

  it("years before the first PFIC year are pre-PFIC: line 16b, no tax", () => {
    const event = {
      amountUsd: 7300,
      date: day("2025-12-30"),
      foreignTaxUsd: 0,
      foreignTax: 0,
      fromDistribution: false,
    };
    expect(line16Of([event], day("2024-01-01"), 2025)).toMatchObject({ line16b: 7300, line16c: 0 });
  });

  it("the foreign tax credit never exceeds a year's increase, and none carries over", () => {
    const event = {
      amountUsd: 7300,
      date: day("2025-12-30"),
      foreignTaxUsd: 5000,
      foreignTax: 5000,
      fromDistribution: true,
    };
    const lines = line16Of([event], day("2024-01-01"), 2024);
    expect(lines).toMatchObject({ line16c: 1354, line16d: 1354, line16e: 0, line16f: 0 });
    // The tax allocated to 2025 goes to the general credit rules: 5,000 × 364/730.
    expect(typeof lines === "string" ? 0 : lines.generalRulesForeignTaxUsd).toBeCloseTo(2493.15, 2);
  });

  it("line 16e = 16c − 16d", () => {
    const event = {
      amountUsd: 7300,
      date: day("2025-12-30"),
      foreignTaxUsd: 100,
      foreignTax: 100,
      fromDistribution: true,
    };
    const lines = line16Of([event], day("2024-01-01"), 2024);
    if (typeof lines === "string") throw new Error(lines);
    expect(lines.line16e).toBe(lines.line16c - lines.line16d);
  });

  it("a holding period before 1987 in a PFIC year is a gap", () => {
    const event = {
      amountUsd: 1000,
      date: day("2025-06-30"),
      foreignTaxUsd: 0,
      foreignTax: 0,
      fromDistribution: false,
    };
    expect(typeof line16Of([event], day("1985-01-01"), 1985)).toBe("string");
  });
});

describe("Section 6621 interest", () => {
  it("the rate table: 7% for 2025, 6% from April 1, 2026, none past the table", () => {
    expect(underpaymentRateOn(day("2025-04-16"))).toBe(0.07);
    expect(underpaymentRateOn(day("2026-04-15"))).toBe(0.06);
    expect(underpaymentRateOn(day("2026-07-01"))).toBeUndefined();
    expect(underpaymentRateOn(day("1987-10-01"))).toBe(0.1);
  });

  it("compounds daily: 2025-04-15 to 2026-04-15 on $1,000 is 350 days at 7% and 15 at 6%", () => {
    const expected = 1000 * ((1 + 0.07 / 365) ** 350 * (1 + 0.06 / 365) ** 15 - 1);
    expect(compoundedInterest(1000, day("2025-04-15"), day("2026-04-15"))).toBeCloseTo(expected, 9);
  });

  it("is more than simple interest and less than the top rate compounded", () => {
    const interest = compoundedInterest(1000, day("2023-04-15"), day("2026-04-15"))!;
    expect(interest).toBeGreaterThan(1000 * 0.06 * 3);
    expect(interest).toBeLessThan(1000 * (1.08 ** 3.01 - 1));
  });

  it("no days, no interest; a day past the table is undefined", () => {
    expect(compoundedInterest(1000, day("2026-04-15"), day("2026-04-15"))).toBe(0);
    expect(compoundedInterest(1000, day("2026-04-15"), day("2026-07-02"))).toBeUndefined();
  });
});
