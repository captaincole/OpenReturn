/* FTB 3805V Part III: the carryover rows, columns (f) to (h), and lines 5 and 6 (partIII.ts). */

import { describe, expect, it } from "vitest";
import type { CaNolCarryoverRow } from "../../../../../src/facts/index.js";
import {
  carryoverRowGap,
  carryoverTotals,
  NOT_PRIOR_YEAR_GAP,
  OLD_LOSS_GAP,
  priorYearLines,
} from "../../../../../src/state/ca/3805v/partIII.js";

const GEN_2020: CaNolCarryoverRow = {
  yearOfLoss: 2020,
  type: "GEN",
  initialLoss: 95000,
  carryoverFrom2024: 68000,
};
const DIS_2018: CaNolCarryoverRow = {
  yearOfLoss: 2018,
  code: "107",
  type: "DIS",
  initialLoss: 40000,
  carryoverFrom2024: 22000,
};

describe("prior year rows", () => {
  /*
   * ca-3807-booklet-2025::sec::instructions-for-worksheet-ii-computation-of-nol-carryover-and-carryover-limitations::b02,
   * ::b03: the same columns on the LAMBRA worksheet. A balance of $5,000 and a
   * $500 carryover: "$500 | Amount deducted this year: $500 | Balance available
   * to offset losses: 4,500 | carryover: $0".
   */
  it("the FTB 3807 Worksheet II example: the smaller amount, the balance, the carryover", () => {
    const lines = priorYearLines(
      [{ yearOfLoss: 2015, type: "GEN", initialLoss: 500, carryoverFrom2024: 500 }],
      5000,
      false,
    );
    expect(lines.rows[0]).toMatchObject({ used: 500, balance: 4500, carryForward: 0 });
  });

  it("earliest year first, each row against the balance the row before left", () => {
    const lines = priorYearLines([GEN_2020, DIS_2018], 78594, false);
    expect(lines.rows.map((row) => row.yearOfLoss)).toEqual([2018, 2020]);
    expect(lines.rows[0]).toMatchObject({ used: 22000, balance: 56594, carryForward: 0 });
    expect(lines.rows[1]).toMatchObject({ used: 56594, balance: 0, carryForward: 11406 });
    expect(lines.disasterUsed).toBe(22000);
    expect(lines.nolUsed).toBe(56594);
  });

  it("no MTI: nothing is used and every carryover goes forward", () => {
    const lines = priorYearLines([GEN_2020, DIS_2018], 0, false);
    expect(lines.disasterUsed + lines.nolUsed).toBe(0);
    expect(lines.rows.map((row) => row.carryForward)).toEqual([22000, 68000]);
  });

  it("suspended: the general NOL takes nothing, the disaster loss is still used", () => {
    const lines = priorYearLines([GEN_2020, DIS_2018], 500000, true);
    expect(lines.disasterUsed).toBe(22000);
    expect(lines.nolUsed).toBe(0);
    expect(lines.rows[1]).toMatchObject({ used: 0, balance: 478000, carryForward: 68000 });
  });

  it("the deductions are never more than the MTI or the carryovers, and (e) = (f) + (h)", () => {
    for (const mti of [0, 1, 21999, 22000, 90000, 200000]) {
      const lines = priorYearLines([GEN_2020, DIS_2018], mti, false);
      const used = lines.disasterUsed + lines.nolUsed;
      expect(used).toBeLessThanOrEqual(Math.min(mti, 90000));
      for (const row of lines.rows) expect(row.used + row.carryForward).toBe(row.carryover);
    }
  });

  it("rows of the same year keep the order recorded", () => {
    const second = { ...GEN_2020, type: "NB" as const, carryoverFrom2024: 1000 };
    const lines = priorYearLines([GEN_2020, second], 68500, false);
    expect(lines.rows.map((row) => row.used)).toEqual([68000, 500]);
  });
});

describe("rows the engine cannot use", () => {
  it.each([
    [{ ...GEN_2020, yearOfLoss: 2007 }, OLD_LOSS_GAP],
    [{ ...GEN_2020, yearOfLoss: 2008 }, undefined],
    [{ ...DIS_2018, yearOfLoss: 2010 }, OLD_LOSS_GAP],
    [{ ...DIS_2018, yearOfLoss: 2011 }, undefined],
    [{ ...GEN_2020, yearOfLoss: 2024 }, undefined],
    [{ ...GEN_2020, yearOfLoss: 2025 }, NOT_PRIOR_YEAR_GAP],
  ])("%o", (row, gap) => {
    expect(carryoverRowGap(row)).toBe(gap);
  });
});

describe("lines 5 and 6", () => {
  it("line 5 adds the non-disaster carryovers and the current year NOL; line 6 the disaster ones", () => {
    const { rows } = priorYearLines([GEN_2020, DIS_2018], 0, false);
    expect(carryoverTotals(rows, 38000, 0)).toEqual({ line5: 106000, line6: 22000 });
    expect(carryoverTotals([], 0, 0)).toEqual({ line5: 0, line6: 0 });
  });
});
