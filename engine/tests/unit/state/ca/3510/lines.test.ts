/*
 * FTB 3510 arithmetic (src/state/ca/3510/lines.ts). The instructions have no
 * worked example with numbers (QUESTIONS.md), so these are hand examples and
 * limit tests: each threshold edge, each stop, and totals that equal their parts.
 */

import { describe, expect, it } from "vitest";
import type {
  CaPriorYearAmtExclusionsFactValue,
  CaPriorYearAmtNonresidentLines,
} from "../../../../../src/facts/index.js";
import {
  figureCreditAllowed,
  figureCreditAvailable,
  figureSectionA,
  figureSectionB,
  line1,
  line2,
  line4,
  ratio,
  ratioText,
} from "../../../../../src/state/ca/3510/lines.js";

/* A single 2024 Form 540 filer; each test changes what it needs. */
const BASE: CaPriorYearAmtExclusionsFactValue = {
  returnForm: "540",
  filingStatus: "single",
  taxableIncome: 220_000,
  itemizedDeductionsLimitation: 9_065,
  exclusionItems: {
    medicalAndDental: 9_500,
    propertyTaxes: 54_000,
    miscellaneousDeductions: 78_000,
  },
  regularTax: 17_002,
};

const NONRESIDENT: CaPriorYearAmtNonresidentLines = {
  itemized: true,
  totalAmtItemizedDeductions: 30_000,
  line28: 210_000,
  investmentInterest: 1_500,
  regularTax: 15_728,
};

describe("hand example (no published example exists)", () => {
  it("Section A, a single 2024 Form 540 filer above the phase-out start", () => {
    const lines = figureSectionA(BASE);
    expect(lines).toEqual({
      line1: 210_935,
      line2: 141_500,
      line3: undefined,
      line4: 352_435,
      line5: 90_048,
      line6: 337_678,
      line7: 14_757,
      line8: 3_689, // 14,757 × 25% = 3,689.25
      line9: 86_359,
      line10: 266_076,
      line11: 18_625, // 266,076 × 7% = 18,625.32
      line12: 17_002,
      line13: 1_623,
    });
  });

  it("Section B, a 2024 Form 540NR filer who itemized", () => {
    const sectionA = figureSectionA({
      ...BASE,
      returnForm: "540nr",
      taxableIncome: 359_309,
      itemizedDeductionsLimitation: 9_309,
      exclusionItems: { propertyTaxes: 20_000 },
      regularTax: undefined,
      nonresident: NONRESIDENT,
    });
    expect([sectionA.line4, sectionA.line11, sectionA.line12, sectionA.line13]).toEqual([
      370_000,
      20_162,
      undefined,
      undefined,
    ]);
    const lines = figureSectionB(sectionA, NONRESIDENT);
    expect(lines).toEqual({
      line14: 370_000,
      line15: 30_000,
      line16: 400_000,
      line17: 210_000,
      line18: 1_500,
      line20: 211_500,
      line21: 0.5288, // 211,500 / 400,000 = 0.52875, half up
      line22: 15_864,
      line23: 195_636,
      line24: 0.0545, // 20,162 / 370,000 = 0.05449
      line25: 10_662,
      line26: 15_728,
      line27: 0,
    });
  });
});

describe("Section A lines", () => {
  it("line 1: lines 15 and 16 less lines 17 and 18 (printed in parentheses)", () => {
    const answers = { ...BASE, nolDeductions: 4_000, amtiExclusion: 1_000 };
    expect(line1(answers)).toBe(220_000 + 4_000 - 1_000 - 9_065);
  });

  it("line 2: lines 1 to 7, 13b and 13i and other exclusions, less line 6", () => {
    const answers: CaPriorYearAmtExclusionsFactValue = {
      ...BASE,
      exclusionItems: {
        standardDeduction: 100,
        medicalAndDental: 200,
        propertyTaxes: 300,
        homeMortgageInterest: 400,
        miscellaneousDeductions: 500,
        propertyTaxRefund: 600,
        investmentInterest: -700,
        depletion: 800,
        pollutionControl: 900,
      },
      otherExclusions: 1_000,
    };
    expect(line2(answers)).toBe(100 + 200 + 300 + 400 + 500 - 600 - 700 + 800 + 900 + 1_000);
  });

  it("line 4 is never below 0; line 3 is taken away", () => {
    expect(line4(10_000, 5_000, 3_000, "single")).toBe(12_000);
    expect(line4(-50_000, 5_000, 0, "single")).toBe(0);
  });

  it("line 4, married/RDP filing separately: the $465,231 edge, the 25% addition and its $60,029 cap", () => {
    expect(line4(465_231, 0, 0, "married_filing_separately")).toBe(465_231);
    expect(line4(465_235, 0, 0, "married_filing_separately")).toBe(465_236);
    expect(line4(500_000, 0, 0, "married_filing_separately")).toBe(500_000 + 8_692);
    expect(line4(800_000, 0, 0, "married_filing_separately")).toBe(860_029);
    // Other statuses never add.
    expect(line4(800_000, 0, 0, "single")).toBe(800_000);
  });

  it("lines 5 and 6 follow the 2024 filing status", () => {
    const of = (filingStatus: CaPriorYearAmtExclusionsFactValue["filingStatus"]) => {
      const lines = figureSectionA({ ...BASE, filingStatus });
      return [lines.line5, lines.line6];
    };
    expect(of("single")).toEqual([90_048, 337_678]);
    expect(of("head_of_household")).toEqual([90_048, 337_678]);
    expect(of("married_filing_jointly")).toEqual([120_065, 450_238]);
    expect(of("qualifying_surviving_spouse")).toEqual([120_065, 450_238]);
    expect(of("married_filing_separately")).toEqual([60_029, 225_115]);
  });

  it("line 4 at 0: line 13 is 0 and lines 5 to 12 stay blank", () => {
    const lines = figureSectionA({ ...BASE, taxableIncome: -200_000 });
    expect(lines.line4).toBe(0);
    expect(lines.line13).toBe(0);
    expect([lines.line5, lines.line9, lines.line11, lines.line12]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("line 7 at the phase-out start: lines 7 and 8 are 0, line 9 is the whole exemption", () => {
    const lines = figureSectionA({
      ...BASE,
      taxableIncome: 337_678,
      itemizedDeductionsLimitation: 0,
      exclusionItems: {},
    });
    expect([lines.line4, lines.line7, lines.line8, lines.line9]).toEqual([337_678, 0, 0, 90_048]);
  });

  it("line 9 is never below 0: the whole exemption phased out", () => {
    const lines = figureSectionA({ ...BASE, taxableIncome: 900_000 });
    expect(lines.line9).toBe(0);
    expect(lines.line10).toBe(lines.line4);
  });

  it("line 9, a certain child under age 24: earned income plus $9,450 when smaller", () => {
    const child = figureSectionA({ ...BASE, childEarnedIncome: 10_000 });
    expect(child.line9).toBe(19_450);
    const large = figureSectionA({ ...BASE, childEarnedIncome: 200_000 });
    expect(large.line9).toBe(86_359);
  });

  it("line 10 at 0: line 13 is 0 and lines 11 and 12 stay blank", () => {
    const lines = figureSectionA({
      ...BASE,
      taxableIncome: 40_000,
      itemizedDeductionsLimitation: 0,
      exclusionItems: { propertyTaxes: 10_000 },
    });
    expect([lines.line10, lines.line11, lines.line12, lines.line13]).toEqual([
      0,
      undefined,
      undefined,
      0,
    ]);
  });

  it("line 13 is never below 0", () => {
    const lines = figureSectionA({ ...BASE, regularTax: 30_000 });
    expect(lines.line13).toBe(0);
  });

  it("line 3: a stated deduction is printed and taken off line 4; 0 is blank", () => {
    expect(figureSectionA({ ...BASE, amtCreditNolDeduction: 5_000 }).line4).toBe(347_435);
    expect(figureSectionA({ ...BASE, amtCreditNolDeduction: 0 }).line3).toBeUndefined();
  });
});

describe("Section B lines", () => {
  const sectionA = figureSectionA({ ...BASE, returnForm: "540nr", nonresident: NONRESIDENT });

  it("no itemized deductions: lines 21 and 22 blank, line 23 equals line 20", () => {
    const lines = figureSectionB(sectionA, { ...NONRESIDENT, itemized: false })!;
    expect([lines.line21, lines.line22]).toEqual([undefined, undefined]);
    expect(lines.line23).toBe(lines.line20);
  });

  it("line 21 is never more than 1.0000", () => {
    const lines = figureSectionB(sectionA, { ...NONRESIDENT, line28: 900_000 })!;
    expect(lines.line21).toBe(1);
    expect(lines.line22).toBe(30_000);
  });

  it("line 16 at 0 or less with itemized deductions: no rule (undefined)", () => {
    const zero = figureSectionA({ ...BASE, returnForm: "540nr", taxableIncome: -400_000 });
    expect(figureSectionB(zero, { ...NONRESIDENT, totalAmtItemizedDeductions: 0 })).toBeUndefined();
  });

  it("line 11 blank (line 4 at 0): line 24 is 0 and line 27 is 0", () => {
    const zero = figureSectionA({ ...BASE, returnForm: "540nr", taxableIncome: -400_000 });
    const lines = figureSectionB(zero, NONRESIDENT)!;
    expect([lines.line14, lines.line24, lines.line25, lines.line27]).toEqual([0, 0, 0, 0]);
  });

  it("line 27 is line 25 less line 26 when above 0", () => {
    const lines = figureSectionB(sectionA, { ...NONRESIDENT, regularTax: 1_000 })!;
    expect(lines.line27).toBe(lines.line25 - 1_000);
    expect(lines.line16).toBe(lines.line14 + lines.line15);
  });
});

describe("Part II lines", () => {
  it("line 30 may be negative; line 32 combines it with line 31", () => {
    const lines = figureCreditAvailable(1_000, 1_500, 700);
    expect([lines.line30, lines.line32]).toEqual([-500, 200]);
  });

  it("line 38 is the smaller of lines 32 and 37; lines 38 and 39 add up to line 32", () => {
    const limited = figureCreditAllowed(18_200, 15_438, 153, 8_208);
    expect(limited).toEqual({
      line33: 15_438,
      line34: 153,
      line35: 15_285,
      line36: 8_208,
      line37: 7_077,
      line38: 7_077,
      line39: 11_123,
    });
    const used = figureCreditAllowed(6_450, 23_808, 33, 14_508);
    expect([used.line37, used.line38, used.line39]).toEqual([9_267, 6_450, 0]);
    expect(limited.line38 + limited.line39).toBe(18_200);
    expect(used.line38 + used.line39).toBe(6_450);
  });

  it("line 37 is never below 0: tentative minimum tax above the tax leaves no credit", () => {
    const lines = figureCreditAllowed(5_000, 10_000, 153, 12_000);
    expect([lines.line37, lines.line38, lines.line39]).toEqual([0, 0, 5_000]);
  });
});

describe("ratios", () => {
  it("four places, half up, between 0 and 1", () => {
    expect(ratio(1, 3)).toBe(0.3333);
    expect(ratio(2, 3)).toBe(0.6667);
    expect(ratio(5, 4)).toBe(1);
    expect(ratio(-1, 4)).toBe(0);
  });

  it("print one digit, the point and four places", () => {
    expect(ratioText(0.5288)).toBe("0.5288");
    expect(ratioText(0.05)).toBe("0.0500");
    expect(ratioText(1)).toBe("1.0000");
    expect(ratioText(0)).toBe("0.0000");
  });
});
