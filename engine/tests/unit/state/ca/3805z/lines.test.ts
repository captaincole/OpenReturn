/*
 * FTB 3805Z's pure arithmetic: the booklet's examples with numbers, each named
 * by its block, and limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  creditAvailable,
  line5,
  line7,
  nolWorksheet,
  partII,
  percentageText,
  propertyValue,
  sectionALine4,
  sectionBLine14,
  truncatedPercentage,
} from "../../../../../src/state/ca/3805z/lines.js";
import { caTaxOnTaxableIncome } from "../../../../../src/state/ca/540/tax.js";

const sectionA = (amounts: {
  owned: [number, number];
  rent?: [number, number];
  payroll: [number, number];
}) =>
  sectionALine4({
    ownedPropertyCalifornia: amounts.owned[0],
    ownedPropertyZone: amounts.owned[1],
    netAnnualRentCalifornia: amounts.rent?.[0] ?? 0,
    netAnnualRentZone: amounts.rent?.[1] ?? 0,
    payrollCalifornia: amounts.payroll[0],
    payrollZone: amounts.payroll[1],
  });

describe("ca-3805z-booklet-2025::sec::apportionment::b06 to ::b07 (Corporations A and B)", () => {
  it("A: all property and payroll in the zone is 100%, and $228,000 stays $228,000", () => {
    const percentage = sectionA({ owned: [1_000_000, 1_000_000], payroll: [800_000, 800_000] });
    expect(percentage).toBe(1);
    expect(sectionBLine14([{ amount: 228_000, share: percentage as number }])).toBe(228_000);
  });

  it("B: 66.66% and 80% average 73.33%, and $250,000 becomes $183,325", () => {
    const percentage = sectionA({ owned: [1_200_000, 800_000], payroll: [1_000_000, 800_000] });
    expect(truncatedPercentage(800_000 / 1_200_000)).toBe(0.6666);
    expect(percentage).toBe(0.7333);
    expect(percentageText(percentage as number)).toBe("73.33%");
    expect(sectionBLine14([{ amount: 250_000, share: percentage as number }])).toBe(183_325);
  });
});

describe("ca-3805z-booklet-2025::sec::part-ii-pass-through-income-or-loss::b02 (three K-1s)", () => {
  it("$40,000 × 80% + $30,000 × 10% + $10,000 × 50% = $40,000", () => {
    const rows = [
      { amount: 40_000, share: 0.8 },
      { amount: 30_000, share: 0.1 },
      { amount: 10_000, share: 0.5 },
    ];
    expect(sectionBLine14(rows)).toBe(40_000);
  });
});

describe("ca-3805z-booklet-2025::sec::example-determination-of-ez-business-income-for-shareholders-partners-or-members-of-pass-through-entities::b01 to ::b02 (the Andersons)", () => {
  const rows = [
    { amount: 100_000, share: 0.5 },
    { amount: 75_000, share: 1 },
    { amount: 40_000, share: 0.8 },
    { amount: -2_000, share: 0.5 },
  ];

  it("EZ business income is $156,000; interest and dividends are left out", () => {
    expect(sectionBLine14(rows)).toBe(156_000);
  });

  it("line 6a is the tax on $156,000 as if it were all their taxable income", () => {
    const tax = caTaxOnTaxableIncome(156_000, "married_filing_jointly");
    expect(tax).toBeGreaterThan(0);
    expect(line7(tax as number, 1_000_000)).toBe(tax);
  });
});

describe("ca-3805z-booklet-2025::sec::form-540-and-form-540nr-filers::b03 (Worksheet II example)", () => {
  it("a $500 carryover against a $5,000 balance: $500 deducted, $4,500 left, $0 carried", () => {
    const worksheet = nolWorksheet(5_000, [{ yearOfLoss: 2012, amount: 500 }], false);
    expect(worksheet.rows[0]).toEqual({
      yearOfLoss: 2012,
      carryover: 500,
      deducted: 500,
      balance: 4_500,
      remaining: 0,
    });
  });
});

describe("ca-3805z-booklet-2025::sec::example-schedule-z-computation-of-credit-carryover-limitations-part-ii::b01 to ::b03", () => {
  it("line 7 $7,000, hiring $300, sales or use $9,000: $300 and $6,700 used, $2,300 carried", () => {
    expect(creditAvailable(7_000, 300, 9_000)).toBe(7_000);
    const lines = partII(7_000, 300, 9_000, 7_000);
    expect(lines.line8).toEqual({ aE: 7_000, aF: 300, bB: 300, bD: 300, bE: 300, bG: 0 });
    expect(lines.line9).toEqual({
      aE: 6_700,
      aF: 6_700,
      bB: 9_000,
      bD: 9_000,
      bE: 6_700,
      bG: 2_300,
    });
  });
});

describe("limits", () => {
  it("rent counts at eight times the net annual rent", () => {
    expect(propertyValue(100_000, 12_000)).toBe(196_000);
  });

  it("a factor with no California total is left out of the average", () => {
    expect(sectionA({ owned: [400_000, 100_000], payroll: [0, 0] })).toBe(0.25);
    expect(sectionA({ owned: [0, 0], payroll: [0, 0] })).toBeUndefined();
  });

  it("a percentage keeps four places, the rest dropped", () => {
    expect(truncatedPercentage(0.29)).toBe(0.29);
    expect(truncatedPercentage(2 / 3)).toBe(0.6666);
    expect(percentageText(1)).toBe("100.00%");
    expect(percentageText(0.0505)).toBe("5.05%");
  });

  it("the rows keep their cents and only line 14 is rounded", () => {
    expect(sectionBLine14([{ amount: 125_000, share: 0.7015 }])).toBe(87_688);
    expect(sectionBLine14([])).toBe(0);
  });

  it("Worksheet II takes the oldest carryover first and never more than the income", () => {
    const worksheet = nolWorksheet(
      10_000,
      [
        { yearOfLoss: 2013, amount: 8_000 },
        { yearOfLoss: 2009, amount: 6_000 },
      ],
      false,
    );
    expect(worksheet.rows.map((row) => [row.yearOfLoss, row.deducted, row.remaining])).toEqual([
      [2009, 6_000, 0],
      [2013, 4_000, 4_000],
    ]);
    expect(worksheet.totalCarryover).toBe(14_000);
    expect(worksheet.totalDeducted).toBe(10_000);
    expect(worksheet.totalRemaining).toBe(4_000);
    expect(worksheet.totalDeducted + worksheet.totalRemaining).toBe(worksheet.totalCarryover);
  });

  it("a loss on line 14 deducts nothing: line 6 is 0", () => {
    const worksheet = nolWorksheet(-3_000, [{ yearOfLoss: 2010, amount: 2_000 }], false);
    expect(worksheet.modifiedTaxableIncome).toBe(0);
    expect(worksheet.totalDeducted).toBe(0);
    expect(worksheet.totalRemaining).toBe(2_000);
  });

  it("with the deduction suspended, every column (b) carries to column (e)", () => {
    const worksheet = nolWorksheet(50_000, [{ yearOfLoss: 2011, amount: 20_000 }], true);
    expect(worksheet.totalDeducted).toBe(0);
    expect(worksheet.totalRemaining).toBe(20_000);
  });

  it("line 5 can be negative; line 7 is the smaller of 6a and 6b", () => {
    expect(line5(-1_000, 0)).toBe(-1_000);
    expect(line7(3_200, 5_167)).toBe(3_200);
    expect(line7(9_000, 4_000)).toBe(4_000);
  });

  it("the credit used is never more than line 7 or the two carryovers", () => {
    expect(creditAvailable(3_200, 1_400, 2_600)).toBe(3_200);
    expect(creditAvailable(10_000, 1_400, 2_600)).toBe(4_000);
    expect(creditAvailable(0, 1_400, 2_600)).toBe(0);
  });

  it("a hiring credit above line 7 leaves nothing for the sales or use tax credit", () => {
    const lines = partII(7_971, 30_000, 5_000, 7_971);
    expect(lines.line8.bG).toBe(22_029);
    expect(lines.line9).toEqual({ aE: 0, aF: 0, bB: 5_000, bD: 5_000, bE: 0, bG: 5_000 });
  });

  it("column (b) of Schedule P below line 7 carries the rest of both credits", () => {
    const lines = partII(3_000, 1_000, 4_000, 2_500);
    expect(lines.line8.aF + lines.line9.aF).toBe(2_500);
    expect(lines.line8.bG + lines.line9.bG).toBe(5_000 - 2_500);
  });
});
