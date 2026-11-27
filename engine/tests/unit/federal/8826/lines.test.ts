/*
 * Form 8826 lines 1 to 8 and the eligible small business test, as pure
 * arithmetic. The form and its instructions publish no example with numbers,
 * so these are limit tests: the $250 floor, the $10,000 cap of line 5, the
 * $5,000 limit of line 8, the rounding of line 6 and each edge of the test.
 */

import { describe, expect, it } from "vitest";
import {
  CREDIT_LIMIT,
  CREDIT_RATE,
  FULL_TIME_EMPLOYEE_LIMIT,
  GROSS_RECEIPTS_LIMIT,
  MAXIMUM_AMOUNT,
  MINIMUM_AMOUNT,
  creditLines,
  eligibleSmallBusiness,
  line1Of,
  line3Of,
  line5Of,
  line6Of,
  line8Of,
} from "../../../../src/federal/8826/lines.js";

describe("the printed amounts", () => {
  it("line 2 is $250, line 4 is $10,000, the rate 50% and line 8's limit $5,000", () => {
    expect(MINIMUM_AMOUNT).toBe(250);
    expect(MAXIMUM_AMOUNT).toBe(10_000);
    expect(CREDIT_RATE).toBe(0.5);
    expect(CREDIT_LIMIT).toBe(5_000);
  });

  it("the most line 6 can hold is line 8's limit: 50% of $10,000", () => {
    expect(line6Of(MAXIMUM_AMOUNT)).toBe(CREDIT_LIMIT);
  });
});

describe("line 1", () => {
  it("adds the expenditures with their cents and rounds the total once", () => {
    // 1,200.40 + 1,300.40 = 2,500.80 → 2,501 (each rounded first would give 2,500).
    expect(line1Of([1200.4, 1300.4])).toBe(2501);
  });

  it("is 0 with no expenditures", () => {
    expect(line1Of([])).toBe(0);
  });
});

describe("line 3: the $250 floor", () => {
  it("expenditures of $250 or less leave 0", () => {
    expect(line3Of(0)).toBe(0);
    expect(line3Of(249)).toBe(0);
    expect(line3Of(250)).toBe(0);
  });

  it("each dollar above $250 counts", () => {
    expect(line3Of(251)).toBe(1);
    expect(line3Of(8650)).toBe(8400);
  });
});

describe("line 5: the smaller of line 3 or $10,000", () => {
  it("below, at and above the cap", () => {
    expect(line5Of(9999)).toBe(9999);
    expect(line5Of(10_000)).toBe(10_000);
    expect(line5Of(10_001)).toBe(10_000);
  });
});

describe("line 6: 50% to the nearest dollar", () => {
  it("an odd line 5 rounds the half dollar up", () => {
    expect(line6Of(2851)).toBe(1426);
    expect(line6Of(1)).toBe(1);
  });

  it("an even line 5 is exact", () => {
    expect(line6Of(8400)).toBe(4200);
  });
});

describe("lines 1 to 6 together", () => {
  it("expenditures of $10,250 give the most credit, $5,000", () => {
    expect(creditLines([10_250])).toEqual({
      line1: 10_250,
      line3: 10_000,
      line5: 10_000,
      line6: 5_000,
    });
  });

  it("more than $10,250 adds nothing", () => {
    expect(creditLines([25_000]).line6).toBe(5_000);
  });

  it("$250 gives no credit", () => {
    expect(creditLines([250])).toEqual({ line1: 250, line3: 0, line5: 0, line6: 0 });
  });

  it("the credit is never more than half of line 1", () => {
    for (const amount of [251, 900, 4_321, 10_250, 50_000]) {
      expect(creditLines([amount]).line6).toBeLessThanOrEqual(amount * CREDIT_RATE);
    }
  });
});

describe("line 8: lines 6 and 7, at most $5,000", () => {
  it("adds below the limit", () => {
    expect(line8Of(4200, 600)).toBe(4800);
  });

  it("stops at $5,000", () => {
    expect(line8Of(4800, 200)).toBe(5000);
    expect(line8Of(5000, 600)).toBe(5000);
  });

  it("a blank line counts 0", () => {
    expect(line8Of(undefined, 600)).toBe(600);
    expect(line8Of(4200, undefined)).toBe(4200);
  });
});

describe("the eligible small business test", () => {
  it("waits on the gross receipts first", () => {
    expect(eligibleSmallBusiness({})).toEqual({ waitsOn: "grossReceipts" });
    expect(eligibleSmallBusiness({ fullTimeEmployees: 5 })).toEqual({ waitsOn: "grossReceipts" });
  });

  it("gross receipts of $1,000,000 or less pass, with no employee answer", () => {
    expect(eligibleSmallBusiness({ grossReceipts: GROSS_RECEIPTS_LIMIT })).toBe(true);
    expect(eligibleSmallBusiness({ grossReceipts: 385_000 })).toBe(true);
  });

  it("above $1,000,000 the test waits on the employees", () => {
    expect(eligibleSmallBusiness({ grossReceipts: GROSS_RECEIPTS_LIMIT + 1 })).toEqual({
      waitsOn: "fullTimeEmployees",
    });
  });

  it("above $1,000,000, 30 full-time employees pass and 31 fail", () => {
    const grossReceipts = 1_180_000;
    expect(
      eligibleSmallBusiness({ grossReceipts, fullTimeEmployees: FULL_TIME_EMPLOYEE_LIMIT }),
    ).toBe(true);
    expect(
      eligibleSmallBusiness({ grossReceipts, fullTimeEmployees: FULL_TIME_EMPLOYEE_LIMIT + 1 }),
    ).toBe(false);
  });
});
