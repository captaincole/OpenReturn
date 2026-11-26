/*
 * Form 8834 lines 2 to 7 as pure arithmetic. The form and its instructions
 * publish no example with numbers (no prior revision with this layout has one
 * either), so these are limit tests from the stated rules.
 */

import { describe, expect, it } from "vitest";
import {
  line7Of,
  netRegularTaxLines,
  skipsToLine7,
  taxLimitLines,
} from "../../../../src/federal/8834/lines.js";

describe("Form 8834 lines 2 to 4", () => {
  it("line 3c adds lines 3a and 3b; line 4 is line 2 less line 3c", () => {
    expect(netRegularTaxLines(28673, 88, 2200)).toEqual({
      line2: 28673,
      line3a: 88,
      line3b: 2200,
      line3c: 2288,
      line4: 26385,
    });
  });

  it("no credits before this one: line 3c is 0 and line 4 is line 2", () => {
    const net = netRegularTaxLines(12000, undefined, undefined);
    expect(net.line3c).toBe(0);
    expect(net.line4).toBe(12000);
  });

  it("credits above the tax: line 4 is 0, not negative, and the form skips to line 7", () => {
    const net = netRegularTaxLines(3000, 500, 4000);
    expect(net.line4).toBe(0);
    expect(skipsToLine7(net)).toBe(true);
  });

  it("credits equal to the tax: line 4 is exactly 0", () => {
    expect(netRegularTaxLines(4500, 500, 4000).line4).toBe(0);
  });
});

describe("Form 8834 lines 5 to 7", () => {
  const net = netRegularTaxLines(28673, 88, 2200);

  it("line 6 is line 4 less line 5; line 7 is the smaller of line 1 and line 6", () => {
    const limit = taxLimitLines(net, 18357);
    expect(limit.line5).toBe(18357);
    expect(limit.line6).toBe(8028);
    expect(line7Of(2400, limit)).toBe(2400);
  });

  it("the tax limit is smaller than line 1: line 7 is line 6, the rest is lost", () => {
    const limit = taxLimitLines(net, 25000);
    expect(limit.line6).toBe(1385);
    expect(line7Of(2400, limit)).toBe(1385);
  });

  it("line 1 equal to line 6: the whole credit", () => {
    const limit = taxLimitLines(net, 23985);
    expect(limit.line6).toBe(2400);
    expect(line7Of(2400, limit)).toBe(2400);
  });

  it("tentative minimum tax above line 4: line 6 and line 7 are 0", () => {
    const limit = taxLimitLines(net, 30000);
    expect(limit.line6).toBe(0);
    expect(line7Of(2400, limit)).toBe(0);
  });

  it("line 4 at 0: lines 5 and 6 are blank and line 7 is 0", () => {
    const zero = netRegularTaxLines(3000, 500, 4000);
    const limit = taxLimitLines(zero, 1000);
    expect(limit.line5).toBeUndefined();
    expect(limit.line6).toBeUndefined();
    expect(line7Of(2400, limit)).toBe(0);
  });

  it("line 7 is never more than line 1 or line 6", () => {
    for (const line1 of [0, 1, 500, 2400, 9000]) {
      for (const line5 of [0, 10000, 26000, 27000]) {
        const limit = taxLimitLines(net, line5);
        const line7 = line7Of(line1, limit);
        expect(line7).toBeLessThanOrEqual(line1);
        expect(line7).toBeLessThanOrEqual(limit.line6 ?? 0);
        expect(line7).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
