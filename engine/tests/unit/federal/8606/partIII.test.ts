/* Source: 2025 Instructions for Form 8606, Part III. */

import { describe, expect, it } from "vitest";
import type { RetirementDistributionFactValue } from "../../../../src/facts/index.js";
import { partIIIFigures } from "../../../../src/federal/8606/partIII.js";

const codeJ = (box1: number): RetirementDistributionFactValue => ({
  payerName: "Bank",
  box1,
  box7: "J",
  box7IraSepSimple: false,
});

describe("Form 8606 Part III", () => {
  it("is not taxable within the contribution basis (line 23 is 0)", () => {
    const figures = partIIIFigures([codeJ(4001)], { contributionBasis: 5000 });
    expect(figures.line23).toBe(0);
    expect(figures.line25c).toBe(0);
  });
  it("takes the excess over both bases", () => {
    const figures = partIIIFigures([codeJ(9000)], {
      contributionBasis: 5000,
      conversionAndRolloverBasis: 1000,
    });
    expect(figures.line23).toBe(4000);
    expect(figures.line25c).toBe(3000);
  });
  it("limits line 20 to $10,000", () => {
    expect(partIIIFigures([codeJ(20000)], { firstTimeHomebuyerExpenses: 15000 }).line20).toBe(
      10000,
    );
  });
});
