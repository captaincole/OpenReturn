/*
 * FTB 3800 arithmetic. The instructions publish no example with numbers
 * (.scratch evidence search), so these are the stated rules, their edges, and
 * limits that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  BASE_AMOUNT,
  ITEMIZED_BASE,
  line1,
  line10,
  line12bDigits,
  line12bRatio,
  line18,
  line2,
  line6,
  line9Form540NR,
  lines12And13,
} from "../../../../../src/state/ca/3800-ca/lines.js";
import { californiaTaxOn, TAX_TABLE_LIMIT } from "../../../../../src/state/ca/3800-ca/tax.js";

describe("Part I (ca-3800-inst-2025::sec::part-i-child-s-net-unearned-income::b01, ::b02)", () => {
  it("line 1 is Form 540 line 17 less earned income; with none, line 17 itself", () => {
    expect(line1(31_000, 18_000)).toBe(13_000);
    expect(line1(9_400, 0)).toBe(9_400);
  });

  it("line 2 is $2,700 for a child who does not itemize", () => {
    expect(line2(false, 5_000)).toBe(BASE_AMOUNT);
  });

  it("line 2 for a child who itemizes: the greater of $2,700 and $1,350 plus the connected deductions", () => {
    expect(line2(true, 0)).toBe(2_700);
    expect(line2(true, 1_350)).toBe(2_700);
    expect(line2(true, 1_351)).toBe(2_701);
    expect(line2(true, 2_000)).toBe(ITEMIZED_BASE + 2_000);
  });
});

describe("Part II (::part-ii-tentative-tax-based-on-parent-s-tax-rate::b01 to ::b04)", () => {
  it("line 6: a loss enters 0", () => {
    expect(line6(-4_000)).toBe(0);
    expect(line6(0)).toBe(0);
    expect(line6(280_000)).toBe(280_000);
  });

  it("with line 7 blank, line 13 is line 11 and lines 12a and 12b are skipped", () => {
    expect(lines12And13(10_300, undefined, 1_349)).toEqual({ line13: 1_349 });
  });

  it("line 12b is line 5 over line 12a to four places; line 13 rounds to the dollar", () => {
    // 10,300 / 14,500 = .710344… → .7103; 1,349 × .7103 = 958.19 → 958.
    expect(lines12And13(10_300, 4_200, 1_349)).toEqual({
      line12a: 14_500,
      line12b: 0.7103,
      line13: 958,
    });
  });

  it("line 12b stays under 1 when four places would round to 1.0000", () => {
    expect(line12bRatio(40_000, 40_001)).toBe(0.9999);
    expect(line12bRatio(1, 3)).toBe(0.3333);
  });

  it("line 12b prints its four digits after the point", () => {
    expect(line12bDigits(0.7103)).toBe("7103");
    expect(line12bDigits(0.05)).toBe("0500");
    expect(line12bDigits(0.0012)).toBe("0012");
  });

  it("line 10 leaves out the FTB 3803 tax on a Form 540", () => {
    expect(line10({ tax: 18_917, ftb3803Tax: 0 })).toBe(18_917);
    expect(line10({ tax: 19_000, ftb3803Tax: 68 })).toBe(18_932);
  });

  it("line 10 for a Form 540NR parent: line 37 with no FTB 3803 tax, else worksheet A to G", () => {
    const form540NR = {
      taxOnTotalTaxableIncome: 20_000,
      totalTaxableIncome: 300_000,
      californiaTaxableIncome: 140_000,
    };
    expect(line10({ tax: 9_000, ftb3803Tax: 0, form540NR })).toBe(9_000);
    // C = 20,000 − 60 = 19,940; E = 19,940 / 300,000; G = 140,000 × E = 9,305.33 → 9,305.
    expect(line10({ tax: 9_000, ftb3803Tax: 60, form540NR })).toBe(9_305);
  });

  it("line 9 for a Form 540NR parent: worksheet A to N", () => {
    // A flat 5% stands in for the tax so each step is easy to check by hand.
    const flat = (amount: number) => amount * 0.05;
    const inputs = {
      childCaliforniaNetUnearnedIncome: 10_000,
      line5: 10_000,
      parentCaliforniaAgi: 150_000,
      parentAgi: 300_000,
      parentDeductions: 11_412,
      otherChildrenCaliforniaNetUnearnedIncome: 0,
      otherChildrenNetUnearnedIncome: 0,
    };
    // C 160,000; F 310,000; G .516129…; I 5,890; J 154,110; K 298,588; M .05; N 7,705.5 → 7,706.
    expect(line9Form540NR(inputs, flat)).toBe(7_706);
    // All California income: G = 1, J = F − H = K, so N is the tax on K: 5% of 298,588 = 14,929.40.
    const resident = { ...inputs, parentCaliforniaAgi: 300_000 };
    expect(line9Form540NR(resident, flat)).toBe(14_929);
  });

  it("line 9 for a Form 540NR parent enters 0 when K is zero or less", () => {
    const flat = (amount: number) => amount * 0.05;
    const inputs = {
      childCaliforniaNetUnearnedIncome: 1_000,
      line5: 1_000,
      parentCaliforniaAgi: 0,
      parentAgi: 0,
      parentDeductions: 5_706,
      otherChildrenCaliforniaNetUnearnedIncome: 0,
      otherChildrenNetUnearnedIncome: 0,
    };
    expect(line9Form540NR(inputs, flat)).toBe(0);
  });
});

describe("Part III (::part-iii-child-s-tax::b01, ::b03)", () => {
  it("line 18 is the larger of lines 16 and 17, so never less than the regular tax", () => {
    expect(line18(1_147, 395)).toBe(1_147);
    expect(line18(300, 395)).toBe(395);
    expect(line18(395, 395)).toBe(395);
  });
});

describe("the tax on an amount (ca-540-inst-2025::sec::line-31-tax::b01)", () => {
  it("is 0 on 0, from the table up to $100,000, from the schedules above it", () => {
    expect(californiaTaxOn(0, "single")).toBe(0);
    // Table rows 14,951–15,050 and 25,251–25,350, single.
    expect(californiaTaxOn(14_994, "single")).toBe(189);
    expect(californiaTaxOn(25_294, "single")).toBe(395);
    expect(californiaTaxOn(TAX_TABLE_LIMIT, "single")).toBeGreaterThan(0);
    // Schedule Y: 6,403.94 + 9.3% × (280,000 − 145,448) = 18,917.28 → 18,917.
    expect(californiaTaxOn(280_000, "married_filing_jointly")).toBe(18_917);
    // 6,403.94 + 9.3% × (294,500 − 145,448) = 20,265.78 → 20,266.
    expect(californiaTaxOn(294_500, "married_filing_jointly")).toBe(20_266);
  });

  it("the table and the schedule meet at $100,000 within a few dollars", () => {
    const table = californiaTaxOn(TAX_TABLE_LIMIT, "single");
    const schedule = californiaTaxOn(TAX_TABLE_LIMIT + 1, "single");
    expect(Math.abs(schedule - table)).toBeLessThan(10);
  });
});
