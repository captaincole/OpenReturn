/*
 * FTB 3805V Part I Section A and Part II arithmetic (lines.ts). No published
 * example with numbers exists for this form (QUESTIONS.md); the cases are the
 * form's own arithmetic, its limits and its edges.
 */

import { describe, expect, it } from "vitest";
import {
  modifiedTaxableIncome,
  nolSuspended,
  partII,
  sectionA,
  SUSPENSION_THRESHOLD,
  type SectionAInputs,
} from "../../../../../src/state/ca/3805v/lines.js";
import { unsupported } from "../../../../../src/types.js";

const BASE: SectionAInputs = {
  agi: 2706,
  deduction: 5706,
  disasterLoss: 0,
  nonbusinessCapitalLosses: 9000,
  nonbusinessCapitalGains: 4600,
  businessCapitalLosses: 0,
  businessCapitalGains: 0,
  nonbusinessDeductions: 5706,
  nonbusinessIncome: 2300,
  scheduleDLoss: 4400,
  capitalLossDeduction: 3000,
  carryoverDeductions: 78594,
};

describe("Section A", () => {
  it("line 3a positive: 0 there and on line 25, the rest blank", () => {
    const lines = sectionA({ ...BASE, agi: 50000 });
    expect(lines).toEqual({ line1: 50000, line2: 5706, line3a: 0, line25: 0 });
  });

  it("line 3a exactly zero: no current year NOL", () => {
    expect(sectionA({ ...BASE, agi: 5706 }).line25).toBe(0);
  });

  it("the made-up taxpayer masema: carryovers used up to MTI leave line 3a at minus the capital loss", () => {
    const lines = sectionA(BASE);
    expect(lines).toMatchObject({
      line3a: -3000,
      line3c: -3000,
      line6: 4400,
      line7: 0,
      line10: 2300,
      line11: 3406,
      line12: 0,
      line17: 4400,
      line18: 4400,
      line19: 3000,
      line20: 1400,
      line21: 0,
      line22: 3000,
      line24: 85000,
      line25: 0,
    });
  });

  it("a business loss larger than the income makes a current year NOL", () => {
    // Wages 40,000 less a 81,000 business loss, 1,000 of interest: AGI -40,000.
    const lines = sectionA({
      ...BASE,
      agi: -40000,
      nonbusinessCapitalLosses: 0,
      nonbusinessCapitalGains: 0,
      nonbusinessIncome: 1000,
      scheduleDLoss: 0,
      capitalLossDeduction: 0,
      carryoverDeductions: 0,
    });
    expect(lines.line3a).toBe(-45706);
    expect(lines.line11).toBe(4706);
    // "skip line 18 through line 21 and enter on line 22 the amount from line 17".
    expect(lines.line18).toBeUndefined();
    expect(lines.line21).toBeUndefined();
    expect(lines.line22).toBe(0);
    expect(lines.line24).toBe(4706);
    // The business loss of 41,000, less nothing: nonbusiness deductions only offset nonbusiness income.
    expect(lines.line25).toBe(-41000);
  });

  it("line 16: business capital losses only up to business gains and the nonbusiness income left", () => {
    const lines = sectionA({
      ...BASE,
      nonbusinessIncome: 7706,
      businessCapitalLosses: 5000,
      businessCapitalGains: 1000,
    });
    expect(lines.line12).toBe(2000);
    expect(lines.line15).toBe(3000);
    expect(lines.line16).toBe(2000);
    expect(lines.line17).toBe(6400);
  });

  it("line 25 is never more than zero, and line 24 adds lines 11, 21, 22 and 23", () => {
    for (const carryoverDeductions of [0, 100, 2999, 3000, 50000]) {
      const lines = sectionA({ ...BASE, carryoverDeductions });
      const parts = [lines.line11, lines.line21, lines.line22, lines.line23] as number[];
      expect(lines.line24).toBe(parts.reduce((total, part) => total + part, 0));
      expect(lines.line25 as number).toBeLessThanOrEqual(0);
    }
  });

  it("a gap reaches only the lines that read it", () => {
    const gap = unsupported("income not sorted");
    const lines = sectionA({ ...BASE, nonbusinessIncome: gap });
    expect(lines.line6).toBe(4400);
    expect(lines.line9).toBe(gap);
    expect(lines.line11).toBe(gap);
    expect(lines.line25).toBe(gap);
  });

  it("a 2025 disaster loss the engine cannot figure stops at line 3b", () => {
    const gap = unsupported("disaster");
    const lines = sectionA({ ...BASE, disasterLoss: gap });
    expect(lines).toEqual({
      line1: 2706,
      line2: 5706,
      line3a: -3000,
      line3b: gap,
      line3c: gap,
      line25: gap,
    });
  });

  it("line 3c zero or more: the rest of Part I is not completed", () => {
    const lines = sectionA({ ...BASE, disasterLoss: 3000 });
    expect(lines).toEqual({
      line1: 2706,
      line2: 5706,
      line3a: -3000,
      line3b: 3000,
      line3c: 0,
      line25: 0,
    });
  });
});

describe("Part II", () => {
  it("line 6 adds lines 1 to 5 and is never below zero", () => {
    const input = {
      taxableIncome: -3000,
      capitalLossDeduction: 3000,
      disasterCarryoverUsed: 22000,
      nolCarryoverUsed: 56594,
      itemizedAdjustment: 0,
    };
    expect(partII(input).line6).toBe(78594);
    expect(partII({ ...input, taxableIncome: -90000 }).line6).toBe(0);
  });

  it("the itemized adjustment's gap is line 6's gap", () => {
    const gap = unsupported("refigure");
    const lines = partII({
      taxableIncome: 1000,
      capitalLossDeduction: 0,
      disasterCarryoverUsed: 0,
      nolCarryoverUsed: 0,
      itemizedAdjustment: gap,
    });
    expect(lines.line6).toBe(gap);
  });

  it("MTI before the deductions equals line 6 after them", () => {
    for (const used of [0, 1000, 78594]) {
      const agiBeforeCarryovers = 81300;
      const mti = modifiedTaxableIncome({
        agiBeforeCarryovers,
        deduction: 5706,
        capitalLossDeduction: 3000,
        itemizedAdjustment: 0,
      });
      const line6 = partII({
        taxableIncome: agiBeforeCarryovers - used - 5706,
        capitalLossDeduction: 3000,
        disasterCarryoverUsed: 0,
        nolCarryoverUsed: used,
        itemizedAdjustment: 0,
      }).line6;
      expect(line6).toBe(mti);
    }
  });
});

describe("the NOL suspension test", () => {
  it.each([
    [SUSPENSION_THRESHOLD, SUSPENSION_THRESHOLD, true],
    [SUSPENSION_THRESHOLD - 1, 5_000_000, false],
    [5_000_000, SUSPENSION_THRESHOLD - 1, false],
    [2_000_000, 2_000_000, true],
  ])("net business income %i and modified AGI %i: suspended %s", (business, agi, expected) => {
    expect(nolSuspended(business, agi)).toBe(expected);
  });
});
