/*
 * FTB 5870A arithmetic. The instructions publish no example with numbers, so
 * these are limit tests and the form's own arithmetic, each with the line's
 * rule (ca-5870a-inst-2025, ca-5870a-face-2025).
 */

import { describe, expect, it } from "vitest";
import { caEarlierYearTax } from "../../../../../src/data/caEarlierYearRates.js";
import {
  computationYearIndexes,
  partIIIApplies,
  partIIIColumn,
  partIIITotal,
  partIITotal,
  partISectionA,
  partITotals,
  sectionAShare,
  sectionBShare,
  taxableIncomeAmount,
  yearColumn,
  type ThrowbackInput,
} from "../../../../../src/state/ca/5870a/lines.js";

const row = (year: number, amount: number, taxes: number, more: Partial<ThrowbackInput> = {}) => ({
  year,
  amount,
  taxes,
  taxExemptInterest: 0,
  multipleTrustRule: false,
  ...more,
});

describe("Part I Section A, lines 1 to 10", () => {
  const rows = [
    row(2018, 14000, 700, { multipleTrustRule: true }),
    row(2019, 12000, 650, { taxExemptInterest: 200 }),
    row(2020, 9000, 400, { taxExemptInterest: 300 }),
    row(2022, 2000, 90),
  ];

  it("follows the form: line 3 = 1 + 2, line 5 = 3 − 4, line 7 = 1 / 6, line 10 = 5 / 9", () => {
    expect(partISectionA(rows)).toEqual({
      line1: 37000,
      line2: 1140,
      line3: 38140,
      line4: 500,
      line5: 37640,
      line6: 4,
      line7: 9250,
      line8: 2313,
      line9: 3,
      line10: 12547,
    });
  });

  it("the multiple trust rule takes a year's taxes off line 2 only; the year still counts", () => {
    const without = partISectionA(rows.map((entry) => ({ ...entry, multipleTrustRule: false })));
    expect(without.line2 - partISectionA(rows).line2).toBe(700);
    expect(without.line6).toBe(4);
  });

  it("line 9 keeps a year equal to line 8 ('less than the amount on line 8')", () => {
    // Line 7 = 5,000; line 8 = 1,250: a $1,250 year stays, a $1,249 year does not.
    const equal = partISectionA([row(2017, 1250, 0), row(2018, 8750, 0)]);
    expect([equal.line7, equal.line8, equal.line9]).toEqual([5000, 1250, 2]);
    const below = partISectionA([row(2017, 1249, 0), row(2018, 8751, 0)]);
    expect([below.line8, below.line9]).toEqual([1250, 1]);
  });

  it("no year left: every line is 0, no division", () => {
    expect(partISectionA([]).line10).toBe(0);
  });
});

describe("line 11 and the computation years", () => {
  it("enters taxable income but not less than zero", () => {
    expect([taxableIncomeAmount(-4000), taxableIncomeAmount(52000.4)]).toEqual([0, 52000]);
  });

  it("drops the highest and the lowest year", () => {
    expect(computationYearIndexes([118000, 104000, 96000, 84000, 79000])).toEqual([1, 2, 3]);
  });
});

describe("a year's column", () => {
  const taxOn = (income: number) => caEarlierYearTax(2022, "single", income);
  const base = { year: 2022, taxableIncome: 96000, share: 12547, taxOn, taxBeforeCredits: 5681 };

  it("recomputes: line 17 = line 15 − line 16, and line 21 = line 19 + line 20", () => {
    const column = yearColumn({ ...base, minimumTaxChange: 150 });
    expect(column).toMatchObject({ recomputed: 108547, tax: 6848, additionalTax: 1167 });
    expect([column.afterCredits, column.total]).toEqual([1167, 1317]);
  });

  it("subtracts an increase in credits and adds a decrease; line 18 prints the size", () => {
    const up = yearColumn({ ...base, creditChange: 200 });
    const down = yearColumn({ ...base, creditChange: -200 });
    expect([up.creditAdjustment, up.afterCredits]).toEqual([200, 967]);
    expect([down.creditAdjustment, down.afterCredits]).toEqual([200, 1367]);
  });

  it("leaves the figured lines blank when the tax cannot be figured", () => {
    const column = yearColumn({ ...base, taxOn: () => undefined });
    expect([column.recomputed, column.tax, column.total]).toEqual([108547, undefined, undefined]);
  });
});

describe("Part I lines 22 to 26", () => {
  const sectionA = partISectionA([row(2019, 30000, 3000), row(2020, 30000, 3000)]);
  const columns = [1167, 967, 1313].map((total, index) => ({
    ...yearColumn({
      year: 2023 - index,
      taxableIncome: 0,
      share: 0,
      taxOn: () => total,
      taxBeforeCredits: 0,
    }),
  }));

  it("adds line 21, divides by 3, multiplies by line 9 and subtracts line 2", () => {
    expect(partITotals(columns, sectionA)).toEqual({
      line22: 3447,
      line23: 1149,
      line24: 2298,
      line25: 6000,
      line26: 0,
    });
  });

  it("is never below 0, and waits while a column has no line 21", () => {
    expect(partITotals(columns, sectionA)?.line26).toBe(0);
    const open = [...columns.slice(0, 2), { ...columns[2], total: undefined }];
    expect(partITotals(open, sectionA)).toBeUndefined();
  });
});

describe("Part II", () => {
  it("Section A: line 2 is line 1 divided by six", () => {
    expect(sectionAShare(300000)).toEqual({ line1: 300000, line2: 50000 });
    expect(sectionAShare(100001).line2).toBe(16667);
  });

  it("Section B: line 3 adds the distribution year, line 4 = line 1 / line 3", () => {
    expect(sectionBShare(90000, 2)).toEqual({ line1: 90000, line2a: 2, line3: 3, line4: 30000 });
    expect(sectionBShare(90000, 4).line4).toBe(18000);
  });

  it("the total adds the 'Yes' columns and waits while one has no total", () => {
    const taxOn = (total: number) => () => total;
    const columns = [6150, 5428].map((total) =>
      yearColumn({
        year: 2024,
        taxableIncome: 0,
        share: 0,
        taxOn: taxOn(total),
        taxBeforeCredits: 0,
      }),
    );
    expect(partIITotal(columns)).toBe(11578);
    expect(partIITotal([...columns, { ...columns[0], total: undefined }])).toBeUndefined();
    expect(partIITotal([])).toBe(0);
  });
});

describe("Part III", () => {
  it("taxes 1% of the recomputed income over $1,000,000, less the tax already paid", () => {
    expect(partIIIColumn(2023, 1110000, 600)).toEqual({
      year: 2023,
      line1: 1110000,
      line2: 110000,
      line3: 1100,
      line4: 600,
      line5: 500,
    });
    expect(partIIIColumn(2022, 690000, 0).line5).toBe(0);
  });

  it("applies only above $1,000,000; the total adds line 5", () => {
    const at = yearColumn({
      year: 2024,
      taxableIncome: 950000,
      share: 50000,
      taxOn: () => 0,
      taxBeforeCredits: 0,
    });
    const over = { ...at, recomputed: 1000001 };
    expect([partIIIApplies([at]), partIIIApplies([at, over])]).toEqual([false, true]);
    const rows = [partIIIColumn(2024, 1035000, 0), partIIIColumn(2023, 1110000, 600)];
    expect(partIIITotal(rows)).toBe(850);
  });
});
