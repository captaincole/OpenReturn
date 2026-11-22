/*
 * Form 8615 arithmetic. Each published example with numbers is a test named by
 * its source: the 2025 instructions (irs-8615-inst-2025) and the Pub. 929
 * (2012) Illustrated Example, the last filled Form 8615 the IRS published. A
 * prior-year example checks only logic that does not depend on yearly amounts.
 */

import { describe, expect, it } from "vitest";
import {
  BASE_AMOUNT,
  ITEMIZED_BASE,
  NO_PREFERENTIAL_PARTS,
  addParts,
  line1,
  line12bDigits,
  line12bRatio,
  line14Parts,
  line2,
  line5Parts,
  line5Worksheet1,
  line5Worksheet2,
  line5Worksheet3,
  line6,
  lines12And13,
  type Line5WorksheetInputs,
} from "../../../../src/federal/8615/lines.js";

const noLosses = { earlyWithdrawalPenalty: 0, alternateWorksheetLosses: 0 };

describe("Form 8615 line 1 (2025 instructions)", () => {
  it("Amanda Black: unearned income is $2,800 (child-s-unearned-income-worksheet-line-1::b01, ::b02)", () => {
    // Line 9: dividends 1,300 + wages 2,100 + interest 1,400 + net gain 100; tax-exempt interest is left out.
    const total = 1_300 + 2_100 + 1_400 + (300 - 200);
    expect(
      line1({ totalIncome: total, adjustedGrossIncome: total, earnedIncome: 2_100, ...noLosses }),
    ).toBe(2_800);
  });

  it("Roger: no earned income, line 1 is AGI, $8,000 (line-2::b02)", () => {
    expect(
      line1({ totalIncome: 8_000, adjustedGrossIncome: 8_000, earnedIncome: 0, ...noLosses }),
    ).toBe(8_000);
  });

  it("Eleanor: AGI after the early withdrawal penalty, $15,900 (line-2::b02, ::b03)", () => {
    expect(
      line1({
        totalIncome: 16_000,
        adjustedGrossIncome: 15_900,
        earnedIncome: 0,
        ...noLosses,
        earlyWithdrawalPenalty: 100,
      }),
    ).toBe(15_900);
  });

  it("the worksheet takes off earned income and the penalty", () => {
    expect(
      line1({
        totalIncome: 10_000,
        adjustedGrossIncome: 9_900,
        earnedIncome: 4_000,
        earlyWithdrawalPenalty: 100,
        alternateWorksheetLosses: 0,
      }),
    ).toBe(5_900);
  });

  it("the Alternate Worksheet adds back a self-employment loss (alternate-worksheet-for-form-8615-line-1::b01)", () => {
    // A: 6,000 (line 9 after a 1,000 business loss); B: 1,000; D: 2,000 wages. E = 7,000 − 2,000.
    expect(
      line1({
        totalIncome: 6_000,
        adjustedGrossIncome: 6_000,
        earnedIncome: 2_000,
        earlyWithdrawalPenalty: 0,
        alternateWorksheetLosses: 1_000,
      }),
    ).toBe(5_000);
  });
});

describe("Form 8615 line 2 (line-2::b01, ::b02, ::b03)", () => {
  it("no itemized deductions: $2,700", () => expect(line2(false, 5_000)).toBe(BASE_AMOUNT));
  it("Roger: $2,700 is more than $1,350 + $300", () => expect(line2(true, 300)).toBe(2_700));
  it("Eleanor: $1,350 + $1,500 = $2,850", () => expect(line2(true, 1_500)).toBe(2_850));
  it("the edge: $1,350 + $1,350 is $2,700; one dollar more is $2,701", () => {
    expect(line2(true, ITEMIZED_BASE)).toBe(2_700);
    expect(line2(true, ITEMIZED_BASE + 1)).toBe(2_701);
  });
  it("is never less than $2,700", () => expect(line2(true, 0)).toBe(2_700));
});

describe("Form 8615 line 6 (line-6::b01)", () => {
  it("enters the parent's taxable income", () => expect(line6(48_000)).toBe(48_000));
  it("zero or less enters -0-", () => expect(line6(-3_200)).toBe(0));
});

describe("Form 8615 lines 12a, 12b and 13", () => {
  it("Sharon Persimmon: 12a $9,000, 12b 0.333 (lines-12a-and-12b::b01, ::b02)", () => {
    const lines = lines12And13(3_000, 6_000, 900);
    expect([lines.line12a, lines.line12b]).toEqual([9_000, 0.333]);
    expect(line12bDigits(lines.line12b!)).toBe("333");
  });

  it("Pub. 929 (2012), Randy: 12a $3,800, 12b .600, line 13 $342", () => {
    const lines = lines12And13(2_280, 1_520, 570);
    expect(lines).toEqual({ line12a: 3_800, line12b: 0.6, line13: 342 });
    expect(line12bDigits(lines.line12b!)).toBe("600");
  });

  it("Pub. 929 (2012), Joshua: line 7 blank, so 12a and 12b are blank and line 13 is line 11 ($45)", () => {
    expect(lines12And13(900, undefined, 45)).toEqual({ line13: 45 });
  });

  it("a share that three places would round to 1.000 keeps more places", () => {
    expect(line12bRatio(9_999 / 10_000)).toBe(0.9999);
    expect(line12bDigits(0.9999)).toBe("9999");
  });

  it("line 13 is never more than line 11", () => {
    for (const [line5, line7] of [
      [1, 1],
      [500, 9_500],
      [9_999, 1],
    ] as const) {
      expect(lines12And13(line5, line7, 1_000).line13).toBeLessThanOrEqual(1_000);
    }
  });
});

const worksheet = (overrides: Partial<Line5WorksheetInputs>): Line5WorksheetInputs => ({
  qualifiedDividends: 0,
  netCapitalGain: 0,
  form8615Line1: 0,
  form8615Line2: BASE_AMOUNT,
  form8615Line3: 0,
  form8615Line5: 0,
  itemizes: false,
  itemizedForDividendsAndGains: 0,
  deductions: 15_750,
  adjustedGrossIncome: 0,
  ...overrides,
});

describe("Form 8615 Line 5 Worksheets (line-8::b02 through ::b10)", () => {
  it("Pub. 929 (2012), Joshua, Worksheet #1: $337 qualified dividends and $225 net capital gain", () => {
    const inputs = worksheet({
      qualifiedDividends: 1_050,
      netCapitalGain: 700,
      form8615Line1: 2_800,
      form8615Line3: 900,
      form8615Line5: 900,
    });
    // The 2012 base amount was $1,900: .375 × 1,900 = 712.5 → 713; .250 × 1,900 = 475.
    expect(line5Worksheet1(inputs, 1_900)).toEqual({
      qualifiedDividends: 337,
      netCapitalGain: 225,
    });
  });

  it("Pub. 929 (2012), Joshua, line 14: $713 qualified dividends and $475 net capital gain", () => {
    expect(
      line14Parts(
        { qualifiedDividends: 1_050, netCapitalGain: 700 },
        { qualifiedDividends: 337, netCapitalGain: 225 },
      ),
    ).toEqual({ qualifiedDividends: 713, netCapitalGain: 475 });
  });

  it("Worksheet #2, by hand: itemized deductions above $2,700", () => {
    // line 4 .667; line 6 800; line 8 3,600; line 9 7,200; line 11 .400; line 12 .200; line 13 540; line 14 270.
    const inputs = worksheet({
      qualifiedDividends: 8_000,
      netCapitalGain: 4_000,
      form8615Line1: 20_000,
      form8615Line2: 3_350,
      form8615Line3: 16_650,
      form8615Line5: 16_650,
      itemizes: true,
      itemizedForDividendsAndGains: 1_200,
    });
    expect(line5Worksheet2(inputs)).toEqual({ qualifiedDividends: 6_660, netCapitalGain: 3_330 });
    expect(line5Parts(inputs)).toEqual(line5Worksheet2(inputs));
  });

  it("Worksheet #3, by hand: line 5 less than line 3, the standard deduction", () => {
    // line 4 .667; line 12 15,750; line 14 .500; line 15 7,875; line 16 5,253; line 17 2,622.
    const inputs = worksheet({
      qualifiedDividends: 10_000,
      netCapitalGain: 5_000,
      form8615Line1: 30_000,
      form8615Line3: 27_300,
      form8615Line5: 14_250,
      adjustedGrossIncome: 30_000,
    });
    expect(line5Worksheet3(inputs)).toEqual({ qualifiedDividends: 4_747, netCapitalGain: 2_378 });
    expect(line5Parts(inputs)).toEqual(line5Worksheet3(inputs));
  });

  it("no qualified dividends or net capital gain: nothing on line 5", () => {
    expect(
      line5Parts(worksheet({ form8615Line1: 9_000, form8615Line3: 6_300, form8615Line5: 6_300 })),
    ).toEqual(NO_PREFERENTIAL_PARTS);
  });

  it("the parts on line 5 are never more than line 5", () => {
    const inputs = worksheet({
      qualifiedDividends: 40_000,
      netCapitalGain: 30_000,
      form8615Line1: 70_000,
      form8615Line3: 3_000,
      form8615Line5: 3_000,
    });
    const parts = line5Worksheet1(inputs);
    expect(parts.qualifiedDividends + parts.netCapitalGain).toBeLessThanOrEqual(3_000);
    expect(parts.qualifiedDividends).toBeGreaterThanOrEqual(0);
    expect(parts.netCapitalGain).toBeGreaterThanOrEqual(0);
  });
});

describe("Form 8615 line 8 parts (line-8::b01, ::b02)", () => {
  it("adds the parts on lines 5, 6 and 7", () => {
    expect(
      addParts(
        { qualifiedDividends: 337, netCapitalGain: 225 },
        { qualifiedDividends: 4_100, netCapitalGain: 7_500 },
        { qualifiedDividends: 900, netCapitalGain: 0 },
      ),
    ).toEqual({ qualifiedDividends: 5_337, netCapitalGain: 7_725 });
  });
});
