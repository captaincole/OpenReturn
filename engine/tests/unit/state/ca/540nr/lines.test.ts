/*
 * Form 540NR and Schedule CA (540NR) Part IV arithmetic: the published example
 * with numbers, and the limits of each ratio.
 */

import { describe, expect, it } from "vitest";
import {
  behavioralHealthServicesTax,
  caShare,
  caTaxRate,
  californiaTaxableIncome,
  columnD,
  prorated,
  ratioDigits,
  regularTaxBeforeCredits,
} from "../../../../../src/state/ca/540nr/lines.js";

/*
 * FTB Pub. 1100 (2025), Example 1 (ftb-pub-1100-2025::sec::example-1::b01,
 * ::page-4-ftb-pub-1100-2025::b01): a single part-year resident, 2024 amounts.
 * The tax on total taxable income ($2,260, from the 2024 tax table) is the
 * example's input; the logic does not depend on the year.
 */
describe("FTB Pub. 1100 Example 1", () => {
  const californiaAgi = 68000;
  const totalAgi = 84000;
  const deductions = 24000;

  it("prorates the deductions by CA AGI over total AGI: .8095, $19,428", () => {
    const share = caShare(californiaAgi, totalAgi);
    expect(share).toBe(0.8095);
    expect(prorated(deductions, share)).toBe(19428);
  });

  it("gives California taxable income of $48,572 and total taxable income of $60,000", () => {
    expect(californiaTaxableIncome(californiaAgi, 19428)).toBe(48572);
    expect(californiaTaxableIncome(totalAgi, deductions)).toBe(60000);
  });

  it("taxes California income at the rate on total taxable income: .0377, $1,831", () => {
    const rate = caTaxRate(2260, 60000);
    expect(rate).toBe(0.0377);
    expect(prorated(48572, rate)).toBe(1831);
  });

  it("prorates the $149 exemption credit by CA taxable income over total: .8095, $121", () => {
    const share = caShare(48572, 60000);
    expect(share).toBe(0.8095);
    expect(prorated(149, share)).toBe(121);
  });

  it("leaves a tax liability of $1,710", () => {
    expect(regularTaxBeforeCredits(1831, 121)).toBe(1710);
  });
});

describe("the ratios' limits", () => {
  it("line 38 and Part IV line 3 are never more than 1.0000", () => {
    expect(caShare(90000, 60000)).toBe(1);
  });

  it("Part IV line 3 is 0 when the California amount is less than zero (the form)", () => {
    expect(caShare(-5000, 60000)).toBe(0);
  });

  it("with no total to divide by, a California amount above 0 is all California's", () => {
    expect(caShare(4000, 0)).toBe(1);
    expect(caShare(0, 0)).toBe(0);
  });

  it("line 36 is 0 with no total taxable income", () => {
    expect(caTaxRate(0, 0)).toBe(0);
  });

  it("rounds to four places, the half up", () => {
    expect(caShare(1, 3)).toBe(0.3333);
    expect(caShare(2, 3)).toBe(0.6667);
    expect(caTaxRate(642.05, 10000)).toBe(0.0642);
  });

  it("prints a ratio as the digit before the point and four after it", () => {
    expect(ratioDigits(0.0642)).toEqual({ whole: "0", decimals: "0642" });
    expect(ratioDigits(1)).toEqual({ whole: "1", decimals: "0000" });
    expect(ratioDigits(0.5)).toEqual({ whole: "0", decimals: "5000" });
  });
});

describe("line 40 and Part IV line 5 are not less than zero", () => {
  it("line 40: exemption credits above the tax leave 0", () => {
    expect(regularTaxBeforeCredits(80, 153)).toBe(0);
  });
  it("Part IV line 5: deductions above California AGI leave 0", () => {
    expect(californiaTaxableIncome(3000, 3319)).toBe(0);
  });
});

describe("line 72, the behavioral health services tax", () => {
  it("is blank at or under $1,000,000 of California taxable income", () => {
    expect(behavioralHealthServicesTax(1000000)).toBeUndefined();
  });
  it("is 1% of the amount over $1,000,000", () => {
    expect(behavioralHealthServicesTax(1250000)).toBe(2500);
    expect(behavioralHealthServicesTax(1000049)).toBe(0);
  });
});

describe("Schedule CA (540NR) column D", () => {
  it("is column A less column B plus column C", () => {
    expect(columnD(10000, 2500, 400)).toBe(7900);
  });
});
