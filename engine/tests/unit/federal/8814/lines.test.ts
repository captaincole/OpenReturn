/*
 * Form 8814's arithmetic (federal/8814/lines.ts), from the published examples
 * and the limits the blank form prints (sources/2025/forms/federal/8814/blank.pdf).
 */

import { describe, expect, it } from "vitest";
import {
  eicWorksheet1Line4,
  form8814Lines,
  FORM_8814_AMOUNTS_2025,
  line12LessAlaskaDividends,
  type Form8814Amounts,
} from "../../../../src/federal/8814/lines.js";

describe("Form 8814 — the 2025 examples", () => {
  /*
   * Fred, age 6 (irs-8814-inst-2025::sec::line-3::b04–b06): $2,190 of ordinary
   * dividends, all qualified, and a $610 capital gain distribution. The example
   * prints lines 7 and 8 as 0.78 and 0.22; the form's three places give 0.782
   * and 0.218, and the same dollars.
   */
  it("Fred: lines 2a–10 as the instructions figure them", () => {
    const lines = form8814Lines({ line2a: 2190, line2b: 2190, line3: 610 });
    expect(lines.line1a).toBeUndefined();
    expect(lines.line1b).toBeUndefined();
    expect(lines.line4).toBe(2800);
    expect(lines.partI).toEqual({
      line6: 100,
      line7: 0.782,
      line8: 0.218,
      line9: 78,
      line10: 22,
      line11: 100,
      line12: 0,
    });
    expect(lines.line14).toBe(1450);
    expect(lines.line14LessThanAmountNotTaxed).toBe(false);
    expect(lines.line15).toBe(135);
  });

  // irs-pub-550-2025::sec::net-investment-income::b03: an 8-year-old with $2,800 of interest only.
  it("Pub. 550, interest only: lines 6 and 12 are $100, and so is the investment income", () => {
    const lines = form8814Lines({ line1a: 2800 });
    expect(lines.line4).toBe(2800);
    expect(lines.partI).toEqual({ line6: 100, line11: 0, line12: 100 });
    expect(line12LessAlaskaDividends(lines, undefined)).toBe(100);
  });

  /*
   * irs-pub-550-2025::sec::net-investment-income::b04: $4,000 of interest and a
   * $2,000 Alaska Permanent Fund dividend. Lines 6 and 12 are $3,300; Form 4952
   * line 4a takes $3,300 − ($3,300 × $2,000 ÷ $6,000) = $2,200.
   */
  it("Pub. 550, Alaska Permanent Fund dividends: line 12 $3,300, Form 4952 line 4a $2,200", () => {
    const lines = form8814Lines({ line1a: 4000, line2a: 2000 });
    expect(lines.line4).toBe(6000);
    expect(lines.partI?.line6).toBe(3300);
    expect(lines.partI?.line12).toBe(3300);
    expect(line12LessAlaskaDividends(lines, 2000)).toBe(2200);
  });

  /*
   * Pub. 596 Worksheet 2 (irs-pub-596-2025::sec::passive-activities::b03, ::b04)
   * for the same child: line 7 = 2,000 ÷ (2,000 − 0 + 4,000) = 0.333; line 9 =
   * 0.333 × 3,300 = 1,099 (1,098.90); line 10 = 3,300 − 1,099 = 2,201.
   */
  it("Pub. 596 Worksheet 2: line 10 for the Alaska child", () => {
    const lines = form8814Lines({ line1a: 4000, line2a: 2000 });
    expect(eicWorksheet1Line4(lines, 2000)).toBe(2201);
    expect(eicWorksheet1Line4(lines, undefined)).toBe(3300);
  });
});

describe("Form 8814 — Pub. 929 (2012), Linda Parks for Philip", () => {
  /*
   * The filled Form 8814 in the 2012 Publication 929's illustrated example
   * (https://www.irs.gov/pub/irs-prior/p929--2012.pdf), with that year's
   * amounts: base $1,900, $950 not taxed, $95 maximum tax, $9,500 limit.
   */
  const AMOUNTS_2012: Form8814Amounts = {
    baseAmount: 1900,
    amountNotTaxed: 950,
    maximumTax: 95,
    rate: 0.1,
    grossIncomeLimit: 9500,
  };

  it("matches every line of the filled form", () => {
    const lines = form8814Lines({ line1a: 1650, line2a: 1150, line2b: 1150 }, AMOUNTS_2012);
    expect(lines.line4).toBe(2800);
    expect(lines.partI).toEqual({ line6: 900, line7: 0.411, line9: 370, line11: 370, line12: 530 });
    expect(lines.line14).toBe(1850);
    expect(lines.line14LessThanAmountNotTaxed).toBe(false);
    expect(lines.line15).toBe(95);
  });
});

describe("Form 8814 — the blank form's limits (2025 amounts)", () => {
  it("line 4 of exactly $2,700 skips lines 5–12 and owes the $135", () => {
    const lines = form8814Lines({ line1a: 2700 });
    expect(lines.partI).toBeUndefined();
    expect(lines.line14).toBe(1350);
    // "Is the amount on line 14 less than $1,350?" No: $1,350 is not less.
    expect(lines.line14LessThanAmountNotTaxed).toBe(false);
    expect(lines.line15).toBe(135);
  });

  it("line 4 of $2,000: 10% of line 14", () => {
    const lines = form8814Lines({ line2a: 2000, line2b: 2000 });
    expect(lines.partI).toBeUndefined();
    expect(lines.line14).toBe(650);
    expect(lines.line14LessThanAmountNotTaxed).toBe(true);
    expect(lines.line15).toBe(65);
  });

  it("line 4 of $1,350 or less: line 14 is -0- and so is the tax", () => {
    for (const line1a of [1350, 900]) {
      const lines = form8814Lines({ line1a });
      expect(lines.line14).toBe(0);
      expect(lines.line15).toBe(0);
    }
  });

  it("line 4 of $13,499 figures Part I in full", () => {
    const lines = form8814Lines({ line1a: 13499 });
    expect(lines.partI).toEqual({ line6: 10799, line11: 0, line12: 10799 });
    expect(lines.line15).toBe(135);
  });

  it("lines 9, 10 and 12 add up to line 6 when the products do not round evenly", () => {
    // Line 7 = 1,500 ÷ 3,505 = 0.428; line 8 = 505 ÷ 3,505 = 0.144.
    const lines = form8814Lines({ line1a: 1000, line2a: 2000, line2b: 1500, line3: 505 });
    const partI = lines.partI!;
    expect(partI).toEqual({
      line6: 805,
      line7: 0.428,
      line8: 0.144,
      line9: 345, // 344.54
      line10: 116, // 115.92
      line11: 461,
      line12: 344,
    });
    expect(partI.line9! + partI.line10! + partI.line12).toBe(partI.line6);
  });

  it("keeps the 2025 amounts in one object", () => {
    expect(FORM_8814_AMOUNTS_2025).toEqual({
      baseAmount: 2700,
      amountNotTaxed: 1350,
      maximumTax: 135,
      rate: 0.1,
      grossIncomeLimit: 13500,
    });
  });
});
