/*
 * Schedule D (540NR) lines 1 to 12b: the published examples with numbers
 * (the line 12a and 12b examples of ca-540nr-sched-d-inst-2025, and FTB Pub.
 * 1100 Examples 21 to 23, "Total Taxable Income" column: the gains and losses
 * as if a full-year resident), then limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import { scheduleD540NRLines } from "../../../../../src/state/ca/schedule-d-540nr/lines.js";
import {
  adjustment,
  type CaliforniaSale,
} from "../../../../../src/state/ca/schedule-d-ca/lines.js";
import type { FilingStatus } from "../../../../../src/values.js";

const sale = (salesPrice: number, basis: number): CaliforniaSale => ({
  description: "STOCK",
  salesPrice,
  basis,
  adjusted: false,
});

function lines(
  sales: CaliforniaSale[],
  options: { distributions?: number; carryover?: number; status?: FilingStatus } = {},
) {
  return scheduleD540NRLines({
    sales,
    capitalGainDistributions: options.distributions,
    californiaCarryover: options.carryover,
    californiaCarryoverMissing: false,
    filingStatus: options.status ?? "single",
  });
}

describe("Schedule D (540NR) instructions, lines 12a and 12b examples", () => {
  it("::loss-on-line-10-is-less-than-loss-on-line-11::b01: ($1,000) and ($2,000) is 12a $1,000", () => {
    expect(adjustment(-1000, -2000)).toEqual({ line12a: 1000, line12b: undefined });
  });

  it("::gain-on-line-10-and-loss-on-line-11::b01: $3,000 and ($3,000) is 12a $6,000", () => {
    expect(adjustment(3000, -3000)).toEqual({ line12a: 6000, line12b: undefined });
  });

  it("::loss-on-line-10-is-more-than-loss-on-line-11::b01: ($2,000) and ($1,000) is 12b $1,000", () => {
    expect(adjustment(-2000, -1000)).toEqual({ line12a: undefined, line12b: 1000 });
  });

  it("::loss-on-line-10-and-gain-on-line-11::b01: ($2,000) and $5,000 is 12b $7,000", () => {
    expect(adjustment(-2000, 5000)).toEqual({ line12a: undefined, line12b: 7000 });
  });
});

describe("FTB Pub. 1100, Total Taxable Income column", () => {
  it("Example 21 (ftb-pub-1100-2025::sec::taxable-year-2023-total-taxable::b01): total $(1,000), allowed $1,000", () => {
    // CA gain 2,000, CA loss 6,000, NY gain 5,000, NY loss 2,000.
    const figures = lines([
      sale(12000, 10000),
      sale(4000, 10000),
      sale(15000, 10000),
      sale(8000, 10000),
    ]);
    expect(figures).toMatchObject({
      line4: 7000,
      line5: 8000,
      line8: -1000,
      line9: 1000,
      line11: -1000,
    });
  });

  it("Example 22 (::taxable-year-2024-total-taxable-3::b01): CA loss 4,000, WY gain 5,000, no carryover is $1,000", () => {
    const figures = lines([sale(6000, 10000), sale(15000, 10000)]);
    expect(figures).toMatchObject({ line4: 5000, line5: 4000, line8: 1000, line11: 1000 });
    expect(figures.line9).toBeUndefined();
  });

  it("Example 23 (::taxable-year-2025-total-taxable::b01): gains 9,000 and 8,000, loss 5,000 is $12,000", () => {
    const figures = lines([sale(19000, 10000), sale(5000, 10000), sale(18000, 10000)]);
    expect(figures).toMatchObject({
      line4: 17000,
      line5: 5000,
      line7: 5000,
      line8: 12000,
      line11: 12000,
    });
  });
});

describe("Schedule D (540NR) limits", () => {
  it("line 9 is the loss up to $3,000, and $1,500 married/RDP filing separately", () => {
    expect(lines([sale(1000, 3999)]).line9).toBe(2999);
    expect(lines([sale(1000, 4000)]).line9).toBe(3000);
    expect(lines([sale(1000, 4001)]).line9).toBe(3000);
    const separate = { status: "married_filing_separately" as const };
    expect(lines([sale(1000, 2500)], separate).line9).toBe(1500);
    expect(lines([sale(1000, 2499)], separate).line9).toBe(1499);
  });

  it("line 4 adds the gains and line 3; line 7 adds line 5 and line 6", () => {
    const figures = lines([sale(5000, 2000), sale(1000, 1600)], {
      distributions: 400,
      carryover: 900,
    });
    expect(figures).toMatchObject({ line3: 400, line4: 3400, line5: 600, line6: 900, line7: 1500 });
    expect(figures.line8).toBe(1900);
  });

  it("a carryover alone is a loss limited on line 9", () => {
    const figures = lines([], { carryover: 6500 });
    expect(figures).toMatchObject({
      line4: undefined,
      line7: 6500,
      line8: -6500,
      line9: 3000,
      line11: -3000,
    });
  });

  it("equal lines 10 and 11 fill neither 12a nor 12b", () => {
    expect(adjustment(2500, 2500)).toEqual({ line12a: undefined, line12b: undefined });
  });

  it("a gap of a source line 1 cannot carry holds every total", () => {
    const figures = scheduleD540NRLines(
      {
        sales: [sale(5000, 2000)],
        capitalGainDistributions: undefined,
        californiaCarryover: undefined,
        californiaCarryoverMissing: false,
        filingStatus: "single",
      },
      "a source gap",
      "a K-1 gap",
    );
    expect(figures.gap).toBe("a source gap");
    expect(figures.line2Gap).toBe("a K-1 gap");
  });
});
