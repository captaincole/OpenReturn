/*
 * Form 6781 Part I from published examples (irs-6781-form-2025, irs-pub-550-2025,
 * and Pub. 550 for 2010, whose box layout is the 2025 one) and limit tests.
 */

import { describe, expect, it } from "vitest";
import {
  aggregateProfitOrLoss,
  line1Columns,
  line1Row,
  partI,
} from "../../../../src/federal/6781/lines.js";

describe("Form 6781 Part I, published examples", () => {
  /*
   * irs-pub-550-2025::sec::puts-and-calls::b04–b06, Example 4: ten nonequity
   * options issued for $4,000 expire. Buyer: short-term loss $1,600 and
   * long-term loss $2,400. Writer: the same as gains.
   */
  it("Pub. 550 (2025) option example, buyer: $4,000 loss → (1,600) and (2,400)", () => {
    expect(partI([-4000])).toEqual({
      line2Loss: 4000,
      line2Gain: undefined,
      line3: -4000,
      line5: -4000,
      line6: 0,
      line7: -4000,
      line8: -1600,
      line9: -2400,
    });
  });

  it("Pub. 550 (2025) option example, writer: $4,000 gain → 1,600 and 2,400", () => {
    expect(partI([4000])).toEqual({
      line2Loss: undefined,
      line2Gain: 4000,
      line3: 4000,
      line5: 4000,
      line6: undefined,
      line7: 4000,
      line8: 1600,
      line9: 2400,
    });
  });

  /*
   * irs-pub-550-2025::sec::mark-to-market-rule::b01, b02: a futures contract worth
   * $57,000 at the end of 2024 (gain taxed in 2024) is sold in 2025 for $56,000.
   * The 2025 loss is $1,000, 60% long term and 40% short term (the split in
   * dollars is our arithmetic; the source states only the rule).
   */
  it("Pub. 550 (2025) mark-to-market futures example: a $1,000 loss", () => {
    const row = line1Row({
      kind: "contract",
      key: "capital_gains.section_1256.futures-contract",
      value: { description: "Regulated futures contract", gainOrLoss: 56000 - 57000 },
    });
    expect(row.amount).toBe(-1000);
    const result = partI([row.amount]);
    expect([result.line7, result.line8, result.line9]).toEqual([-1000, -400, -600]);
  });

  /*
   * Pub. 550 (2010), Emily Jones: box 8 (11,000), box 9 1,000, box 10 27,000;
   * "Box 11 shows her combined profit of $15,000 ($27,000 − $1,000 − $11,000)."
   * 40% ($6,000) goes on Schedule D line 4 and 60% ($9,000) on line 11.
   */
  it("Pub. 550 (2010) Emily Jones: boxes 8–10 → 15,000 → 6,000 and 9,000", () => {
    const boxes = { brokerName: "XYZ Trading Co.", box8: -11000, box9: 1000, box10: 27000 };
    expect(aggregateProfitOrLoss(boxes)).toBe(15000);
    expect(aggregateProfitOrLoss({ ...boxes, box11: 15000 })).toBe(15000);
    const result = partI([15000]);
    expect([result.line3, result.line8, result.line9]).toEqual([15000, 6000, 9000]);
  });
});

describe("Form 6781 line 1", () => {
  // irs-6781-form-2025::sec::specific-instructions::b01: "include on line 1 the amount from box 11".
  it("takes box 11 when boxes 8–10 disagree with it", () => {
    expect(
      aggregateProfitOrLoss({ brokerName: "B", box8: 100, box9: 0, box10: 0, box11: 250 }),
    ).toBe(250);
  });

  it("counts a blank box as 0 when box 11 is blank", () => {
    expect(aggregateProfitOrLoss({ brokerName: "B", box8: -730 })).toBe(-730);
    expect(aggregateProfitOrLoss({ brokerName: "B", box10: 412, box9: -88 })).toBe(500);
    expect(aggregateProfitOrLoss({ brokerName: "B" })).toBe(0);
  });

  it("names a 1099-B row by the form and the broker", () => {
    const row = line1Row({
      kind: "statement",
      key: "account.ridge.section_1256",
      value: { brokerName: "Ridge Futures", box11: -20 },
    });
    expect(row).toEqual({ account: "Form 1099-B, Ridge Futures", amount: -20 });
  });

  it.each([
    [1234.5, { gain: 1235 }],
    [-1234.5, { loss: 1235 }],
    [1234.49, { gain: 1234 }],
    [0, { gain: 0 }],
  ])("puts %d in the right column, in whole dollars", (amount, columns) => {
    expect(line1Columns(amount)).toEqual(columns);
  });
});

describe("Form 6781 Part I, limit tests", () => {
  it("line 8 + line 9 = line 7 for every whole amount from -2,000 to 2,000", () => {
    for (let line7 = -2000; line7 <= 2000; line7++) {
      const result = partI([line7]);
      expect(result.line8 + result.line9).toBe(line7);
    }
  });

  it.each([
    // line 7, line 8, line 9
    [15001, 6000, 9001],
    [-15001, -6000, -9001],
    [-5, -2, -3],
    [1, 0, 1],
    [-1, 0, -1],
    [3, 1, 2],
    [-3, -1, -2],
    [987654321, 395061728, 592592593],
  ])("rounds line 7 = %d to the nearest dollar: %d and %d", (line7, line8, line9) => {
    const result = partI([line7]);
    expect([result.line8, result.line9]).toEqual([line8, line9]);
  });

  it("never prints -0", () => {
    const result = partI([-1]);
    expect(Object.is(result.line8, -0)).toBe(false);
  });

  it("a net loss: line 6 is 0 (box D not checked), line 7 is the loss", () => {
    expect(partI([-2500, 700])).toMatchObject({
      line2Loss: 2500,
      line2Gain: 700,
      line3: -1800,
      line6: 0,
      line7: -1800,
      line8: -720,
      line9: -1080,
    });
  });

  it("three rows with gains and losses", () => {
    expect(partI([13205.4, -4318.6, 977])).toMatchObject({
      line2Loss: 4319,
      line2Gain: 14182,
      line3: 9863,
      line6: undefined,
      line7: 9863,
      line8: 3945,
      line9: 5918,
    });
  });

  it("zero net: line 6 is 0, lines 7–9 are 0", () => {
    expect(partI([500, -500])).toMatchObject({ line3: 0, line6: 0, line7: 0, line8: 0, line9: 0 });
  });
});
