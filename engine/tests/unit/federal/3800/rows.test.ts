/*
 * Form 3800 rows, the order of use and the limits on single lines: the
 * allocation (first in, first out), the research credit limitation, the caps of
 * lines 1e and 1k, and the columns of one Part III or Part IV row.
 */

import { describe, expect, it } from "vitest";
import { allocate, claimOf } from "../../../../src/federal/3800/allocation.js";
import { isGap } from "../../../../src/federal/3800/cells.js";
import type { Carryover, CurrentCredit } from "../../../../src/federal/3800/credits.js";
import {
  CHILDCARE_CAP,
  DISABLED_ACCESS_CAP,
  capped,
  researchLimits,
} from "../../../../src/federal/3800/currentCredits.js";
import { partIIIColumns, partIVColumns } from "../../../../src/federal/3800/rowLines.js";
import { PART_III_ROWS, PART_IV_ROWS, rankOf } from "../../../../src/federal/3800/rows.js";

const credit = (
  line: string,
  amount: number,
  extra: Partial<CurrentCredit> = {},
): CurrentCredit => ({
  line,
  key: `credit-${line}-${amount}`,
  amount,
  passive: false,
  ...extra,
});

const carryover = (
  line: string,
  originYear: number,
  amount: number,
  extra: Partial<Carryover> = {},
): Carryover => ({
  line,
  key: `carry-${line}-${originYear}`,
  originYear,
  amount,
  passive: false,
  changed: false,
  ...extra,
});

describe("the row tables", () => {
  it("hold every Part III and Part IV line once, in form order", () => {
    const lines = (rows: ReadonlyArray<{ line: string }>) => rows.map((row) => row.line);
    expect(new Set(lines(PART_III_ROWS)).size).toBe(PART_III_ROWS.length);
    expect(new Set(lines(PART_IV_ROWS)).size).toBe(PART_IV_ROWS.length);
    expect(PART_III_ROWS).toHaveLength(45);
    // 32 lines 1a–1zz, 25 lines 2a–2zz, line 3, and 13 lines 4a–4k, 4y, 4z.
    expect(PART_IV_ROWS).toHaveLength(71);
  });

  it("rank the investment credit first and the electing large partnership last of the listed credits (credit-ordering-rule::b02 to ::b04)", () => {
    expect(rankOf("4k")).toBeLessThan(rankOf("4a"));
    expect(rankOf("4b")).toBeLessThan(rankOf("1c"));
    expect(rankOf("1e")).toBeLessThan(rankOf("1s"));
    expect(rankOf("1ee")).toBeLessThan(rankOf("2i"));
    expect(rankOf("2i")).toBeLessThan(rankOf("1zz"));
  });
});

describe("the allocation: first in, first out (credit-ordering-rule::b01)", () => {
  it("uses carryforwards, the earliest first, then this year's credits, then a carryback", () => {
    const old = carryover("1e", 2021, 1_000);
    const newer = carryover("1e", 2024, 1_000);
    const current = credit("1e", 1_000);
    const back = carryover("1e", 2026, 1_000);
    const used = allocate(
      [back, current, newer, old].map((source) => claimOf(source, 1_000)),
      2_500,
    );
    expect(used.get(old)).toBe(1_000);
    expect(used.get(newer)).toBe(1_000);
    expect(used.get(current)).toBe(500);
    expect(used.get(back)).toBe(0);
  });

  it("uses the credits of one year in the order of use", () => {
    const research = credit("1c", 4_000);
    const access = credit("1e", 4_000);
    const used = allocate(
      [access, research].map((source) => claimOf(source, 4_000)),
      5_000,
    );
    expect(used.get(research)).toBe(4_000);
    expect(used.get(access)).toBe(1_000);
  });

  it("never uses more than the limit or than a credit holds, and uses all it can", () => {
    for (const limit of [0, 700, 3_000, 9_999, 50_000]) {
      const sources = [credit("1b", 1_200), credit("1h", 2_500), carryover("1h", 2020, 3_100)];
      const used = allocate(
        sources.map((source) => claimOf(source, source.amount as number)),
        limit,
      );
      const total = [...used.values()].reduce((left: number, right) => left + (right as number), 0);
      expect(total).toBe(Math.min(limit, 6_800));
      for (const source of sources)
        expect(used.get(source) as number).toBeLessThanOrEqual(source.amount as number);
    }
  });

  it("is a gap for every source when the limit is one", () => {
    const sources = [credit("1b", 1_200)];
    const used = allocate(
      sources.map((source) => claimOf(source, 1_200)),
      { unsupported: true, reason: "x" } as never,
    );
    expect(isGap(used.get(sources[0]))).toBe(true);
  });
});

describe("the research credit limitation (lines-1c-and-4i::b01, ::b02)", () => {
  it("is line 11 times the source's share of taxable income", () => {
    expect(researchLimits(50_000, 200_000, [40_000])).toEqual([10_000]);
  });

  it("scales the fractions down when they add to more than 1", () => {
    expect(researchLimits(30_000, 100_000, [80_000, 40_000])).toEqual([20_000, 10_000]);
  });

  it("allows nothing with no taxable income, or with a loss from the source", () => {
    expect(researchLimits(30_000, 0, [10_000])).toEqual([0]);
    expect(researchLimits(30_000, 100_000, [-5_000])).toEqual([0]);
  });
});

describe("the caps of lines 1e and 1k (limitation-on-certain-credits-reported-in-part-iii::b01)", () => {
  it("shares $5,000 of disabled access credit pro rata, the rest lost", () => {
    const shares = capped([credit("1e", 3_000), credit("1e", 4_000)]).map((each) => each.amount);
    expect(shares).toEqual([2_143, 2_857]);
    expect((shares as number[]).reduce((left, right) => left + right)).toBe(DISABLED_ACCESS_CAP);
  });

  it("leaves a line under its cap and other lines alone", () => {
    const kept = capped([credit("1e", 2_000), credit("1k", CHILDCARE_CAP), credit("1b", 900_000)]);
    expect(kept.map((each) => each.amount)).toEqual([2_000, CHILDCARE_CAP, 900_000]);
  });

  it("caps the childcare credit at $150,000", () => {
    expect(capped([credit("1k", 200_000)])[0].amount).toBe(CHILDCARE_CAP);
  });
});

describe("one Part III row", () => {
  it("adds the non-passive sources in column (e), and (g) is (e) plus (f)", () => {
    const sold = credit("1f", 9_000, {
      transfer: { direction: "sold", amount: 4_000, registrationNumber: "RG-25-0001" },
    });
    const row = partIIIColumns([sold, credit("1f", 1_000, { ein: "00-0000001" })]);
    expect(row).toMatchObject({
      a: 2,
      b: "RG-25-0001",
      c: "00-0000001",
      e: 10_000,
      f: -4_000,
      g: 6_000,
    });
    expect(row.d).toBeUndefined();
  });

  it("puts a passive source in column (d), and column (g) needs Form 8582-CR", () => {
    const row = partIIIColumns([credit("4d", 5_000, { passive: true })]);
    expect(row.d).toBe(5_000);
    expect(row.e).toBeUndefined();
    expect(isGap(row.g)).toBe(true);
  });

  it("names the pass-through entity that allocated the most in column (c)", () => {
    const row = partIIIColumns([
      credit("1e", 300, { ein: "00-0000001" }),
      credit("1e", 900, { ein: "00-0000002" }),
    ]);
    expect(row.c).toBe("00-0000002");
  });

  it("makes columns (h) and (j) gaps with an elective payment election", () => {
    const row = partIIIColumns([
      credit("1b", 5_000, { electivePayment: { amount: 5_000, registrationNumber: "EP-1" } }),
    ]);
    expect(isGap(row.h)).toBe(true);
    expect(isGap(row.j)).toBe(true);
    expect(row.b).toBe("EP-1");
  });
});

describe("one Part IV row", () => {
  it("prints the latest originating year and counts the sources", () => {
    const row = partIVColumns([
      carryover("1e", 2022, 900),
      carryover("1e", 2023, 1_100, { recaptured: 100 }),
    ]);
    expect(row).toMatchObject({ a: 2, b: 2023, f: 2_000, h: 100 });
  });

  it("makes column (e) a gap for a passive carryover", () => {
    const row = partIVColumns([carryover("1h", 2020, 700, { passive: true })]);
    expect(row.d).toBe(700);
    expect(isGap(row.e)).toBe(true);
  });
});
