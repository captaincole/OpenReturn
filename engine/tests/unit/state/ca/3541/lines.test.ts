/*
 * FTB 3541 arithmetic (src/state/ca/3541/lines.ts). The only published
 * examples with numbers are the California Film Commission's "Program 4.0
 * Refundability Summary" (July 2023), Examples 1 and 2; the rest are limit
 * and edge tests that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  creditTaken,
  line13,
  partILines,
  partIVLines,
  programOf,
  shareUsed,
} from "../../../../../src/state/ca/3541/lines.js";

describe("Part IV, California Film Commission examples", () => {
  it("Example #1: $11,000,000 credit, $1,000,000 tax: $9,000,000 total and $1,800,000 a year", () => {
    expect(partIVLines(11_000_000, 1_000_000, 0)).toEqual({
      line20: 11_000_000,
      line21: 1_000_000,
      line22: 10_000_000,
      line23: 9_000_000,
      line24: 1_800_000,
    });
  });

  it("Example #2: $100 credit, $50 tax after all other credits: a $9 refund", () => {
    const lines = partIVLines(100, 50, 0);
    expect([lines.line22, lines.line23, lines.line24]).toEqual([50, 45, 9]);
  });

  it("Example #1, zero tax: $9,900,000 total and $1,980,000 a year", () => {
    const lines = partIVLines(11_000_000, 0, 0);
    expect([lines.line23, lines.line24]).toEqual([9_900_000, 1_980_000]);
  });
});

describe("Part IV limits", () => {
  it("line 21 adds Part I line 10 to the tax", () => {
    expect(partIVLines(60_000, 28_000, 5_000)).toMatchObject({ line21: 33_000, line22: 27_000 });
  });

  it("stops at line 22 when the tax is the credit or more", () => {
    expect(partIVLines(50_000, 50_000, 0)).toEqual({ line20: 50_000, line21: 50_000, line22: 0 });
    expect(partIVLines(50_000, 80_000, 0).line23).toBeUndefined();
  });

  it("never refunds more than 18% of line 22, rounded", () => {
    const lines = partIVLines(1_001, 0, 0);
    expect(lines.line23).toBe(901);
    expect(lines.line24).toBe(180);
    expect(lines.line24 as number).toBeLessThanOrEqual(1_001 * 0.18 + 0.5);
  });
});

describe("the program of a certificate number", () => {
  const code = (number: number) => programOf(number)?.code;
  it("follows the ranges of the check boxes", () => {
    expect(code(999)).toBeUndefined();
    expect([code(1000), code(4999)]).toEqual(["223", "223"]);
    expect([code(5000), code(6999)]).toEqual(["237", "237"]);
    expect([code(7000), code(7999)]).toEqual(["239", "239"]);
    expect([code(8000), code(8199)]).toEqual(["245", "245"]);
    expect([code(8200), code(99_999)]).toEqual(["248", "248"]);
  });

  it("puts original and new in Section A2 and the others in Section B2", () => {
    expect([1000, 5000, 7000, 8000, 8200].map((number) => programOf(number)?.section)).toEqual([
      "A2",
      "A2",
      "B2",
      "B2",
      "B2",
    ]);
  });
});

describe("Part I", () => {
  it("takes the credit on line 1, 2 or 3 by how it was received", () => {
    const base = { credit: 10_000, carryover: 0, appliedToSalesAndUseTax: 0 };
    expect(partILines({ ...base, source: "generated" }).line1).toBe(10_000);
    expect(partILines({ ...base, source: "pass_through" }).line2).toBe(10_000);
    expect(partILines({ ...base, source: "purchased" }).line3).toBe(10_000);
    expect(partILines({ ...base, source: "pass_through" }).line1).toBeUndefined();
  });

  it("line 11 is lines 1 to 5a less line 10, and never below 0", () => {
    const lines = partILines({
      source: "pass_through",
      credit: 3_000,
      carryover: 1_500,
      appliedToSalesAndUseTax: 1_000,
    });
    expect([lines.line5a, lines.line9, lines.line10, lines.line11]).toEqual([
      1_500, 1_000, 1_000, 3_500,
    ]);
    const over = partILines({
      source: "generated",
      credit: 500,
      carryover: 0,
      appliedToSalesAndUseTax: 900,
    });
    expect(over.line11).toBe(0);
  });

  it("a carryover alone leaves lines 1 to 3 and 10 blank", () => {
    const lines = partILines({
      source: "pass_through",
      credit: 0,
      carryover: 12_000,
      appliedToSalesAndUseTax: 0,
    });
    expect([lines.line2, lines.line10, lines.line11]).toEqual([undefined, undefined, 12_000]);
  });
});

describe("Part II and the share of a code", () => {
  it("line 13 is line 11 less lines 12a to 12d: the parts add to line 11", () => {
    expect(line13(55_000, 28_000, 27_000)).toBe(0);
    expect(line13(25_000, 15_835, undefined)).toBe(9_165);
    expect(line13(25_000, 15_835, undefined) + 15_835).toBe(25_000);
  });

  it("shares the credit taken oldest first, each up to its line 11", () => {
    expect(shareUsed(7_000, [5_000, 4_000])).toEqual([5_000, 2_000]);
    expect(shareUsed(20_000, [5_000, 4_000])).toEqual([5_000, 4_000]);
    expect(shareUsed(0, [5_000])).toEqual([0]);
  });

  it("never takes more than the credit or the tax left", () => {
    expect(creditTaken(10_000, 4_000)).toBe(4_000);
    expect(creditTaken(3_000, 4_000)).toBe(3_000);
    expect(creditTaken(3_000, -50)).toBe(0);
  });
});
