/*
 * Form 8801's pure arithmetic. The instructions publish one example with
 * numbers: the married-filing-separately add-on of line 4
 * (irs-8801-inst-2025::sec::line-4::b01). The rest are limit tests: thresholds,
 * the form's skips, and totals that equal their parts.
 */

import { describe, expect, it } from "vitest";
import {
  lines11To15,
  lines16To21,
  lines1To10,
  lines24To26,
  taxAtAmtRates,
  withSeparateAddOn,
} from "../../../../src/federal/8801/lines.js";
import { partIIILines } from "../../../../src/federal/8801/partIII.js";

describe("line 4 add-on, married filing separately for 2024 (line-4::b01)", () => {
  it("the published example: $895,950 becomes $900,950", () => {
    expect(withSeparateAddOn(895_950, "married_filing_separately")).toBe(900_950);
  });

  it("nothing at $875,950 or less, and nothing for another filing status", () => {
    expect(withSeparateAddOn(875_950, "married_filing_separately")).toBe(875_950);
    expect(withSeparateAddOn(895_950, "single")).toBe(895_950);
  });

  it("$66,650 at $1,142,550 or more", () => {
    expect(withSeparateAddOn(1_142_550, "married_filing_separately")).toBe(1_142_550 + 66_650);
    expect(withSeparateAddOn(2_000_000, "married_filing_separately")).toBe(2_066_650);
  });
});

describe("lines 11, 33 and 54: the 2024 AMT rates", () => {
  it("26% up to $232,600, and the 28% line meets it there", () => {
    expect(taxAtAmtRates(232_600, "single")).toBe(60_476);
    expect(taxAtAmtRates(232_601, "single")).toBe(60_476);
  });

  it("married filing separately breaks at $116,300 and subtracts $2,326", () => {
    expect(taxAtAmtRates(116_300, "married_filing_separately")).toBe(30_238);
    expect(taxAtAmtRates(116_301, "married_filing_separately")).toBe(30_238);
    expect(taxAtAmtRates(200_000, "married_filing_separately")).toBe(53_674);
  });
});

describe("lines 1–10", () => {
  it("line 4 zero or less: 0, and lines 5–10 blank", () => {
    const lines = lines1To10("single", -20_000, 15_000, undefined);
    expect(lines.line4).toBe(0);
    expect([lines.line5, lines.line10]).toEqual([undefined, undefined]);
  });

  it("line 3 subtracts: 580,000 + 120,000 − 15,000 = 685,000", () => {
    expect(lines1To10("single", 580_000, 120_000, 15_000).line4).toBe(685_000);
  });

  it("at the 2024 phase-out start line 7 and line 8 are 0 and the full exemption stays", () => {
    const lines = lines1To10("single", 609_350, 0, undefined);
    expect([lines.line7, lines.line8, lines.line9]).toEqual([0, 0, 85_700]);
    expect(lines.line10).toBe(609_350 - 85_700);
  });

  it("the exemption is gone once line 7 reaches four times it", () => {
    const lines = lines1To10("single", 609_350 + 4 * 85_700, 0, undefined);
    expect([lines.line8, lines.line9]).toEqual([85_700, 0]);
    expect(lines.line10).toBe(lines.line4);
  });

  it("joint 2024 amounts: $133,300 and $1,218,700", () => {
    const lines = lines1To10("married_filing_jointly", 100_000, 20_000, undefined);
    expect([lines.line5, lines.line6, lines.line10]).toEqual([133_300, 1_218_700, 0]);
  });

  it("line 8 rounds to the nearest dollar: 25% of 75,650 is 18,912.50", () => {
    expect(lines1To10("single", 685_000, 0, undefined).line8).toBe(18_913);
  });
});

describe("lines 11–21", () => {
  it("line 15 is never below 0", () => {
    expect(lines11To15(100_000, undefined, 150_000).line15).toBe(0);
  });

  it("line 13 is line 11 less line 12; line 15 is line 13 less line 14", () => {
    expect(lines11To15(159_303, 280, 151_350)).toEqual({
      line11: 159_303,
      line12: 280,
      line13: 159_023,
      line14: 151_350,
      line15: 7_673,
    });
  });

  it("line 18 goes negative, and line 21 combines lines 18 through 20", () => {
    const lines = lines16To21(9_000, 4_000, 12_000, 500);
    expect(lines.line18).toBe(-5_000);
    expect(lines.line21).toBe(7_500);
  });
});

describe("lines 24–26", () => {
  it("the credit is the smaller of lines 21 and 24, and lines 25 + 26 equal line 21", () => {
    const limited = lines24To26(164_820, 201_143, 165_806);
    expect(limited).toEqual({ line24: 35_337, line25: 35_337, line26: 129_483 });
    const used = lines24To26(10_000, 201_143, 165_806);
    expect(used).toEqual({ line24: 35_337, line25: 10_000, line26: 0 });
  });

  it("no credit when the tentative minimum tax is at least the regular tax", () => {
    expect(lines24To26(50_000, 100_000, 120_000)).toEqual({
      line24: 0,
      line25: 0,
      line26: 50_000,
    });
  });
});

describe("Part III", () => {
  it("the logain scenario: a 2024 Schedule D Tax Worksheet with unrecaptured gain", () => {
    const lines = partIIILines(618_213, "single", {
      worksheet: "schedule_d",
      line10: 90_000,
      line13: 82_000,
      line14: 480_000,
      line21: 472_000,
      scheduleDLine19: 8_000,
    });
    expect([lines.line30, lines.line32, lines.line33]).toEqual([90_000, 528_213, 143_248]);
    expect([lines.line44, lines.line46, lines.line48, lines.line49]).toEqual([
      46_900, 7_035, 35_100, 7_020,
    ]);
    expect([lines.line50, lines.line51, lines.line52]).toEqual([610_213, 8_000, 2_000]);
    expect([lines.line53, lines.line54, lines.line55]).toEqual([159_303, 168_448, 159_303]);
  });

  it("the Qualified Dividends worksheet skips line 29 and lines 50–52; line 30 is line 28", () => {
    const lines = partIIILines(300_000, "single", {
      worksheet: "qualified_dividends_capital_gain",
      line4: 50_000,
      line5: 600_000,
    });
    expect([lines.line29, lines.line30]).toEqual([undefined, 50_000]);
    expect([lines.line50, lines.line51, lines.line52]).toEqual([undefined, undefined, undefined]);
    // Line 42 (600,000) is over $518,900: no 15% room, so all 50,000 is at 20%.
    expect([lines.line45, lines.line48, lines.line49]).toEqual([0, 50_000, 10_000]);
    expect(lines.line53).toBe(lines.line33 + 10_000);
  });

  it("lines 47 and 27 the same: lines 48–52 are skipped", () => {
    const lines = partIIILines(40_000, "married_filing_jointly", {
      worksheet: "qualified_dividends_capital_gain",
      line4: 40_000,
      line5: 0,
    });
    expect([lines.line36, lines.line38, lines.line47]).toEqual([94_050, 40_000, 40_000]);
    expect([lines.line48, lines.line49, lines.line52]).toEqual([undefined, undefined, undefined]);
    expect([lines.line53, lines.line55]).toEqual([0, 0]);
  });

  it("line 55 is never more than the tax at the AMT rates (line 54)", () => {
    for (const line10 of [10_000, 150_000, 232_600, 500_000, 2_000_000]) {
      const lines = partIIILines(line10, "head_of_household", {
        worksheet: "schedule_d",
        line10: 120_000,
        line13: 100_000,
        line14: 60_000,
        line21: 60_000,
        scheduleDLine19: 30_000,
      });
      expect(lines.line55).toBeLessThanOrEqual(lines.line54);
      expect(lines.line54).toBe(taxAtAmtRates(line10, "head_of_household"));
    }
  });

  it("2024 head of household amounts: $63,000 and $551,350", () => {
    const lines = partIIILines(100_000, "head_of_household", {
      worksheet: "qualified_dividends_capital_gain",
      line4: 10_000,
      line5: 90_000,
    });
    expect([lines.line34, lines.line40]).toEqual([63_000, 551_350]);
  });
});
