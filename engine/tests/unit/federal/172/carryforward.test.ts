/*
 * The 2025 NOL deduction for carryovers (Schedule 1 line 8a, Form 172 line
 * 23): losses before 2018 in full, losses from 2018 up to 80% of taxable
 * income left after them (irs-172-inst-2025::sec::how-to-carry-an-nol-back-or-forward::b01, ::b02).
 * No published example with numbers; these are limit tests.
 */

import { describe, expect, it } from "vitest";
import {
  carryoverTotals,
  LATER_YEAR_ROW_GAP,
  nolDeduction,
} from "../../../../src/federal/172/carryforward.js";

describe("NOL carryover deduction", () => {
  it("splits the rows at tax years beginning in 2018, rounding each row", () => {
    expect(
      carryoverTotals([
        { yearOfLoss: 2016, carryoverTo2025: 4000.4 },
        { yearOfLoss: 2017, carryoverTo2025: 1000 },
        { yearOfLoss: 2018, carryoverTo2025: 2500.5 },
        { yearOfLoss: 2024, carryoverTo2025: 7000 },
      ]),
    ).toEqual({ before2018: 5000, from2018: 9501 });
  });

  it("a row for 2025 or later is not a carryover", () => {
    expect(carryoverTotals([{ yearOfLoss: 2025, carryoverTo2025: 100 }])).toBe(LATER_YEAR_ROW_GAP);
  });

  it("deducts losses before 2018 in full, even above taxable income", () => {
    expect(nolDeduction({ before2018: 30000, from2018: 0 }, 10000)).toBe(30000);
    expect(nolDeduction({ before2018: 30000, from2018: 0 }, -5000)).toBe(30000);
  });

  it("limits losses from 2018 to 80% of taxable income", () => {
    expect(nolDeduction({ before2018: 0, from2018: 50000 }, 40000)).toBe(32000);
    expect(nolDeduction({ before2018: 0, from2018: 20000 }, 40000)).toBe(20000);
  });

  it("the 80% applies to taxable income less the losses before 2018", () => {
    expect(nolDeduction({ before2018: 10000, from2018: 50000 }, 40000)).toBe(10000 + 24000);
  });

  it("no deduction from 2018 on when taxable income is zero or less", () => {
    expect(nolDeduction({ before2018: 0, from2018: 50000 }, 0)).toBe(0);
    expect(nolDeduction({ before2018: 0, from2018: 50000 }, -12000)).toBe(0);
    expect(nolDeduction({ before2018: 15000, from2018: 50000 }, 12000)).toBe(15000);
  });

  it("rounds 80% to the nearest dollar", () => {
    expect(nolDeduction({ before2018: 0, from2018: 50000 }, 1001)).toBe(801);
  });
});
