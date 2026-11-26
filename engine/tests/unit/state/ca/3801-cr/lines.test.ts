/*
 * FTB 3801-CR lines 1a to 17 as pure arithmetic (lines.ts): the published
 * federal example on the California form, every skip rule and threshold edge,
 * and the limits that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  form3801CRLines,
  lowIncomeHousingOffsetOf,
  type CaReturnAmounts,
  type PartIAmounts,
} from "../../../../../src/state/ca/3801-cr/lines.js";
import { unsupported } from "../../../../../src/types.js";

const isGap = (value: unknown) => (value as { unsupported?: boolean })?.unsupported === true;

/* A flat 9.3% bracket: the tax attributable to an amount is 9.3% of it, whole dollars. */
const flat93 = (amount: number) => Math.round(amount * 0.093);

function inputs(overrides: Partial<CaReturnAmounts> = {}): CaReturnAmounts {
  return {
    line6: 0,
    livedWithSpouse: false,
    mfsApart: false,
    magi: () => 90_000,
    form8582Line9: undefined,
    taxAttributable: flat93,
    ...overrides,
  };
}

describe("the published example on the California form: Mr. Jones's low-income housing credit", () => {
  /*
   * Instructions for federal Form 8582-CR, "Example of How To Complete Form
   * 8582-CR" (2005 and 2009 editions): a post-1989 low-income housing credit of
   * $12,000 and no net passive income. Part I is the same on FTB 3801-CR
   * (lines 3a, 3c, 5, 6 and 7). California's form has no Part III or IV, and
   * California sets no dollar limit on the low-income housing credit's offset,
   * so line 17 allows the whole credit (DECISION in lines.ts).
   */
  it("lines 3a to 7 as the example prints them; line 17 allows the whole credit", () => {
    const lines = form3801CRLines({ line3a: 12_000 }, inputs());
    expect(lines).toMatchObject({ line3a: 12_000, line3c: 12_000, line5: 12_000, line6: 0 });
    expect(lines.line7).toBe(12_000);
    expect(lines.line8).toBeUndefined();
    expect(lines.line17).toBe(12_000);
  });
});

describe("the low-income housing credit's offset with no dollar limit (decision A47)", () => {
  it("a credit on line 2 with no net passive income is allowed in full", () => {
    const lines = form3801CRLines({ line2a: 600, line2b: 1_800 }, inputs());
    expect(lines.line2c).toBe(2_400);
    expect(lines.line17).toBe(2_400);
  });

  it("with line 1c credits too, Part II takes only line 1c and line 17 adds the three parts", () => {
    const amounts: PartIAmounts = { line1a: 10_000, line2a: 3_000, line3a: 4_000 };
    const lines = form3801CRLines(amounts, inputs({ line6: 1_000, magi: () => 140_000 }));
    expect(lines).toMatchObject({ line5: 17_000, line7: 16_000, line8: 10_000 });
    expect(lines).toMatchObject({ line12: 5_000, line15: 465, line16: 465 });
    // 1,000 + 465 + the smaller of 7,000 and 16,000 − 465.
    expect(lines.line17).toBe(1_000 + 465 + 7_000);
  });

  it("the offset is never more than line 7 less line 16: line 2c first, then line 3c", () => {
    const amounts: PartIAmounts = { line1a: 10_000, line2a: 30_000, line3a: 30_000 };
    const lines = form3801CRLines(amounts, inputs({ line6: 12_000, magi: () => 140_000 }));
    expect(lines).toMatchObject({ line5: 70_000, line7: 58_000, line16: 465 });
    expect(lowIncomeHousingOffsetOf(lines)).toEqual({ line30: 30_000, line36: 27_535 });
    expect(lines.line17).toBe(70_000);
  });

  it("line 7 of 0 keeps line 5 on line 17 (decision A46)", () => {
    const lines = form3801CRLines({ line1a: 500, line3a: 2_000 }, inputs({ line6: 5_000 }));
    expect(lines.line7).toBe(0);
    expect(lines.line17).toBe(2_500);
  });

  it("a separate return living with the spouse has the credit on line 4: no offset", () => {
    const lines = form3801CRLines({ line4a: 2_400 }, inputs({ livedWithSpouse: true, line6: 300 }));
    expect(lines.line17).toBe(300);
  });

  it("a gap in line 16 is a gap on line 17", () => {
    const amounts: PartIAmounts = { line1a: 300, line3a: 2_000 };
    const lines = form3801CRLines(amounts, inputs({ magi: () => unsupported("magi") }));
    expect(isGap(lines.line17)).toBe(true);
  });
});

describe("Part I", () => {
  it("adds columns (a) and (b) on each line and in line 5", () => {
    const amounts: PartIAmounts = { line1a: 100, line1b: 50, line2b: 10, line4a: 7 };
    const lines = form3801CRLines(amounts, inputs({ line6: 1_000 }));
    expect(lines).toMatchObject({ line1c: 150, line2c: 10, line4c: 7, line5: 167 });
    expect(lines.line3c).toBeUndefined();
  });

  it("line 7 is 0 and line 17 is line 5 when line 6 covers every credit (line-7::b01)", () => {
    const lines = form3801CRLines({ line1a: 2_000, line4a: 500 }, inputs({ line6: 3_000 }));
    expect(lines.line7).toBe(0);
    expect(lines.line17).toBe(2_500);
    expect(lines.line8).toBeUndefined();
  });

  it("line 6 equal to line 5: line 7 is 0 and line 17 is both", () => {
    const lines = form3801CRLines({ line4a: 1_000 }, inputs({ line6: 1_000 }));
    expect(lines.line7).toBe(0);
    expect(lines.line17).toBe(1_000);
  });

  it("line 17 is line 6 when only Worksheet 4 credits are above it", () => {
    const lines = form3801CRLines({ line4a: 5_000 }, inputs({ line6: 1_200 }));
    expect(lines.line7).toBe(3_800);
    expect(lines.line17).toBe(1_200);
  });

  it("a gap in line 6 is a gap on lines 7 and 17", () => {
    const lines = form3801CRLines({ line4a: 5_000 }, inputs({ line6: unsupported("tax") }));
    expect(isGap(lines.line7)).toBe(true);
    expect(isGap(lines.line17)).toBe(true);
  });
});

describe("Part II", () => {
  it("modified AGI of $100,000 gives the full $25,000 (line 12 cap)", () => {
    const lines = form3801CRLines({ line1a: 10_000 }, inputs({ magi: () => 100_000 }));
    expect(lines).toMatchObject({ line8: 10_000, line9: 150_000, line10: 100_000 });
    expect(lines).toMatchObject({ line11: 50_000, line12: 25_000, line14: 25_000 });
    expect(lines.line15).toBe(2_325);
    expect(lines.line16).toBe(2_325);
    expect(lines.line17).toBe(2_325);
  });

  it("modified AGI of $140,000: half of $10,000", () => {
    const lines = form3801CRLines({ line1a: 1_500 }, inputs({ magi: () => 140_000 }));
    expect(lines).toMatchObject({ line11: 10_000, line12: 5_000, line14: 5_000, line15: 465 });
    expect(lines.line16).toBe(465);
  });

  it("modified AGI at $150,000 skips lines 11 to 15 and enters 0 on line 16", () => {
    const lines = form3801CRLines({ line1a: 1_500 }, inputs({ magi: () => 150_000 }));
    expect(lines.line10).toBe(150_000);
    expect(lines.line11).toBeUndefined();
    expect(lines.line15).toBeUndefined();
    expect(lines.line16).toBe(0);
    expect(lines.line17).toBe(0);
  });

  it("$1 under the threshold leaves $0.50, rounded to $1 on line 12", () => {
    const lines = form3801CRLines({ line1a: 1_500 }, inputs({ magi: () => 149_999 }));
    expect(lines.line11).toBe(1);
    expect(lines.line12).toBe(1);
  });

  it("FTB 3801 line 9 on line 13 lowers line 14, not below 0", () => {
    const some = form3801CRLines({ line1a: 9_000 }, inputs({ form8582Line9: 9_000 }));
    expect(some).toMatchObject({ line12: 25_000, line13: 9_000, line14: 16_000, line15: 1_488 });
    const all = form3801CRLines({ line1a: 9_000 }, inputs({ form8582Line9: 30_000 }));
    expect(all.line14).toBe(0);
    expect(all.line16).toBe(0);
  });

  it("a separate return living apart: $75,000 and at most $12,500", () => {
    const lines = form3801CRLines({ line1a: 9_000 }, inputs({ mfsApart: true, magi: () => 0 }));
    expect(lines).toMatchObject({ line9: 75_000, line11: 75_000, line12: 12_500 });
  });

  it("a separate return living with the spouse skips Part II (line-9::b01)", () => {
    const lines = form3801CRLines({ line4a: 2_000 }, inputs({ livedWithSpouse: true }));
    expect(lines.line8).toBeUndefined();
    expect(lines.line17).toBe(0);
  });

  it("Part II is only for an amount on line 1c: the low-income housing credits get their offset on line 17", () => {
    const lines = form3801CRLines({ line2a: 3_000, line3a: 4_000 }, inputs());
    expect(lines.line8).toBeUndefined();
    expect(lines.line16).toBeUndefined();
    expect(lines.line17).toBe(7_000);
  });

  it("line 16 is never more than line 8", () => {
    const lines = form3801CRLines({ line1a: 300 }, inputs({ magi: () => 0 }));
    expect(lines.line15).toBe(2_325);
    expect(lines.line16).toBe(300);
  });

  it("a gap in modified AGI is a gap on line 16 and line 17", () => {
    const lines = form3801CRLines({ line1a: 300 }, inputs({ magi: () => unsupported("magi") }));
    expect(isGap(lines.line16)).toBe(true);
    expect(isGap(lines.line17)).toBe(true);
  });
});

describe("limits that need no source", () => {
  const cases: Array<[PartIAmounts, number]> = [
    [{ line1a: 4_000, line3b: 2_000, line4a: 1_000 }, 500],
    [{ line1b: 8_000, line2a: 1_000 }, 0],
    [{ line4a: 700 }, 5_000],
    [{ line1a: 30_000 }, 900],
  ];
  it.each(cases)("line 17 is never more than line 5 (%o, line 6 %d)", (amounts, line6) => {
    const lines = form3801CRLines(amounts, inputs({ line6, magi: () => 60_000 }));
    expect(lines.line17 as number).toBeLessThanOrEqual(lines.line5 as number);
    expect(lines.line17 as number).toBeGreaterThanOrEqual(Math.min(line6, lines.line5 as number));
  });

  it.each(cases)(
    "the housing offset is at most lines 2c and 3c and line 7 less line 16 (%o, line 6 %d)",
    (amounts, line6) => {
      const lines = form3801CRLines(amounts, inputs({ line6, magi: () => 60_000 }));
      const { line30, line36 } = lowIncomeHousingOffsetOf(lines);
      const offset = (line30 as number) + (line36 as number);
      const room = (lines.line7 as number) - ((lines.line16 as number | undefined) ?? 0);
      const housing =
        ((lines.line2c as number | undefined) ?? 0) + ((lines.line3c as number | undefined) ?? 0);
      expect(offset).toBeLessThanOrEqual(Math.max(0, room));
      expect(offset).toBeLessThanOrEqual(housing);
    },
  );
});
