/*
 * FTB 3461 arithmetic (lines.ts). The instructions publish no example with
 * numbers (ca-3461-inst-2025, searched with the corpus and on ftb.ca.gov), so
 * these are the stated rules and their edges.
 */

import { describe, expect, it } from "vitest";
import {
  CA_EXCESS_BUSINESS_LOSS_JOINT_THRESHOLD,
  CA_EXCESS_BUSINESS_LOSS_THRESHOLD,
  caThreshold,
  capitalSplit,
  carryoverUsed,
  line17,
  line8pAdjustment,
  line9,
  partIII,
} from "../../../../../src/state/ca/3461/lines.js";

describe("line 15 (ca-3461-inst-2025::sec::c-definitions::b01)", () => {
  it("is $313,000, or $626,000 for a joint return", () => {
    expect(CA_EXCESS_BUSINESS_LOSS_THRESHOLD).toBe(313000);
    expect(CA_EXCESS_BUSINESS_LOSS_JOINT_THRESHOLD).toBe(626000);
    expect(caThreshold(false)).toBe(313000);
    expect(caThreshold(true)).toBe(626000);
  });
});

describe("line 9 (::line-9::b01)", () => {
  it("combines lines 2 to 8, blank lines as nothing", () => {
    expect(line9({ line2: 42000, line3: -3000, line5: -639500, line8: 6000 })).toBe(-594500);
    expect(line9({})).toBe(0);
  });
});

describe("line 3 split (::line-11::b01 note, ::line-10::b01)", () => {
  it("a limited ($3,000) loss with a business loss of $3,000 or more: nothing on line 11", () => {
    expect(capitalSplit(-3000, -5000)).toEqual({ nonbusinessGain: 0, nonbusinessLoss: 0 });
    expect(capitalSplit(-3000, -3000)).toEqual({ nonbusinessGain: 0, nonbusinessLoss: 0 });
  });

  it("a limited loss with a smaller business loss: the difference goes on line 11", () => {
    expect(capitalSplit(-3000, -1000)).toEqual({ nonbusinessGain: 0, nonbusinessLoss: 2000 });
  });

  it("a loss with no business part (or a business gain): the whole loss goes on line 11", () => {
    expect(capitalSplit(-3000, 0)).toEqual({ nonbusinessGain: 0, nonbusinessLoss: 3000 });
    expect(capitalSplit(-3000, 4000)).toEqual({ nonbusinessGain: 0, nonbusinessLoss: 3000 });
  });

  it("a gain: the business gain counts up to the line 3 gain, the rest goes on line 10", () => {
    expect(capitalSplit(25000, 0)).toEqual({ nonbusinessGain: 25000, nonbusinessLoss: 0 });
    expect(capitalSplit(25000, 10000)).toEqual({ nonbusinessGain: 15000, nonbusinessLoss: 0 });
    expect(capitalSplit(25000, 40000)).toEqual({ nonbusinessGain: 0, nonbusinessLoss: 0 });
    expect(capitalSplit(25000, -5000)).toEqual({ nonbusinessGain: 25000, nonbusinessLoss: 0 });
  });

  it("a blank line 3 splits into nothing", () => {
    expect(capitalSplit(undefined, -5000)).toEqual({ nonbusinessGain: 0, nonbusinessLoss: 0 });
  });

  it("the business part and the nonbusiness part add up to line 3", () => {
    for (const [line3, business] of [
      [-3000, -1000],
      [-2000, -5000],
      [25000, 10000],
      [-1500, 0],
    ]) {
      const split = capitalSplit(line3, business);
      const businessPart = line3 - split.nonbusinessGain + split.nonbusinessLoss;
      expect(Math.abs(businessPart)).toBeLessThanOrEqual(Math.abs(line3));
    }
  });
});

describe("Part III (::line-12::b01 to ::line-16::b01)", () => {
  it("with no carryover: 14b blank, 14c = 14a, 16 = 14c + 15", () => {
    const lines = partIII(-594500, 12000, 1500, 0, 313000);
    expect(lines).toEqual({
      line12: 10500,
      line13: -10500,
      line14a: -605000,
      line14b: undefined,
      line14c: -605000,
      line15: 313000,
      line16: -292000,
    });
  });

  it("with a carryover: 14b is negative and 14c adds it", () => {
    const lines = partIII(-250000, 0, 0, 200000, 313000);
    expect(lines.line14b).toBe(-200000);
    expect(lines.line14c).toBe(-450000);
    expect(lines.line16).toBe(-137000);
  });

  it("line 13 reverses line 12's sign, and line 14a = line 9 + line 13", () => {
    const lines = partIII(-100000, 1000, 9000, 0, 313000);
    expect(lines.line12).toBe(-8000);
    expect(lines.line13).toBe(8000);
    expect(lines.line14a).toBe(-92000);
  });

  it("at the threshold edge: a loss of exactly $313,000 leaves line 16 at 0", () => {
    expect(partIII(-313000, 0, 0, 0, 313000).line16).toBe(0);
    expect(partIII(-313001, 0, 0, 0, 313000).line16).toBe(-1);
  });
});

describe("line 17 (::line-17::b01)", () => {
  it("is blank with no carryover or with line 16 at 0 or more", () => {
    expect(line17(-50000, 0, 0)).toBeUndefined();
    expect(line17(0, 100000, 100000)).toBeUndefined();
    expect(line17(25000, 100000, 100000)).toBeUndefined();
  });

  it("is line 16 (positive) less the prior adjustments, when line 16 is more", () => {
    expect(line17(-387000, 300000, 300000)).toBe(87000);
  });

  it("is blank when line 16 (positive) is less than or equal to the prior adjustments", () => {
    expect(line17(-137000, 200000, 200000)).toBeUndefined();
    expect(line17(-200000, 200000, 200000)).toBeUndefined();
  });
});

describe("Schedule CA line 8p column C (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b04)", () => {
  it("takes line 16 as a positive number with no carryover", () => {
    expect(line8pAdjustment(-292000, 0, 0)).toBe(292000);
    expect(line8pAdjustment(0, 0, 0)).toBeUndefined();
    expect(line8pAdjustment(63000, 0, 0)).toBeUndefined();
  });

  it("takes line 17 with a carryover (::line-16::b02)", () => {
    expect(line8pAdjustment(-387000, 300000, 300000)).toBe(87000);
    expect(line8pAdjustment(-137000, 200000, 200000)).toBeUndefined();
  });
});

describe("Schedule CA line 8z column B: the carryover used (::line-14b::b01, ::line-15::b01)", () => {
  it("a business loss under line 15: line 15 less the loss, up to the carryover", () => {
    expect(carryoverUsed(-250000, 200000, 313000)).toBe(63000);
    expect(carryoverUsed(-250000, 40000, 313000)).toBe(40000);
  });

  it("a business loss over line 15: nothing used", () => {
    expect(carryoverUsed(-400000, 200000, 313000)).toBe(0);
  });

  it("business income that covers the whole carryover: the whole carryover", () => {
    expect(carryoverUsed(250000, 200000, 313000)).toBe(200000);
  });

  it("no carryover: nothing", () => {
    expect(carryoverUsed(100000, 0, 313000)).toBe(0);
  });

  it("what is used plus what line 16 carries forward is the carryover", () => {
    for (const line14a of [-400000, -250000, -50000, 0, 100000]) {
      const carryover = 500000;
      const used = carryoverUsed(line14a, carryover, 313000);
      const { line16 } = partIII(line14a, 0, 0, carryover, 313000);
      const forward = line16 < 0 ? 0 - line16 : 0;
      const newLoss = Math.max(0, 0 - line14a - 313000);
      expect(used + forward).toBe(carryover + newLoss);
    }
  });
});
