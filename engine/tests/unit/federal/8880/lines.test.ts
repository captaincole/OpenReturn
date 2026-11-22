/*
 * Form 8880 lines from the published examples (irs-8880-form-2025, the IRS
 * saver's credit page) and limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  AGI_LIMIT_HEAD_OF_HOUSEHOLD,
  AGI_LIMIT_JOINT,
  AGI_LIMIT_OTHER,
  LINE_9_TABLE,
  agiLimit,
  columnLines,
  creditLimit,
  line10,
  line12,
  line7,
  line9Digit,
} from "../../../../src/federal/8880/lines.js";
import type { FilingStatus } from "../../../../src/values.js";

const STATUSES: FilingStatus[] = [
  "single",
  "married_filing_jointly",
  "married_filing_separately",
  "head_of_household",
  "qualifying_surviving_spouse",
];

describe("Form 8880, published examples", () => {
  /*
   * IRS saver's credit page, tax year 2021: Jill (MFJ) put $2,000 in her IRA;
   * AGI after the deduction is $39,000; she may claim a 50% credit of $1,000.
   * The 2025 table gives 0.5 at $39,000 too, so the 2025 result is the same.
   */
  it("IRS saver's credit page, Jill: $2,000 IRA, MFJ AGI $39,000 → $1,000", () => {
    const jill = columnLines({
      iraAndAbleContributions: 2000,
      electiveDeferrals: 0,
      distributions: 0,
    });
    expect(jill.line6).toBe(2000);
    const total = line7(jill.line6, undefined);
    const digit = line9Digit(39000, "married_filing_jointly");
    expect(digit).toBe(5);
    const tentative = line10(total, digit);
    expect(tentative).toBe(1000);
    expect(line12(tentative, creditLimit(1500, []).line3)).toBe(1000);
  });

  /*
   * irs-8880-form-2025::sec::line-4::b02, b03: line 4 is $5,000 in column (a)
   * and $7,000 in column (b) (the resolver test checks how the columns are
   * built). Here: what those line 4 amounts do to lines 5 and 6.
   */
  it("Form 8880 instructions, line 4 example: line 4 of $5,000 and $7,000 reduce each column", () => {
    const you = columnLines({
      iraAndAbleContributions: 6000,
      electiveDeferrals: 0,
      distributions: 5000,
    });
    const spouse = columnLines({
      iraAndAbleContributions: 6000,
      electiveDeferrals: 0,
      distributions: 7000,
    });
    expect([you.line4, you.line5, you.line6]).toEqual([5000, 1000, 1000]);
    expect([spouse.line4, spouse.line5, spouse.line6]).toEqual([7000, 0, 0]);
  });
});

describe("Form 8880 lines 1–7, limits", () => {
  it("line 3 adds lines 1 and 2; lines 1, 2 and 4 round their cents once", () => {
    const lines = columnLines({
      iraAndAbleContributions: 499.5,
      electiveDeferrals: 1000.49,
      distributions: 10.5,
    });
    expect(lines).toEqual({
      line1: 500,
      line2: 1000,
      line3: 1500,
      line4: 11,
      line5: 1489,
      line6: 1489,
    });
  });

  it("line 5 is -0- when distributions are more than contributions", () => {
    expect(
      columnLines({ iraAndAbleContributions: 100, electiveDeferrals: 0, distributions: 900 }).line5,
    ).toBe(0);
  });

  it("line 6 is never more than $2,000 or line 5", () => {
    for (const amount of [0, 1, 1999, 2000, 2001, 50000]) {
      const lines = columnLines({
        iraAndAbleContributions: amount,
        electiveDeferrals: 0,
        distributions: 0,
      });
      expect(lines.line6).toBe(Math.min(amount, 2000));
    }
  });

  it("line 7 adds the line 6 amounts; a blank column adds 0", () => {
    expect(line7(2000, 1200)).toBe(3200);
    expect(line7(800, undefined)).toBe(800);
    expect(line7(undefined, undefined)).toBe(0);
  });
});

describe("Form 8880 line 9 table", () => {
  it("the AGI limits of the Caution", () => {
    expect(agiLimit("married_filing_jointly")).toBe(AGI_LIMIT_JOINT);
    expect(agiLimit("head_of_household")).toBe(AGI_LIMIT_HEAD_OF_HOUSEHOLD);
    for (const status of [
      "single",
      "married_filing_separately",
      "qualifying_surviving_spouse",
    ] as const) {
      expect(agiLimit(status)).toBe(AGI_LIMIT_OTHER);
    }
  });

  it("each row's 'But not over' amount is in the row; one dollar more is the next row", () => {
    const rows = [
      ...LINE_9_TABLE,
      { butNotOver: Infinity, joint: 0, headOfHousehold: 0, other: 0 },
    ];
    for (let index = 0; index < LINE_9_TABLE.length; index++) {
      const edge = LINE_9_TABLE[index]!.butNotOver;
      const next = rows[index + 1]!;
      expect(line9Digit(edge, "married_filing_jointly")).toBe(LINE_9_TABLE[index]!.joint);
      expect(line9Digit(edge + 1, "married_filing_jointly")).toBe(next.joint);
      expect(line9Digit(edge, "head_of_household")).toBe(LINE_9_TABLE[index]!.headOfHousehold);
      expect(line9Digit(edge + 1, "head_of_household")).toBe(next.headOfHousehold);
      expect(line9Digit(edge, "single")).toBe(LINE_9_TABLE[index]!.other);
      expect(line9Digit(edge + 1, "single")).toBe(next.other);
    }
  });

  it("the rate is 0 over each status's AGI limit and above 0 at it", () => {
    for (const status of STATUSES) {
      expect(line9Digit(agiLimit(status), status)).toBeGreaterThan(0);
      expect(line9Digit(agiLimit(status) + 1, status)).toBe(0);
    }
  });

  it("a negative or zero AGI is in the first row", () => {
    expect(line9Digit(-5000, "single")).toBe(5);
    expect(line9Digit(0, "head_of_household")).toBe(5);
  });

  it("married filing separately and qualifying surviving spouse use the single column", () => {
    for (const agi of [24000, 30000, 39000, 40000]) {
      expect(line9Digit(agi, "married_filing_separately")).toBe(line9Digit(agi, "single"));
      expect(line9Digit(agi, "qualifying_surviving_spouse")).toBe(line9Digit(agi, "single"));
    }
  });
});

describe("Form 8880 lines 10–12 and the Credit Limit Worksheet", () => {
  it("line 10 rounds to the nearest dollar: 1,235 × 0.1 = 123.50 → 124", () => {
    expect(line10(1235, 1)).toBe(124);
    expect(line10(1234, 1)).toBe(123);
    expect(line10(1001, 5)).toBe(501);
  });

  it("the credit is never more than $1,000 per person ($2,000 joint)", () => {
    for (const status of STATUSES) {
      const people = status === "married_filing_jointly" ? 2 : 1;
      const total = line7(...Array.from({ length: people }, () => 2000));
      const most = line10(total, line9Digit(0, status));
      expect(most).toBe(1000 * people);
    }
  });

  it("worksheet line 3 is line 1 less line 2; zero or less stops the credit", () => {
    expect(creditLimit(1603, [100, undefined, 3])).toEqual({
      line1: 1603,
      line2: 103,
      line3: 1500,
      creditAllowed: true,
    });
    expect(creditLimit(500, [500])).toEqual({
      line1: 500,
      line2: 500,
      line3: 0,
      creditAllowed: false,
    });
    expect(creditLimit(500, [700]).line3).toBe(0);
  });

  it("line 12 is the smaller of lines 10 and 11", () => {
    expect(line12(2000, 1603)).toBe(1603);
    expect(line12(800, 1603)).toBe(800);
    expect(line12(800, 800)).toBe(800);
  });
});
