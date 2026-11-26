/*
 * Form 2555's arithmetic (src/federal/2555/lines.ts and dates.ts): the published
 * examples with numbers, named by their source, then limit tests that need none.
 */

import { describe, expect, it } from "vitest";
import type { ForeignEarnedIncomeFactValue } from "../../../../src/facts/index.js";
import { qualifyingDays } from "../../../../src/federal/2555/dates.js";
import {
  baseHousingAmount,
  decimalRatio,
  housingCarryover,
  line44Amount,
  MAXIMUM_EXCLUSION_2025,
  partIVLines,
  partIXLines,
  partVIILines,
  partVILines,
  standardHousingLimit,
} from "../../../../src/federal/2555/lines.js";

const bonaFide = (began: string, ended?: string): ForeignEarnedIncomeFactValue => ({
  foreignAddress: "x",
  occupation: "x",
  citizenship: "United States",
  taxHomes: [{ location: "x", established: began }],
  bonaFideResidence: {
    began,
    ended,
    livingQuarters: [],
    nonresidentStatement: false,
    foreignIncomeTaxRequired: true,
    contractTerms: "x",
    visaType: "x",
    visaLimitedStay: false,
  },
});

describe("Form 2555 instructions, published examples", () => {
  it("line 29b example: 276 days at $106.85 is $29,491 (irs-2555-inst-2025::sec::line-29b::b02)", () => {
    expect(standardHousingLimit(276)).toBe(29_491);
  });

  it("line 31 example: a residence from August 14, 2025 gives 140 days (::line-31::b01)", () => {
    expect(qualifyingDays(bonaFide("08/14/2025", "01/31/2027"))).toBe(140);
  });

  it("line 29b: $39,000 for a full year at a location the notice does not list (::line-29b::b01)", () => {
    expect(standardHousingLimit(365)).toBe(39_000);
  });

  it("line 32: $20,800 for 365 days, not $56.99 × 365 (the form)", () => {
    expect(baseHousingAmount(365)).toBe(20_800);
    expect(baseHousingAmount(140)).toBe(7_979); // 56.99 × 140 = 7,978.60
  });
});

describe("Pub. 54 How To Report Deductions, examples 2 to 5 (line 44)", () => {
  /*
   * Example 2 prints 98.48% and $66,666 (::how-to-report-deductions::b04), but
   * 120,000 / 121,842 is 0.98488: cut, not rounded. Example 4 rounds (0.52740
   * from 0.527397), so the engine rounds every time and gives $66,673
   * (QUESTIONS.md, line 44).
   */
  it("example 2: $120,000 of $121,842 excluded; the engine rounds the share to 0.9849", () => {
    expect(line44Amount(120_000, 121_842, 67_695)).toBe(66_673);
    expect(Math.abs(line44Amount(120_000, 121_842, 67_695) - 66_666)).toBeLessThan(10);
  });

  it("example 3: 13.33% of $67,695 is $9,024", () => {
    expect(line44Amount(16_244, 121_842, 67_695)).toBe(9_024);
  });

  it("example 4: 52.74% of $172,000 is $90,713, more than the exclusion, so line 45 is below 0 (::b05)", () => {
    const line44 = line44Amount(77_000, 146_000, 172_000);
    expect(line44).toBe(90_713);
    expect(77_000 - line44).toBe(-13_713);
  });

  it("example 5: 96.77% of the partner's $51,125 share of expenses is $49,474 (::b06, b07)", () => {
    expect(line44Amount(120_000, 124_000, 51_125)).toBe(49_474);
  });
});

describe("Pub. 54 Foreign Housing Deduction example (::foreign-housing-deduction::b02)", () => {
  // A housing amount of $18,000; $100,000 of foreign earned income, half of it self-employment.
  const partVI = partVILines({
    line27: 100_000,
    expenses: 38_800,
    limit: 39_000,
    days: 365,
    employerProvided: 50_000,
  });

  it("half of the housing amount is provided by the employer: $9,000 is excluded", () => {
    expect(partVI.line33).toBe(18_000);
    expect(partVI.line35).toBe(0.5);
    expect(partVI.line36).toBe(9_000);
  });

  it("the other $9,000 is the housing deduction, here with no earned income exclusion to limit it", () => {
    const partIX = partIXLines({ line27: 100_000, line33: 18_000, line36: 9_000, line43: 9_000 });
    expect(partIX).toEqual({
      line46: 9_000,
      line47: 91_000,
      line48: 9_000,
      line49: undefined,
      line50: 9_000,
    });
  });
});

describe("Form 2555 limits", () => {
  it("line 24 adds lines 19 to 21d, 22g and 23; line 26 subtracts line 25", () => {
    const lines = partIVLines({
      wages: 100_000.4,
      meals: 1_000,
      car: 2_000,
      costOfLiving: 3_000,
      otherAllowance: 500,
      otherIncome: 250,
      excludableMealsAndLodging: 1_000,
    });
    expect(lines.line19).toBe(100_000);
    expect(lines.line22g).toBe(3_500);
    expect(lines.line24).toBe(106_750);
    expect(lines.line26).toBe(105_750);
    expect(lines.line20a).toBeUndefined();
  });

  it("line 22g is blank with no allowance", () => {
    expect(partIVLines({ wages: 1 }).line22g).toBeUndefined();
  });

  it("line 33 at zero or less stops Part VI: lines 34 to 36 stay blank", () => {
    const lines = partVILines({
      line27: 90_000,
      expenses: 20_000,
      limit: 39_000,
      days: 365,
      employerProvided: 90_000,
    });
    expect(lines.line33).toBe(0);
    expect(lines.line36).toBeUndefined();
  });

  it("all self-employment income: lines 34 and 35 are skipped and line 36 is 0 (::line-34::b01)", () => {
    const lines = partVILines({ line27: 90_000, expenses: 30_000, limit: 39_000, days: 365 });
    expect(lines.line34).toBeUndefined();
    expect(lines.line35).toBeUndefined();
    expect(lines.line36).toBe(0);
  });

  it("line 35 is never more than 1.000 and line 36 never more than line 34", () => {
    expect(decimalRatio(120, 100, 3)).toBe(1);
    const lines = partVILines({
      line27: 10_000,
      expenses: 39_000,
      limit: 39_000,
      days: 365,
      employerProvided: 9_000,
    });
    expect(lines.line35).toBe(0.9);
    expect(lines.line36).toBe(9_000);
  });

  it("line 39 is 1.000 for 365 days and three places otherwise; line 40 never exceeds $130,000", () => {
    expect(partVIILines(200_000, 0, 365).line40).toBe(MAXIMUM_EXCLUSION_2025);
    const part = partVIILines(200_000, 0, 306);
    expect(part.line39).toBe(0.838);
    expect(part.line40).toBe(108_940);
  });

  it("line 42 is the smaller of lines 40 and 41", () => {
    expect(partVIILines(50_000, 10_000, 365).line42).toBe(40_000);
    expect(partVIILines(500_000, 10_000, 365).line42).toBe(130_000);
  });

  it("Part IX needs line 33 above line 36 and line 27 above line 43", () => {
    expect(
      partIXLines({ line27: 100_000, line33: 9_000, line36: 9_000, line43: 50_000 }),
    ).toBeUndefined();
    expect(
      partIXLines({ line27: 100_000, line33: 18_000, line36: 0, line43: 100_000 }),
    ).toBeUndefined();
  });

  it("line 48 is the smaller of lines 46 and 47", () => {
    const partIX = partIXLines({ line27: 135_000, line33: 18_000, line36: 0, line43: 130_000 });
    expect(partIX?.line48).toBe(5_000);
  });

  it("the carryover worksheet: none when 2024 line 46 is not above line 48, and at most 2025 line 47 less 48", () => {
    expect(housingCarryover({ line46: 5_000, line48: 5_000 }, 40_000, 10_000)).toBe(0);
    expect(housingCarryover({ line46: 12_000, line48: 9_500 }, 41_060, 15_257)).toBe(2_500);
    expect(housingCarryover({ line46: 30_000, line48: 0 }, 12_000, 10_000)).toBe(2_000);
    expect(housingCarryover(undefined, 12_000, 10_000)).toBeUndefined();
  });

  it("line 49 is blank unless line 47 is more than line 48 and 2024 left a deduction (face-part-ix::b01)", () => {
    const noPrior = partIXLines({ line27: 90_000, line33: 10_670, line36: 0, line43: 76_180 });
    expect(noPrior?.line49).toBeUndefined();
    expect(noPrior?.line50).toBe(10_670);
    const prior = { line46: 30_000, line48: 0 };
    expect(housingCarryover(prior, 10_000, 10_000)).toBeUndefined();
  });

  it("line 44 multiplies by the share rounded to four places, not the exact fraction (decision A29)", () => {
    // $76,180 of $90,000 excluded is 0.8464 (0.846444...); 0.8464 × $15,651 is $13,247.
    expect(line44Amount(76_180, 90_000, 15_651)).toBe(13_247);
  });

  it("line 44's share is line 43, both exclusions, over line 27 (decision A30)", () => {
    // $92,080 excluded under line 42 plus $7,920 under line 36: all $100,000 of line 27.
    expect(line44Amount(100_000, 100_000, 10_600)).toBe(10_600);
  });

  it("line 44 is 0 with no related deduction, and never more than the deductions", () => {
    expect(line44Amount(100_000, 100_000, 0)).toBe(0);
    expect(line44Amount(130_000, 120_000, 10_000)).toBe(10_000);
  });
});
