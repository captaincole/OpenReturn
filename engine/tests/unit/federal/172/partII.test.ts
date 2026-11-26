/*
 * Form 172 Part II as pure arithmetic: the carryback columns. The published
 * example is the farming loss table of Pub. 536 (2022), "How To Carry an NOL
 * Back or Forward" (a $42,000 farming loss, $2,000 absorbed in the first
 * carryback year). The rest are limit tests and the galina scenario's columns.
 */

import { describe, expect, it } from "vitest";
import type { NolCarrybackYearValue } from "../../../../src/facts/index.js";
import {
  ALTERNATE_AGI_GAP,
  carrybackColumn,
  carrybackColumns,
  OTHER_GIFTS_GAP,
  refiguredGifts,
} from "../../../../src/federal/172/partII.js";
import { return2023, return2024 } from "../../../scenarios/synthetic/galina/facts.js";

const plainYear = (taxableIncome: number): NolCarrybackYearValue => ({
  taxableIncome,
  itemized: false,
});

describe("Pub. 536 (2022), the farming loss carryback table", () => {
  /* "2020 ... $42,000 ... Unused Loss $40,000; 2021 ... $40,000 ... $0". */
  const columns = carrybackColumns(42000, plainYear(2000), plainYear(55000));

  it("the first carryback year absorbs $2,000 and leaves $40,000", () => {
    expect(columns?.secondPreceding.line1).toBe(42000);
    expect(columns?.secondPreceding.line9).toBe(2000);
    expect(columns?.secondPreceding.line10).toBe(40000);
  });

  it("the second carryback year takes the $40,000 and leaves nothing", () => {
    expect(columns?.firstPreceding?.line1).toBe(40000);
    expect(columns?.firstPreceding?.line10).toBe(0);
  });
});

describe("Part II rules", () => {
  it("the 1st preceding column is not used when the 2nd absorbs the whole loss", () => {
    const columns = carrybackColumns(10000, plainYear(25000), undefined);
    expect(columns?.secondPreceding.line10).toBe(0);
    expect(columns?.firstPreceding).toBeUndefined();
  });

  it("waits for the 1st preceding year's amounts when the loss is not absorbed", () => {
    expect(carrybackColumns(30000, plainYear(5000), undefined)).toBeUndefined();
    expect(carrybackColumns(30000, undefined, plainYear(5000))).toBeUndefined();
  });

  it("line 9 is never below 0, so a negative taxable income absorbs nothing", () => {
    const column = carrybackColumn(8000, plainYear(-3000));
    expect(column.line2).toBe(-3000);
    expect(column.line9).toBe(0);
    expect(column.line10).toBe(8000);
  });

  it("line 6 prints only with an amount on line 3 or 4; line 7 only for an itemizer", () => {
    const year: NolCarrybackYearValue = {
      taxableIncome: 10000,
      qbiDeduction: 1500,
      itemized: false,
    };
    const column = carrybackColumn(20000, year);
    expect(column.line5).toBe(1500);
    expect(column.line6).toBeUndefined();
    expect(column.line7).toBeUndefined();
    expect(column.itemized).toBeUndefined();
    expect(column.line9).toBe(11500);
  });

  it("an itemizer with nothing on lines 3 to 5 skips lines 11 to 33", () => {
    const column = carrybackColumn(20000, { taxableIncome: 10000, itemized: true, agi: 30000 });
    expect(column.itemized).toBeUndefined();
    expect(column.line7).toBeUndefined();
  });

  it("the medical and casualty floors rise with modified AGI, never below 0", () => {
    const column = carrybackColumn(50000, {
      taxableIncome: 20000,
      netCapitalLossDeduction: 3000,
      agiAdjustment: 0,
      itemized: true,
      agi: 30000,
      medicalBeforeLimit: 2000,
      medicalAfterLimit: 0,
      casualtyBeforeLimit: 2500,
      casualtyDeduction: 0,
    });
    expect(column.itemized?.line13).toBe(33000);
    expect(column.itemized?.line16).toBe(2475);
    expect(column.itemized?.line17).toBe(0);
    expect(column.itemized?.line18).toBe(0);
    expect(column.itemized?.line30).toBe(3300);
    expect(column.itemized?.line31).toBe(0);
    expect(column.itemized?.line33).toBe(0);
  });
});

describe("line 26, the refigured charitable contributions", () => {
  const giving = (changes: Partial<NolCarrybackYearValue>): NolCarrybackYearValue => ({
    taxableIncome: 0,
    itemized: true,
    charitableContributions: 6000,
    cashGiftsTo60PercentOrganizations: 9000,
    ...changes,
  });

  it("refigures cash gifts at 60% of line 24 (Pub. 526)", () => {
    expect(refiguredGifts(giving({}), 10000)).toBe(6000);
    expect(refiguredGifts(giving({}), 20000)).toBe(9000);
  });

  it("is 0 with no gifts on line 25", () => {
    expect(refiguredGifts(giving({ charitableContributions: 0 }), 20000)).toBe(0);
  });

  it("is a gap with other gifts, or with line 23 and an AGI adjustment", () => {
    expect(refiguredGifts(giving({ otherGifts: true }), 20000)).toMatchObject({
      reason: OTHER_GIFTS_GAP,
    });
    expect(refiguredGifts(giving({ nolDeducted: 500, agiAdjustment: 200 }), 20000)).toMatchObject({
      reason: ALTERNATE_AGI_GAP,
    });
    expect(refiguredGifts(giving({ nolDeducted: 500, agiAdjustment: 0 }), 20000)).toBe(9000);
  });

  it("line 27 is negative when the higher AGI frees more of the gifts", () => {
    const column = carrybackColumn(30000, {
      ...giving({}),
      netCapitalLossDeduction: 3000,
      agiAdjustment: 0,
      agi: 10000,
    });
    expect(column.itemized?.line24).toBe(13000);
    expect(column.itemized?.line26).toBe(7800);
    expect(column.itemized?.line27).toBe(-1800);
    expect(column.itemized?.line33).toBe(-1800);
  });
});

describe("the galina scenario's columns, checked by hand", () => {
  const columns = carrybackColumns(60000, return2023, return2024);

  it("2023: modified taxable income $36,225, $23,775 carried on", () => {
    const column = columns?.secondPreceding;
    expect(column?.itemized?.line13).toBe(57000);
    expect(column?.itemized?.line16).toBe(4275);
    expect(column?.itemized?.line18).toBe(525);
    expect(column?.itemized?.line24).toBe(82000);
    expect(column?.itemized?.line32).toBe(700);
    expect(column?.line7).toBe(1225);
    expect(column?.line9).toBe(36225);
    expect(column?.line10).toBe(23775);
  });

  it("2024: the 7.5% floor rounds to the nearest dollar; $5,012 is carried on", () => {
    const column = columns?.firstPreceding;
    expect(column?.line1).toBe(23775);
    expect(column?.itemized?.line16).toBe(3263);
    expect(column?.itemized?.line18).toBe(263);
    expect(column?.line9).toBe(18763);
    expect(column?.line10).toBe(5012);
  });
});
