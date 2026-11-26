/*
 * Form 8915-F arithmetic from the published examples of its instructions
 * (irs-8915f-inst-2025) and limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  QUALIFIED_DISASTER_LIMIT,
  allocateInDateOrder,
  line1,
  needsWorksheet1B,
  partIColumns,
  spreadOverThreeYears,
  worksheet1B,
  type DesignatedPiece,
  type LimitDisaster,
} from "../../../../src/federal/8915-f/lines.js";
import {
  distributionPeriodEnd,
  inDistributionPeriod,
  inHomePurchaseWindow,
  repaymentPeriodEnd,
} from "../../../../src/federal/8915-f/periods.js";

const disaster = (beginningDate: string, declarationDate: string, endingDate?: string) => ({
  femaNumber: "DR-0000-XX",
  beginningDate,
  declarationDate,
  endingDate,
});

const limitDisaster = (
  periodStart: string,
  periodEnd: string,
  earlier = 0,
  onEarlierForm = earlier > 0,
): LimitDisaster => ({ periodStart, periodEnd, earlier, onEarlierForm });

const ira = (amount: number, date: string): DesignatedPiece => ({
  line: "traditional",
  amount,
  date,
});

describe("Form 8915-F periods, the published dates", () => {
  // qualified-disaster-distribution-requirements::b05, its examples, and qualified-distribution-repayment-period::b01–b03.
  it.each([
    ["DR-4644-VA", "2022-01-02", "2022-03-11", "2023-06-26", "2023-06-27"],
    ["DR-4682-WA", "2022-11-03", "2023-01-12", "2023-07-10", "2023-07-11"],
    ["DR-4681", "2022-10-01", "2022-12-30", "2023-06-27", "2023-06-28"],
    ["DR-4685-GA", "2023-01-12", "2023-01-16", "2023-07-14", "2023-07-15"],
  ])("%s: distributions to %s, repayments to %s", (_, begins, declared, last, repay) => {
    expect(distributionPeriodEnd(disaster(begins, declared))).toBe(last);
    expect(repaymentPeriodEnd(disaster(begins, declared))).toBe(repay);
  });

  // Example 1A-1, Worksheet 1B Example 1, line 1e Example 2, the Form 8606 line 15b examples.
  it.each([
    ["DR-4696-ME", "2022-12-23", "2023-03-22", "2023-09-17"],
    ["DR-4719-ME", "2023-04-30", "2023-07-06", "2024-01-01"],
    ["DR-4737-ME", "2023-06-26", "2023-09-06", "2024-03-03"],
    ["DR-4694-NY", "2022-12-23", "2023-03-15", "2023-09-10"],
    ["DR-4865-AR", "2025-03-14", "2025-05-08", "2025-11-03"],
    ["DR-4798-TX", "2024-07-05", "2024-07-09", "2025-01-04"],
    ["DR-4879-TX", "2025-07-02", "2025-07-06", "2026-01-01"],
  ])("%s: the distribution period ends %s", (_, begins, declared, last) => {
    expect(distributionPeriodEnd(disaster(begins, declared))).toBe(last);
  });

  it("complete-part-iv…::b02, DR-4745-MT: repayments through April 8, 2024", () => {
    expect(repaymentPeriodEnd(disaster("2023-06-01", "2023-10-11"))).toBe("2024-04-08");
  });

  it("the period starts on the beginning date and ends on its last day", () => {
    const fire = disaster("2025-03-14", "2025-05-08");
    expect(inDistributionPeriod(fire, "2025-03-13")).toBe(false);
    expect(inDistributionPeriod(fire, "2025-03-14")).toBe(true);
    expect(inDistributionPeriod(fire, "2025-11-03")).toBe(true);
    expect(inDistributionPeriod(fire, "2025-11-04")).toBe(false);
  });

  it("Part IV: from 180 days before the first day to 30 days after the last day", () => {
    const flood = disaster("2025-06-01", "2025-06-10", "2025-06-20");
    expect(inHomePurchaseWindow(flood, "2024-12-02")).toBe(false);
    expect(inHomePurchaseWindow(flood, "2024-12-03")).toBe(true);
    expect(inHomePurchaseWindow(flood, "2025-07-20")).toBe(true);
    expect(inHomePurchaseWindow(flood, "2025-07-21")).toBe(false);
    expect(inHomePurchaseWindow({ ...flood, endingDate: undefined }, "2025-12-31")).toBe(true);
  });
});

describe("Form 8915-F lines 1a–1e, the published examples (line-1e::b01–b05)", () => {
  const fred = limitDisaster("2021-08-18", "2023-06-26", 10_000);

  it("Examples 1 and 3: one disaster on an earlier form, $10,000 earlier", () => {
    expect(line1([fred])).toEqual({
      line1a: 22_000,
      line1b: 10_000,
      line1c: 12_000,
      line1d: 0,
      line1e: 12_000,
    });
  });

  it("Example 2, second form: one disaster on no earlier form skips 1a–1d, 1e $22,000", () => {
    expect(line1([limitDisaster("2022-12-23", "2023-09-10")])).toEqual({ line1e: 22_000 });
  });

  it("Example 4: $5,000 + $2,000 earlier gives 1b $7,000 and 1e $15,000", () => {
    expect(line1([limitDisaster("2021-08-18", "2023-06-26", 7_000)])).toMatchObject({
      line1b: 7_000,
      line1c: 15_000,
      line1e: 15_000,
    });
  });

  it("lines-1a-through-1d::b02: two disasters on no earlier form leave 1a–1d blank", () => {
    const two = [
      limitDisaster("2023-03-01", "2023-09-01"),
      limitDisaster("2023-08-01", "2024-02-01"),
    ];
    expect(line1(two)).toEqual({ line1e: 2 * QUALIFIED_DISASTER_LIMIT });
  });

  it("an earlier disaster with nothing distributed still counts on line 1a", () => {
    const listed = limitDisaster("2024-01-01", "2024-07-01", 0, true);
    expect(line1([listed, limitDisaster("2024-03-01", "2024-09-01")])).toEqual({
      line1a: 22_000,
      line1b: 0,
      line1c: 22_000,
      line1d: 22_000,
      line1e: 44_000,
    });
  });
});

describe("Form 8915-F Worksheet 1B, the published examples (worksheet-1b::b03–b16)", () => {
  const maine1 = limitDisaster("2023-04-30", "2024-01-01");
  const maine2 = limitDisaster("2023-06-26", "2024-03-03");

  it("Example 1: $30,000 on 09/08/2023 → $22,000 and $8,000", () => {
    const pieces = [ira(30_000, "2023-09-08")];
    expect(needsWorksheet1B([maine1, maine2], pieces)).toBe(false);
    expect(worksheet1B([maine1, maine2], pieces)).toEqual([30_000]);
  });

  it("Example 2: $30,000 on 05/01 and $14,000 on 09/17 → $22,000 and $14,000", () => {
    const pieces = [ira(30_000, "2023-05-01"), ira(14_000, "2023-09-17")];
    expect(needsWorksheet1B([maine1, maine2], pieces)).toBe(true);
    expect(worksheet1B([maine1, maine2], pieces)).toEqual([22_000, 14_000]);
  });

  it("Example 3: $20,000 used in 2022 leaves $2,000; $40,000 → $2,000 and $22,000", () => {
    const pr1 = limitDisaster("2022-02-04", "2023-06-26", 20_000);
    const pr2 = limitDisaster("2022-09-17", "2023-06-26");
    expect(worksheet1B([pr1, pr2], [ira(40_000, "2023-05-09")])).toEqual([24_000]);
  });

  it("a disaster at $22,000 already takes nothing", () => {
    const used = limitDisaster("2023-01-01", "2023-12-31", 22_000);
    const open = limitDisaster("2023-02-01", "2023-12-31");
    expect(worksheet1B([used, open], [ira(30_000, "2023-06-01")])).toEqual([22_000]);
  });
});

describe("Form 8915-F lines 2–7", () => {
  const none = { plan: 0, traditional: 0, roth: 0 };

  it("line-7::b01: $40,000 IRA, $22,000 qualified → line 7 $18,000", () => {
    const pieces = [ira(40_000, "2023-05-09")];
    const qualified = allocateInDateOrder(pieces, 22_000);
    const columns = partIColumns({
      columnA: { ...none, traditional: 40_000 },
      pieces,
      qualified,
      line1e: 22_000,
      line28: 0,
    });
    expect(columns).toMatchObject({
      line5a: 0,
      line5bColumnA: 40_000,
      line6: 22_000,
      line7: 18_000,
    });
    expect(columns.columnB).toEqual({ ...none, traditional: 22_000 });
  });

  it("line-7::b04: with $10,000 of it on Part IV line 28, line 7 is $8,000", () => {
    const pieces = [ira(30_000, "2023-05-09")];
    const columns = partIColumns({
      columnA: { ...none, traditional: 40_000 },
      pieces,
      qualified: allocateInDateOrder(pieces, 22_000),
      line1e: 22_000,
      line28: 10_000,
    });
    expect(columns.line7).toBe(8_000);
  });

  it("line 5b column (b) is the smaller of 5b column (a) and line 1e, and lines 2–4 (b) add to it", () => {
    const pieces: DesignatedPiece[] = [
      { line: "plan", amount: 15_000, date: "2025-02-14" },
      ira(25_000, "2025-03-03"),
    ];
    for (const limit of [0, 10_000, 36_000, 40_000, 60_000]) {
      const qualified = allocateInDateOrder(pieces, limit);
      const columns = partIColumns({
        columnA: { plan: 27_000, traditional: 25_000, roth: 0 },
        pieces,
        qualified,
        line1e: limit === 0 ? undefined : limit,
        line28: 0,
      });
      const columnB = columns.columnB ?? none;
      expect(columns.line5bColumnB).toBe(Math.min(40_000, limit));
      expect(columnB.plan + columnB.traditional + columnB.roth).toBe(columns.line5bColumnB);
      expect(columns.line6).toBe(columns.line5bColumnB);
    }
  });

  it("the date order applies the earliest distribution first", () => {
    const pieces = [
      ira(25_000, "2025-03-03"),
      { line: "plan" as const, amount: 15_000, date: "2025-02-14" },
    ];
    expect(allocateInDateOrder(pieces, 36_000)).toEqual([21_000, 15_000]);
  });

  it("line 1e of 0: column (b) and line 5 blank, line 6 is 0", () => {
    const columns = partIColumns({
      columnA: { ...none, plan: 9_000 },
      pieces: [{ line: "plan", amount: 9_000, date: "2025-01-02" }],
      qualified: [0],
      line1e: 0,
      line28: 0,
    });
    expect(columns).toEqual({ columnA: { ...none, plan: 9_000 }, line6: 0, line7: 9_000 });
  });
});

describe("Form 8915-F lines 11 and 22: the 3-year spread", () => {
  it("file-form-1040-x…::b02–b03, Example 3: $21,000 spread is $7,000 a year", () => {
    expect(spreadOverThreeYears(21_000, false)).toBe(7_000);
  });

  it("a third rounds to the nearest dollar; with the box checked the whole amount", () => {
    expect(spreadOverThreeYears(13_801, false)).toBe(4_600);
    expect(spreadOverThreeYears(13_802, false)).toBe(4_601);
    expect(spreadOverThreeYears(13_800, true)).toBe(13_800);
  });
});
