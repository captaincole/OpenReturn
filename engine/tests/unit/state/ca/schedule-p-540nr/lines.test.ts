/*
 * Schedule P (540NR) Part II lines 28 to 45: the published example and the
 * limits of the arithmetic (state/ca/schedule-p-540nr/lines.ts).
 */

import { describe, expect, it } from "vitest";
import {
  alternativeMinimumTax,
  amtItemizedDeductionPercentage,
  californiaAgiForAmt,
  californiaAmtAgi,
  californiaAmtRate,
  californiaPartII,
  californiaTmt,
  totalAmtItemizedDeductions,
} from "../../../../../src/state/ca/schedule-p-540nr/lines.js";

describe("FTB Pub. 1100 (2025 edition), Example 43 (ftb-pub-1100-2025::sec::example-43::b01)", () => {
  /*
   * A couple moved to California on May 1, 2023; $100,000 of wages after the
   * move (CA AGI), an $80,000 ISO preference in October, $20,000 of itemized
   * deductions of which $5,000 are property taxes, total AMTI $235,000 and a
   * total TMT of $8,314 (2023 exemption, not used here). Prorated regular tax
   * $6,000. The example's results (::california-alternative-minimum-taxable-income::b01,
   * ::california-alternative-minimum-tax::b01) do not depend on yearly amounts.
   */
  const lines = californiaPartII({
    californiaAgi: 100000,
    californiaAdjustments: 80000,
    itemized: { scheduleCaLine28: 20000, includedInPartI: 5000 },
    totalAmti: 235000,
    line23: 118771,
    totalTmt: 8314,
    regularTax: 6000,
  });

  it("CA AMT AGI is $180,000 (line 32)", () => expect(lines.line32).toBe(180000));
  it("total AMT itemized deductions are $15,000 (line 35)", () => expect(lines.line35).toBe(15000));
  it("total AMT AGI is $250,000 (line 37)", () => expect(lines.line37).toBe(250000));
  it("the ratio is .7200 (line 38)", () => expect(lines.line38).toBe(0.72));
  it("prorated AMT itemized deductions are $10,800 (line 39)", () =>
    expect(lines.line39).toBe(10800));
  it("CA AMTI is $169,200 (line 40)", () => expect(lines.line40).toBe(169200));
  it("the rate 8,314 ÷ 235,000 rounds to .0354 (line 42)", () => expect(lines.line42).toBe(0.0354));
  it("CA TMT is $5,990 (line 43)", () => expect(lines.line43).toBe(5990));
  it("the AMT is 0: CA TMT is under the prorated regular tax (line 45)", () =>
    expect(lines.line45).toBe(0));
});

describe("limits", () => {
  it("line 28 adds the NOL adjustment and takes off the AMTI exclusion", () => {
    expect(californiaAgiForAmt(100000, 4000, 1500)).toBe(102500);
  });

  it("line 32 is line 28 plus line 29 less line 31", () => {
    expect(californiaAmtAgi(100000, 25000, 9000)).toBe(116000);
  });

  it("line 35 is line 33 less the Part I amounts of line 34", () => {
    expect(totalAmtItemizedDeductions(30000, 12000)).toBe(18000);
  });

  it("line 38 is never more than 1.0000", () => {
    expect(amtItemizedDeductionPercentage(500000, 400000)).toBe(1);
  });

  it("line 38 is never below 0", () => {
    expect(amtItemizedDeductionPercentage(-20000, 400000)).toBe(0);
  });

  it("line 38 with no total AMT AGI is 1 for a California amount above 0, else 0", () => {
    expect(amtItemizedDeductionPercentage(1000, 0)).toBe(1);
    expect(amtItemizedDeductionPercentage(0, 0)).toBe(0);
  });

  it("line 42 is 0 with no AMTI above 0", () => {
    expect(californiaAmtRate(0, 0)).toBe(0);
    expect(californiaAmtRate(0, -5000)).toBe(0);
  });

  it("line 42 rounds the fifth place half up", () => {
    expect(californiaAmtRate(605, 10000)).toBe(0.0605);
    expect(californiaAmtRate(60545, 1000000)).toBe(0.0605);
    expect(californiaAmtRate(60550, 1000000)).toBe(0.0606);
  });

  it("line 43 is 0 when line 23 is 0 or less (::line-23::b01)", () => {
    expect(californiaTmt(300000, 0.06, 0)).toBe(0);
  });

  it("line 43 is never below 0", () => {
    expect(californiaTmt(-40000, 0.05, 10000)).toBe(0);
  });

  it("line 45 is never below 0, and is line 43 less line 44 above it", () => {
    expect(alternativeMinimumTax(5000, 6000)).toBe(0);
    expect(alternativeMinimumTax(9000, 6000)).toBe(3000);
  });

  it("without itemized deductions line 40 is line 32 and lines 35 to 39 are blank", () => {
    const lines = californiaPartII({
      californiaAgi: 150000,
      californiaAdjustments: 50000,
      totalAmti: 400000,
      line23: 330000,
      totalTmt: 23100,
      regularTax: 9000,
    });
    expect(lines.line35).toBeUndefined();
    expect(lines.line38).toBeUndefined();
    expect(lines.line40).toBe(200000);
    expect(lines.line42).toBe(0.0578);
    expect(lines.line43).toBe(11560);
    expect(lines.line45).toBe(2560);
  });

  it("a full-year amount (all of AMTI California's) gives the total TMT within the rate's rounding", () => {
    const lines = californiaPartII({
      californiaAgi: 400000,
      totalAmti: 400000,
      line23: 330000,
      totalTmt: 23100,
      regularTax: 0,
    });
    expect(lines.line43).toBe(23120);
  });
});
