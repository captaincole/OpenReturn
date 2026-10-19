import { describe, expect, it } from "vitest";
import { atLeast, formatDollars, roundDollars, stepsOf, sum } from "../../../src/engine/money.js";

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

describe("sum", () => {
  it("keeps cents and counts blank terms as 0", () => {
    expect(sum(9.59, 2287.09)).toBeCloseTo(2296.68, 10);
    expect(sum(100, undefined, null, Number.NaN)).toBe(100);
    expect(sum()).toBe(0);
  });

  it("counts a non-numeric term as 0 (a documented trade-off)", () => {
    /*
     * Cross-form reads widen to `unknown`, so a text value can reach a
     * sum. The engine drops it instead of throwing mid-evaluation. A
     * string here is an upstream bug: the binding should read a numeric
     * field. Pinned so a change to this choice is deliberate.
     */
    expect(sum(100, "7")).toBe(100);
  });
});

describe("atLeast", () => {
  it("clamps at the minimum and treats blank as the minimum", () => {
    expect(atLeast(0, -250)).toBe(0);
    expect(atLeast(0, 250)).toBe(250);
    expect(atLeast(10000, undefined)).toBe(10000);
  });
});

describe("stepsOf", () => {
  it("counts a part step as a whole step (CA AGI limitation)", () => {
    expect(stepsOf(2500, 2500)).toBe(1);
    expect(stepsOf(2501, 2500)).toBe(2);
    expect(stepsOf(1, 1250)).toBe(1);
  });
});

describe("formatDollars", () => {
  it("prints comma-grouped whole dollars, 0 for zero, blank for blank", () => {
    expect(formatDollars(79000)).toBe("79,000");
    expect(formatDollars(-4293.4)).toBe("-4,293");
    expect(formatDollars(0)).toBe("0");
    expect(formatDollars(undefined)).toBe("");
    expect(formatDollars(null)).toBe("");
  });
});
