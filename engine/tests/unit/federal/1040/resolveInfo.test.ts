import { describe, expect, it } from "vitest";
import type { RetirementDistributionFactValue } from "../../../../src/facts/index.js";
import { rowTaxable, traditionalTaxable } from "../../../../src/federal/1040/resolveInfo.js";

const distribution = (
  change: Partial<RetirementDistributionFactValue>,
): RetirementDistributionFactValue => ({
  payerName: "Test Payer",
  box1: 35800,
  box7: "7",
  box7IraSepSimple: false,
  ...change,
});

describe("rowTaxable", () => {
  it.each([
    ["box 2a given", distribution({ box2a: 12000 }), 12000],
    ["no box 2a: box 1", distribution({}), 35800],
    [
      "box 2b taxable amount not determined",
      distribution({ box2b: { taxableAmountNotDetermined: true } }),
      undefined,
    ],
    ["Roth code Q: not taxable", distribution({ box7: "Q", box2a: 35800 }), 0],
    ["Roth code J: Form 8606 not modeled", distribution({ box7: "J", box2a: 35800 }), undefined],
    ["Roth code T: Form 8606 not modeled", distribution({ box7: "T" }), undefined],
    ["code Y: charitable distribution not modeled", distribution({ box7: "7Y" }), undefined],
  ] as Array<[string, RetirementDistributionFactValue, number | undefined]>)(
    "%s",
    (_, row, expected) => {
      expect(rowTaxable(row)).toBe(expected);
    },
  );
});

describe("traditionalTaxable", () => {
  const ira = (change: Partial<RetirementDistributionFactValue>) =>
    distribution({ box7IraSepSimple: true, ...change });
  const direct = ira({ box1: 20000, box2a: 0, box7: "G" });
  const normal = ira({ box1: 10000, box2a: 10000, box7: "7" });

  it("does not take a direct rollover off twice", () => {
    expect(traditionalTaxable([direct, normal], 20000)).toBe(10000);
  });
  it("takes an indirect rollover off the other rows", () => {
    expect(traditionalTaxable([direct, normal], 24000)).toBe(6000);
  });
  it("does not go below zero", () => {
    expect(traditionalTaxable([normal], 15000)).toBe(0);
  });
  it("is undefined when a row's taxable amount is not determined", () => {
    const unknown = ira({ box2b: { taxableAmountNotDetermined: true } });
    expect(traditionalTaxable([direct, unknown], 20000)).toBeUndefined();
  });
});
