/*
 * Form 8828 arithmetic. No IRS publication has a worked example with numbers;
 * the two issuer notices compared in the melaine README give the income
 * percentage examples. The rest are the stated rules of the form, its
 * instructions and the Holding Period Percentage Worksheet, and limit tests.
 */

import { describe, expect, it } from "vitest";
import {
  AFTER_REPAYMENT_PERCENTAGES,
  REPAYMENT_YEAR_PERCENTAGES,
  adjustedQualifyingIncome,
  gainLines,
  holdingPeriod,
  incomePercentage,
  modifiedAgi,
  recaptureLines,
  repaymentWorksheet,
  subsidizedAmountForInterest,
  tableRowFor,
  usesRepaymentWorksheet,
  withinRecapturePeriod,
  yearsHeld,
} from "../../../../src/federal/8828/lines.js";

describe("Form 8828 line 18, the issuers' examples", () => {
  it("CHFA Form 052-1195-S, paragraph D(ii): $1,000 / $5,000 is 20%", () => {
    expect(incomePercentage(1000)).toBe(20);
  });

  it("NJ HMFA notice: an excess of $500 is 10 percent", () => {
    expect(incomePercentage(500)).toBe(10);
  });
});

describe("Form 8828 line 18, the stated rule", () => {
  it("is 100 at $5,000 or more", () => {
    expect([incomePercentage(5000), incomePercentage(80000)]).toEqual([100, 100]);
  });

  it("rounds to the nearest whole percentage", () => {
    expect([incomePercentage(2932), incomePercentage(25), incomePercentage(24)]).toEqual([
      59, 1, 0,
    ]);
    expect(incomePercentage(4999)).toBe(100);
  });
});

describe("Form 8828 line 7 and the notice's row", () => {
  it("counts years and full months from line 5 to line 6", () => {
    expect(holdingPeriod("2020-06-12", "2025-08-29")).toEqual({ years: 5, fullMonths: 2 });
    expect(holdingPeriod("2020-06-12", "2025-08-11")).toEqual({ years: 5, fullMonths: 1 });
    expect(holdingPeriod("2020-06-12", "2025-06-12")).toEqual({ years: 5, fullMonths: 0 });
  });

  it("counts a part year as a full year for the table's line", () => {
    expect(yearsHeld("2020-06-12", "2025-06-12")).toBe(5);
    expect(yearsHeld("2020-06-12", "2025-06-13")).toBe(6);
    expect(yearsHeld("2025-01-10", "2025-08-01")).toBe(1);
  });

  it("finds the row and the family-size column", () => {
    const table = [
      {
        yearsHeld: 6,
        holdingPeriodPercentage: 80,
        adjustedQualifyingIncomeTwoOrFewer: 65218,
        adjustedQualifyingIncomeThreeOrMore: 75001,
      },
    ];
    const row = tableRowFor(table, 6)!;
    expect([adjustedQualifyingIncome(row, 2), adjustedQualifyingIncome(row, 3)]).toEqual([
      65218, 75001,
    ]);
    expect(tableRowFor(table, 7)).toBeUndefined();
  });
});

describe("Form 8828 who files: the dates", () => {
  it("needs a loan closed after December 31, 1990", () => {
    expect(withinRecapturePeriod("1990-12-31", "1995-01-01")).toBe(false);
    expect(withinRecapturePeriod("1991-01-01", "1995-01-01")).toBe(true);
  });

  it("ends 9 years after the closing", () => {
    expect(withinRecapturePeriod("2016-06-12", "2025-06-12")).toBe(true);
    expect(withinRecapturePeriod("2016-06-12", "2025-06-13")).toBe(false);
  });
});

describe("Form 8828 Holding Period Percentage Worksheet", () => {
  it("prints the tables of lines D and G", () => {
    expect(REPAYMENT_YEAR_PERCENTAGES).toEqual([20, 40, 60, 80]);
    expect(AFTER_REPAYMENT_PERCENTAGES).toEqual([100, 80, 60, 40, 20]);
  });

  it("applies only to a repayment before the sale and within 4 years", () => {
    expect(usesRepaymentWorksheet("2020-06-12", undefined, "2025-08-29")).toBe(false);
    expect(usesRepaymentWorksheet("2020-06-12", "2025-08-29", "2025-08-29")).toBe(false);
    expect(usesRepaymentWorksheet("2020-06-12", "2024-06-12", "2025-08-29")).toBe(true);
    expect(usesRepaymentWorksheet("2020-06-12", "2024-06-13", "2025-08-29")).toBe(false);
  });

  it("multiplies line D by line G: repaid in year 2, sold 4 years later", () => {
    expect(repaymentWorksheet("2020-06-12", "2022-03-01", "2025-08-29")).toEqual({
      lineC: 2,
      lineD: 40,
      lineF: 4,
      lineG: 40,
      lineH: 16,
    });
  });

  it("gives 0 six years or more after the repayment", () => {
    expect(repaymentWorksheet("2016-02-01", "2016-09-01", "2023-01-15").lineH).toBe(0);
  });

  it("is 80% × 100% when repaid on the 4th anniversary and sold within a year", () => {
    expect(repaymentWorksheet("2021-03-01", "2025-03-01", "2025-09-30").lineH).toBe(80);
  });
});

describe("Form 8828 lines 9 to 14", () => {
  it("subtracts line by line and halves the gain", () => {
    expect(gainLines(330000, 19800, 262500)).toEqual({
      line9: 330000,
      line10: 19800,
      line11: 310200,
      line12: 262500,
      line13: 47700,
      line14: 23850,
    });
  });

  it("stops after a loss: line 14 is blank", () => {
    expect(gainLines(200000, 12000, 210000).line14).toBeUndefined();
    expect(gainLines(200000, 12000, 210000).line13).toBe(-22000);
  });

  it("keeps a zero gain and rounds half a dollar up", () => {
    expect(gainLines(100000, 0, 100000).line14).toBe(0);
    expect(gainLines(100001, 0, 52300).line14).toBe(23851);
  });
});

describe("Form 8828 lines 15 to 23", () => {
  const inputs = { line14: 23850, line15: 68150, line16: 65218, line19: 14750, line20: 80 };

  it("line 15 adds tax-exempt interest and subtracts the gain in income", () => {
    expect(modifiedAgi(67740, 410, 0)).toBe(68150);
    expect(modifiedAgi(90000, 0, 12000.4)).toBe(78000);
  });

  it("figures the recapture tax", () => {
    expect(recaptureLines(inputs)).toEqual({
      line17: 2932,
      line18: 59,
      line19: 14750,
      line20: 80,
      line21: 11800,
      line22: 6962,
      line23: 6962,
    });
  });

  it("stops when line 17 is zero or less", () => {
    expect(recaptureLines({ ...inputs, line16: 68150 })).toEqual({ line17: 0 });
    expect(recaptureLines({ ...inputs, line16: 70000 })).toEqual({ line17: -1850 });
  });

  it("takes line 14 when it is the smaller", () => {
    expect(recaptureLines({ ...inputs, line14: 1500, line15: 90000 }).line23).toBe(1500);
  });

  it("never owes more than half the gain or line 19", () => {
    for (const line14 of [0, 100, 5000, 50000]) {
      const lines = recaptureLines({ ...inputs, line14, line15: 200000, line20: 100 });
      expect(lines.line23).toBeLessThanOrEqual(line14);
      expect(lines.line23).toBeLessThanOrEqual(inputs.line19);
    }
  });

  it("owes nothing at a 0% holding period", () => {
    expect(recaptureLines({ ...inputs, line20: 0 }).line23).toBe(0);
  });
});

describe("Form 8828 line 19 for a part interest", () => {
  it("special-rules::b02, Dwaine's 75% interest takes 75% of the subsidy", () => {
    expect(subsidizedAmountForInterest(14750, 0.75)).toBe(11063);
    expect(subsidizedAmountForInterest(14750)).toBe(14750);
  });
});
