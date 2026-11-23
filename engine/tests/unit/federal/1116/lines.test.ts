/*
 * Form 1116 arithmetic: the published examples with numbers (the 2025
 * instructions and Pub. 514), then limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  EXCEPTION_FOREIGN_LIMIT,
  EXCEPTION_INCOME_LIMIT,
  EXCEPTION_INCOME_LIMIT_JOINT,
  adjustmentRequired,
  electionCredit,
  electionLimit,
  line16Adjustments,
  line18Worksheet,
  line19Ratio,
  partIIIValues,
  partIVLines,
  qualifiesForAdjustmentException,
} from "../../../../src/federal/1116/lines.js";
import {
  FIFTEEN_RATE_FACTOR,
  TWENTY_RATE_FACTOR,
  adjustedPreferential,
  grossIncomeRatio,
  groupByCountry,
  homeMortgageInterestShare,
  isHighTaxed,
  partIColumn,
  partIIRow,
} from "../../../../src/federal/1116/partI.js";
import type { ForeignTaxSource } from "../../../../src/federal/1116/sources.js";
import { unsupported } from "../../../../src/types.js";

const source = (value: Partial<ForeignTaxSource>): ForeignTaxSource => ({
  factKey: "account.test.dividends",
  payer: "Test Fund",
  country: "RIC",
  category: "passive",
  incomeKind: "dividends",
  grossIncome: 1000,
  foreignTaxPaid: 100,
  onPayeeStatement: true,
  ...value,
});

describe("Form 1116, published examples", () => {
  /*
   * irs-1116-inst-2025::sec::line-16::b03, b04: a general category loss of
   * $2,000, passive income of $4,000, treaty income of $1,000. 80% of the loss
   * ($1,600) goes on the passive line 16, 20% ($400) on the treaty line 16.
   */
  it("instructions, line 16 example: (1,600) passive, (400) treaty, nothing on the loss form", () => {
    expect(line16Adjustments({ general: -2000, passive: 4000, treaty: 1000 }, 50000)).toEqual({
      general: 0,
      passive: -1600,
      treaty: -400,
    });
  });

  // irs-pub-514-2025::sec::foreign-losses::b01: a $5,000 general loss offsets $5,000 of $10,000 passive income.
  it("Pub. 514, foreign losses: a $5,000 general loss offsets $5,000 of passive income", () => {
    expect(line16Adjustments({ passive: 10000, general: -5000 }, 80000).passive).toBe(-5000);
  });

  // irs-pub-514-2025::sec::foreign-losses::b01, b02: 60% ($1,200) and 40% ($800) of a $2,000 loss.
  it("Pub. 514, how to allocate: $1,200 passive and $800 treaty", () => {
    expect(line16Adjustments({ general: -2000, passive: 3000, treaty: 2000 }, 80000)).toEqual({
      general: 0,
      passive: -1200,
      treaty: -800,
    });
  });

  /*
   * irs-pub-514-2025::sec::determining-taxable-income-from-sources::b08:
   * $12,000 of home mortgage interest, gross income $60,000 of which $6,000 is
   * foreign passive: $1,200 is apportioned to it.
   */
  it("Pub. 514, home mortgage interest example: $1,200", () => {
    expect(homeMortgageInterestShare(12000, 6000, 60000)).toBe(1200);
  });

  // irs-1116-inst-2025::sec::line-3f::b01: "if your result is 0.8756782, round off to 0.8757".
  it("instructions, line 3f: 0.8756782 rounds to 0.8757", () => {
    expect(grossIncomeRatio(8756782, 10000000)).toBe(0.8757);
  });
});

describe("the election to claim the credit without Form 1116", () => {
  it("the limit is $300, $600 on a joint return", () => {
    expect(electionLimit("single")).toBe(300);
    expect(electionLimit("head_of_household")).toBe(300);
    expect(electionLimit("married_filing_separately")).toBe(300);
    expect(electionLimit("married_filing_jointly")).toBe(600);
  });

  it("the credit is the smaller of the foreign tax (rounded once) and the regular tax", () => {
    expect(electionCredit([118.4, 31.2], 8167)).toBe(150);
    expect(electionCredit([118.4, 31.2], 90)).toBe(90);
    expect(electionCredit([50], -10)).toBe(0);
  });
});

describe("the qualified dividend adjustment and its exception", () => {
  it("the factors: 15% rate ×0.4054, 20% rate ×0.5405, 0% rate left off", () => {
    expect(adjustedPreferential(1000, { zeroRate: 0, fifteenRate: 5000, twentyRate: 0 })).toBe(
      1000 * FIFTEEN_RATE_FACTOR,
    );
    expect(adjustedPreferential(1000, { zeroRate: 0, fifteenRate: 0, twentyRate: 5000 })).toBe(
      1000 * TWENTY_RATE_FACTOR,
    );
    expect(adjustedPreferential(1000, { zeroRate: 5000, fifteenRate: 0, twentyRate: 0 })).toBe(0);
  });

  it("a worldwide amount across two rates spreads the foreign part in proportion (own reading)", () => {
    const half = adjustedPreferential(1000, { zeroRate: 0, fifteenRate: 500, twentyRate: 500 });
    expect(half).toBeCloseTo(500 * FIFTEEN_RATE_FACTOR + 500 * TWENTY_RATE_FACTOR, 6);
  });

  it("required only when line 5 is above 0 and line 23 is below line 24", () => {
    expect(adjustmentRequired(1, 100, 101)).toBe(true);
    expect(adjustmentRequired(0, 100, 101)).toBe(false);
    expect(adjustmentRequired(1, 101, 101)).toBe(false);
  });

  it("the exception's edges: line 5 at the limit qualifies, a dollar over does not", () => {
    expect(qualifiesForAdjustmentException("single", EXCEPTION_INCOME_LIMIT, 0)).toBe(true);
    expect(qualifiesForAdjustmentException("single", EXCEPTION_INCOME_LIMIT + 1, 0)).toBe(false);
    expect(qualifiesForAdjustmentException("head_of_household", 197300, 0)).toBe(true);
    expect(
      qualifiesForAdjustmentException("married_filing_jointly", EXCEPTION_INCOME_LIMIT_JOINT, 0),
    ).toBe(true);
    expect(qualifiesForAdjustmentException("qualifying_surviving_spouse", 394601, 0)).toBe(false);
  });

  it("the exception's foreign test is strict: under $20,000", () => {
    expect(qualifiesForAdjustmentException("single", 1000, EXCEPTION_FOREIGN_LIMIT - 0.01)).toBe(
      true,
    );
    expect(qualifiesForAdjustmentException("single", 1000, EXCEPTION_FOREIGN_LIMIT)).toBe(false);
  });

  it("the Worksheet for Line 18 takes the 20% and 15% parts by their factors and all of the 0% part", () => {
    expect(line18Worksheet(196550, { line9: 0, line17: 28305, line20: 0 })).toEqual({
      line1: 196550,
      line6: 0,
      line7: 0,
      line8: 28305,
      line9: 16830,
      line10: 0,
      line11: 16830,
      line12: 179720,
    });
    expect(line18Worksheet(1000, { line9: 2000, line17: 0, line20: 0 }).line12).toBe(0);
    expect(line18Worksheet(600000, { line9: 0, line17: 0, line20: 10000 }).line11).toBe(4595);
  });
});

describe("Part I and Part II", () => {
  const shared = { line3a: 15750, line3b: 0, line3e: 100000, homeMortgageInterest: 0 };

  it("line 3f is never more than 1, and 0 with no gross income", () => {
    expect(grossIncomeRatio(150, 100)).toBe(1);
    expect(grossIncomeRatio(10, 0)).toBe(0);
  });

  it("line 3d is the gross before the adjustment; line 1a the adjusted amount", () => {
    const column = partIColumn(
      [source({ grossIncome: 10000, qualifiedDividends: 10000 })],
      shared,
      { zeroRate: 0, fifteenRate: 10000, twentyRate: 0 },
    );
    expect([column.line1a, column.line3d, column.line3f, column.line3g]).toEqual([
      4054, 10000, 0.1, 1575,
    ]);
    expect(column.line6).toBe(1575);
  });

  it("line 6 adds lines 2, 3g and 4a", () => {
    const column = partIColumn(
      [source({ grossIncome: 20000, definitelyRelatedExpenses: 500 })],
      { ...shared, homeMortgageInterest: 10000 },
      undefined,
    );
    expect([column.line2, column.line3g, column.line4a, column.line6]).toEqual([
      500, 3150, 2000, 5650,
    ]);
  });

  it("a row adds (q) through (t) into (u); a 1099 row says 1099 taxes and has no foreign currency", () => {
    const row = partIIRow([
      source({ foreignTaxPaid: 10.4 }),
      source({ incomeKind: "interest", foreignTaxPaid: 5.6 }),
    ]);
    expect(row).toEqual({
      date: "1099 taxes",
      foreignCurrency: {},
      dollars: { dividends: 10, interest: 6 },
      total: 16,
    });
  });

  it("countries group with case and spaces ignored, in source order", () => {
    const groups = groupByCountry([
      source({ country: "Canada" }),
      source({ country: "RIC" }),
      source({ country: " canada " }),
    ]);
    expect(groups.map((group) => group.length)).toEqual([2, 1]);
  });

  it("high-taxed: tax above 37% of the income less line 6", () => {
    const column = partIColumn([source({ grossIncome: 1000 })], shared, undefined);
    const low = partIIRow([source({ foreignTaxPaid: 300 })]);
    const high = partIIRow([source({ foreignTaxPaid: 400 })]);
    expect(isHighTaxed(column, low)).toBe(false);
    expect(isHighTaxed(column, high)).toBe(true);
  });
});

describe("Parts III and IV", () => {
  const inputs = {
    line11: 1000,
    line12: 0,
    line13: 0,
    line15: 20000,
    line16: 0,
    line18Amount: 100000,
    line20: 20000,
    line22: 0,
  };

  it("line 24 is the smaller of the foreign tax (line 14) and the limit (line 23)", () => {
    expect(partIIIValues(inputs)).toMatchObject({
      line14: 1000,
      line17: 20000,
      line18: 100000,
      line19: 0.2,
      line21: 4000,
      line24: 1000,
    });
    expect(partIIIValues({ ...inputs, line11: 9000 }).line24).toBe(4000);
  });

  it("line 17 zero or less: line 18 skipped, line 19 is 0, no credit", () => {
    const values = partIIIValues({ ...inputs, line15: -500 });
    expect([values.line18, values.line19, values.line21, values.line24]).toEqual([
      undefined,
      0,
      0,
      0,
    ]);
  });

  it("line 18 zero or less enters 0; line 19 is then 0", () => {
    const values = partIIIValues({ ...inputs, line18Amount: -100 });
    expect([values.line18, values.line19]).toEqual([0, 0]);
  });

  it("line 19 is 1 when line 17 is more than line 18, and keeps four places", () => {
    expect(line19Ratio(5, 4)).toBe(1);
    expect(line19Ratio(1, 3)).toBe(0.3333);
    expect(line19Ratio(0, 3)).toBe(0);
  });

  it("a gap or a wait carries forward, and a waiting line 11 still lets line 23 figure", () => {
    const gap = unsupported("test");
    expect(partIIIValues({ ...inputs, line13: gap }).line24).toBe(gap);
    const waits = partIIIValues({ ...inputs, line11: undefined });
    expect([waits.line14, waits.line23, waits.line24]).toEqual([undefined, 4000, undefined]);
  });

  it("Part IV: line 32 adds the categories; line 33 is no more than line 20", () => {
    expect(partIVLines(3275, 7828, 37472)).toEqual({
      line27: 3275,
      line28: 7828,
      line32: 11103,
      line33: 11103,
      line35: 11103,
    });
    expect(partIVLines(3000, 4000, 5000).line33).toBe(5000);
    expect(partIVLines(3000, undefined, 5000).line35).toBe(3000);
  });

  it("line 16: a net U.S. loss reduces each income category in proportion", () => {
    // Line 15 total 15,000 over a 12,000 line 18 amount: a 3,000 U.S. loss, 2,000 and 1,000.
    expect(line16Adjustments({ passive: 10000, general: 5000 }, 12000)).toEqual({
      passive: -2000,
      general: -1000,
    });
    expect(line16Adjustments({ passive: 10000, general: 5000 }, 20000)).toEqual({
      passive: 0,
      general: 0,
    });
  });
});
