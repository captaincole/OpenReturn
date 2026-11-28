/*
 * Form 8882's arithmetic (lines.ts): the published examples with numbers and
 * the limits that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  CREDIT_LIMIT,
  FACILITY_RATE,
  RESOURCE_AND_REFERRAL_RATE,
  line6Of,
  line7Of,
  line7Shares,
  ownCreditOf,
  ownLines,
} from "../../../../src/federal/8882/lines.js";
import { sum } from "../../../../src/money.js";

describe("Form 8882 lines: published examples", () => {
  /*
   * CRS In Focus IF12379 (updated 2025-09-04), a business that contracts with
   * a qualified child care facility: "$700,000 in costs ... the credit is
   * capped at $150,000 per year (25% of $600,000) ... it must reduce the
   * $700,000 in expenses by the $150,000 credit", a $550,000 deduction.
   */
  it("CRS IF12379: a $700,000 facility contract is limited to $150,000, all of it off the deduction", () => {
    const lines = ownLines([700_000], []);
    expect(lines).toEqual({ line1: 700_000, line2: 175_000, line3: undefined, line4: undefined });
    const line7 = line7Of(line6Of(lines, undefined));
    expect(line7).toBe(150_000);
    const [share] = line7Shares(lines, [{ line: "facility", amount: 700_000 }]);
    expect(700_000 - share).toBe(550_000);
  });

  /* CRS IF12379: "$12,000 of each qualified employee's child care expenses" for 10 employees, "$120,000 ... yielding a credit of $30,000". */
  it("CRS IF12379: $120,000 at a facility gives a $30,000 credit", () => {
    const lines = ownLines([12_000 * 10], []);
    expect(lines.line2).toBe(30_000);
    expect(line7Of(line6Of(lines, undefined))).toBe(30_000);
  });

  /* CRS IF12379: "$70,000 (10 x $7,000) ... the 45F credit amount would be $17,500 (25% of $70,000)". */
  it("CRS IF12379: $70,000 at a facility gives a $17,500 credit", () => {
    expect(ownLines([70_000], []).line2).toBe(17_500);
  });
});

describe("Form 8882 lines: rules with no published example", () => {
  it("takes 25% of line 1 and 10% of line 3", () => {
    expect(FACILITY_RATE).toBe(0.25);
    expect(RESOURCE_AND_REFERRAL_RATE).toBe(0.1);
    const lines = ownLines([40_000, 10_000], [8_000]);
    expect(lines).toEqual({ line1: 50_000, line2: 12_500, line3: 8_000, line4: 800 });
    expect(ownCreditOf(lines)).toBe(13_300);
  });

  it("adds each line with cents and rounds once", () => {
    // 1,000.30 + 1,000.30 = 2,000.60 → 2,001; 25% = 500.25 → 500.
    const lines = ownLines([1_000.3, 1_000.3], [333.3]);
    expect(lines.line1).toBe(2_001);
    expect(lines.line2).toBe(500);
    // 333.30 → 333; 10% = 33.30 → 33.
    expect(lines.line3).toBe(333);
    expect(lines.line4).toBe(33);
  });

  it("leaves a line blank with no expenditure of its kind", () => {
    expect(ownLines([], [5_000])).toEqual({
      line1: undefined,
      line2: undefined,
      line3: 5_000,
      line4: 500,
    });
  });

  it("line 6 adds lines 2, 4 and 5", () => {
    expect(line6Of({ line2: 1_000, line4: 200 }, 300)).toBe(1_500);
    expect(line6Of({}, 300)).toBe(300);
  });

  it("line 7 is line 6 up to $150,000 at each edge", () => {
    expect(CREDIT_LIMIT).toBe(150_000);
    expect(line7Of(149_999)).toBe(149_999);
    expect(line7Of(150_000)).toBe(150_000);
    expect(line7Of(150_001)).toBe(150_000);
    expect(line7Of(0)).toBe(0);
  });

  it("the shares of line 7 add to line 7 and follow each expenditure's credit", () => {
    const expenditures = [
      { line: "facility" as const, amount: 160_000 },
      { line: "facility" as const, amount: 52_000 },
      { line: "resource_and_referral" as const, amount: 6_000 },
    ];
    const lines = ownLines([160_000, 52_000], [6_000]);
    const shares = line7Shares(lines, expenditures);
    expect(shares).toEqual([40_000, 13_000, 600]);
    expect(sum(...shares)).toBe(ownCreditOf(lines));
  });

  it("above the limit the shares are the $150,000 allocated pro rata", () => {
    const expenditures = [
      { line: "facility" as const, amount: 600_000 },
      { line: "facility" as const, amount: 200_000 },
    ];
    const lines = ownLines([600_000, 200_000], []);
    expect(lines.line2).toBe(200_000);
    const shares = line7Shares(lines, expenditures);
    expect(shares).toEqual([112_500, 37_500]);
    expect(sum(...shares)).toBe(CREDIT_LIMIT);
  });
});
