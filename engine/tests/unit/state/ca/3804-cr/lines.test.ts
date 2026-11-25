/*
 * FTB 3804-CR arithmetic. No published example with numbers exists for this
 * form (QUESTIONS.md), so these are limit tests: totals equal their parts, the
 * credit never passes its limits, and each edge.
 */

import { describe, expect, it } from "vitest";
import {
  PART_I_ROWS,
  PTE_CREDIT_CODE,
  columnC,
  creditCarryover,
  creditClaimed,
  partIILine1,
  partIILine2,
  partIILine3,
  partILine2,
  rowsByForm,
  scheduleCreditRow,
  taxLeftForCredit,
} from "../../../../../src/state/ca/3804-cr/lines.js";

describe("FTB 3804-CR Part I", () => {
  it("has ten rows and code 242", () => {
    expect(PART_I_ROWS).toBe(10);
    expect(PTE_CREDIT_CODE).toBe("242");
  });

  it("puts ten entities on each form, and keeps one form with none", () => {
    expect(rowsByForm([])).toEqual([[]]);
    expect(rowsByForm(Array.from({ length: 10 }, (_, i) => i)).map((form) => form.length)).toEqual([
      10,
    ]);
    expect(rowsByForm(Array.from({ length: 11 }, (_, i) => i)).map((form) => form.length)).toEqual([
      10, 1,
    ]);
    expect(rowsByForm(Array.from({ length: 25 }, (_, i) => i)).map((form) => form.length)).toEqual([
      10, 10, 5,
    ]);
  });

  it("rounds column (c) to the nearest dollar", () => {
    expect(columnC(9300.49)).toBe(9300);
    expect(columnC(9300.5)).toBe(9301);
  });

  it("line 2 adds the rounded rows (the form's arithmetic)", () => {
    expect(partILine2([100.4, 100.4])).toBe(200);
    expect(partILine2([9300, 6975, 1116])).toBe(17391);
  });
});

describe("FTB 3804-CR Part II", () => {
  it("line 1 equals the total of every form's Part I line 2", () => {
    const credits = Array.from({ length: 11 }, (_, i) => 1000 + i);
    const total = rowsByForm(credits).reduce((sum, form) => sum + partILine2(form), 0);
    expect(partIILine1(credits)).toBe(total);
    expect(partIILine1(credits)).toBe(11055);
  });

  it("line 1 is 0 with a carryover and no entity", () => {
    expect(partIILine1([])).toBe(0);
  });

  it("line 3 adds line 1 and the rounded carryover", () => {
    expect(partIILine2(2140.5)).toBe(2141);
    expect(partIILine3(28830, 2140)).toBe(30970);
    expect(partIILine3(0, 500)).toBe(500);
  });

  it("line 4 is never more than line 3 or the tax left", () => {
    expect(creditClaimed(30970, 18419)).toBe(18419);
    expect(creditClaimed(5000, 18419)).toBe(5000);
    expect(creditClaimed(5000, 5000)).toBe(5000);
    expect(creditClaimed(5000, 0)).toBe(0);
    expect(creditClaimed(5000, -10)).toBe(0);
  });

  it("lines 4 and 5 add up to line 3", () => {
    for (const [available, taxLeft] of [
      [30970, 18419],
      [5000, 9000],
      [5000, 0],
    ]) {
      const claimed = creditClaimed(available, taxLeft);
      expect(claimed + creditCarryover(available, claimed)).toBe(available);
      expect(creditCarryover(available, claimed)).toBeGreaterThanOrEqual(0);
    }
  });

  it("the tax left is the tax less the earlier credits, not less than 0", () => {
    expect(taxLeftForCredit(19959, [0, 0, 0, 1540])).toBe(18419);
    expect(taxLeftForCredit(1000, [300, 800])).toBe(0);
    expect(taxLeftForCredit(1000, [])).toBe(1000);
  });
});

describe("Schedule P (540) line 21", () => {
  it("uses the smaller of the credit and the balance, and carries the rest", () => {
    expect(scheduleCreditRow(17950, 15525)).toEqual({
      available: 17950,
      used: 15525,
      balance: 0,
      carryover: 2425,
    });
    expect(scheduleCreditRow(1000, 5000)).toEqual({
      available: 1000,
      used: 1000,
      balance: 4000,
      carryover: 0,
    });
  });

  it("column (b) plus column (c) is the balance before, and (b) plus (d) is (a)", () => {
    const row = scheduleCreditRow(7000, 6000);
    expect(row.used + row.balance).toBe(6000);
    expect(row.used + row.carryover).toBe(row.available);
  });

  it("takes nothing with no balance", () => {
    expect(scheduleCreditRow(7000, 0)).toEqual({
      available: 7000,
      used: 0,
      balance: 0,
      carryover: 7000,
    });
  });
});
