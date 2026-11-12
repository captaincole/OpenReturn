/*
 * Source: 2025 Instructions for Form 8582 (irs-8582-inst-2025), Parts VI–VIII.
 * Every expected value is worked by hand from the instructions, not from the code:
 * - part-vi::b02–b04: Part VI lists Part IV's overall losses; ratios total 1.00;
 *   column (c) totals line 9; column (d) only when (c) is less than (a).
 * - part-vii-allocation-of-unallowed-losses::b01–b02: Part VII lists Part VI
 *   column (d) (or Part IV column (e) without Part VI) and Part V column (e);
 *   column (c) shares line C (line 3 as a positive amount, less line 9).
 * - part-viii-allowed-losses::b01–b02: column (a) is columns (b) and (c) of Parts
 *   IV and V; column (c) is (a) less Part VII column (c).
 * - how-to-report-allowed-losses::b01: line 3 income or zero allows every loss.
 * Line 9 is the smaller of line 4 and line 8 (line-4::b01, line-9::b01); line 8 is
 * half of $150,000 less modified AGI, at most $25,000 ($75,000 and $12,500 for
 * MFS spouses who lived apart all year: line-5::b01, line-8::b01).
 */

import { describe, expect, it } from "vitest";
import {
  type ActivityPart,
  type PassiveActivities,
  type PassiveActivity,
} from "../../../../src/federal/8582/activities.js";
import { allocateLosses, type LossAllocation } from "../../../../src/federal/8582/allocation.js";
import type { PropertyColumn } from "../../../../src/federal/schedule-e/filingInfo.js";

type Amounts = Partial<Pick<PassiveActivity, "netIncome" | "netLoss" | "priorUnallowedLoss">>;

const row = (
  factKey: string,
  column: PropertyColumn,
  part: ActivityPart,
  amounts: Amounts,
): PassiveActivity => ({
  factKey,
  column,
  part,
  name: factKey,
  netIncome: amounts.netIncome ?? 0,
  netLoss: amounts.netLoss ?? 0,
  priorUnallowedLoss: amounts.priorUnallowedLoss ?? 0,
});

const parts = (...rows: PassiveActivity[]): PassiveActivities => ({
  part4: rows.filter((entry) => entry.part === "part4"),
  part5: rows.filter((entry) => entry.part === "part5"),
});

const ref = (factKey: string, column: PropertyColumn) => ({ factKey, column, name: factKey });

/* A ratio column as numbers, for the 1.00 total check. */
const ratioTotal = (rows: Array<{ ratio: string }>) =>
  rows.reduce((total, entry) => total + Number(entry.ratio), 0);

const total = (values: number[]) => values.reduce((sum, value) => sum + value, 0);

interface Case {
  label: string;
  activities: PassiveActivities;
  line3: number;
  line9: number;
  expected: LossAllocation;
}

const cases: Case[] = [
  {
    /*
     * Part IV: A loss 6,000; B gain 2,000. Part V: C loss 3,000 + prior 1,000.
     * Line 1d −4,000, 2d −4,000, line 3 −8,000. MAGI $160,000: line 8 is 0, so line 9 is 0.
     * No Part VI. Part VII: A 6,000 and C 4,000 of 10,000 (0.60000, 0.40000).
     * Line C 8,000: A 4,800, C 3,200. Allowed 1,200 + 800 = 2,000 = line 11 (line 10's 2,000).
     */
    label: "Parts IV and V without a special allowance",
    activities: parts(
      row("A", "a", "part4", { netLoss: 6000 }),
      row("B", "b", "part4", { netIncome: 2000 }),
      row("C", "c", "part5", { netLoss: 3000, priorUnallowedLoss: 1000 }),
    ),
    line3: -8000,
    line9: 0,
    expected: {
      part6: undefined,
      part7: [
        { ...ref("A", "a"), loss: 6000, ratio: "0.60000", unallowed: 4800 },
        { ...ref("C", "c"), loss: 4000, ratio: "0.40000", unallowed: 3200 },
      ],
      part8: [
        { ...ref("A", "a"), loss: 6000, unallowed: 4800, allowed: 1200 },
        { ...ref("C", "c"), loss: 4000, unallowed: 3200, allowed: 800 },
      ],
    },
  },
  {
    /*
     * Part IV: A 7,000 + prior 2,000 = 9,000; B 6,000. Part V: C 5,000.
     * Line 1d −15,000, line 3 −20,000, line 4 15,000. MAGI $130,000: line 8 10,000 = line 9.
     * Part VI: 0.60000 and 0.40000 of 10,000 = 6,000 and 4,000; column (d) 3,000 and 2,000.
     * Part VII: 3,000 + 2,000 + 5,000 = 10,000 (0.30000, 0.20000, 0.50000); line C 10,000.
     */
    label: "a special allowance that allows part of Part IV's losses",
    activities: parts(
      row("A", "a", "part4", { netLoss: 7000, priorUnallowedLoss: 2000 }),
      row("B", "b", "part4", { netLoss: 6000 }),
      row("C", "c", "part5", { netLoss: 5000 }),
    ),
    line3: -20000,
    line9: 10000,
    expected: {
      part6: [
        { ...ref("A", "a"), loss: 9000, ratio: "0.60000", allowance: 6000, remaining: 3000 },
        { ...ref("B", "b"), loss: 6000, ratio: "0.40000", allowance: 4000, remaining: 2000 },
      ],
      part7: [
        { ...ref("A", "a"), loss: 3000, ratio: "0.30000", unallowed: 3000 },
        { ...ref("B", "b"), loss: 2000, ratio: "0.20000", unallowed: 2000 },
        { ...ref("C", "c"), loss: 5000, ratio: "0.50000", unallowed: 5000 },
      ],
      part8: [
        { ...ref("A", "a"), loss: 9000, unallowed: 3000, allowed: 6000 },
        { ...ref("B", "b"), loss: 6000, unallowed: 2000, allowed: 4000 },
        { ...ref("C", "c"), loss: 5000, unallowed: 5000, allowed: 0 },
      ],
    },
  },
  {
    /*
     * Part IV: A loss 9,000; B gain 1,000 (not in Part VI). Part V: C loss 2,000.
     * Line 1d −8,000, line 3 −10,000, line 4 8,000. MAGI $140,000: line 8 5,000 = line 9.
     * Part VI: A alone, 1.00000, 5,000; column (d) 4,000.
     * Part VII: 4,000 and 2,000 of 6,000: 2/3 → 0.66667, 1/3 → 0.33333.
     * Line C 5,000: 3,333.33 → 3,333 and 1,666.67 → 1,667 (total 5,000).
     */
    label: "a Part IV gain left out of Part VI, with ratios that round",
    activities: parts(
      row("A", "a", "part4", { netLoss: 9000 }),
      row("B", "b", "part4", { netIncome: 1000 }),
      row("C", "c", "part5", { netLoss: 2000 }),
    ),
    line3: -10000,
    line9: 5000,
    expected: {
      part6: [{ ...ref("A", "a"), loss: 9000, ratio: "1.00000", allowance: 5000, remaining: 4000 }],
      part7: [
        { ...ref("A", "a"), loss: 4000, ratio: "0.66667", unallowed: 3333 },
        { ...ref("C", "c"), loss: 2000, ratio: "0.33333", unallowed: 1667 },
      ],
      part8: [
        { ...ref("A", "a"), loss: 9000, unallowed: 3333, allowed: 5667 },
        { ...ref("C", "c"), loss: 2000, unallowed: 1667, allowed: 333 },
      ],
    },
  },
  {
    /*
     * Part V: 1,000, 2,000 and 4,000 of 7,000: 0.142857 → 0.14286, 0.285714 → 0.28571,
     * 0.571429 → 0.57143 (total 1.00000). Line 3 −7,000 with B's 2,000 income in Part IV:
     * line 3 −5,000, line 1d +2,000 (Part II skipped, line 9 0). Line C 5,000:
     * 714.29 → 714, 1,428.57 → 1,429, 2,857.14 → 2,857 (total 5,000).
     */
    label: "Part V losses in sevenths, beside Part IV income",
    activities: parts(
      row("B", "b", "part4", { netIncome: 2000 }),
      row("A", "a", "part5", { netLoss: 1000 }),
      row("C", "c", "part5", { netLoss: 2000 }),
      row("D", "c", "part5", { netLoss: 4000 }),
    ),
    line3: -5000,
    line9: 0,
    expected: {
      part6: undefined,
      part7: [
        { ...ref("A", "a"), loss: 1000, ratio: "0.14286", unallowed: 714 },
        { ...ref("C", "c"), loss: 2000, ratio: "0.28571", unallowed: 1429 },
        { ...ref("D", "c"), loss: 4000, ratio: "0.57143", unallowed: 2857 },
      ],
      part8: [
        { ...ref("A", "a"), loss: 1000, unallowed: 714, allowed: 286 },
        { ...ref("C", "c"), loss: 2000, unallowed: 1429, allowed: 571 },
        { ...ref("D", "c"), loss: 4000, unallowed: 2857, allowed: 1143 },
      ],
    },
  },
  {
    /*
     * MFS, lived apart all year: Part IV A loss 20,000. Line 3 −20,000, line 4 20,000.
     * MAGI $50,000: line 5 75,000, line 7 25,000, half 12,500, cap 12,500: line 9 12,500.
     * Part VI 1.00000, 12,500; column (d) 7,500. Part VII 1.00000; line C 7,500.
     */
    label: "married filing separately, lived apart: the $12,500 cap",
    activities: parts(row("A", "a", "part4", { netLoss: 20000 })),
    line3: -20000,
    line9: 12500,
    expected: {
      part6: [
        { ...ref("A", "a"), loss: 20000, ratio: "1.00000", allowance: 12500, remaining: 7500 },
      ],
      part7: [{ ...ref("A", "a"), loss: 7500, ratio: "1.00000", unallowed: 7500 }],
      part8: [{ ...ref("A", "a"), loss: 20000, unallowed: 7500, allowed: 12500 }],
    },
  },
  {
    /*
     * Part IV A loss 8,000. MAGI $100,000: line 8 25,000; line 4 8,000 = line 9.
     * Part VI column (c) equals column (a): no column (d), nothing in Part VII (part-vi::b03).
     */
    label: "a special allowance that allows every loss",
    activities: parts(row("A", "a", "part4", { netLoss: 8000 })),
    line3: -8000,
    line9: 8000,
    expected: {
      part6: [{ ...ref("A", "a"), loss: 8000, ratio: "1.00000", allowance: 8000 }],
      part7: [],
      part8: [],
    },
  },
  {
    // Line 3 income: every loss is allowed (how-to-report-allowed-losses::b01).
    label: "line 3 is income",
    activities: parts(
      row("A", "a", "part4", { netLoss: 3000 }),
      row("B", "b", "part5", { netIncome: 5000 }),
    ),
    line3: 2000,
    line9: 0,
    expected: { part7: [], part8: [] },
  },
];

describe("Form 8582 Parts VI–VIII (allocateLosses)", () => {
  it.each(cases)("$label", ({ activities, line3, line9, expected }) => {
    expect(allocateLosses(activities, line3, line9)).toEqual(expected);
  });

  it.each(cases)("$label: the columns total as the instructions say", (entry) => {
    const allocation = allocateLosses(entry.activities, entry.line3, entry.line9);
    const lineC = -entry.line3 - entry.line9;
    if (allocation?.part6?.length) {
      expect(ratioTotal(allocation.part6)).toBeCloseTo(1, 5);
      expect(total(allocation.part6.map((part6) => part6.allowance))).toBe(entry.line9);
    }
    if (allocation?.part7.length) {
      expect(allocation.part7.every((part7) => /^\d\.\d{5}$/.test(part7.ratio))).toBe(true);
      expect(ratioTotal(allocation.part7)).toBeCloseTo(1, 5);
      expect(total(allocation.part7.map((part7) => part7.unallowed))).toBe(lineC);
    }
  });

  it("shares a line C of 2,000 among three equal losses so the column totals 2,000", () => {
    // Three thirds of 2,000 are 666.67 each; rounded alone they total 2,001 (part-vii::b02).
    const activities = parts(
      row("B", "b", "part4", { netIncome: 1000 }),
      row("A", "a", "part5", { netLoss: 1000 }),
      row("C", "c", "part5", { netLoss: 1000 }),
      row("D", "c", "part5", { netLoss: 1000 }),
    );
    const allocation = allocateLosses(activities, -2000, 0);
    const part7 = allocation?.part7 ?? [];
    expect(part7.map((entry) => entry.loss)).toEqual([1000, 1000, 1000]);
    expect(ratioTotal(part7)).toBeCloseTo(1, 5);
    for (const entry of part7) expect(Number(entry.ratio)).toBeCloseTo(1 / 3, 4);
    expect(total(part7.map((entry) => entry.unallowed))).toBe(2000);
    for (const entry of part7) expect(Math.abs(entry.unallowed - 2000 / 3)).toBeLessThan(1);
  });

  it.each([
    ["no parts yet", undefined, -1000, 0],
    ["line 3 blank", parts(row("A", "a", "part5", { netLoss: 1000 })), undefined, 0],
    [
      "line 9 blank with a Part IV loss",
      parts(row("A", "a", "part4", { netLoss: 1000 })),
      -1000,
      undefined,
    ],
  ] as Array<[string, PassiveActivities | undefined, number | undefined, number | undefined]>)(
    "waits: %s",
    (_, activities, line3, line9) => {
      expect(allocateLosses(activities, line3, line9)).toBeUndefined();
    },
  );
});
