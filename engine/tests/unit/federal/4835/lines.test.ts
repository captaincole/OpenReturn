/*
 * Form 4835 Parts I and II (lines.ts): the published examples of Pub. 225 by
 * their source, then the limits and edges that need no source.
 */

import { describe, expect, it } from "vitest";
import type { FarmRentalFactValue } from "../../../../src/facts/index.js";
import {
  cccLoanLines,
  conservationCarryforward,
  conservationDeduction,
  cooperativeLines,
  cropInsuranceLines,
  grossIncomeFromFarming,
  isGap,
  otherExpenseLines,
  partI,
  partII,
  programPaymentLines,
  type Form4835PartI,
  type Form4835PartII,
} from "../../../../src/federal/4835/lines.js";

const partIOf = (farm: FarmRentalFactValue) => partI(farm) as Form4835PartI;
const partIIOf = (farm: FarmRentalFactValue, gross: number | undefined, gap?: string) =>
  partII(farm, gross, gap) as Form4835PartII;

describe("Pub. 225 examples", () => {
  // irs-pub-225-2025::sec::assessment-for-depreciable::b08, b09.
  it("conservation limit: $10,000 of expenses against $32,000 of gross income gives $8,000", () => {
    expect(conservationDeduction(10000, undefined, 32000)).toBe(8000);
    expect(conservationCarryforward(10000, undefined, 8000)).toBe(2000);
  });

  // irs-pub-225-2025::sec::assessment-for-depreciable::b07, b08.
  it("gross income from farming: $85,000 + $15,000 of breeding animal gains is $100,000; the limit is $25,000", () => {
    const gross = grossIncomeFromFarming(85000, 15000);
    expect(gross).toBe(100000);
    expect(conservationDeduction(40000, undefined, gross)).toBe(25000);
  });

  // irs-pub-225-2025::sec::market-gain::b02, b03 (Mike Green, included MAL).
  it("market gain with the CCC loan election: $1,200 on line 3a, not taxable on line 3b", () => {
    const farm = { agriculturalProgramPayments: 1200, marketGain: 1200 };
    expect(programPaymentLines(farm, true)).toEqual({ line3a: 1200, line3b: 0 });
  });

  // irs-pub-225-2025::sec::excluded-mal-as-in-example-1-mike::b01 (excluded MAL).
  it("market gain without the election: the $1,200 is taxable", () => {
    const farm = { agriculturalProgramPayments: 1200, marketGain: 1200 };
    expect(programPaymentLines(farm, false)).toEqual({ line3a: 1200, line3b: 1200 });
  });

  // irs-pub-225-2025::sec::market-gain::b02, Table 3-3.
  it("machinery rented with the land in a crop share is line 6 income, in line 7", () => {
    const lines = partIOf({ productionIncome: 10000, otherIncome: 800 });
    expect(lines.line6).toBe(800);
    expect(lines.line7).toBe(10800);
  });
});

describe("Part I", () => {
  it("line 7 adds the right column only: 1, 2b, 3b, 4a, 4c, 5b, 5d, 6", () => {
    const lines = partIOf({
      productionIncome: 1000,
      cooperativeDistributions: 200,
      cooperativeDistributionsNotTaxable: 50,
      agriculturalProgramPayments: 300,
      excludedCostSharing: 100,
      cccLoanElection: false,
      cccLoansForfeited: 400,
      cropInsuranceReceived: 500,
      cropInsuranceDeferredTo2026: 200,
      cropInsuranceDeferredFrom2024: 60,
      otherIncome: 7,
    });
    expect(lines.line2b).toBe(150);
    expect(lines.line3b).toBe(200);
    expect(lines.line4c).toBe(400);
    expect(lines.line5b).toBe(300);
    expect(lines.line7).toBe(1000 + 150 + 200 + 400 + 300 + 60 + 7);
  });

  it("line 2b is never below 0 or above line 2a", () => {
    expect(
      cooperativeLines({ cooperativeDistributions: 100, cooperativeDistributionsNotTaxable: 150 }),
    ).toEqual({ line2a: 100, line2b: 0 });
    expect(cooperativeLines({ cooperativeDistributions: 100 })).toEqual({
      line2a: 100,
      line2b: 100,
    });
    expect(cooperativeLines({})).toEqual({});
  });

  it("line 5c is checked only with a deferral; line 5b leaves the deferred part out", () => {
    expect(cropInsuranceLines({ cropInsuranceReceived: 900 })).toMatchObject({
      line5a: 900,
      line5b: 900,
      line5c: undefined,
    });
    expect(
      cropInsuranceLines({ cropInsuranceReceived: 900, cropInsuranceDeferredTo2026: 900 }),
    ).toMatchObject({ line5b: 0, line5c: true });
    expect(cropInsuranceLines({ cropInsuranceDeferredFrom2024: 75 })).toMatchObject({
      line5a: undefined,
      line5d: 75,
    });
  });

  it("line 4c: without the election the forfeited amount; with it, only a gain over the basis", () => {
    expect(cccLoanLines({ cccLoansForfeited: 6000 }, false)).toMatchObject({
      line4b: 6000,
      line4c: 6000,
    });
    expect(cccLoanLines({ cccLoansForfeited: 6000 }, true)).toMatchObject({
      line4b: 6000,
      line4c: undefined,
    });
    expect(
      cccLoanLines({ cccLoansForfeited: 6000, forfeitedCommodityBasis: 5400 }, true),
    ).toMatchObject({ line4c: 600 });
    expect(
      cccLoanLines({ cccLoansForfeited: 6000, forfeitedCommodityBasis: 6500 }, true).gap,
    ).toBeDefined();
    expect(cccLoanLines({ cccLoansForfeited: 6000 }, undefined)).toMatchObject({ waits: true });
  });

  it("line 4a prints only under the election, which a loan reported under it shows", () => {
    expect(partIOf({ cccLoansReportedUnderElection: 5000 }).line4a).toBe(5000);
    expect(
      partIOf({ cccLoansReportedUnderElection: 5000, cccLoanElection: false }).line4a,
    ).toBeUndefined();
  });

  it("line 7 waits while the market gain or a forfeiture needs the election", () => {
    const lines = partIOf({ agriculturalProgramPayments: 900, marketGain: 300 });
    expect(lines.waitsOnElection).toBe(true);
    expect(lines.line7).toBeUndefined();
  });

  it("a forfeiture loss under the election is a gap for the whole form", () => {
    expect(
      isGap(partI({ cccLoanElection: true, cccLoansForfeited: 100, forfeitedCommodityBasis: 200 })),
    ).toBe(true);
  });

  it("each line rounds to whole dollars and line 7 adds the rounded lines", () => {
    const lines = partIOf({ productionIncome: 100.5, otherIncome: 10.4 });
    expect(lines.line1).toBe(101);
    expect(lines.line6).toBe(10);
    expect(lines.line7).toBe(111);
  });
});

describe("Part II", () => {
  it("line 10 is never more than 25% of gross income from farming, nor more than claimed", () => {
    expect(conservationDeduction(1000, undefined, 100000)).toBe(1000);
    expect(conservationDeduction(1000, 500, 4000)).toBe(1000);
    expect(conservationDeduction(1000, 500, 100000)).toBe(1500);
    expect(conservationDeduction(1000, undefined, -5000)).toBe(0);
    expect(conservationDeduction(undefined, undefined, 5000)).toBeUndefined();
  });

  it("line 10 rounds 25% of an odd gross to the nearest dollar", () => {
    expect(conservationDeduction(20000, undefined, 71550)).toBe(17888);
  });

  it("line 10 is a gap when other farming shares the limit; line 31 follows", () => {
    const lines = partIIOf({ expenses: { conservation: 500, taxes: 100 } }, 10000, "shared");
    expect(isGap(lines.line10)).toBe(true);
    expect(isGap(lines.line31)).toBe(true);
  });

  it("line 31 waits while line 10 waits on line 7", () => {
    const lines = partIIOf({ expenses: { conservation: 500, taxes: 100 } }, undefined);
    expect(lines.line10).toBeUndefined();
    expect(lines.line31).toBeUndefined();
  });

  it("line 31 equals the sum of its lines, with the 263A costs taken off", () => {
    const lines = partIIOf(
      {
        expenses: { taxes: 1000, feed: 200 },
        otherExpenses: [{ description: "Accounting", amount: 300 }],
        capitalizedCosts263A: 150,
      },
      0,
    );
    expect(lines.otherRows[0]).toEqual({ description: "Accounting", amount: 300 });
    expect(lines.otherRows[6]).toEqual({ description: "263A", amount: -150 });
    expect(lines.line31).toBe(1000 + 200 + 300 - 150);
  });

  it("lines 30a to 30g hold seven other expenses, or six with the 263A costs", () => {
    const seven = Array.from({ length: 7 }, (_, index) => ({
      description: `Item ${index}`,
      amount: 10,
    }));
    expect(isGap(otherExpenseLines(seven, undefined))).toBe(false);
    expect(isGap(otherExpenseLines(seven, 100))).toBe(true);
    expect(isGap(otherExpenseLines(seven.slice(0, 6), 100))).toBe(false);
  });

  it("line 31 is blank with no expense", () => {
    expect(partIIOf({}, 1000).line31).toBeUndefined();
  });
});
