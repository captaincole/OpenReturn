/*
 * Form 4970 arithmetic. The instructions publish no example with numbers
 * (evidence search, 2026-11-25), so these are limit tests from the stated
 * rules and the Rev. Proc. rate tables of 2020 to 2024.
 */

import { describe, expect, it } from "vitest";
import { earlierYearIncomeTax } from "../../../../src/federal/4970/earlierYearTax.js";
import {
  column,
  computationYearIndexes,
  partI,
  partIITotals,
  type ThrowbackInput,
} from "../../../../src/federal/4970/lines.js";

const row = (year: number, amount: number, taxes: number, more: Partial<ThrowbackInput> = {}) => ({
  year,
  amount,
  taxes,
  taxExemptInterest: 0,
  beforeAge21: false,
  multipleTrustRule: false,
  ...more,
});

describe("Part I", () => {
  it("a total equals its parts: lines 3, 5 and 7", () => {
    const lines = partI([
      row(2018, 10000, 2000, { taxExemptInterest: 500 }),
      row(2019, 8000, 1500),
    ]);
    expect(lines).toMatchObject({ line1: 18000, line2: 0, line3: 18000, line4: 3500 });
    expect(lines.line5).toBe(lines.line3 + lines.line4);
    expect(lines.line7).toBe(lines.line5 - lines.line6);
  });

  it("a year before age 21 goes on line 2 and leaves lines 4, 6 and 8 (DECISION)", () => {
    const lines = partI([
      row(2010, 6000, 1500, { beforeAge21: true, taxExemptInterest: 400 }),
      row(2018, 10000, 2000, { taxExemptInterest: 100 }),
    ]);
    expect(lines).toMatchObject({ line1: 16000, line2: 6000, line3: 10000, line4: 2000 });
    expect([lines.line6, lines.line8, lines.line9]).toEqual([100, 1, 10000]);
  });

  it("the multiple trust rule takes the year's taxes off line 4 only (line-4::b01)", () => {
    const lines = partI([
      row(2017, 9000, 2000, { multipleTrustRule: true }),
      row(2018, 9000, 2100),
    ]);
    expect([lines.line3, lines.line4, lines.line8, lines.line11]).toEqual([18000, 2100, 2, 2]);
  });

  it("line 11 drops a year under line 10, and keeps a year equal to it (line-11::b01)", () => {
    // Line 9 = 40,000 / 4 = 10,000; line 10 = 2,500.
    const under = partI([row(1, 20000, 0), row(2, 10000, 0), row(3, 7501, 0), row(4, 2499, 0)]);
    expect([under.line10, under.line11]).toEqual([2500, 3]);
    const equal = partI([row(1, 20000, 0), row(2, 10000, 0), row(3, 7500, 0), row(4, 2500, 0)]);
    expect(equal.line11).toBe(4);
  });

  it("rounds lines 9, 10 and 12 to the nearest dollar", () => {
    const lines = partI([row(1, 10001, 0), row(2, 10000, 0), row(3, 10000, 0)]);
    expect([lines.line9, lines.line10, lines.line12]).toEqual([10000, 2500, 10000]);
    const half = partI([row(1, 15751, 0), row(2, 15750, 0)]);
    expect([half.line9, half.line10]).toEqual([15751, 3938]);
  });

  it("with every year before 21, line 8 is 0 and lines 9 to 12 are blank", () => {
    const lines = partI([row(2010, 5000, 800, { beforeAge21: true })]);
    expect([lines.line3, lines.line8, lines.line9, lines.line12]).toEqual([
      0,
      0,
      undefined,
      undefined,
    ]);
  });
});

describe("Line 14 computation years", () => {
  it("drops the highest and the lowest year, keeping line 13's order", () => {
    expect(computationYearIndexes([88000, 82000, 61000, 54000, 47000])).toEqual([1, 2, 3]);
    expect(computationYearIndexes([10, 50, 30, 0, 20])).toEqual([0, 2, 4]);
  });

  it("a tie drops the first of the tied years in line 13's order (QUESTIONS.md question 3)", () => {
    expect(computationYearIndexes([5, 5, 5, 5, 5])).toEqual([2, 3, 4]);
    expect(computationYearIndexes([9, 1, 9, 1, 4])).toEqual([2, 3, 4]);
  });
});

describe("Part II columns and totals", () => {
  const taxOf = (amount: number) => (line16: number) => amount + line16 * 0;

  it("line 19 = 17 − 18, line 21 = 19 − 20, line 23 = 21 + 22", () => {
    const entry = column({
      year: 2023,
      line14: 50000,
      line15: 10000,
      taxOnLine16: taxOf(9000),
      taxBeforeCredits: 6800,
      creditIncrease: 150,
      minimumTaxChange: -50,
    });
    expect(entry).toMatchObject({ line16: 60000, line17: 9000, line18: 6800, line19: 2200 });
    expect([entry.line20, entry.line21, entry.line22, entry.line23]).toEqual([
      150, 2050, -50, 2000,
    ]);
  });

  it("lines 20 and 22 are blank with nothing stated; line 17 unknown leaves lines 19 to 23 blank", () => {
    const blank = column({
      year: 1,
      line14: 1,
      line15: 1,
      taxOnLine16: taxOf(10),
      taxBeforeCredits: 4,
    });
    expect([blank.line20, blank.line22, blank.line23]).toEqual([undefined, undefined, 6]);
    const gap = column({
      year: 1,
      line14: 1,
      line15: 1,
      taxOnLine16: () => undefined,
      taxBeforeCredits: 4,
    });
    expect([gap.line17, gap.line19, gap.line23, gap.line18]).toEqual([
      undefined,
      undefined,
      undefined,
      4,
    ]);
  });

  it("line 25 is line 24 / 3, line 26 times line 11, line 28 never below 0", () => {
    const entries = [2000, 2001, 2001].map((tax) =>
      column({ year: 1, line14: 0, line15: 0, taxOnLine16: taxOf(tax), taxBeforeCredits: 0 }),
    );
    expect(partIITotals(entries, 4, 3000, false)).toEqual({
      line24: 6002,
      line25: 2001,
      line26: 8004,
      line27: 3000,
      line28: 5004,
    });
    expect(partIITotals(entries, 1, 9000, false)?.line28).toBe(0);
  });

  it("estate or generation-skipping tax leaves line 28 blank (line-28::b01)", () => {
    const entries = [
      column({ year: 1, line14: 0, line15: 0, taxOnLine16: taxOf(30), taxBeforeCredits: 0 }),
    ];
    expect(partIITotals(entries, 1, 0, true)?.line28).toBeUndefined();
  });
});

describe("Line 17: the earlier year's rates", () => {
  it("matches the Rev. Proc. tables at bracket tops", () => {
    // Rev. Proc. 2023-34, Table 3: over $47,150, "$5,426 plus 22%".
    expect(earlierYearIncomeTax(2024, "single", 47150)).toBe(5426);
    // Rev. Proc. 2019-44, Table 1: over $622,050, "$167,307.50 plus 37%".
    expect(earlierYearIncomeTax(2020, "married_filing_jointly", 622050)).toBe(167308);
    // Rev. Proc. 2021-45, Table 2: over $89,050, "$13,708 plus 24%".
    expect(earlierYearIncomeTax(2022, "head_of_household", 89050)).toBe(13708);
    // Rev. Proc. 2022-38, Table 4: over $346,875, "$93,300.75 plus 37%".
    expect(earlierYearIncomeTax(2023, "married_filing_separately", 346875)).toBe(93301);
    // Rev. Proc. 2020-45, Table 1 for a surviving spouse: over $81,050, "$9,328 plus 22%".
    expect(earlierYearIncomeTax(2021, "qualifying_surviving_spouse", 81050)).toBe(9328);
  });

  it("stacks capital gain income on the 0% and 15% ceilings of the year", () => {
    // 2024 single, $50,000 with $10,000 preferential: ordinary $4,568; 7,025 at 0%; 2,975 at 15%.
    expect(earlierYearIncomeTax(2024, "single", 50000, 10000)).toBe(5014);
    // 2024 single, $600,000 with $100,000 preferential: 18,900 at 15%, 81,100 at 20%.
    expect(earlierYearIncomeTax(2024, "single", 600000, 100000)).toBe(164430);
  });

  it("is never more than the tax at ordinary rates, and 0 below zero", () => {
    expect(earlierYearIncomeTax(2022, "single", 30000, 30000)).toBe(0);
    expect(earlierYearIncomeTax(2022, "single", -5)).toBe(0);
    expect(earlierYearIncomeTax(2019, "single", 1000)).toBeUndefined();
  });
});
