/*
 * Form 3800 Parts I and II as pure arithmetic (src/federal/3800/lines.ts). The
 * instructions publish no example with numbers (.scratch evidence): these are
 * the form's own lines, each threshold edge, and limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import { isGap, type Cell } from "../../../../src/federal/3800/cells.js";
import {
  NET_REGULAR_TAX_FLOOR,
  line13Of,
  partI,
  sectionA,
  sectionB,
  sectionC,
  type TaxInputs,
} from "../../../../src/federal/3800/lines.js";
import { separateReturnGap } from "../../../../src/federal/3800/tax.js";
import { unsupported } from "../../../../src/types.js";

const tax = (line7: number, line14: Cell, extra: Partial<TaxInputs> = {}): TaxInputs => ({
  line7,
  line8: undefined,
  line10a: undefined,
  line10b: undefined,
  line14,
  ...extra,
});

const NO_ZONE = { line22: undefined, line23: undefined, line24: undefined };
const NO_SPECIFIED = {
  line30: undefined,
  line32: undefined,
  line33: undefined,
  line34: undefined,
  line35: undefined,
};

describe("Part I", () => {
  it("line 6 adds lines 1, 3, 4 and 5, not line 2", () => {
    const lines = partI({ line1: 1000, line2: 700, line3: undefined, line4: 250, line5: 50 });
    expect(lines.line6).toBe(1300);
  });

  it("line 6 is a gap when line 3 (Form 8582-CR) is one", () => {
    const lines = partI({
      line1: 1000,
      line2: 700,
      line3: unsupported("8582-CR"),
      line4: undefined,
      line5: undefined,
    });
    expect(isGap(lines.line6)).toBe(true);
  });
});

describe("Part II Section A", () => {
  it("line 13 is 25% of line 12 over $25,000, and 0 at the edge", () => {
    expect(line13Of(NET_REGULAR_TAX_FLOOR)).toBe(0);
    expect(line13Of(NET_REGULAR_TAX_FLOOR - 1)).toBe(0);
    expect(line13Of(NET_REGULAR_TAX_FLOOR + 1)).toBe(0);
    expect(line13Of(NET_REGULAR_TAX_FLOOR + 2)).toBe(1);
    expect(line13Of(125_000)).toBe(25_000);
  });

  it("lines 9 to 17 for a return above the floor", () => {
    const partA = sectionA(
      tax(100_000, 70_000, { line8: 2_000, line10a: 500, line10b: 1_500 }),
      9_000,
    );
    expect(partA.line9).toBe(102_000);
    expect(partA.line10c).toBe(2_000);
    expect(partA.line11).toBe(100_000);
    expect(partA.line12).toBe(98_000);
    expect(partA.line13).toBe(18_250);
    expect(partA.line15).toBe(70_000);
    expect(partA.line16).toBe(30_000);
    expect(partA.line17).toBe(9_000);
  });

  it("line 11 at 0 skips lines 12 to 15 and enters 0 on line 16", () => {
    const partA = sectionA(tax(5_000, 4_000, { line10b: 5_000 }), 1_000);
    expect(partA.line11).toBe(0);
    expect([partA.line12, partA.line13, partA.line14, partA.line15]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(partA.line16).toBe(0);
    expect(partA.line17).toBe(0);
  });

  it("line 17 is 0 with no line 6 credit even when the tentative minimum tax is a gap", () => {
    const partA = sectionA(tax(50_000, unsupported("no Form 6251")), 0);
    expect(isGap(partA.line15)).toBe(true);
    expect(isGap(partA.line16)).toBe(true);
    expect(partA.line17).toBe(0);
  });

  it("line 17 is never more than line 6 or line 16", () => {
    for (const line6 of [0, 500, 5_000, 50_000]) {
      for (const tmt of [0, 20_000, 60_000, 90_000]) {
        const partA = sectionA(tax(80_000, tmt), line6);
        expect(partA.line17).toBeLessThanOrEqual(line6);
        expect(partA.line17).toBeLessThanOrEqual(partA.line16 as number);
      }
    }
  });
});

describe("Part II Section B", () => {
  it("with nothing on lines 22 and 24, lines 18 to 25 are skipped and line 26 is 0", () => {
    const partA = sectionA(tax(80_000, 60_000), 1_000);
    const partB = sectionB(partA, 60_000, NO_ZONE);
    expect([partB.line18, partB.line19, partB.line20, partB.line21, partB.line25]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(partB.line26).toBe(0);
  });

  it("lines 18 to 26: 75% of the tentative minimum tax, then the room left after line 17", () => {
    const partA = sectionA(tax(80_000, 60_000), 30_000);
    const partB = sectionB(partA, 60_000, { ...NO_ZONE, line22: 3_000 });
    expect(partB.line18).toBe(45_000);
    expect(partB.line19).toBe(45_000);
    expect(partB.line20).toBe(35_000);
    expect(partB.line21).toBe(15_000);
    expect(partB.line25).toBe(3_000);
    expect(partB.line26).toBe(3_000);
  });

  it("line 26 is never more than line 21", () => {
    const partA = sectionA(tax(80_000, 60_000), 20_000);
    const partB = sectionB(partA, 60_000, { ...NO_ZONE, line22: 40_000 });
    expect(partB.line26).toBe(partB.line21);
  });
});

describe("Part II Section C", () => {
  it("lines 27 to 38: the specified credits reach past the tentative minimum tax", () => {
    const partA = sectionA(tax(80_000, 60_000), 30_000);
    const partB = sectionB(partA, 60_000, NO_ZONE);
    const partC = sectionC(partA, partB, { ...NO_SPECIFIED, line30: 10_000, line34: 4_000 });
    expect(partC.line27).toBe(66_250);
    expect(partC.line28).toBe(20_000);
    expect(partC.line29).toBe(46_250);
    expect(partC.line36).toBe(14_000);
    expect(partC.line37).toBe(14_000);
    expect(partC.line38).toBe(34_000);
  });

  it("line 38 is never more than line 11 less line 13", () => {
    for (const credit of [0, 10_000, 60_000, 200_000]) {
      const partA = sectionA(tax(80_000, 60_000), credit);
      const partB = sectionB(partA, 60_000, { ...NO_ZONE, line22: credit });
      const partC = sectionC(partA, partB, { ...NO_SPECIFIED, line30: credit });
      expect(partC.line38 as number).toBeLessThanOrEqual(
        (partA.line11 as number) - (partA.line13 as number),
      );
    }
  });

  it("a gap on line 33 (Form 8582-CR) makes lines 36 to 38 gaps", () => {
    const partA = sectionA(tax(80_000, 60_000), 0);
    const partB = sectionB(partA, 60_000, NO_ZONE);
    const partC = sectionC(partA, partB, {
      ...NO_SPECIFIED,
      line32: 500,
      line33: unsupported("8582-CR"),
    });
    expect(isGap(partC.line36)).toBe(true);
    expect(isGap(partC.line38)).toBe(true);
  });
});

describe("Form 3800 line 13 on a separate return", () => {
  it("is a gap for married filing separately (irs-3800-inst-2025::sec::line-13::b01)", () => {
    expect(separateReturnGap("married_filing_separately")).toMatchObject({ unsupported: true });
  });

  it("is figured for every other filing status", () => {
    expect(separateReturnGap("single")).toBeUndefined();
    expect(separateReturnGap("married_filing_jointly")).toBeUndefined();
    expect(separateReturnGap(undefined)).toBeUndefined();
  });
});
