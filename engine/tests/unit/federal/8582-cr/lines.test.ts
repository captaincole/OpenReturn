/*
 * Form 8582-CR lines 1a to 37 as pure arithmetic (lines.ts): the published
 * example of the instructions, every skip rule and threshold edge, and the
 * limits that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  form8582CRLines,
  type PartIAmounts,
  type ReturnAmounts,
} from "../../../../src/federal/8582-cr/lines.js";
import { unsupported } from "../../../../src/types.js";

const isGap = (value: unknown) => (value as { unsupported?: boolean })?.unsupported === true;

/* A flat 22% bracket: the tax attributable to an amount is 22% of it. */
const flat22 = (amount: number) => Math.min(amount, 1_000_000) * 0.22;

function inputs(overrides: Partial<ReturnAmounts> = {}): ReturnAmounts {
  return {
    line6: 0,
    livedWithSpouse: false,
    mfsApart: false,
    magi: () => 90_000,
    form8582Line9: undefined,
    taxAttributable: flat22,
    ...overrides,
  };
}

describe("the published example: Mr. Jones, a limited partner with a low-income housing credit", () => {
  /*
   * Instructions for Form 8582-CR, "Example of How To Complete Form 8582-CR"
   * (2005 and 2009 editions; the 1998 edition the same with its own tax). A
   * post-1989 low-income housing credit of $12,000, no net passive income,
   * taxable income $305,000: line 35 is the tax on $305,000 less the tax on
   * $280,000. 2005: $81,675 − $73,425 = $8,250. 1998: $94,384 − $84,484 = $9,900.
   * The tax amounts are the edition's; the lines' logic has not changed.
   */
  const jones = (taxOn25000: number) =>
    form8582CRLines(
      { line3a: 12_000 },
      inputs({ taxAttributable: (amount) => (amount === 25_000 ? taxOn25000 : NaN) }),
    );

  it("2005 and 2009: lines 3a to 7 and 31 to 37 as the example prints them", () => {
    const lines = jones(81_675 - 73_425);
    expect(lines).toMatchObject({
      line3a: 12_000,
      line3c: 12_000,
      line5: 12_000,
      line6: 0,
      line7: 12_000,
      line31: 12_000,
      line32: 0,
      line33: 12_000,
      line34: 12_000,
      line35: 8_250,
      line36: 8_250,
      line37: 8_250,
    });
    // "His unallowed credit of $3,750 is determined by subtracting the allowed credit on line 37 from the total credit on line 5."
    expect((lines.line5 as number) - (lines.line37 as number)).toBe(3_750);
    // Parts II and III are skipped: "the only credit he has is from a post-1989 low-income housing credit".
    expect(lines.line8).toBeUndefined();
    expect(lines.line17).toBeUndefined();
  });

  it("1998: line 35 and line 37 are $9,900, the unallowed credit $2,100", () => {
    const lines = jones(94_384 - 84_484);
    expect(lines.line35).toBe(9_900);
    expect(lines.line37).toBe(9_900);
    expect((lines.line5 as number) - (lines.line37 as number)).toBe(2_100);
  });
});

describe("Part I", () => {
  it("adds columns (a) and (b) on each worksheet line and in line 5", () => {
    const amounts: PartIAmounts = { line1a: 100, line1b: 50, line2a: 10, line4b: 7 };
    const lines = form8582CRLines(amounts, inputs({ line6: 1_000 }));
    expect(lines).toMatchObject({ line1c: 150, line2c: 10, line4c: 7, line5: 167 });
    expect(lines.line3c).toBeUndefined();
  });

  it("line 7 is 0 and line 37 is line 5 when line 6 covers every credit (line-7::b01)", () => {
    const lines = form8582CRLines({ line1a: 2_000, line4a: 500 }, inputs({ line6: 3_000 }));
    expect(lines.line7).toBe(0);
    expect(lines.line37).toBe(2_500);
    expect(lines.line8).toBeUndefined();
  });

  it("line 37 is line 6 when only Worksheet 4 credits are above it", () => {
    const lines = form8582CRLines({ line4a: 5_000 }, inputs({ line6: 1_200 }));
    expect(lines.line7).toBe(3_800);
    expect(lines.line37).toBe(1_200);
  });

  it("a gap in line 6 is a gap on lines 7 and 37", () => {
    const lines = form8582CRLines({ line4a: 5_000 }, inputs({ line6: unsupported("tax") }));
    expect(isGap(lines.line7)).toBe(true);
    expect(isGap(lines.line37)).toBe(true);
  });
});

describe("Part II", () => {
  it("modified AGI of $100,000 gives the full $25,000 (line 12 cap)", () => {
    const lines = form8582CRLines({ line1a: 10_000 }, inputs({ magi: () => 100_000 }));
    expect(lines).toMatchObject({ line11: 50_000, line12: 25_000, line14: 25_000 });
    expect(lines.line15).toBe(5_500);
    expect(lines.line16).toBe(5_500);
  });

  it("line 10 at line 9: lines 11 to 15 are skipped and line 16 is 0", () => {
    const lines = form8582CRLines({ line1a: 10_000 }, inputs({ magi: () => 150_000 }));
    expect(lines.line16).toBe(0);
    expect(lines.line11).toBeUndefined();
    expect(lines.line15).toBeUndefined();
    expect(lines.line37).toBe(0);
  });

  it("$1 under line 9: half of $1 rounds to $1", () => {
    const lines = form8582CRLines({ line1a: 10_000 }, inputs({ magi: () => 149_999 }));
    expect(lines.line11).toBe(1);
    expect(lines.line12).toBe(1);
  });

  it("line 13 takes Form 8582 line 9 out of the allowance, and line 16 never passes line 8", () => {
    const lines = form8582CRLines(
      { line1a: 800 },
      inputs({ magi: () => 120_000, form8582Line9: 9_000 }),
    );
    expect(lines).toMatchObject({ line12: 15_000, line13: 9_000, line14: 6_000, line15: 1_320 });
    expect(lines.line16).toBe(800);
  });

  it("a separate return living apart all year: $75,000 and $12,500 (line-9::b01, line-12::b01)", () => {
    const lines = form8582CRLines(
      { line1a: 10_000 },
      inputs({ mfsApart: true, magi: () => 40_000 }),
    );
    expect(lines.line9).toBe(75_000);
    expect(lines.line12).toBe(12_500);
  });

  it("a gap in modified AGI is a gap on lines 10, 16 and 37", () => {
    const lines = form8582CRLines({ line1a: 10_000 }, inputs({ magi: () => unsupported("magi") }));
    expect(isGap(lines.line10)).toBe(true);
    expect(isGap(lines.line16)).toBe(true);
    expect(isGap(lines.line37)).toBe(true);
  });
});

describe("Part III", () => {
  it("Part II done and modified AGI at $100,000 or less: lines 21 to 26 skipped, line 27 is line 15", () => {
    const lines = form8582CRLines({ line1a: 1_000, line2a: 8_000 }, inputs({ magi: () => 95_000 }));
    expect(lines.line21).toBeUndefined();
    expect(lines.line26).toBeUndefined();
    expect(lines.line27).toBe(lines.line15);
    expect(lines).toMatchObject({ line16: 1_000, line28: 1_000, line29: 4_500, line30: 4_500 });
  });

  it("the higher phaseout: modified AGI of $220,000 allows tax on $15,000 (line-21::b01, line-24)", () => {
    const lines = form8582CRLines({ line2a: 8_000 }, inputs({ magi: () => 220_000 }));
    expect(lines).toMatchObject({
      line21: 250_000,
      line23: 30_000,
      line24: 15_000,
      line26: 15_000,
    });
    expect(lines.line27).toBe(3_300);
    expect(lines.line28).toBe(0);
    expect(lines.line30).toBe(3_300);
  });

  it("line 22 at line 21: lines 23 to 29 skipped, line 30 is 0", () => {
    const lines = form8582CRLines({ line2a: 8_000 }, inputs({ magi: () => 250_000 }));
    expect(lines.line30).toBe(0);
    expect(lines.line23).toBeUndefined();
    expect(lines.line29).toBeUndefined();
  });

  it("line 19 at zero: lines 30 and 36 are 0 and Part IV is skipped", () => {
    const lines = form8582CRLines(
      { line1a: 5_000, line2a: 2_000, line3a: 1_000 },
      inputs({ magi: () => 90_000, taxAttributable: () => 99_999, line6: 3_000 }),
    );
    // Line 7 is 5,000, and line 16 takes all of it.
    expect(lines.line16).toBe(5_000);
    expect(lines.line19).toBe(0);
    expect(lines.line30).toBe(0);
    expect(lines.line36).toBe(0);
    expect(lines.line20).toBeUndefined();
    expect(lines.line31).toBeUndefined();
    expect(lines.line37).toBe(8_000);
  });

  it("line 33 at zero: line 36 is 0 and lines 34 and 35 are skipped", () => {
    const lines = form8582CRLines(
      { line1a: 5_000, line2a: 3_000, line3a: 3_000 },
      inputs({ magi: () => 90_000, taxAttributable: () => 99_999, line6: 3_000 }),
    );
    // Line 7 is 8,000; line 16 is 5,000; line 30 takes the other 3,000.
    expect(lines.line19).toBe(3_000);
    expect(lines.line30).toBe(3_000);
    expect(lines.line33).toBe(0);
    expect(lines.line34).toBeUndefined();
    expect(lines.line36).toBe(0);
    expect(lines.line37).toBe(11_000);
  });

  it("a separate return living apart: $125,000 on line 21 and $12,500 on line 24", () => {
    const lines = form8582CRLines(
      { line2a: 8_000 },
      inputs({ mfsApart: true, magi: () => 60_000 }),
    );
    expect(lines.line21).toBe(125_000);
    expect(lines.line24).toBe(12_500);
  });
});

describe("Part IV and Part V", () => {
  it("line 35 is the tax on $25,000 less Form 8582 line 9, less lines 16 and 30", () => {
    const lines = form8582CRLines(
      { line1a: 1_000, line3a: 20_000 },
      inputs({ magi: () => 300_000, form8582Line9: 5_000 }),
    );
    expect(lines.line16).toBe(0);
    expect(lines.line35).toBe(4_400);
    expect(lines.line36).toBe(4_400);
    expect(lines.line37).toBe(4_400);
  });

  it("a separate return living with the spouse skips Parts II to IV: line 37 is line 6", () => {
    const lines = form8582CRLines(
      { line4a: 9_000 },
      inputs({ livedWithSpouse: true, line6: 2_000 }),
    );
    expect(lines.line8).toBeUndefined();
    expect(lines.line31).toBeUndefined();
    expect(lines.line37).toBe(2_000);
  });

  it("line 37 is never more than line 5", () => {
    for (const magi of [0, 80_000, 120_000, 180_000, 240_000, 400_000]) {
      for (const line6 of [0, 500, 4_000]) {
        const lines = form8582CRLines(
          { line1a: 3_000, line1b: 400, line2a: 2_000, line3a: 6_000, line4a: 1_000 },
          inputs({ magi: () => magi, line6 }),
        );
        expect(lines.line37 as number).toBeLessThanOrEqual(lines.line5 as number);
        expect(lines.line37 as number).toBeGreaterThanOrEqual(Math.min(line6, 12_400));
      }
    }
  });
});
