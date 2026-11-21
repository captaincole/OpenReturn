/* Source: 2025 Instructions for Schedule D (540) (ca-540-sched-d-inst-2025). */

import { describe, expect, it } from "vitest";
import {
  ADJUSTED_SALE_GAP,
  adjustment,
  allowedLoss,
  californiaGainOrLoss,
  line1Row,
  netGainOrLoss,
  scheduleDCaFigures,
  type CaliforniaSale,
  type ScheduleDCaInputs,
} from "../../../../../src/state/ca/schedule-d-ca/lines.js";

const sale = (salesPrice: number, basis: number | undefined, adjusted = false): CaliforniaSale => ({
  description: "100 sh Z CO",
  salesPrice,
  basis,
  adjusted,
});

const inputs = (overrides: Partial<ScheduleDCaInputs>): ScheduleDCaInputs => ({
  sales: [],
  capitalGainDistributions: undefined,
  californiaCarryover: undefined,
  californiaCarryoverMissing: false,
  filingStatus: "single",
  ...overrides,
});

/* Line 11 from one California sale: its gain, or its loss after the line 9 limit. */
const line11Of = (gainOrLoss: number) =>
  scheduleDCaFigures(
    inputs({ sales: [gainOrLoss >= 0 ? sale(gainOrLoss, 0) : sale(0, -gainOrLoss)] }),
  ).line11 as number;

describe("Schedule D (540) lines 12a and 12b: the published examples", () => {
  it("::line-12a::b01, loss on line 10 less than loss on line 11: (1,000) and (2,000) → 12a 1,000", () => {
    const line11 = line11Of(-2000);
    expect(line11).toBe(-2000);
    expect(adjustment(-1000, line11)).toEqual({ line12a: 1000, line12b: undefined });
  });

  it("::line-12a::b01, gain on line 10 and loss on line 11: 3,000 and (3,000) → 12a 6,000", () => {
    const line11 = line11Of(-3000);
    expect(line11).toBe(-3000);
    expect(adjustment(3000, line11)).toEqual({ line12a: 6000, line12b: undefined });
  });

  it("::line-12b::b01, loss on line 10 more than loss on line 11: (2,000) and (1,000) → 12b 1,000", () => {
    const line11 = line11Of(-1000);
    expect(line11).toBe(-1000);
    expect(adjustment(-2000, line11)).toEqual({ line12a: undefined, line12b: 1000 });
  });

  it("::line-12b::b01, loss on line 10 and gain on line 11: (2,000) and 5,000 → 12b 7,000", () => {
    const line11 = line11Of(5000);
    expect(line11).toBe(5000);
    expect(adjustment(-2000, line11)).toEqual({ line12a: undefined, line12b: 7000 });
  });

  it("fills neither line when lines 10 and 11 are equal: each line asks for more or less", () => {
    expect(adjustment(-3000, -3000)).toEqual({ line12a: undefined, line12b: undefined });
    expect(adjustment(0, 0)).toEqual({ line12a: undefined, line12b: undefined });
  });
});

describe("Schedule D (540) line 9: the loss limit (::line-9::b01)", () => {
  it("keeps a loss under the limit", () => {
    expect(allowedLoss(-2500, "single")).toBe(2500);
    expect(californiaGainOrLoss(-2500, 2500)).toBe(-2500);
  });
  it("limits a loss to $3,000", () => {
    expect(allowedLoss(-10000, "single")).toBe(3000);
    expect(allowedLoss(-10000, "married_filing_jointly")).toBe(3000);
    expect(allowedLoss(-3000, "head_of_household")).toBe(3000);
  });
  it("limits a married/RDP separate filer to $1,500", () => {
    expect(allowedLoss(-10000, "married_filing_separately")).toBe(1500);
    expect(allowedLoss(-1200, "married_filing_separately")).toBe(1200);
  });
  it("is blank for a gain, and waits for the filing status", () => {
    expect(allowedLoss(0, "single")).toBeUndefined();
    expect(allowedLoss(500, "single")).toBeUndefined();
    expect(allowedLoss(-500, undefined)).toBeUndefined();
  });
});

describe("Schedule D (540) line 8: the sign rule (::line-8-net-gain-or-loss::b01)", () => {
  it("is a gain when line 4 is more than line 7", () => {
    expect(netGainOrLoss(5000, 2000)).toBe(3000);
  });
  it("is a negative number when line 7 is more than line 4", () => {
    expect(netGainOrLoss(2000, 5000)).toBe(-3000);
    expect(netGainOrLoss(undefined, 2500)).toBe(-2500);
  });
  it("takes line 11 from line 8 when line 8 is a gain or 0", () => {
    expect(californiaGainOrLoss(1800, undefined)).toBe(1800);
    expect(californiaGainOrLoss(0, undefined)).toBe(0);
  });
});

describe("Schedule D (540) line 1 and the totals", () => {
  it("prints the rounded (b) and (c), and (d) or (e) from them", () => {
    expect(line1Row(sale(1000.4, 1200.6))).toMatchObject({
      salesPrice: 1000,
      basis: 1201,
      loss: 201,
      gain: undefined,
    });
    expect(line1Row(sale(500, 500))).toMatchObject({ loss: undefined, gain: undefined });
  });

  it("adds the rows, line 3 and the carryover (lines 4 to 11)", () => {
    const figures = scheduleDCaFigures(
      inputs({
        sales: [sale(12000, 8000), sale(5000, 6500)],
        capitalGainDistributions: 800.4,
        californiaCarryover: 2500,
      }),
    );
    expect(figures).toMatchObject({
      gap: undefined,
      line3: 800,
      line4: 4800,
      line5: 1500,
      line6: 2500,
      line7: 4000,
      line8: 800,
      line9: undefined,
      line11: 800,
    });
  });

  it("takes a carryover only: line 8 is the loss, line 9 limits it", () => {
    const figures = scheduleDCaFigures(inputs({ californiaCarryover: 5000 }));
    expect(figures).toMatchObject({ line4: undefined, line5: undefined, line7: 5000 });
    expect(figures).toMatchObject({ line8: -5000, line9: 3000, line11: -3000 });
  });

  it("waits from line 7 on while the California carryover is asked", () => {
    const figures = scheduleDCaFigures(
      inputs({ sales: [sale(5000, 1000)], californiaCarryoverMissing: true }),
    );
    expect(figures).toMatchObject({ line4: 4000, line7: undefined, line8: undefined });
    expect(figures.line11).toBeUndefined();
  });

  it("waits while a sale's basis is unknown", () => {
    const figures = scheduleDCaFigures(inputs({ sales: [sale(5000, undefined)] }));
    expect(figures).toMatchObject({ line4: undefined, line5: undefined, line8: undefined });
  });

  it("carries the gap of a sale with a federal adjustment", () => {
    const figures = scheduleDCaFigures(inputs({ sales: [sale(5000, 6000, true)] }));
    expect(figures.gap).toBe(ADJUSTED_SALE_GAP);
    expect(figures.line1[0].gap).toBe(ADJUSTED_SALE_GAP);
  });
});
