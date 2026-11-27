/*
 * Form 8609-A's arithmetic: each published example with numbers is a test
 * named by its source (irs-8609a-inst-2025, and the IRS Audit Technique Guide
 * for IRC 42, part 7, "ATG"), then the limits that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  averagePortion,
  creditAllowed,
  creditPercentage,
  decimalDigits,
  deferredFirstYearCredit,
  disallowedForGrants,
  line11Worksheet,
  lowIncomeFraction,
  lowIncomePortion,
  oneThirdOf,
  partYear,
  qualifiedBasis,
  timesDecimal,
} from "../../../../src/federal/8609-a/lines.js";
import { daysOwned, shareOfCredit } from "../../../../src/federal/8609-a/ownership.js";

const count = (lowIncomeUnits: number, residentialUnits: number, floor = [1, 1]) => ({
  lowIncomeUnits,
  residentialUnits,
  lowIncomeFloorSpace: floor[0],
  residentialFloorSpace: floor[1],
});

describe("published examples", () => {
  it("line 2: 50/100 = .5000 (line-2::b01)", () => {
    expect(lowIncomePortion(count(50, 100))).toBe(5000);
  });

  it("line 2, first year: 3 months half low-income = 0.1250 (proc-2014-49…::b02)", () => {
    expect(averagePortion([5000, 5000, 5000])).toBe(1250);
  });

  it("line 4: $20,000 sold May 25 — seller 151 days $8,274, buyer 214 days $11,726 (line-4::b02)", () => {
    const seller = daysOwned({ share: 1, disposedOn: "2025-05-25", recaptureAvoided: true });
    const buyer = daysOwned({ share: 1, acquiredOn: "2025-05-25" });
    expect([seller, buyer]).toEqual([151, 214]);
    expect(partYear(20000, 151, 365)).toBe(8274);
    expect(partYear(20000, 214, 365)).toBe(11726);
  });

  it("ATG ch. 15, line 4: $10,000,000 — seller $4,136,986, buyer $5,863,014", () => {
    expect(partYear(10000000, 151, 365)).toBe(4136986);
    expect(partYear(10000000, 214, 365)).toBe(5863014);
  });

  it("line 5: 8.13% is 0.0813; line 9: one-third is 0.0271 (line-5::b01, line-9::b01)", () => {
    expect(creditPercentage(0.0813)).toBe(813);
    expect(oneThirdOf(813)).toBe(271);
  });

  it("ATG ch. 15: $8,753,000 × .7500 = $6,564,750; × .0900 = $590,828", () => {
    const line3 = qualifiedBasis(8753000, 7500);
    expect(line3).toBe(6564750);
    expect(timesDecimal(line3, 900)).toBe(590828);
  });

  it("Line 11 Worksheet line 4: .5000 then .7500 for Oct–Dec = 0.0625 (line-14::b03)", () => {
    const worksheet = line11Worksheet({
      line1: 1000000,
      line3: 750000,
      line5: 900,
      line7: 250000,
      originalQualifiedBasis: 500000,
      priorYearLine1: 1000000,
      priorYearLine2: 5000,
      baselinePortion: 5000,
      monthEnds: [...Array(9).fill(5000), 7500, 7500, 7500],
    });
    expect(worksheet?.line4).toBe(625);
    expect(worksheet?.line3).toBe(250000);
    expect(worksheet?.line5).toBe(62500);
    expect(worksheet?.line7).toBe(11250);
  });

  it("line 14 step 1: $11,000 × 1.3000 = $14,300, divided by line 1 (line-14::b05)", () => {
    // $14,300 / $1,430,000 = .0100; step 2: × line 13.
    expect(disallowedForGrants(100000, 1430000, 11000, 1.3)).toBe(1000);
    // Without the increase: $11,000 / $1,430,000 = .0077 (4 places).
    expect(disallowedForGrants(100000, 1430000, 11000)).toBe(770);
  });

  it("ATG ch. 15, examples 2 to 4: line 15 is the smaller of the credit and line 1b", () => {
    expect(creditAllowed(timesDecimal(10000000, 900), 0, 810000)).toBe(810000);
    expect(creditAllowed(timesDecimal(8500000, 900), 0, 810000)).toBe(765000);
    expect(creditAllowed(timesDecimal(9500000, 900), 0, 810000)).toBe(810000);
  });

  it("line 16: A 60%, B 40% (line-16::b01)", () => {
    expect(shareOfCredit({ share: 0.6 })).toBe(0.6);
    expect(shareOfCredit({ share: 0.4 })).toBe(0.4);
  });

  it("line 16: 100% for 273 days, 40% for 92 days (line-16::b02–b04)", () => {
    const sold = { share: 1, interestChange: { on: "2025-09-30", shareAfter: 0.4 } };
    expect(
      shareOfCredit({
        ...sold,
        interestChange: { ...sold.interestChange, recaptureAvoided: false },
      }),
    ).toBe(0.4);
    const kept = shareOfCredit({
      ...sold,
      interestChange: { ...sold.interestChange, recaptureAvoided: true },
    });
    // 273/365 (74.79%) + 92/365 × 40% (10.08%).
    expect(kept).toBeCloseTo(273 / 365 + (92 / 365) * 0.4, 12);
  });

  it("ATG ch. 17, year 2 additions: lines 7 to 13", () => {
    const line6 = timesDecimal(460056, 900);
    const line10 = timesDecimal(27603, oneThirdOf(900));
    const worksheet = line11Worksheet({
      line1: 460056,
      line3: 460056,
      line5: 900,
      line7: 27603,
      originalQualifiedBasis: 432253,
      priorYearLine1: 460056,
      priorYearLine2: 4100,
      baselinePortion: 9400,
      // Increases of .0600 for 8 months and .0300 for one: .5100 / 12 = .0425.
      monthEnds: [9400, 9400, 9400, 9700, ...Array(8).fill(10000)],
    });
    expect(oneThirdOf(900)).toBe(300);
    expect(line10).toBe(828);
    expect(worksheet).toMatchObject({ line2: 188623, line3: 27603, line4: 425, line5: 19552 });
    expect(worksheet?.line6).toBe(8051);
    expect(worksheet?.line7).toBe(483);
    expect(line10 + worksheet!.line7).toBe(1311);
    // The guide prints $42,716; $41,405 − $1,311 is $40,094.
    expect(line6 - 1311).toBe(40094);
  });

  it("ATG ch. 17, year 11: ($460,056)(94%)(9%) − $16,976 = $21,945", () => {
    expect(
      deferredFirstYearCredit(460056, 900, { modifiedPortion: 4100, yearEndPortion: 9400 }),
    ).toBe(21945);
  });

  it("line 17's example factor .8750 holds for a building all low-income at the close of year 1 (line-17::b01)", () => {
    const line1 = 1000000;
    expect(
      deferredFirstYearCredit(line1, 900, { modifiedPortion: 1250, yearEndPortion: 10000 }),
    ).toBe(timesDecimal(timesDecimal(line1, 8750), 900));
    // Half low-income at the close (the example's building): .5000 − .1250 = .3750 (DECISION in copies.ts).
    expect(
      deferredFirstYearCredit(line1, 900, { modifiedPortion: 1250, yearEndPortion: 5000 }),
    ).toBe(33750);
  });

  it("line 17 limits both first-year bases to Form 8609 line 3a (line-3-2::b01)", () => {
    const firstYear = { modifiedPortion: 3750, yearEndPortion: 9000 };
    expect(deferredFirstYearCredit(1300000, 900, firstYear, 1080000)).toBe(53325);
    expect(deferredFirstYearCredit(1300000, 900, firstYear)).toBe(61425);
  });
});

describe("limits", () => {
  it("line 2 is the smaller fraction, and 0 with no residential units", () => {
    expect(lowIncomeFraction(count(8, 10, [700, 1000]))).toBe(0.7);
    expect(lowIncomeFraction(count(7, 10, [800, 1000]))).toBe(0.7);
    expect(lowIncomePortion(count(0, 0, [0, 0]))).toBe(0);
  });

  it("line 3 never exceeds Form 8609 line 3a when the agency limited it", () => {
    expect(qualifiedBasis(1000000, 10000, 900000)).toBe(900000);
    expect(qualifiedBasis(800000, 10000, 900000)).toBe(800000);
  });

  it("line 5 is never below the minimum percentage", () => {
    expect(creditPercentage(0.0371, "four_percent")).toBe(400);
    expect(creditPercentage(0.0412, "four_percent")).toBe(412);
    expect(creditPercentage(0.0855, "nine_percent")).toBe(900);
  });

  it("line 15 never exceeds line 1b", () => {
    for (const line13 of [0, 50000, 80999, 81000, 200000]) {
      expect(creditAllowed(line13, 0, 81000)).toBeLessThanOrEqual(81000);
    }
  });

  it("a full year of days is the whole amount; the buyer and seller split 365 days", () => {
    expect(partYear(123457, 365, 365)).toBe(123457);
    for (const date of ["2025-01-31", "2025-02-14", "2025-06-15", "2025-07-16", "2025-12-01"]) {
      const seller = daysOwned({ share: 1, disposedOn: date, recaptureAvoided: true })!;
      const buyer = daysOwned({ share: 1, acquiredOn: date })!;
      expect(seller + buyer).toBe(365);
    }
  });

  it("a tie in the month of sale goes to the seller (line-4::b01)", () => {
    // June 15: 15 days each; the seller keeps June (181 days), the buyer starts July 1.
    expect(daysOwned({ share: 1, disposedOn: "2025-06-15", recaptureAvoided: true })).toBe(181);
    expect(daysOwned({ share: 1, acquiredOn: "2025-06-15" })).toBe(184);
    // June 14: the seller held 14 days, the buyer 16: June is the buyer's.
    expect(daysOwned({ share: 1, acquiredOn: "2025-06-14" })).toBe(214);
  });

  it("dates outside 2025 mean the whole year", () => {
    expect(daysOwned({ share: 1, acquiredOn: "2019-03-01" })).toBeUndefined();
    expect(daysOwned({ share: 1 })).toBeUndefined();
  });

  it("an increase in interest weighs each share by its days", () => {
    const share = shareOfCredit({
      share: 0.5,
      interestChange: { on: "2025-06-30", shareAfter: 1 },
    });
    expect(share).toBeCloseTo((181 * 0.5 + 184) / 365, 12);
  });

  it("a decrease that does not say whether recapture was avoided waits", () => {
    expect(
      shareOfCredit({ share: 1, interestChange: { on: "2025-06-30", shareAfter: 0.5 } }),
    ).toBeUndefined();
  });

  it("the Line 11 Worksheet: no increase over the previous year enters 0", () => {
    const inputs = {
      line1: 1000000,
      line3: 800000,
      line5: 900,
      line7: 100000,
      originalQualifiedBasis: 700000,
      priorYearLine1: 1000000,
      priorYearLine2: 8000,
      baselinePortion: 8000,
      monthEnds: Array(12).fill(8000),
    };
    expect(line11Worksheet(inputs)).toBeUndefined();
    // A previous year below Form 8609 line 8a takes line 7 (worksheet line 3).
    expect(line11Worksheet({ ...inputs, priorYearLine2: 6000 })?.line3).toBe(100000);
  });

  it("worksheet line 7 is never below 0", () => {
    const worksheet = line11Worksheet({
      line1: 1000000,
      line3: 900000,
      line5: 900,
      line7: 50000,
      originalQualifiedBasis: 850000,
      priorYearLine1: 1000000,
      priorYearLine2: 8500,
      baselinePortion: 2000,
      monthEnds: Array(12).fill(9000),
    });
    expect(worksheet?.line6).toBeLessThan(0);
    expect(worksheet?.line7).toBe(0);
  });

  it("no grant enters 0 on line 14", () => {
    expect(disallowedForGrants(50000, 1000000, 0)).toBe(0);
  });

  it("decimals print around the point", () => {
    expect(decimalDigits(1250)).toEqual({ whole: "", decimal: "1250" });
    expect(decimalDigits(10000)).toEqual({ whole: "1", decimal: "0000" });
    expect(decimalDigits(400)).toEqual({ whole: "", decimal: "0400" });
  });
});
