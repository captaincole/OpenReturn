/*
 * FTB 3506 arithmetic (src/state/ca/3506/lines.ts). Each published example
 * with numbers is a test named by its source; the rest are limit tests.
 */

import { describe, expect, it } from "vitest";
import type { CaPriorYearDependentCareFactValue } from "../../../../../src/facts/index.js";
import {
  FEDERAL_AGI_LIMIT,
  californiaPercent,
  federalPercent,
  figurePartIII,
  figurePartIV,
  figureWorksheet,
  line3,
  line33,
  line6,
  type PartIVInputs,
} from "../../../../../src/state/ca/3506/lines.js";

/* Earned income well above every limit, no grace period, no forfeit, no own business. */
const PART_IV: PartIVInputs = {
  line13: 0,
  line14: 0,
  line15: 0,
  line17: 0,
  line19: 50_000,
  line20: 50_000,
  line22: 5_000,
  line23: 0,
};

describe("published examples", () => {
  it("ca-3506-inst-2025::sec::line-17::b01: $2,000 of benefits, $900 incurred", () => {
    const lines = figurePartIV({ ...PART_IV, line13: 2_000, line17: 900 }, 1);
    expect([lines.line16, lines.line18]).toEqual([2_000, 900]);
    // The form's arithmetic past the example: $900 excluded, the other $1,100 taxable.
    expect([lines.line26, lines.line27]).toEqual([900, 1_100]);
  });

  it("Pub. 503, George: one person, $1,000 excluded leaves a $2,000 limit", () => {
    const lines = figurePartIV({ ...PART_IV, line13: 1_000, line17: 4_000 }, 1);
    expect([lines.line28, lines.line29, lines.line30]).toEqual([3_000, 1_000, 2_000]);
  });

  it("Pub. 503, Randall: two children, $5,000 excluded leaves $1,000", () => {
    const lines = figurePartIV({ ...PART_IV, line13: 5_000, line17: 6_000 }, 2);
    expect([lines.line28, lines.line29, lines.line30]).toEqual([6_000, 5_000, 1_000]);
    expect(line33(lines.line30, 1_000, 1_000)).toBe(1_000);
  });

  it("Pub. 503, Paris: a child with $0 still counts; the limit is $6,000 less $1,000", () => {
    const lines = figurePartIV({ ...PART_IV, line13: 1_000, line17: 19_500 }, 2);
    expect(lines.line30).toBe(5_000);
    // Column (e): Susan $0, James $18,500; Form 2441 line 31 is the same $5,000.
    expect(line33(lines.line30, 0 + 18_500, 5_000)).toBe(5_000);
  });
});

describe("the line 7 and line 9 charts", () => {
  it("line 7 (ca-3506-inst-2025::sec::line-7::b02) at each edge", () => {
    expect([15_000, 15_001, 17_000, 17_001, 43_000, 43_001, 500_000].map(federalPercent)).toEqual([
      35, 34, 34, 33, 21, 20, 20,
    ]);
  });

  it("line 9 (ca-3506-inst-2025::sec::line-9::b02) at each edge", () => {
    expect([0, 40_000, 40_001, 70_000, 70_001, 100_000, 100_001].map(californiaPercent)).toEqual([
      50,
      50,
      43,
      43,
      34,
      34,
      undefined,
    ]);
    expect(FEDERAL_AGI_LIMIT).toBe(100_000);
  });
});

describe("limits", () => {
  it("line 3 is at most $3,000 for one person and $6,000 for two or more", () => {
    expect(line3([4_500])).toBe(3_000);
    expect(line3([4_500, 2_000])).toBe(6_000);
    expect(line3([1_000, 500, 200])).toBe(1_700);
  });

  it("line 6 is never below 0 (a business loss)", () => {
    expect(line6(3_000, -2_000, 40_000)).toBe(0);
  });

  it("the credit is never more than $6,000 × 35% × 50%", () => {
    const lines = figurePartIII({
      columnE: [9_000, 9_000],
      yourEarnedIncome: 90_000,
      spouseEarnedIncome: 90_000,
      federalAgi: 10_000,
      priorYearCredit: 0,
    });
    expect(lines.line12).toBe(1_050);
  });

  it("line 12 is line 10 plus line 11", () => {
    const lines = figurePartIII({
      columnE: [2_000],
      yourEarnedIncome: 30_000,
      spouseEarnedIncome: 30_000,
      federalAgi: 30_000,
      priorYearCredit: 45,
    });
    // 2,000 × 27% = 540; 540 × 50% = 270.
    expect([lines.line8, lines.line10, lines.line12]).toEqual([540, 270, 315]);
  });

  it("over $100,000 of federal AGI line 9 stops and line 12 is 0", () => {
    const lines = figurePartIII({
      columnE: [3_000],
      yourEarnedIncome: 80_000,
      spouseEarnedIncome: 80_000,
      federalAgi: 100_001,
      priorYearCredit: 0,
    });
    expect([lines.line9, lines.line10, lines.line12]).toEqual([undefined, undefined, 0]);
  });

  it("Part IV: benefits above the expenses are taxable, never negative", () => {
    const lines = figurePartIV({ ...PART_IV, line13: 3_000, line15: 500, line17: 4_000 }, 1);
    expect([lines.line16, lines.line26, lines.line27]).toEqual([2_500, 2_500, 0]);
    expect(lines.line30).toBe(500);
  });

  it("Part IV: an exclusion over the limit leaves line 30 at 0", () => {
    const lines = figurePartIV({ ...PART_IV, line13: 5_000, line17: 8_000 }, 1);
    expect(lines.line30).toBe(0);
  });
});

/* A joint 2024 return: $1,000 claimed, $1,500 more paid in 2025, two persons. */
const PRIOR: CaPriorYearDependentCareFactValue = {
  expensesPaidIn2024: 1_000,
  qualifyingPersons: 2,
  excludedBenefits: 0,
  yourEarnedIncome: 30_000,
  spouseEarnedIncome: 24_000,
  priorYearLine6: 1_000,
  federalAgi: 54_000,
  californiaAgi: 54_000,
};

describe("the worksheet for 2024 expenses paid in 2025", () => {
  it("figures each line: 1,500 more expenses at 20% and 43%", () => {
    const lines = figureWorksheet(PRIOR, 1_500, true)!;
    expect([lines.line3, lines.line4, lines.line6, lines.line7, lines.line8]).toEqual([
      2_500, 6_000, 6_000, 24_000, 2_500,
    ]);
    // 1,500 × 20% = 300; 300 × 43% = 129.
    expect([lines.line10, lines.line12, lines.line13, lines.line14, lines.line15]).toEqual([
      1_500, 20, 300, 43, 129,
    ]);
    expect(lines.credit).toBe(129);
  });

  it("stops at line 10 when last year already used the whole limit", () => {
    const lines = figureWorksheet({ ...PRIOR, priorYearLine6: 6_000 }, 1_500, true)!;
    expect([lines.line10, lines.line11, lines.credit]).toEqual([0, undefined, 0]);
  });

  it("stops at line 14 when 2024 California AGI was over $100,000", () => {
    const lines = figureWorksheet({ ...PRIOR, californiaAgi: 120_000 }, 1_500, true)!;
    expect([lines.line13, lines.line14, lines.credit]).toEqual([300, undefined, 0]);
  });

  it("caps line 8 at the excluded-benefit limit (line 6)", () => {
    const lines = figureWorksheet({ ...PRIOR, excludedBenefits: 5_000 }, 1_500, true)!;
    expect([lines.line6, lines.line8, lines.line10]).toEqual([1_000, 1_000, 0]);
  });

  it("not joint: line 7 is the taxpayer's own earned income", () => {
    const lines = figureWorksheet({ ...PRIOR, spouseEarnedIncome: undefined }, 1_500, false)!;
    expect(lines.line7).toBe(30_000);
  });

  it("a joint return waits for the spouse's 2024 earned income", () => {
    expect(figureWorksheet({ ...PRIOR, spouseEarnedIncome: undefined }, 1_500, true)).toBe(
      undefined,
    );
  });
});
