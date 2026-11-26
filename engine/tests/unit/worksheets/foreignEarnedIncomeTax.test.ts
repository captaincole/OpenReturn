/*
 * The Foreign Earned Income Tax Worksheet—Line 16 (src/worksheets/foreignEarnedIncomeTax.ts;
 * irs-1040-inst-2025::sec::foreign-earned-income-tax-worksheet-line-16::b01–b04).
 * No published example has numbers; the checks are the worksheet's own steps.
 */

import { describe, expect, it } from "vitest";
import { foreignEarnedIncomeTax } from "../../../src/worksheets/foreignEarnedIncomeTax.js";
import { computeQdcg, taxByAmount, type QdcgInputs } from "../../../src/worksheets/qdcg.js";

const inputs = (change: Partial<QdcgInputs> = {}): QdcgInputs => ({
  taxableIncome: 55_975,
  qualifiedDividends: 3_000,
  netLongTermGain: 0,
  filingStatus: "head_of_household",
  taxYear: 2025,
  ...change,
});

describe("the Foreign Earned Income Tax Worksheet", () => {
  it("line 6 is the tax on line 3 less the tax on line 2c: the bair scenario's return", () => {
    const lines = foreignEarnedIncomeTax(inputs(), { line2a: 148_200, line2b: 0 });
    expect(lines.line3).toBe(204_175);
    expect(lines.capitalGainExcess).toBe(0);
    // QDCG worksheet on 204,175: 450 at 15% on the dividends, 39,700 on 201,175.
    expect(lines.line4).toBe(40_150);
    // Tax Computation Worksheet on 148,200 (head of household).
    expect(lines.line5).toBe(26_676);
    expect(lines.line6).toBe(13_474);
  });

  it("the exclusion taxes the rest at the rates that would apply without it: never less than the plain tax", () => {
    const plain = computeQdcg(inputs()).tax;
    const lines = foreignEarnedIncomeTax(inputs(), { line2a: 148_200, line2b: 0 });
    expect(lines.line6).toBeGreaterThan(plain);
  });

  it("line 5 uses the Tax Table under $100,000 and the Tax Computation Worksheet from $100,000 (::b02)", () => {
    const small = foreignEarnedIncomeTax(inputs(), { line2a: 60_000, line2b: 0 });
    expect(small.line5).toBe(taxByAmount(60_000, "head_of_household", 2025));
  });

  it("line 2c is line 2a less line 2b, not below 0", () => {
    const lines = foreignEarnedIncomeTax(inputs(), { line2a: 10_000, line2b: 12_000 });
    expect(lines.line2c).toBe(0);
    expect(lines.line6).toBe(computeQdcg(inputs()).tax);
  });

  it("a capital gain excess reduces QDCG line 3, then line 2 (::b03, b04)", () => {
    // Qualified dividends and gains of 50,000 against taxable income of 20,000: an excess of 30,000.
    const base = inputs({
      taxableIncome: 20_000,
      qualifiedDividends: 20_000,
      netLongTermGain: 30_000,
    });
    const lines = foreignEarnedIncomeTax(base, { line2a: 100_000, line2b: 0 });
    expect(lines.capitalGainExcess).toBe(30_000);
    const second = computeQdcg({
      ...base,
      taxableIncome: 120_000,
      netLongTermGain: 0,
      qualifiedDividends: 20_000,
    });
    expect(lines.line4).toBe(second.tax);
  });

  it("an excess larger than line 3 takes the rest from line 2", () => {
    const base = inputs({
      taxableIncome: 5_000,
      qualifiedDividends: 20_000,
      netLongTermGain: 10_000,
    });
    const lines = foreignEarnedIncomeTax(base, { line2a: 50_000, line2b: 0 });
    expect(lines.capitalGainExcess).toBe(25_000);
    const second = computeQdcg({
      ...base,
      taxableIncome: 55_000,
      netLongTermGain: 0,
      qualifiedDividends: 5_000,
    });
    expect(lines.line4).toBe(second.tax);
  });
});
