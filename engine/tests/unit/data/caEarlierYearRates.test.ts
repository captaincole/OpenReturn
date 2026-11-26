/*
 * The California tax of 2020 to 2024 for FTB 5870A: each year's published
 * rate schedule example, and rows of each year's printed Tax Table (the FTB
 * booklets; read 2026-11-25).
 */

import { describe, expect, it } from "vitest";
import {
  CA_EARLIER_YEAR_SCHEDULES,
  CA_RATES,
  caEarlierYearTax,
  taxTableMidpoint,
} from "../../../src/data/caEarlierYearRates.js";
import { roundToPlaces } from "../../../src/money.js";

describe("the rate schedules' own example: Chris and Pat Smith, joint, $125,000", () => {
  // "How to Figure Tax Using the <year> California Tax Rate Schedules": "they will enter $X on Form 540, line 31".
  const printed: Array<[number, number]> = [
    [2020, 5882],
    [2021, 5630],
    [2022, 5231],
    [2023, 5083],
    [2024, 4920],
  ];
  it.each(printed)("%i: $%i", (year, tax) => {
    expect(caEarlierYearTax(year, "married_filing_jointly", 125000)).toBe(tax);
  });
});

describe("rows of each year's printed Tax Table (single or MFS, joint, head of household)", () => {
  // [year, at least, but not over, column 1 or 3, column 2 or 5, column 4], as printed.
  const rows: Array<[number, number, number, number, number, number]> = [
    [2020, 21451, 21550, 347, 251, 251],
    [2020, 75451, 75550, 4150, 2168, 2571],
    [2020, 99951, 100000, 6426, 3780, 4791],
    [2021, 30951, 31050, 705, 434, 433],
    [2021, 75451, 75550, 4024, 2064, 2418],
    [2022, 21451, 21550, 329, 228, 228],
    [2022, 99951, 100000, 6051, 3327, 4202],
    [2023, 30951, 31050, 642, 412, 412],
    [2023, 75451, 75550, 3674, 1824, 2061],
    [2024, 21451, 21550, 322, 215, 215],
    [2024, 99951, 100000, 5840, 3154, 3871],
  ];
  it.each(rows)("%i, $%i to $%i", (year, low, high, single, joint, head) => {
    for (const income of [low, high]) {
      expect(caEarlierYearTax(year, "single", income)).toBe(single);
      expect(caEarlierYearTax(year, "married_filing_separately", income)).toBe(single);
      expect(caEarlierYearTax(year, "married_filing_jointly", income)).toBe(joint);
      expect(caEarlierYearTax(year, "qualifying_surviving_spouse", income)).toBe(joint);
      expect(caEarlierYearTax(year, "head_of_household", income)).toBe(head);
    }
  });
});

describe("the Tax Table and the rate schedules", () => {
  it("finds the row's whole-dollar midpoint; the last row stops at $100,000", () => {
    expect([taxTableMidpoint(1), taxTableMidpoint(50), taxTableMidpoint(51)]).toEqual([
      25, 25, 100,
    ]);
    expect([taxTableMidpoint(150), taxTableMidpoint(151), taxTableMidpoint(99951)]).toEqual([
      100, 200, 99975,
    ]);
  });

  it("each printed row's tax is the tax at the row above plus its rate (the schedule adds up)", () => {
    for (const schedules of Object.values(CA_EARLIER_YEAR_SCHEDULES)) {
      for (const rows of [schedules.X, schedules.Y, schedules.Z]) {
        rows.base.slice(1).forEach((base, index) => {
          const span = rows.over[index + 1] - rows.over[index];
          expect(base).toBeCloseTo(roundToPlaces(rows.base[index] + CA_RATES[index] * span, 2), 1);
        });
      }
    }
  });

  it("uses the rate schedule above $100,000 and gives 0 at or below zero", () => {
    // 2024 Schedule X: $70,116.38 + 12.3% of the amount over $721,314.
    expect(caEarlierYearTax(2024, "single", 985000)).toBe(102550);
    expect(caEarlierYearTax(2024, "single", 0)).toBe(0);
    expect(caEarlierYearTax(2024, "single", -500)).toBe(0);
  });

  it("holds no year outside 2020 to 2024", () => {
    expect(caEarlierYearTax(2019, "single", 50000)).toBeUndefined();
    expect(caEarlierYearTax(2025, "single", 50000)).toBeUndefined();
  });
});
