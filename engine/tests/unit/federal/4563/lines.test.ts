/*
 * Form 4563's arithmetic: the published examples of Pub. 570 chapter 4 (the
 * deduction fraction), and limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import type { AmericanSamoaExclusionFactValue } from "../../../../src/facts/index.js";
import {
  allowableShare,
  daysAbsent,
  excludedGrossIncome,
  excludedSelfEmployment,
  form4563Lines,
  hasExcludedIncome,
  owesSelfEmploymentTax,
} from "../../../../src/federal/4563/lines.js";

const PART_I = {
  bonaFideResidentAllYear: true,
  usCitizenOrResident: true,
  residenceBegan: "01/01/2020",
  livingQuarters: [],
  employer: "Self-employed",
} satisfies AmericanSamoaExclusionFactValue;

describe("Pub. 570, chapter 4: the share of a deduction", () => {
  it("Terry, single: $8,000 / $28,000 x $15,750 = $4,500 (Allowable standard deduction, Example)", () => {
    expect(allowableShare(15750, 8000, 20000)).toBe(4500);
  });

  it("the Thompsons, joint, one over 65: $6,000 / $41,000 x $33,100 = $4,844 (Example 1)", () => {
    expect(allowableShare(33100, 6000, 35000)).toBe(4844);
  });

  it("the itemized example: $96,000 / $120,000 of each deduction (Itemized Deductions, Example)", () => {
    expect(allowableShare(11000, 96000, 24000)).toBe(8800);
    expect(allowableShare(10000, 96000, 24000)).toBe(8000);
    expect(allowableShare(16250, 96000, 24000)).toBe(13000);
    expect(allowableShare(5000, 96000, 24000)).toBe(4000);
  });

  it("with no excluded gross income the whole deduction stays", () => {
    expect(allowableShare(15750, 30000, 0)).toBe(15750);
  });

  it("with no gross income subject to U.S. tax nothing is allowed", () => {
    expect(allowableShare(15750, 0, 40000)).toBe(0);
  });

  it("the share is never more than the deduction, nor less than 0", () => {
    for (const [us, excluded] of [
      [1, 1],
      [50000, 1],
      [-500, 2000],
      [123456, 654321],
    ]) {
      const share = allowableShare(17750, us, excluded);
      expect(share).toBeGreaterThanOrEqual(0);
      expect(share).toBeLessThanOrEqual(17750);
    }
  });
});

describe("Pub. 570 (1995), Illustrated Example of Form 4563: John Black", () => {
  it("wages of $24,000 on line 7 and dividends of $100 + $220 on line 9: line 15 is $24,320", () => {
    const lines = form4563Lines({
      ...PART_I,
      wages: { amount: 24000, medicareWages: 24000 },
      dividends: 320,
    });
    expect([lines.line7, lines.line9, lines.line15]).toEqual([24000, 320, 24320]);
  });
});

describe("Part II lines 7 to 15", () => {
  const value: AmericanSamoaExclusionFactValue = {
    ...PART_I,
    wages: { amount: 1000.5, medicareWages: 1000.5 },
    interest: 10.49,
    dividends: 20,
    business: { amount: -300, grossIncome: 900 },
    capitalGain: { amount: 40, grossIncome: 60 },
    rentalAndRoyalties: { amount: 50, grossIncome: 500 },
    farm: { amount: 60, grossIncome: 700 },
    otherIncome: [
      { description: "Prize", amount: 35.3 },
      { description: "Jury duty pay", amount: 35.3 },
    ],
  };

  it("rounds each line, adds line 14's kinds before rounding, and line 15 is the sum of lines 7 to 14", () => {
    const lines = form4563Lines(value);
    expect(lines).toEqual({
      line7: 1001,
      line8: 10,
      line9: 20,
      line10: -300,
      line11: 40,
      line12: 50,
      line13: 60,
      line14: 71,
      line15: 1001 + 10 + 20 - 300 + 40 + 50 + 60 + 71,
    });
  });

  it("a line with no amount stays blank, and line 15 adds what is there", () => {
    const lines = form4563Lines({ ...PART_I, interest: 250 });
    expect(lines.line7).toBeUndefined();
    expect(lines.line14).toBeUndefined();
    expect(lines.line15).toBe(250);
    expect(hasExcludedIncome(lines)).toBe(true);
    expect(hasExcludedIncome(form4563Lines(PART_I))).toBe(false);
  });

  it("gross income takes the gross of lines 10 to 13, never a loss", () => {
    // 1,001 + 10 + 20 + 900 + 60 + 500 + 700 + 71: each line's whole-dollar amount.
    expect(excludedGrossIncome(value)).toBe(3262);
  });

  it("gross income adds the rounded lines, as line 15 does (blind case 4)", () => {
    const cents: AmericanSamoaExclusionFactValue = {
      ...PART_I,
      interest: 1234.49 + 87.5,
      dividends: 455.5,
      otherIncome: [
        { description: "Prize", amount: 100.25 },
        { description: "Raffle bonus", amount: 49.5 },
      ],
    };
    // 1,322 + 456 + 150, not 1,927.24 rounded to 1,927.
    expect(excludedGrossIncome(cents)).toBe(1928);
    expect(form4563Lines(cents).line15).toBe(1928);
    // 15,750 x 3,000 / 4,928 = 9,588.07.
    expect(allowableShare(15750, 3000, excludedGrossIncome(cents))).toBe(9588);
  });

  it("lines 10 and 13 are the self-employment income", () => {
    expect(excludedSelfEmployment(form4563Lines(value))).toBe(-240);
  });
});

describe("self-employment tax on excluded income: net earnings of $400 or more", () => {
  it("$433 of income is $400 of net earnings (92.35%): owed", () => {
    expect(owesSelfEmploymentTax(433)).toBe(true);
  });

  it("$432 is $399: not owed", () => {
    expect(owesSelfEmploymentTax(432)).toBe(false);
  });

  it("a loss owes none", () => {
    expect(owesSelfEmploymentTax(-5000)).toBe(false);
  });
});

describe("line 6 column (c): the full days away", () => {
  it("the day of leaving and the day of return are days in American Samoa", () => {
    expect(daysAbsent("03/10/2025", "03/24/2025")).toBe(13);
  });

  it("back the next day: no full day away", () => {
    expect(daysAbsent("06/01/2025", "06/02/2025")).toBe(0);
    expect(daysAbsent("06/01/2025", "06/01/2025")).toBe(0);
  });

  it("only the days in 2025 count: a trip from 2024, a trip into 2026", () => {
    expect(daysAbsent("12/30/2024", "01/02/2025")).toBe(1);
    expect(daysAbsent("12/20/2025", "01/03/2026")).toBe(11);
    expect(daysAbsent("12/31/2024", "01/03/2025")).toBe(2);
    expect(daysAbsent("03/01/2024", "03/10/2024")).toBe(0);
  });

  it("a date not in MM/DD/YYYY form has no count", () => {
    expect(daysAbsent("2025-03-10", "03/24/2025")).toBeUndefined();
  });
});
