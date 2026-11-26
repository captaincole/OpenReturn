/*
 * Form 8919 arithmetic (lines.ts). No IRS publication has a worked example with
 * numbers for this form, so these are limit tests that need no source: each
 * threshold edge of lines 9 and 10, the rates, rounding, and totals.
 */

import { describe, expect, it } from "vitest";
import {
  form8919Lines,
  MEDICARE_TAX_RATE,
  rowColumns,
  SOCIAL_SECURITY_TAX_RATE,
  SOCIAL_SECURITY_WAGE_BASE,
  totalWages,
  waitsForDetermination,
  type FirmRow,
} from "../../../../src/federal/8919/lines.js";

const firm = (wages: number, extra: Partial<FirmRow> = {}): FirmRow => ({
  firmName: "Firm",
  firmTin: "00-0000000",
  reasonCode: "G",
  received1099: false,
  wages,
  ...extra,
});

describe("the printed amounts (irs-8919-form-2025::sec::face-page-1::b03)", () => {
  it("line 7 is $176,100; lines 11 and 12 use 6.2% and 1.45%", () => {
    expect(SOCIAL_SECURITY_WAGE_BASE).toBe(176_100);
    expect(SOCIAL_SECURITY_TAX_RATE).toBe(0.062);
    expect(MEDICARE_TAX_RATE).toBe(0.0145);
    expect(form8919Lines([firm(1000)], 0).line7).toBe(176_100);
  });
});

describe("lines 6 through 13", () => {
  it("no W-2: all of line 6 is subject to social security tax", () => {
    const lines = form8919Lines([firm(50_000)], 0);
    expect(lines).toEqual({
      line6: 50_000,
      line7: 176_100,
      line8: 0,
      line9: 176_100,
      line10: 50_000,
      line11: 3100,
      line12: 725,
      line13: 3825,
    });
  });

  it("line 6 adds every firm (lines 1 through 5 of every Form 8919)", () => {
    const rows = [1, 2, 3, 4, 5, 6, 7].map((each) => firm(each * 1000));
    expect(form8919Lines(rows, 0).line6).toBe(28_000);
  });

  it("line 9 is 0 when line 8 is more than line 7, and line 10 follows", () => {
    const lines = form8919Lines([firm(20_000)], 190_000);
    expect([lines.line9, lines.line10, lines.line11]).toEqual([0, 0, 0]);
    // Medicare has no wage base: line 12 is still 1.45% of line 6.
    expect(lines.line12).toBe(290);
    expect(lines.line13).toBe(290);
  });

  it("line 8 equal to line 7: line 9 is 0", () => {
    expect(form8919Lines([firm(1000)], 176_100).line9).toBe(0);
  });

  it("line 8 one dollar under line 7: only $1 is subject to social security tax", () => {
    const lines = form8919Lines([firm(5000)], 176_099);
    expect([lines.line9, lines.line10]).toEqual([1, 1]);
    expect(lines.line11).toBe(0); // 0.062 rounds to 0
  });

  it("line 10 is the smaller of lines 6 and 9: line 9 sets it", () => {
    const lines = form8919Lines([firm(52_850)], 140_000);
    expect([lines.line9, lines.line10]).toEqual([36_100, 36_100]);
  });

  it("line 10 is the smaller of lines 6 and 9: line 6 sets it", () => {
    const lines = form8919Lines([firm(18_000)], 62_000);
    expect([lines.line9, lines.line10]).toEqual([114_100, 18_000]);
  });

  it("line 6 equal to line 9: either one", () => {
    const lines = form8919Lines([firm(26_100)], 150_000);
    expect(lines.line10).toBe(26_100);
  });

  it("line 13 is the sum of lines 11 and 12", () => {
    const lines = form8919Lines([firm(24_500)], 0);
    expect(lines.line11).toBe(1519);
    expect(lines.line12).toBe(355); // 355.25
    expect(lines.line13).toBe(lines.line11! + lines.line12);
  });

  it("the tax is never more than 7.65% of line 6 (plus rounding)", () => {
    for (const wages of [1, 999, 12_345, 176_100, 300_000]) {
      for (const line8 of [0, 100_000, 176_100]) {
        const lines = form8919Lines([firm(wages)], line8);
        expect(lines.line13!).toBeLessThanOrEqual(wages * 0.0765 + 1);
        expect(lines.line10!).toBeLessThanOrEqual(lines.line6);
        expect(lines.line10!).toBeLessThanOrEqual(lines.line9!);
      }
    }
  });

  it("line 8 waits: lines 8 through 11 and 13 wait, line 12 does not", () => {
    const lines = form8919Lines([firm(10_000)], undefined);
    expect(lines).toEqual({ line6: 10_000, line7: 176_100, line12: 145 });
  });
});

describe("rounding to whole dollars (irs-1040-inst-2025::sec::rounding-off-to-whole::b01)", () => {
  it("line 6 keeps each firm's cents and rounds only the total", () => {
    const rows = [firm(7500.25), firm(9800.4), firm(0.4)];
    // Printed rows 7,500 + 9,800 + 0; the total 17,301.05 rounds to 17,301.
    expect(rows.map((row) => rowColumns(row).wages)).toEqual([7500, 9800, 0]);
    expect(totalWages(rows)).toBe(17_301);
  });

  it("line 8 rounds the W-2 total (cents kept while adding)", () => {
    expect(form8919Lines([firm(100)], 1000.5).line8).toBe(1001);
  });

  it("line 12 of 50 cents rounds up", () => {
    // 1,000 × 1.45% = 14.50 → 15
    expect(form8919Lines([firm(1000)], 0).line12).toBe(15);
  });
});

describe("the columns of a row (irs-8919-form-2025::sec::lines-1-through-5::b01 to b03)", () => {
  it("column (d) prints only for reason codes A and C", () => {
    const date = "06/30/2025";
    expect(
      rowColumns(firm(1, { reasonCode: "A", determinationDate: date })).determinationDate,
    ).toBe(date);
    expect(
      rowColumns(firm(1, { reasonCode: "C", determinationDate: date })).determinationDate,
    ).toBe(date);
    expect(
      rowColumns(firm(1, { reasonCode: "G", determinationDate: date })).determinationDate,
    ).toBeUndefined();
    expect(
      rowColumns(firm(1, { reasonCode: "H", determinationDate: date })).determinationDate,
    ).toBeUndefined();
  });

  it("a code A or C row with no date waits; G and H never do", () => {
    expect(waitsForDetermination(firm(1, { reasonCode: "A" }))).toBe(true);
    expect(waitsForDetermination(firm(1, { reasonCode: "C" }))).toBe(true);
    expect(waitsForDetermination(firm(1, { reasonCode: "G" }))).toBe(false);
    expect(waitsForDetermination(firm(1, { reasonCode: "H" }))).toBe(false);
  });

  it("column (e) is checked or blank, never an unchecked false", () => {
    expect(rowColumns(firm(1, { received1099: true })).received1099).toBe(true);
    expect(rowColumns(firm(1, { received1099: false })).received1099).toBeUndefined();
  });

  it('column (b): a blank number prints "unknown"', () => {
    expect(rowColumns(firm(1, { firmTin: " " })).firmTin).toBe("unknown");
    expect(rowColumns(firm(1, { firmTin: "unknown" })).firmTin).toBe("unknown");
  });
});
