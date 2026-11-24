/*
 * Form 461's arithmetic (lines.ts): the one filled example with numbers, the
 * capital gain rule of line 3, the threshold edges and the sign rules.
 */

import { describe, expect, it } from "vitest";
import {
  capitalAdjustment,
  excessBusinessLossAdjustment,
  line9,
  partIII,
} from "../../../../src/federal/461/lines.js";
import { excessBusinessLossThreshold } from "../../../../src/federal/passThrough/excessBusinessLoss.js";

describe("the filled 2024 Form 461 (TaxAct output, TAXSIM; logic only)", () => {
  // Line 3 -3,000 and line 5 -838,974; the 2024 joint threshold, $610,000, is passed in.
  const partI = { line3: -3000, line5: -838974 };

  it("combines lines 1 to 8 on line 9", () => {
    expect(line9(partI)).toBe(-841974);
  });

  it("puts the capital loss on line 3 back on line 11", () => {
    expect(capitalAdjustment(partI.line3, 0)).toEqual({ nonbusinessGain: 0, capitalLoss: 3000 });
  });

  it("gives lines 12 to 16 and the Schedule 1 line 8p amount", () => {
    const lines = partIII(line9(partI), 0, 3000, 610000);
    expect(lines).toEqual({
      line12: -3000,
      line13: 3000,
      line14: -838974,
      line15: 610000,
      line16: -228974,
    });
    expect(excessBusinessLossAdjustment(lines.line16)).toBe(228974);
  });
});

describe("line 3 capital gains (irs-461-inst-2025::sec::line-3::b01)", () => {
  it("takes out a gain with no business part", () => {
    expect(capitalAdjustment(30000, 0)).toEqual({ nonbusinessGain: 30000, capitalLoss: 0 });
  });

  it("keeps the business net gain, up to the gain on line 3", () => {
    expect(capitalAdjustment(30000, 10000)).toEqual({ nonbusinessGain: 20000, capitalLoss: 0 });
    expect(capitalAdjustment(30000, 30000)).toEqual({ nonbusinessGain: 0, capitalLoss: 0 });
    expect(capitalAdjustment(30000, 50000)).toEqual({ nonbusinessGain: 0, capitalLoss: 0 });
  });

  it("keeps nothing when the business capital assets lost money", () => {
    expect(capitalAdjustment(30000, -8000)).toEqual({ nonbusinessGain: 30000, capitalLoss: 0 });
  });

  it("takes out every capital loss, business or not", () => {
    expect(capitalAdjustment(-1500, 4000)).toEqual({ nonbusinessGain: 0, capitalLoss: 1500 });
  });

  it("adjusts nothing with no line 3 amount", () => {
    expect(capitalAdjustment(undefined, 0)).toEqual({ nonbusinessGain: 0, capitalLoss: 0 });
    expect(capitalAdjustment(0, 5000)).toEqual({ nonbusinessGain: 0, capitalLoss: 0 });
  });
});

describe("the threshold (irs-461-inst-2025::sec::who-must-file::b02)", () => {
  it("is $313,000, or $626,000 on a joint return", () => {
    expect(excessBusinessLossThreshold("single")).toBe(313000);
    expect(excessBusinessLossThreshold("head_of_household")).toBe(313000);
    expect(excessBusinessLossThreshold("married_filing_separately")).toBe(313000);
    expect(excessBusinessLossThreshold("married_filing_jointly")).toBe(626000);
  });

  it("allows a net business loss equal to the threshold in full", () => {
    const lines = partIII(-313000, 0, 0, 313000);
    expect(lines.line16).toBe(0);
    expect(excessBusinessLossAdjustment(lines.line16)).toBeUndefined();
  });

  it("adds back one dollar over the threshold", () => {
    const lines = partIII(-313001, 0, 0, 313000);
    expect(excessBusinessLossAdjustment(lines.line16)).toBe(1);
  });

  it("adds back nothing with business income", () => {
    expect(excessBusinessLossAdjustment(partIII(50000, 0, 0, 313000).line16)).toBeUndefined();
  });
});

describe("Part II and Part III signs", () => {
  it("reverses line 12 on line 13, and line 14 is the net business amount", () => {
    const lines = partIII(-561500, 42000, 1500, 313000);
    expect(lines.line12).toBe(40500);
    expect(lines.line13).toBe(-40500);
    expect(lines.line14).toBe(-602000);
    expect(lines.line16).toBe(lines.line14 + lines.line15);
  });

  it("adds a nonbusiness loss back to the business amount", () => {
    const lines = partIII(-400000, 0, 20000, 313000);
    expect(lines.line13).toBe(20000);
    expect(lines.line14).toBe(-380000);
  });

  it("never adds back more than the net business loss above the threshold", () => {
    for (const net of [-313000, -500000, -1200000]) {
      const added = excessBusinessLossAdjustment(partIII(net, 0, 0, 313000).line16) ?? 0;
      expect(added).toBe(Math.max(0, -net - 313000));
    }
  });

  it("leaves line 9 blank lines out of the total", () => {
    expect(line9({ line2: 42000, line8: -6000 })).toBe(36000);
    expect(line9({})).toBe(0);
  });
});
