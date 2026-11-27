/*
 * Schedule J's arithmetic: the published examples with numbers (the
 * Schedule J instructions' Taxable Income Worksheet examples, the examples of
 * regulation section 1.1301-1), then limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  makeFarmAveragingBaseYearFactKey,
  type FarmAveragingBaseYearFactValue,
} from "../../../../src/facts/index.js";
import { baseYears, type BaseYear } from "../../../../src/federal/schedule-j/baseYears.js";
import { baseYearTax } from "../../../../src/federal/schedule-j/baseYearTax.js";
import {
  baseYearShare,
  combinedWithShare,
  isGap,
  line17,
  line22,
  line23,
  line2a,
  line2b,
  line2c,
  line3,
  line6,
  line7,
  noTaxOn,
  taxableIncomeWorksheet,
  totalOf,
} from "../../../../src/federal/schedule-j/lines.js";
import type { ResolverInputs } from "../../../../src/resolverInputs.js";

const NO_SHARE = { netCapitalGain: 0, unrecapturedSection1250Gain: 0 };

/* ResolverInputs with only the base-year facts: baseYears reads nothing else. */
const inputsWith = (years: Record<number, FarmAveragingBaseYearFactValue>) =>
  ({
    factByKey: new Map(
      Object.entries(years).map(([year, value]) => [
        makeFarmAveragingBaseYearFactKey(Number(year)),
        value,
      ]),
    ),
  }) as unknown as ResolverInputs;

const base = (year: 2022 | 2023 | 2024, fact: FarmAveragingBaseYearFactValue): BaseYear => ({
  year,
  factKey: makeFarmAveragingBaseYearFactKey(year),
  fact,
  income: 0,
  tax: 0,
});

describe("Schedule J instructions: the farmer's Taxable Income Worksheets (irs-1040sj-inst-2025)", () => {
  it("2022 worksheet (line-3::b01–b03): line 5 is 0, Schedule J line 7 is $6,000", () => {
    const worksheet = taxableIncomeWorksheet({
      belowZero: 8150,
      scheduleDLine21Loss: 3000,
      capitalLossCarryover: 7000,
      scheduleDLine16Loss: 7000,
      netOperatingLoss: 5150,
    });
    expect(worksheet).toEqual({
      line1: 8150,
      line2: 3000,
      line3: 5150,
      line4: 8150,
      line5: 0,
      baseIncome: 0,
    });
    expect(line6(18000)).toBe(6000);
    expect(line7(worksheet.baseIncome, line6(18000))).toBe(6000);
  });

  /*
   * The example says "a negative $6,200 on Schedule J, line 11", but −12,400 +
   * 6,000 is −6,400; the form's "Combine lines 9 and 10" wins (DECISION in lines.ts).
   */
  it("2023 worksheet (line-3-2::b01–b02): line 9 is −$12,400, line 11 is −$6,400", () => {
    const worksheet = taxableIncomeWorksheet({
      belowZero: 29900,
      scheduleDLine21Loss: 3000,
      capitalLossCarryover: 7000,
      scheduleDLine16Loss: 7000,
      netOperatingLoss: 14500,
    });
    expect([worksheet.line2, worksheet.line4, worksheet.line5]).toEqual([3000, 17500, 12400]);
    expect(worksheet.baseIncome).toBe(-12400);
    const line11 = combinedWithShare(worksheet.baseIncome, 6000);
    expect(line11).toBe(-6400);
    // "If line 11 is zero or less, enter -0- on line 12" (line-12::b01).
    expect(noTaxOn(line11)).toBe(true);
  });

  it("2024 worksheet (line-3-3::b01–b03): line 13 is 0, line 15 is $6,000", () => {
    const worksheet = taxableIncomeWorksheet({
      belowZero: 1000,
      scheduleDLine21Loss: 3000,
      capitalLossCarryover: 5000,
      scheduleDLine16Loss: 7000,
    });
    expect([worksheet.line2, worksheet.line3, worksheet.line4, worksheet.line5]).toEqual([
      1000, 0, 1000, 0,
    ]);
    expect(combinedWithShare(worksheet.baseIncome, 6000)).toBe(6000);
  });

  it("the three examples through baseYears: lines 5, 9 and 13", () => {
    const result = baseYears(
      inputsWith({
        // "As previously adjusted": the 2023 NOL carried back makes 2022's taxable income below zero.
        2022: {
          filingStatus: "single",
          taxableIncome: 0,
          sectionOneTax: 0,
          belowZero: {
            belowZero: 8150,
            scheduleDLine21Loss: 3000,
            capitalLossCarryover: 7000,
            scheduleDLine16Loss: 7000,
            netOperatingLoss: 5150,
          },
        },
        2023: {
          filingStatus: "single",
          taxableIncome: 0,
          sectionOneTax: 0,
          belowZero: {
            belowZero: 29900,
            scheduleDLine21Loss: 3000,
            capitalLossCarryover: 7000,
            scheduleDLine16Loss: 7000,
            netOperatingLoss: 14500,
          },
        },
        2024: {
          filingStatus: "single",
          taxableIncome: 0,
          sectionOneTax: 0,
          belowZero: {
            belowZero: 1000,
            scheduleDLine21Loss: 3000,
            capitalLossCarryover: 5000,
            scheduleDLine16Loss: 7000,
          },
        },
      }),
    );
    expect(result.kind).toBe("known");
    if (result.kind !== "known") return;
    expect(result.years.map((year) => year.income)).toEqual([0, -12400, 0]);
  });
});

describe("Regulation section 1.1301-1 examples (logic only: the rates are other years')", () => {
  it("(e)(2)(ii) Example 4: elected farm income cannot exceed taxable income", () => {
    // $200,000 of farm income, a $50,000 nonfarm loss: taxable income $150,000.
    expect(line2a(200000, 150000)).toBe(150000);
  });

  it("(e)(2)(ii) Example 5: the capital gain part cannot exceed the total net capital gain", () => {
    expect(line2b(50000, 70000, 10000)).toBe(10000);
  });

  it("(d)(2)(ii): a base year of −$8,150 with $8,000 added is −$150, so its line 7 is 0", () => {
    expect(combinedWithShare(-8150, 8000)).toBe(-150);
    expect(line7(-8150, 8000)).toBe(0);
  });

  it("(d)(3)(ii): the fisherman's 2010 election, then the 2011 election on top of it", () => {
    // 2010: taxable income $30,000, elected $9,000.
    expect(line3(30000, line2a(9000, 30000))).toBe(21000);
    expect(line6(9000)).toBe(3000);
    expect(combinedWithShare(20000, 3000)).toBe(23000);
    // 2011: the base years come from the 2010 Schedule J (lines 11, 15 and 3), plus $4,000.
    const result = baseYears(
      inputsWith({
        2022: { filingStatus: "single" },
        2023: { filingStatus: "single" },
        2024: {
          filingStatus: "single",
          scheduleJ: { line3: 21000, line4: 0, line11: 23000, line12: 0, line15: 23000, line16: 0 },
        },
      }),
    );
    expect(result.kind).toBe("known");
    if (result.kind !== "known") return;
    expect(result.years.map((year) => combinedWithShare(year.income, line6(12000)))).toEqual([
      27000, 27000, 25000,
    ]);
    expect(line3(50000, line2a(12000, 50000))).toBe(38000);
  });
});

describe("base-year sources (the face, lines 5, 9, 13 and 19 to 21)", () => {
  const own = (taxableIncome: number, sectionOneTax: number): FarmAveragingBaseYearFactValue => ({
    filingStatus: "single",
    taxableIncome,
    sectionOneTax,
  });

  it("with no earlier Schedule J, each year's own return", () => {
    const result = baseYears(inputsWith({ 2022: own(1, 10), 2023: own(2, 20), 2024: own(3, 30) }));
    if (result.kind !== "known") throw new Error("waits");
    expect(result.years.map((year) => [year.income, year.tax])).toEqual([
      [1, 10],
      [2, 20],
      [3, 30],
    ]);
  });

  it("2023 but not 2024: lines 15/16 for 2022, lines 3/4 for 2023, the 2024 return", () => {
    const result = baseYears(
      inputsWith({
        2022: own(1, 10),
        2023: { ...own(2, 20), scheduleJ: { line3: 200, line4: 2000, line15: 100, line16: 1000 } },
        2024: own(3, 30),
      }),
    );
    if (result.kind !== "known") throw new Error("waits");
    expect(result.years.map((year) => [year.income, year.tax])).toEqual([
      [100, 1000],
      [200, 2000],
      [3, 30],
    ]);
  });

  it("2022 only: its line 3 and line 4", () => {
    const result = baseYears(
      inputsWith({
        2022: { ...own(1, 10), scheduleJ: { line3: 7, line4: 70 } },
        2023: own(2, 20),
        2024: own(3, 30),
      }),
    );
    if (result.kind !== "known") throw new Error("waits");
    expect(result.years[0]).toMatchObject({ income: 7, tax: 70, fromScheduleJOf: 2022 });
  });

  it("waits for a missing year, and for an answer a line needs", () => {
    expect(baseYears(inputsWith({ 2022: own(1, 1), 2023: own(2, 2) }))).toEqual({
      kind: "waits",
      missing: [makeFarmAveragingBaseYearFactKey(2024)],
    });
    const noWorksheet = baseYears(
      inputsWith({ 2022: own(1, 1), 2023: own(0, 0), 2024: own(3, 3) }),
    );
    expect(noWorksheet).toEqual({
      kind: "waits",
      missing: [makeFarmAveragingBaseYearFactKey(2023)],
    });
    const incomplete = baseYears(
      inputsWith({
        2022: own(1, 1),
        2023: own(2, 2),
        2024: { ...own(3, 3), scheduleJ: { line3: 1, line4: 1 } },
      }),
    );
    expect(incomplete).toEqual({
      kind: "waits",
      missing: [makeFarmAveragingBaseYearFactKey(2024)],
    });
  });
});

describe("base-year tax (line-8::b01, line-12::b01, line-16::b01)", () => {
  const single = (year: 2022 | 2023 | 2024, extra: Partial<FarmAveragingBaseYearFactValue> = {}) =>
    base(year, { filingStatus: "single", ...extra });

  it("the year's Tax Rate Schedule: each bracket edge, rounded to the dollar", () => {
    expect(baseYearTax(single(2022), 10275, NO_SHARE)).toBe(1028); // $1,027.50
    expect(baseYearTax(single(2022), 41775, NO_SHARE)).toBe(4808); // $4,807.50
    expect(baseYearTax(single(2023), 44725, NO_SHARE)).toBe(5147);
    expect(baseYearTax(single(2024), 100525, NO_SHARE)).toBe(17169); // $17,168.50
    const joint = base(2024, { filingStatus: "married_filing_jointly" });
    expect(baseYearTax(joint, 94300, NO_SHARE)).toBe(10852);
  });

  it("zero or less enters 0", () => {
    expect(baseYearTax(single(2023), 0, NO_SHARE)).toBe(0);
    expect(baseYearTax(single(2023), -6200, NO_SHARE)).toBe(0);
  });

  it("the year's QDCG worksheet stacks the qualified dividends on top", () => {
    // 2024 single, $52,800 with $1,800 of qualified dividends: 15% × 1,800 + tax on 51,000 (5,426 + 847).
    expect(baseYearTax(single(2024, { qualifiedDividends: 1800 }), 52800, NO_SHARE)).toBe(
      270 + 6273,
    );
  });

  it("a third of line 2b is taxed at that year's capital gain rates", () => {
    const share = { netCapitalGain: 8000, unrecapturedSection1250Gain: 0 };
    // 2022 single, $54,733: ordinary 46,733 → 5,898; 15% × 8,000 = 1,200.
    expect(baseYearTax(single(2022), 54733, share)).toBe(7098);
  });

  it("a third of line 2c, or a year that used the Schedule D Tax Worksheet, is a gap", () => {
    const share = { netCapitalGain: 8000, unrecapturedSection1250Gain: 1000 };
    expect(isGap(baseYearTax(single(2022), 54733, share))).toBe(true);
    const own = single(2023, { usedScheduleDTaxWorksheet: true });
    expect(isGap(baseYearTax(own, 30000, NO_SHARE))).toBe(true);
  });

  it("the year's Foreign Earned Income Tax Worksheet: tax on line 3 less tax on line 2c", () => {
    const abroad = single(2023, { foreignExclusion: { excluded: 20000, deductionsNotClaimed: 0 } });
    // Line 3 = 30,000 + 20,000; tax on 50,000 = $6,307.50 → 6,308; tax on 20,000 = 2,180.
    expect(baseYearTax(abroad, 30000, NO_SHARE)).toBe(6308 - 2180);
  });
});

describe("limits that need no source", () => {
  it("line 2a is never more than line 1 and never below 0", () => {
    expect(line2a(500000, 120000)).toBe(120000);
    expect(line2a(-5000, 120000)).toBe(0);
    expect(line2a(90000, 0)).toBe(0);
  });

  it("line 2b is part of line 2a, blank with no capital gain; line 2c is part of line 2b", () => {
    expect(line2b(undefined, 90000, 24000)).toBeUndefined();
    expect(line2b(30000, 20000, 50000)).toBe(20000);
    expect(line2c(undefined, 5000)).toBeUndefined();
    expect(line2c(4000, 5000)).toBe(4000);
    expect(line2c(4000, undefined)).toBeUndefined();
  });

  it("line 6 is a third of line 2a to the dollar; each base year's capital gain share too", () => {
    expect(line6(100000)).toBe(33333);
    expect(line6(100001)).toBe(33334);
    expect(baseYearShare(24000)).toBe(8000);
    expect(baseYearShare(undefined)).toBe(0);
  });

  it("totals equal their parts; a gap in a part is a gap in the total", () => {
    expect(line17(3821, 7098, 9616, 13316)).toBe(33851);
    expect(line22(2366, 3893, 6549)).toBe(12808);
    expect(line23(33851, 12808)).toBe(21043);
    const gap = baseYearTax(single2022(), 1, { netCapitalGain: 0, unrecapturedSection1250Gain: 1 });
    expect(isGap(totalOf(1, gap))).toBe(true);
    expect(isGap(line23(gap as never, 1))).toBe(true);
  });
});

function single2022(): BaseYear {
  return base(2022, { filingStatus: "single" });
}
