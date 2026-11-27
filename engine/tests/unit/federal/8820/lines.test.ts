/*
 * Form 8820's arithmetic (lines.ts) and the placement of the section 280C(b)
 * reduction (reduction.ts). The form and its instructions publish no example
 * with numbers (.scratch evidence search, QUESTIONS.md), so the cases are the
 * stated rules and their limits.
 */

import { describe, expect, it } from "vitest";
import {
  FULL_CREDIT_RATE,
  REDUCED_CREDIT_RATE,
  creditLines,
  deductionReductionOf,
  line1Of,
  line2aOf,
  line2cOf,
  line4Of,
} from "../../../../src/federal/8820/lines.js";
import { placeReduction, placedTotal } from "../../../../src/federal/8820/reduction.js";

describe("the rates", () => {
  it("line 2a: 25%, or 19.75% with the election (irs-8820-form-2025::sec::face-part-i::b01)", () => {
    expect(FULL_CREDIT_RATE).toBe(0.25);
    expect(REDUCED_CREDIT_RATE).toBe(0.1975);
  });

  it("19.75% is 25% less 25% times the 21% corporate rate (section 280C(b)(3)(B))", () => {
    expect(FULL_CREDIT_RATE - FULL_CREDIT_RATE * 0.21).toBeCloseTo(REDUCED_CREDIT_RATE, 10);
  });
});

describe("line 1", () => {
  it("adds every kind with cents and rounds the total once", () => {
    expect(line1Of({ wages: 120000, supplies: 30000.4, contractTesting: 50000 })).toBe(200000);
    expect(line1Of({ wages: 0.4, supplies: 0.4, computerRental: 0.4 })).toBe(1);
  });

  it("is 0 with no expenses (the election alone)", () => {
    expect(line1Of({})).toBe(0);
  });

  it("takes contract testing in full, not 65% (purpose-of-form::b01)", () => {
    expect(line1Of({ contractTesting: 10000 })).toBe(10000);
  });
});

describe("line 2a", () => {
  it("own example: line 1 of 200,000 gives 50,000, or 39,500 with the election", () => {
    expect(line2aOf(200000, false)).toBe(50000);
    expect(line2aOf(200000, true)).toBe(39500);
  });

  it("rounds to the nearest dollar", () => {
    // 169,551 × 0.1975 = 33,486.32; 1,002 × 0.25 = 250.50.
    expect(line2aOf(169551, true)).toBe(33486);
    expect(line2aOf(1002, false)).toBe(251);
  });

  it("is never more than 25% of line 1", () => {
    for (const line1 of [0, 1, 3, 999, 12345, 987654]) {
      expect(line2aOf(line1, false)).toBeLessThanOrEqual(line1 * 0.25 + 0.5);
      expect(line2aOf(line1, true)).toBeLessThanOrEqual(line2aOf(line1, false));
    }
  });
});

describe("lines 2b, 2c and 4", () => {
  it("line 2c is line 2a less line 2b", () => {
    expect(line2cOf(33486, 900)).toBe(32586);
    expect(line2cOf(33486, undefined)).toBe(33486);
  });

  it('line 2c is 0 when line 2b is more ("If zero or less, enter -0-")', () => {
    expect(line2cOf(500, 900)).toBe(0);
    expect(line2cOf(900, 900)).toBe(0);
  });

  it("line 4 adds lines 2c and 3", () => {
    expect(line4Of(32586, 4250)).toBe(36836);
    expect(line4Of(undefined, 4250)).toBe(4250);
    expect(line4Of(50000, undefined)).toBe(50000);
  });

  it("a line 2b of 0 stays blank", () => {
    expect(creditLines({ wages: 1000 }, false, 0).line2b).toBeUndefined();
    expect(creditLines({ wages: 1000 }, false, undefined).line2b).toBeUndefined();
    expect(creditLines({ wages: 1000 }, false, 100.5).line2b).toBe(101);
  });
});

describe("the deduction the credit takes off", () => {
  const lines = creditLines({ wages: 200000 }, false, 900);

  it("is line 2a without the election, not line 2c (DECISION in lines.ts)", () => {
    expect(deductionReductionOf(lines, false)).toBe(50000);
  });

  it("is 0 with the election (section 280C(b)(3)(A))", () => {
    expect(deductionReductionOf(creditLines({ wages: 200000 }, true, undefined), true)).toBe(0);
  });
});

describe("placing the reduction on Schedule C", () => {
  const stated = {
    wages: 140000,
    supplies: 30000,
    rentVehiclesMachinery: 12000,
    contractLabor: 260000,
  };
  const expenses = {
    wages: 20000,
    supplies: 10000,
    computerRental: 6000,
    contractTesting: 164000.4,
  };

  it("eward: wages, then supplies, machinery rent and contract labor, each by at most its kind", () => {
    const placed = placeReduction(stated, 50000, expenses);
    expect(placed.byLine).toEqual({
      wages: 20000,
      supplies: 10000,
      rentVehiclesMachinery: 6000,
      contractLabor: 14000,
    });
    expect(placed.left).toBe(0);
    expect(placedTotal(placed)).toBe(50000);
  });

  it("takes all of it from wages when the clinical wages hold it", () => {
    const placed = placeReduction(stated, 15000, expenses);
    expect(placed.byLine).toEqual({ wages: 15000 });
  });

  it("never takes a line below 0: a stated line smaller than its kind gives only what it has", () => {
    const placed = placeReduction({ wages: 5000 }, 8000, { wages: 20000, supplies: 10000 });
    expect(placed.byLine).toEqual({ wages: 5000 });
    expect(placed.left).toBe(3000);
  });

  it("the parts plus what is left always equal the reduction", () => {
    for (const reduction of [0, 1, 19999, 20000, 36001, 50000, 60000]) {
      const placed = placeReduction(stated, reduction, expenses);
      expect(placedTotal(placed) + placed.left).toBe(reduction);
    }
  });
});
