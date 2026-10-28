import { describe, expect, it } from "vitest";
import type { RetirementDistributionFactValue } from "../../../../src/facts/index.js";
import { rowTaxable } from "../../../../src/federal/1040/resolveInfo.js";

const r = (change: Partial<RetirementDistributionFactValue>): RetirementDistributionFactValue => ({
  payerName: "Test Payer",
  box1: 35800,
  box7: "7",
  box7IraSepSimple: false,
  ...change,
});

describe("rowTaxable", () => {
  it.each([
    ["box 2a given", r({ box2a: 12000 }), 12000],
    ["no box 2a: box 1", r({}), 35800],
    [
      "box 2b taxable amount not determined",
      r({ box2b: { taxableAmountNotDetermined: true } }),
      undefined,
    ],
    ["Roth code Q: not taxable", r({ box7: "Q", box2a: 35800 }), 0],
    ["Roth code J: Form 8606 not modeled", r({ box7: "J", box2a: 35800 }), undefined],
    ["Roth code T: Form 8606 not modeled", r({ box7: "T" }), undefined],
  ] as Array<[string, RetirementDistributionFactValue, number | undefined]>)(
    "%s",
    (_, row, expected) => {
      expect(rowTaxable(row)).toBe(expected);
    },
  );
});
