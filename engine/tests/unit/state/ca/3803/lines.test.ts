/*
 * FTB 3803's arithmetic (lines.ts). Neither the 2025 instructions
 * (ca-3803-inst-2025) nor the corpus has a worked example with numbers, so
 * these tests take the stated rules of the blank form and its instructions,
 * and the federal Fred example's amounts (irs-8814-inst-2025::sec::line-3::b04)
 * run through the California form.
 */

import { describe, expect, it } from "vitest";
import {
  FORM_3803_AMOUNTS_2025,
  form3803InputsOf,
  form3803Lines,
  line6Of,
  line9Tax,
  scheduleCaLine8zColumns,
} from "../../../../../src/state/ca/3803/lines.js";

describe("form3803Lines", () => {
  it("Fred's amounts (irs-8814-inst-2025::sec::line-3::b04) on FTB 3803: line 6 is $100 and line 9 the $14 maximum", () => {
    const lines = form3803Lines(
      form3803InputsOf({
        ordinaryDividends: 2190,
        qualifiedDividends: 2190,
        capitalGainDistributions: 610,
      }),
    );
    expect(lines).toMatchObject({
      line1a: undefined,
      line2: 2190,
      line3: 610,
      line4: 2800,
      partI: { line5: 2700, line6: 100 },
      line7: 1350,
      line8: 1450,
      line9: 14,
    });
  });

  it("line 4 adds lines 1a, 2 and 3, and never line 1b", () => {
    const lines = form3803Lines({ line1a: 1000, line1b: 5000, line2: 800, line3: 200 });
    expect(lines.line4).toBe(2000);
  });

  it("line 4 of $2,700 or less skips lines 5 and 6 (the form's line 4)", () => {
    expect(form3803Lines({ line1a: 2700, line2: 0 }).partI).toBeUndefined();
    expect(form3803Lines({ line1a: 2701, line2: 0 }).partI).toEqual({ line5: 2700, line6: 1 });
    expect(line6Of(form3803Lines({ line1a: 2000, line2: 0 }))).toBe(0);
  });

  it("line 8 is never below 0 (the form's line 8)", () => {
    expect(form3803Lines({ line1a: 900, line2: 0 }).line8).toBe(0);
    expect(form3803Lines({ line1a: 1350, line2: 0 }).line8).toBe(0);
  });

  it("lines 6 and 8 add back to line 4 with lines 5 and 7", () => {
    const lines = form3803Lines({ line1a: 4321, line2: 1234, line3: 99 });
    expect(lines.partI!.line5 + lines.partI!.line6).toBe(lines.line4);
    expect(lines.line7 + lines.line8).toBe(lines.line4);
  });
});

describe("line9Tax (the form's line 9)", () => {
  it("is 1% of line 8 below $1,350, rounded to the nearest dollar", () => {
    expect(line9Tax(400)).toBe(4);
    expect(line9Tax(1249)).toBe(12);
    expect(line9Tax(1250)).toBe(13);
    expect(line9Tax(1349)).toBe(13);
    expect(line9Tax(49)).toBe(0);
  });

  it("is $14 at $1,350 or more, and never more", () => {
    expect(line9Tax(1350)).toBe(14);
    expect(line9Tax(12_000)).toBe(14);
    for (const line8 of [0, 500, 1349, 1350, 5000, 12149]) {
      expect(line9Tax(line8)).toBeLessThanOrEqual(FORM_3803_AMOUNTS_2025.maximumTax);
    }
  });
});

describe("form3803InputsOf (lines 1a–3 from the child's fact)", () => {
  it("moves U.S. obligation interest from line 1a to line 1b (::line-1b::b01)", () => {
    expect(form3803InputsOf({ taxableInterest: 2000, usObligationInterest: 250 })).toEqual({
      line1a: 1750,
      line1b: 250,
      line2: 0,
      line3: undefined,
    });
  });

  it("moves another state's bond interest from line 1b to line 1a (::line-1a::b01)", () => {
    const inputs = form3803InputsOf({
      taxableInterest: 1240,
      taxExemptInterest: 900,
      taxExemptInterestTaxedByCalifornia: 600,
      ordinaryDividends: 3150,
      capitalGainDistributions: 760,
    });
    expect(inputs).toEqual({ line1a: 1840, line1b: 300, line2: 3150, line3: 760 });
  });

  it("keeps cents while adding and rounds the total once", () => {
    expect(form3803InputsOf({ taxableInterest: 1000.4, usObligationInterest: 0.3 }).line1a).toBe(
      1000,
    );
    expect(
      form3803InputsOf({ taxableInterest: 9.59, taxExemptInterestTaxedByCalifornia: 2287.09 })
        .line1a,
    ).toBe(2297);
  });

  it("prints 0 on line 2 when there are no dividends ('If none, enter -0-')", () => {
    expect(form3803InputsOf({ taxableInterest: 2000 }).line2).toBe(0);
  });

  it("leaves line 1a blank when all the interest is exempt from California tax", () => {
    expect(
      form3803InputsOf({ taxableInterest: 500, usObligationInterest: 500 }).line1a,
    ).toBeUndefined();
  });
});

describe("scheduleCaLine8zColumns (ca-3803-inst-2025::sec::line-6::b01)", () => {
  it("less than the federal line 6 total goes in column B", () => {
    expect(scheduleCaLine8zColumns(1000, 2600)).toEqual({ subtraction: 1600 });
  });

  it("more than the federal total goes in column C", () => {
    expect(scheduleCaLine8zColumns(3050, 2450)).toEqual({ addition: 600 });
  });

  it("with no federal Form 8814, all of line 6 goes in column C", () => {
    expect(scheduleCaLine8zColumns(3050, 0)).toEqual({ addition: 3050 });
  });

  it("equal totals print nothing", () => {
    expect(scheduleCaLine8zColumns(2450, 2450)).toEqual({});
  });
});
