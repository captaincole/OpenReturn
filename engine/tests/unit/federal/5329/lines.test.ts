/* Source: 2025 Form 5329 Part I and its instructions; Pub. 590-B's Tom Jones example. */

import { describe, expect, it } from "vitest";
import type { EarlyDistributionPerson } from "../../../../src/federal/5329/filingInfo.js";
import {
  earlyDistributionTax,
  line1,
  line2,
  line2ExceptionNumber,
  line3,
  line4,
  type EarlyDistributionRow,
} from "../../../../src/federal/5329/lines.js";

const row = (
  amountInIncome: number,
  exception?: { number: string; amount: number },
  simpleIraFirstTwoYears = false,
): EarlyDistributionRow => ({ amountInIncome, simpleIraFirstTwoYears, exception });

const lines = (rows: EarlyDistributionRow[]) => ({
  line1: line1(rows),
  line2: line2(rows),
  number: line2ExceptionNumber(rows),
  line3: line3(rows),
  line4: line4(rows),
});

describe("Form 5329 Part I lines", () => {
  /*
   * irs-pub-590b-2025::sec::additional-10-tax::b01: Tom Jones, 35, a $3,000
   * traditional IRA distribution, no exception, no basis: "an additional tax of
   * $300". The filled-in form (irs-pub-590b-2025::sec::omb-no-1545-0074-2::b05)
   * prints line 1 3000, line 2 -0-, line 3 3000, line 4 300.
   */
  it("Pub. 590-B, Tom Jones: lines 1–4", () => {
    expect(lines([row(3000)])).toEqual({
      line1: 3000,
      line2: 0,
      number: undefined,
      line3: 3000,
      line4: 300,
    });
  });

  it.each([
    // label, rows, lines 1, 3, 4
    ["line 4 is 10% of line 3", [row(12345)], 12345, 12345, 1235],
    ["cents kept while adding, the total rounded", [row(500.3), row(499.4)], 1000, 1000, 100],
    ["50 cents rounds up", [row(1004.6)], 1005, 1005, 101],
    ["under 50 cents rounds down", [row(1004.4)], 1004, 1004, 100],
  ] as const)("%s", (_, rows, expected1, expected3, expected4) => {
    const result = lines([...rows]);
    expect([result.line1, result.line3, result.line4]).toEqual([expected1, expected3, expected4]);
  });

  // irs-5329-inst-2025::sec::line-2::b01: the amount "included on line 1" that is not subject.
  it("never excludes more than the distribution's amount in income", () => {
    expect(lines([row(2000, { number: "05", amount: 5000 })])).toEqual({
      line1: 2000,
      line2: 2000,
      number: "05",
      line3: 0,
      line4: 0,
    });
  });

  it("excludes part of a distribution and names its exception", () => {
    expect(lines([row(3000, { number: "05", amount: 1200 })])).toMatchObject({
      line2: 1200,
      number: "05",
      line3: 1800,
      line4: 180,
    });
  });

  // irs-5329-inst-2025::sec::line-2::b01: "If more than one exception applies, enter 99."
  it("enters 99 for more than one exception", () => {
    const rows = [
      row(1000, { number: "05", amount: 400 }),
      row(2000, { number: "08", amount: 500 }),
    ];
    expect(lines(rows)).toMatchObject({ line2: 900, number: "99", line3: 2100, line4: 210 });
  });

  it("keeps one number when two rows give the same exception", () => {
    const rows = [
      row(1000, { number: "19", amount: 1000 }),
      row(500, { number: "19", amount: 500 }),
    ];
    expect(line2ExceptionNumber(rows)).toBe("19");
  });

  // irs-5329-inst-2025::sec::line-4::b01: 25% of a code S amount, 10% of the rest.
  it("takes 25% of the SIMPLE IRA part of line 3", () => {
    expect(line4([row(4000, undefined, true), row(2000)])).toBe(1200);
  });

  it("takes 25% only of the SIMPLE IRA part no exception covers", () => {
    expect(line4([row(4000, { number: "03", amount: 1000 }, true), row(2000)])).toBe(950);
  });
});

describe("Schedule 2 line 8's Part I amount", () => {
  const person = (rows: EarlyDistributionRow[], pending = false): EarlyDistributionPerson => ({
    owner: "taxpayer",
    rows,
    pending,
    needsForm: false,
    factKeys: [],
  });

  // irs-5329-inst-2025::sec::specific-instructions::b01: "Include the combined tax on Schedule 2".
  it("adds line 4 of each person", () => {
    expect(earlyDistributionTax([person([row(3000)]), person([row(1000)])])).toBe(400);
  });

  it("waits while a person's answers are missing", () => {
    expect(earlyDistributionTax([person([row(3000)]), person([], true)])).toBeUndefined();
  });

  it("is 0 with no early distribution", () => {
    expect(earlyDistributionTax([])).toBe(0);
  });
});
