/*
 * FTB 3507 arithmetic. No published example with numbers exists for this form
 * (QUESTIONS.md), so these are limit tests: totals equal their parts, the
 * credit never passes its limits, and each edge.
 */

import { describe, expect, it } from "vitest";
import {
  ASSIGNED_CREDIT_OF_AN_INDIVIDUAL,
  BUSINESS_CREDIT_LIMIT,
  CREDIT_RATE,
  PRISON_LABOR_CREDIT_CODE,
  creditUsed,
  disallowedByLimit,
  line1,
  line2,
  line3,
  line4,
  line5,
  line6c,
  line7,
  scheduleARow,
} from "../../../../../src/state/ca/3507/lines.js";

describe("FTB 3507 lines 1 to 5", () => {
  it("is 10% of the wages, code 162, a $5,000,000 limit", () => {
    expect(CREDIT_RATE).toBe(0.1);
    expect(PRISON_LABOR_CREDIT_CODE).toBe("162");
    expect(BUSINESS_CREDIT_LIMIT).toBe(5_000_000);
  });

  it("rounds the wages, then takes 10% to the nearest dollar", () => {
    expect(line1(40000.49)).toBe(40000);
    expect(line2(40000)).toBe(4000);
    expect(line2(12345)).toBe(1235); // 1,234.50 rounds up
    expect(line2(12344)).toBe(1234); // 1,234.40 rounds down
    expect(line2(0)).toBe(0);
  });

  it("adds the pass-through credits with their cents and rounds the total once", () => {
    expect(line3([])).toBe(0);
    expect(line3([100.3, 200.3])).toBe(301); // 300.60
    expect(line3([650])).toBe(650);
  });

  it("line 5 is line 2 plus line 3 plus line 4", () => {
    expect(line4(300.5)).toBe(301);
    expect(line5(40000, [650], 300)).toBe(4000 + 650 + 300);
    expect(line5(0, [], 0)).toBe(0);
  });
});

describe("FTB 3507 the credit used (line 6a) and Schedule P (540) line 4", () => {
  it("is the whole credit when the excess tax covers it", () => {
    expect(creditUsed(4950, 5625)).toBe(4950);
    expect(scheduleARow(4950, 5625)).toEqual({ available: 4950, used: 4950, balance: 675 });
  });

  it("stops at the excess tax: the tentative minimum tax floor", () => {
    expect(creditUsed(12000, 9267)).toBe(9267);
    expect(scheduleARow(12000, 9267)).toEqual({ available: 12000, used: 9267, balance: 0 });
  });

  it("takes nothing when there is no excess tax, even a negative one", () => {
    expect(creditUsed(5000, 0)).toBe(0);
    expect(creditUsed(5000, -10)).toBe(0);
    expect(scheduleARow(5000, 0).balance).toBe(0);
  });

  it("never passes the $5,000,000 business credit limit", () => {
    expect(creditUsed(6_000_000, 8_000_000)).toBe(BUSINESS_CREDIT_LIMIT);
    expect(creditUsed(BUSINESS_CREDIT_LIMIT, 8_000_000)).toBe(BUSINESS_CREDIT_LIMIT);
    expect(creditUsed(BUSINESS_CREDIT_LIMIT + 1, 8_000_000)).toBe(BUSINESS_CREDIT_LIMIT);
  });

  it("each column (b) is at most column (a) and line 3", () => {
    for (const [available, excess] of [
      [1, 0],
      [100, 99],
      [99, 100],
      [7_000_000, 6_000_000],
    ]) {
      const row = scheduleARow(available, excess);
      expect(row.used).toBeLessThanOrEqual(available);
      expect(row.used).toBeLessThanOrEqual(Math.max(0, excess));
      expect(row.used + row.balance).toBe(Math.max(0, excess));
    }
  });
});

describe("FTB 3507 lines 6b, 6c and 7", () => {
  it("6b is 0 for an individual", () => {
    expect(ASSIGNED_CREDIT_OF_AN_INDIVIDUAL).toBe(0);
  });

  it("the limit disallows only the part the tax could have used", () => {
    // Tax room 8,000,000, credit 6,000,000: 1,000,000 is disallowed by the limit.
    expect(disallowedByLimit(6_000_000, 8_000_000)).toBe(1_000_000);
    // Tax room 5,500,000: only 500,000; the other 500,000 is limited by the tax.
    expect(disallowedByLimit(6_000_000, 5_500_000)).toBe(500_000);
    // Under the limit nothing is disallowed.
    expect(disallowedByLimit(12000, 9267)).toBe(0);
  });

  it("6c is all of the disallowed part with the election, else 0", () => {
    expect(line6c(1_000_000, true)).toBe(1_000_000);
    expect(line6c(1_000_000, false)).toBe(0);
  });

  /* Line 7 from line 5, Schedule P line 3 and the election, as the bindings figure it. */
  const carryover = (available: number, excess: number, elects: boolean) => {
    const part = disallowedByLimit(available, excess);
    return line7(part, line6c(part, elects));
  };

  it("line 7 is 0 for a credit above the tax with no limitation: that part is lost", () => {
    // katerine: 12,000 of credit, 9,267 of excess tax; 2,733 does not carry.
    expect(carryover(12000, 9267, false)).toBe(0);
    expect(carryover(5000, 0, false)).toBe(0);
  });

  it("line 7 is 0 for a credit within the tax", () => {
    expect(carryover(4950, 5625, false)).toBe(0);
  });

  it("line 7 carries the part the limit disallowed, unless 6c makes it refundable", () => {
    expect(carryover(6_000_000, 8_000_000, false)).toBe(1_000_000);
    expect(carryover(6_000_000, 8_000_000, true)).toBe(0);
    /* Tax room 5,500,000: only the 500,000 the limit disallowed carries; the other 500,000 is limited by the tax and is lost. */
    expect(carryover(6_000_000, 5_500_000, false)).toBe(500_000);
    expect(carryover(6_000_000, 5_500_000, true)).toBe(0);
  });

  it("lines 6a, 6c and 7 never pass line 5; the rest is the part the tax could not use", () => {
    for (const [available, excess, elects] of [
      [6_000_000, 8_000_000, true],
      [6_000_000, 5_500_000, true],
      [6_000_000, 5_500_000, false],
      [12000, 9267, false],
      [4950, 5625, true],
    ] as const) {
      const used = creditUsed(available, excess);
      const part = disallowedByLimit(available, excess);
      const elected = line6c(part, elects);
      const lost = available - Math.min(available, Math.max(0, excess));
      expect(used + elected + line7(part, elected) + lost).toBe(available);
    }
  });
});
