/*
 * Energy Efficient Home Improvement Credit Limit Worksheet—Line 31
 * (2025 Form 5695 instructions). Fake figures, checked by hand.
 */

import { describe, expect, it } from "vitest";
import { computeEnergyCreditLimit } from "../../../../src/engine/worksheets/energyCreditLimit.js";

describe("computeEnergyCreditLimit", () => {
  it("is the whole tax when no earlier credit is taken", () => {
    expect(computeEnergyCreditLimit({ tax: 2969 })).toEqual({ line1: 2969, line2: 0, line3: 2969 });
  });

  it("subtracts every Schedule 3 credit on line 2", () => {
    const r = computeEnergyCreditLimit({
      tax: 5000,
      form8978Amount: 10,
      foreignTaxCredit: 100,
      dependentCareCredit: 600,
      elderlyOrDisabledCredit: 40,
      educationCredits: 1000,
      retirementSavingsCredit: 200,
    });
    expect(r.line2).toBe(1950);
    expect(r.line3).toBe(3050);
  });

  it("is 0, not negative, when the credits use up the tax", () => {
    expect(computeEnergyCreditLimit({ tax: 300, educationCredits: 500 }).line3).toBe(0);
  });
});
