/*
 * FTB 3805V's reads of the return (figures.ts, sectionAReads.ts): the
 * business and nonbusiness sort, the gaps, the itemized adjustment and the
 * suspension test, on small hand-made reads. The base is the made-up taxpayer
 * masema (tests/scenarios/synthetic/masema).
 */

import { describe, expect, it } from "vitest";
import type { CaNolCarryoverRow } from "../../../../../src/facts/index.js";
import {
  carryoverDeductions,
  deductionOf,
  ITEMIZED_REFIGURE_GAP,
  itemizedAdjustment,
  suspendedOf,
  type Info,
  type Read,
} from "../../../../../src/state/ca/3805v/figures.js";
import { FORM_540NR_GAP } from "../../../../../src/state/ca/3805v/resolveInfo.js";
import {
  CAPITAL_LIST_GAP,
  DISASTER_2025_GAP,
  sectionALinesOf,
} from "../../../../../src/state/ca/3805v/sectionAReads.js";
import {
  SECTION_1231_ROW,
  type ScheduleDCaFigures,
} from "../../../../../src/state/ca/schedule-d-ca/lines.js";
import type { Unsupported } from "../../../../../src/types.js";

const ROWS: CaNolCarryoverRow[] = [
  { yearOfLoss: 2020, type: "GEN", initialLoss: 95000, carryoverFrom2024: 68000 },
  { yearOfLoss: 2018, code: "107", type: "DIS", initialLoss: 40000, carryoverFrom2024: 22000 },
];

const CAPITAL: ScheduleDCaFigures = {
  gap: undefined,
  line1: [],
  line3: 600,
  line4: 4600,
  line5: 9000,
  line6: undefined,
  line7: 9000,
  line8: -4400,
  line9: 3000,
  line11: -3000,
};

const info = (
  change: Partial<NonNullable<Info["form3805v"]>> = {},
  extra: Partial<Info> = {},
): Info => ({
  mustFile: {},
  filingStatus: "single",
  increasedStandardDeduction: false,
  form3805v: { priorRows: ROWS, capital: CAPITAL, lossFromPassThrough: false, ...change },
  ...extra,
});

const READ: Read = {
  "form-1040.line.11b": 81300,
  "form-540.line.17_ca_agi": 2706,
  "form-540.line.18_deductions": 5706,
  "schedule-ca.0.line.2b_federal": 900,
  "schedule-ca.0.line.3b_federal": 1400,
  "schedule-ca.0.line.7a_federal": -3000,
};

const gapOf = (value: unknown) => (value as Unsupported).reason;

function lines(read: Read = READ, figures: Info = info()) {
  const result = sectionALinesOf(read, figures);
  if (result === undefined || "unsupported" in result) throw new Error("Section A did not figure");
  return result;
}

describe("Section A reads", () => {
  it("masema: interest and dividends are nonbusiness income, the standard deduction a nonbusiness deduction", () => {
    expect(lines()).toMatchObject({
      line4: 9000,
      line5: 4600,
      line8: 5706,
      line9: 2300,
      line23: 78594,
    });
  });

  it("gambling winnings count as nonbusiness income (line 8b)", () => {
    const read = {
      ...READ,
      "schedule-ca.2.line.b9a_federal": 700,
      "schedule-ca.1.line.b8b_federal": 700,
    };
    expect(lines(read).line9).toBe(3000);
  });

  it("other income the instructions do not sort is a gap on line 9", () => {
    const read = {
      ...READ,
      "schedule-ca.2.line.b9a_federal": 500,
      "schedule-ca.1.line.b8c_federal": 500,
    };
    expect(gapOf(lines(read).line9)).toMatch(/does not sort|do not sort/);
    expect(lines(read).line6).toBe(4400);
  });

  it("an IRA deduction is a nonbusiness deduction; self-employment tax is not", () => {
    const read = {
      ...READ,
      "schedule-1.1.line.26": 7500,
      "schedule-ca.3.line.c26_federal": 7500,
      "schedule-ca.2.line.c20_federal": 7000,
      "schedule-ca.2.line.c15_federal": 500,
    };
    expect(lines(read).line8).toBe(12706);
  });

  it("an itemizer's unreimbursed employee expenses are a gap on line 8", () => {
    const read = {
      ...READ,
      "schedule-ca.5.page2.total_itemized_29": 5706,
      "schedule-ca.5.page2.job_expenses_19": 900,
    };
    expect(gapOf(lines(read).line8)).toMatch(/employee expenses/);
  });

  it("an itemizer's casualty loss: line 3b is the gap and stops Part I", () => {
    const read = {
      ...READ,
      "schedule-ca.5.page2.total_itemized_29": 5706,
      "schedule-ca.5.page2.casualty_15_federal": 2000,
    };
    expect(gapOf(lines(read).line3b)).toBe(DISASTER_2025_GAP);
    expect(lines(read).line4).toBeUndefined();
  });

  it("a Schedule D-1 section 1231 gain is a business capital gain", () => {
    const row = {
      description: SECTION_1231_ROW,
      salesPrice: undefined,
      basis: undefined,
      loss: undefined,
      gain: 1500,
      gap: undefined,
      waits: false,
    };
    const capital = { ...CAPITAL, line1: [row], line4: 6100, line8: -2900, line11: -2900 };
    const read = { ...READ, "schedule-ca.0.line.7a_federal": -2900 };
    expect(lines(read, info({ capital }))).toMatchObject({ line5: 4600, line14: 1500 });
  });

  it("a capital amount Schedule D (540) does not list is a gap on lines 4 to 19", () => {
    const read = { ...READ, "schedule-ca.0.line.7a_federal": -1000 };
    expect(gapOf(lines(read).line4)).toBe(CAPITAL_LIST_GAP);
    expect(gapOf(lines(read).line19)).toBe(CAPITAL_LIST_GAP);
  });

  it("Form 540NR: Section A is blank and the carryovers are the gap", () => {
    const figures = info({ gap: FORM_540NR_GAP });
    expect(sectionALinesOf(READ, figures)).toBeUndefined();
    expect(gapOf(carryoverDeductions(READ, figures))).toBe(FORM_540NR_GAP);
  });

  it("with the federal increased standard deduction, line 18 is a gap", () => {
    const read = { ...READ, "form-540.line.18_deductions": undefined };
    expect(gapOf(deductionOf(read, info({}, { increasedStandardDeduction: true })))).toMatch(
      /increased standard/,
    );
  });
});

describe("Part II line 5, the itemized adjustment", () => {
  const itemizing = { ...READ, "schedule-ca.5.page2.total_itemized_29": 5706 };

  it("0 without itemized deductions or without a capital loss deduction", () => {
    expect(itemizedAdjustment(READ, info(), 5706, 3000)).toBe(0);
    expect(itemizedAdjustment(itemizing, info(), 5706, 0)).toBe(0);
  });

  it("0 when no itemized deduction depends on AGI", () => {
    expect(itemizedAdjustment(itemizing, info(), 5706, 3000)).toBe(0);
  });

  it.each([
    ["medical expenses", { "schedule-a.0.line.4_net_medical_dental": 1200 }],
    ["the 2% floor", { "schedule-ca.5.page2.job_expenses_22_total": 400 }],
    ["gifts above 20% of AGI", { "schedule-a.0.line.14_total_gifts": 20000 }],
    ["the itemized deduction limitation", { "form-1040.line.11b": 251000 }],
  ])("the gap with %s", (_, change) => {
    expect(gapOf(itemizedAdjustment({ ...itemizing, ...change }, info(), 5706, 3000))).toBe(
      ITEMIZED_REFIGURE_GAP,
    );
  });
});

describe("the suspension test", () => {
  const high = { "form-1040.line.11b": 1_200_000, "schedule-ca.0.line.b3_federal": 1_100_000 };

  it("not read below $1,000,000 of modified AGI", () => {
    expect(suspendedOf({ ...high, "form-1040.line.11b": 999_999 }, info())).toBe(false);
  });

  it("business income and modified AGI each $1,000,000 or more: suspended", () => {
    expect(suspendedOf(high, info())).toBe(true);
  });

  it("business income below $1,000,000: not suspended", () => {
    expect(suspendedOf({ ...high, "schedule-ca.0.line.b3_federal": 900_000 }, info())).toBe(false);
  });

  it("Schedule E lines 26, 32 and 40 count", () => {
    const read = {
      ...high,
      "schedule-ca.0.line.b3_federal": 600_000,
      "schedule-e.0.line.26_total_income_or_loss": 400_000,
    };
    expect(suspendedOf(read, info())).toBe(true);
  });

  it("a California adjustment on Schedule CA line 5 is a gap", () => {
    expect(
      gapOf(suspendedOf({ ...high, "schedule-ca.0.line.b5_subtractions": 10 }, info())),
    ).toMatch(/Schedule CA line 5/);
  });
});
