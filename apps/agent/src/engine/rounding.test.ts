import { describe, expect, it } from "vitest";
import { roundDollars } from "./defineForm.js";

describe("roundDollars", () => {
  it("drops under 50 cents and raises 50–99 cents (IRS rule)", () => {
    expect(roundDollars(381.4)).toBe(381); // Alejandro's CPA golden, 1040 line 3a
    expect(roundDollars(2296.68)).toBe(2297);
    expect(roundDollars(2.5)).toBe(3);
  });

  it("rounds negatives by magnitude", () => {
    expect(roundDollars(-4293.4)).toBe(-4293);
    expect(roundDollars(-2.5)).toBe(-3);
  });

  it("snaps float noise to cents first", () => {
    expect(roundDollars(0.1 + 0.2 + 0.2)).toBe(1); // 0.5000000000000001 -> 0.50 -> 1
    expect(roundDollars(202887.49999999997)).toBe(202888); // snaps to 202887.50 -> 202888
  });

  it("keeps blank as blank", () => {
    expect(roundDollars(undefined)).toBeUndefined();
  });
});

describe("roundDollars on calculated lines (decided 2026-10-16)", () => {
  it("rounds a percentage to the nearest dollar, not up", () => {
    /*
     * Some preparers round a 20% line like this up. The IRS rule (1040
     * instr., "Rounding Off to Whole Dollars") is nearest.
     */
    expect(roundDollars(70001 * 0.2)).toBe(14000); // 14,000.20
    expect(roundDollars(13885 * 0.15)).toBe(2083); // 2,082.75
  });
});
