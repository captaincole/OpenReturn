/*
 * Form 8611's pure arithmetic (federal/8611/lines.ts, interest.ts). The current
 * instructions (Rev. December 2021) have no example with numbers; the Line 7
 * example of the prior revision (Form 8611, Rev. 1-2006, page 3) checks lines
 * 3 to 7, and needs no yearly amount. The rest are limit tests.
 */

import { describe, expect, it } from "vitest";
import {
  NO_PRIOR_YEAR_CREDIT,
  PAST_RATE_TABLE,
  recaptureInterest,
} from "../../../../src/federal/8611/interest.js";
import {
  basisDecreasePercentage,
  decimalDigits,
  decimalText,
  line2Worksheet,
  netRecapture,
  ownPartLines,
  recaptureLines,
  recapturePercentage,
  timesDecimal,
  unusedAcceleratedPortion,
  yearOfCompliancePeriod,
} from "../../../../src/federal/8611/lines.js";

const decrease = (first: number, prior: number, yearEnd: number) =>
  ({
    kind: "decrease",
    firstYearQualifiedBasis: first,
    priorYearEndQualifiedBasis: prior,
    yearEndQualifiedBasis: yearEnd,
  }) as const;

describe("Form 8611 (Rev. 1-2006), Line 7 example: $270 of Year 1 credit", () => {
  it("Year 2: a 20% reduction recaptures $18 ($270 × .333 × .2)", () => {
    const lines = ownPartLines({
      credits: [270],
      worksheets: [],
      line4: recapturePercentage(2)!,
      line6: basisDecreasePercentage(decrease(100, 100, 80)),
      acceleratedPortionRecapturedEarlier: 0,
    });
    expect(lines).toMatchObject({ line3: 270, line4: 333, line5: 90, line6: 200, line7: 18 });
  });

  it("Year 4: a 30% reduction recaptures $9 ($27 less the $18 of Year 2)", () => {
    const lines = ownPartLines({
      credits: [270],
      worksheets: [],
      line4: recapturePercentage(4)!,
      line6: basisDecreasePercentage(decrease(100, 100, 70)),
      acceleratedPortionRecapturedEarlier: 18,
    });
    expect(lines).toMatchObject({ line5: 90, line6: 300, line7: 9 });
  });

  it("takes the earlier recapture off line 5 × line 6, not off line 5 (QUESTIONS.md doubt 2)", () => {
    const lines = ownPartLines({
      credits: Array.from({ length: 9 }, () => 3000),
      worksheets: [],
      line4: recapturePercentage(10)!,
      line6: basisDecreasePercentage(decrease(800000, 800000, 720000)),
      acceleratedPortionRecapturedEarlier: 1000,
    });
    // $8,991 × .100 = $899, less the $1,000 recaptured earlier: 0, not ($8,991 − $1,000) × .100 = $799.
    expect(lines).toMatchObject({ line5: 8991, line6: 100, line7: 0 });
  });
});

describe("line 4: the table (line-4::b01)", () => {
  it.each([
    [1, undefined],
    [2, 333],
    [11, 333],
    [12, 267],
    [13, 200],
    [14, 133],
    [15, 67],
    [16, undefined],
  ])("year %i of the compliance period: %s", (year, expected) => {
    expect(recapturePercentage(year)).toBe(expected);
  });

  it("counts the first credit year as year 1", () => {
    expect(yearOfCompliancePeriod(2018, 2025)).toBe(8);
    expect(yearOfCompliancePeriod(2025, 2025)).toBe(1);
  });
});

describe("line 6: the percentage decrease (line-6::b01)", () => {
  it("is 1.000 for a disposition and for a fall below the minimum set-aside", () => {
    expect(basisDecreasePercentage({ kind: "disposition" })).toBe(1000);
    expect(basisDecreasePercentage({ kind: "below_minimum_set_aside" })).toBe(1000);
  });

  it("is 0 when the basis did not fall this year", () => {
    expect(basisDecreasePercentage(decrease(1000, 800, 800))).toBe(0);
    expect(basisDecreasePercentage(decrease(1000, 800, 900))).toBe(0);
  });

  it("is 0 while the decrease only uses up additions after the first year", () => {
    expect(basisDecreasePercentage(decrease(1000, 1200, 1000))).toBe(0);
  });

  it("counts only the first-year basis lost when the decrease passes the additions", () => {
    expect(basisDecreasePercentage(decrease(1000, 1200, 900))).toBe(100);
  });

  it("rounds to 3 places, to the nearest", () => {
    expect(basisDecreasePercentage(decrease(3, 3, 2))).toBe(333);
    expect(basisDecreasePercentage(decrease(3, 3, 1))).toBe(667);
  });

  it("is never more than 1.000", () => {
    expect(basisDecreasePercentage(decrease(1000, 1000, 0))).toBe(1000);
  });
});

describe("the Line 2 Worksheet (part-i::b01)", () => {
  it("follows lines a to i", () => {
    const worksheet = line2Worksheet({
      line10: 700,
      line11: 300,
      line14Step1Decimal: 0.25,
      line15: 12,
      line16: 9,
    });
    expect(worksheet).toEqual({
      lineA: 700,
      lineB: 1400,
      lineC: 300,
      lineD: 1100,
      lineE: 250,
      lineF: 275,
      lineG: 825,
      lineH: 750,
      lineI: 619,
    });
  });

  it("enters 0 on line e when line 14 does not apply", () => {
    const worksheet = line2Worksheet({
      line10: 500,
      line11: 0,
      line14Step1Decimal: 0,
      line15: 10,
      line16: 10,
    });
    expect(worksheet).toMatchObject({
      lineD: 1000,
      lineF: 0,
      lineG: 1000,
      lineH: 1000,
      lineI: 1000,
    });
  });

  it("line 2 adds the i amounts of every worksheet", () => {
    const one = line2Worksheet({
      line10: 100,
      line11: 0,
      line14Step1Decimal: 0,
      line15: 1,
      line16: 1,
    });
    const lines = ownPartLines({
      credits: [1000, 1000],
      worksheets: [one, one],
      line4: 333,
      line6: 0,
      acceleratedPortionRecapturedEarlier: 0,
    });
    expect(lines.line2).toBe(400);
    expect(lines.line3).toBe(lines.line1 - lines.line2);
  });
});

describe("lines 1 to 7", () => {
  it("line 1 adds the credits with their cents and rounds the total", () => {
    const lines = ownPartLines({
      credits: [100.4, 100.4],
      worksheets: [],
      line4: 333,
      line6: 0,
      acceleratedPortionRecapturedEarlier: 0,
    });
    expect(lines.line1).toBe(201);
  });

  it("line 7 is never below 0 when the earlier recapture is larger", () => {
    const lines = ownPartLines({
      credits: [270],
      worksheets: [],
      line4: 333,
      line6: 100,
      acceleratedPortionRecapturedEarlier: 18,
    });
    expect(lines.line7).toBe(0);
  });

  it("a disposition recaptures all of line 5", () => {
    const lines = ownPartLines({
      credits: [9000],
      worksheets: [],
      line4: 333,
      line6: 1000,
      acceleratedPortionRecapturedEarlier: 0,
    });
    expect(lines.line7).toBe(lines.line5);
  });
});

describe("lines 9 to 15 (line-9::b01, line-13::b01)", () => {
  it("line 9 takes the unused credits less those from additions, times lines 4 and 6", () => {
    expect(unusedAcceleratedPortion(3000, 200, 333, 175)).toBe(163);
    expect(unusedAcceleratedPortion(0, 0, 333, 1000)).toBe(0);
  });

  it("line 9 is never more than the unused credits", () => {
    expect(unusedAcceleratedPortion(5000, 0, 333, 1000)).toBeLessThanOrEqual(5000);
  });

  it("line 10 is never below 0", () => {
    expect(netRecapture(100, 150)).toBe(0);
    expect(netRecapture(150, 100)).toBe(50);
  });

  it("line 14 and line 15 are each 0 when the other holds the difference", () => {
    const tax = recaptureLines(163, 4203, 1205, 3000);
    expect(tax).toMatchObject({ line12: 5408, line13: 2837, line14: 2571, line15: 0 });
    const carry = recaptureLines(500, 1000, 50, 4000);
    expect(carry).toMatchObject({ line12: 1050, line13: 3500, line14: 0, line15: 2450 });
  });

  it("line 14 less line 15 is line 12 less line 13", () => {
    const lines = recaptureLines(10, 700, 20, 900);
    expect(lines.line14 - lines.line15).toBe(lines.line12 - lines.line13);
  });
});

describe("line 11: the interest (line-11::b01)", () => {
  it("is 0 when line 10 is 0", () => {
    expect(recaptureInterest(0, [{ taxYear: 2024, weight: 1 }], 2025)).toEqual({
      kind: "figured",
      amount: 0,
    });
  });

  it("compounds daily from April 15, 2025 to April 15, 2026: $1,000 gives $72", () => {
    expect(recaptureInterest(1000, [{ taxYear: 2024, weight: 1 }], 2025)).toEqual({
      kind: "figured",
      amount: 72,
    });
  });

  it("shares line 10 among the prior years by their credit", () => {
    const years = [
      { taxYear: 2023, weight: 6000 },
      { taxYear: 2024, weight: 4000 },
    ];
    expect(recaptureInterest(1000, years, 2025)).toEqual({ kind: "figured", amount: 124 });
  });

  it("is a gap with no prior year credit", () => {
    expect(recaptureInterest(1000, [], 2025)).toEqual({
      kind: "gap",
      reason: NO_PRIOR_YEAR_CREDIT,
    });
  });

  it("is a gap for a day before the rate table", () => {
    expect(recaptureInterest(1000, [{ taxYear: 1985, weight: 1 }], 2025)).toEqual({
      kind: "gap",
      reason: PAST_RATE_TABLE,
    });
  });
});

describe("printing a decimal", () => {
  it("leaves the digit before the point empty below 1", () => {
    expect(decimalDigits(333)).toEqual({ whole: "", decimal: "333" });
    expect(decimalDigits(67)).toEqual({ whole: "", decimal: "067" });
    expect(decimalDigits(1000)).toEqual({ whole: "1", decimal: "000" });
    expect(decimalText(250)).toBe(".250");
  });

  it("an amount times a printed decimal rounds to the nearest dollar", () => {
    expect(timesDecimal(81781, 333)).toBe(27233);
  });
});
