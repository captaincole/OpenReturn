import { describe, expect, it } from "vitest";
import { computeQdcg } from "../../../src/worksheets/qdcg.js";

describe("computeQdcg", () => {
  it("high-income single filer — gains in the 15% and 20% bands", () => {
    // Fake figures, checked by hand against the 2025 rate schedule.
    const result = computeQdcg({
      taxableIncome: 600_000,
      qualifiedDividends: 1_000,
      /* The caller passes min(Sched D L15, L16), blank/loss as 0. */
      netLongTermGain: 80_000,
      filingStatus: "single",
      taxYear: 2025,
    });

    expect(result.breakdown.line5).toBe(519000); // ordinary bucket
    expect(result.breakdown.line18).toBe(2160); // 14,400 × 15%
    expect(result.breakdown.line21).toBe(13320); // 66,600 × 20%
    expect(result.breakdown.line22).toBe(151197); // 57,231 + 35% × (519,000 − 250,525) = 151,197.25
    expect(result.tax).toBe(166677);
  });

  it("matches Alejandro's golden — single filer, $381 qual divs + $2,250 LTCG", () => {
    const result = computeQdcg({
      taxableIncome: 87185,
      qualifiedDividends: 381,
      netLongTermGain: 2250,
      filingStatus: "single",
      taxYear: 2025,
    });

    expect(result.tax).toBe(13916);
    expect(result.breakdown.line1).toBe(87185);
    expect(result.breakdown.line4).toBe(2631); // total preferential
    expect(result.breakdown.line5).toBe(84554); // ordinary bucket
    expect(result.breakdown.line9).toBe(0); // ordinary fills past 0% ceiling
    expect(result.breakdown.line17).toBe(2631);
    expect(result.breakdown.line18).toBe(395); // 2,631 × 15% = 394.65 → $395
    expect(result.breakdown.line20).toBe(0);
    expect(result.breakdown.line22).toBe(13521); // tax on ordinary $84,554 via 2025 single tax table
    expect(result.breakdown.line24).toBe(14093); // sanity-check tax on full $87,185
    // line23 = line22 + line18 + line21 = 13,521 + 395 + 0
    expect(result.breakdown.line25).toBe(13916);
  });

  it("no preferential income → matches plain tax-table lookup (Alex shape)", () => {
    const result = computeQdcg({
      taxableIncome: 63250,
      qualifiedDividends: 0,
      netLongTermGain: 0,
      filingStatus: "single",
      taxYear: 2025,
    });

    expect(result.tax).toBe(8835);
    expect(result.breakdown.line4).toBe(0);
    expect(result.breakdown.line5).toBe(63250);
    expect(result.breakdown.line18).toBe(0);
    expect(result.breakdown.line21).toBe(0);
    expect(result.breakdown.line22).toBe(8835);
    expect(result.breakdown.line24).toBe(8835);
    expect(result.tax).toBe(result.ordinaryAlternativeTax);
  });

  it("all preferential at 0% — ordinary bucket below the 0% ceiling", () => {
    // Single 2025 0% ceiling $48,350: ordinary $30k leaves $18,350 of room.
    const result = computeQdcg({
      taxableIncome: 40000,
      qualifiedDividends: 0,
      netLongTermGain: 10000,
      filingStatus: "single",
      taxYear: 2025,
    });

    expect(result.breakdown.line5).toBe(30000);
    expect(result.breakdown.line9).toBe(10000);
    expect(result.breakdown.line17).toBe(0);
    expect(result.breakdown.line20).toBe(0);
    expect(result.breakdown.line18).toBe(0);
    expect(result.breakdown.line21).toBe(0);
    expect(result.tax).toBe(result.breakdown.line22);
  });

  it("preferential straddles 0% / 15% — ordinary fills part of 0% room", () => {
    // Single 2025 0% ceiling $48,350: ordinary $40k leaves $8,350 of room.
    const result = computeQdcg({
      taxableIncome: 60000,
      qualifiedDividends: 5000,
      netLongTermGain: 15000,
      filingStatus: "single",
      taxYear: 2025,
    });

    expect(result.breakdown.line4).toBe(20000);
    expect(result.breakdown.line5).toBe(40000);
    expect(result.breakdown.line9).toBe(8350);
    expect(result.breakdown.line17).toBe(11650);
    expect(result.breakdown.line18).toBe(1748); // 11,650 × 15% = 1,747.5 → $1,748
    expect(result.breakdown.line20).toBe(0);
  });

  it("MFJ filer at the 0% ceiling boundary — $96,700 single test", () => {
    // MFJ 2025 0% ceiling = $96,700.
    const result = computeQdcg({
      taxableIncome: 106700,
      qualifiedDividends: 10000,
      netLongTermGain: 0,
      filingStatus: "married_filing_jointly",
      taxYear: 2025,
    });

    expect(result.breakdown.line5).toBe(96700);
    expect(result.breakdown.line9).toBe(0);
    expect(result.breakdown.line17).toBe(10000);
    expect(result.breakdown.line18).toBe(1500); // 10,000 × 15%
  });

  it("hits 20% bracket — single with $1M taxable + $200k preferential", () => {
    // Single 2025 15% ceiling = $533,400.
    const result = computeQdcg({
      taxableIncome: 1000000,
      qualifiedDividends: 0,
      netLongTermGain: 200000,
      filingStatus: "single",
      taxYear: 2025,
    });

    expect(result.breakdown.line5).toBe(800000);
    expect(result.breakdown.line9).toBe(0);
    expect(result.breakdown.line17).toBe(0);
    expect(result.breakdown.line20).toBe(200000);
    expect(result.breakdown.line21).toBe(40000); // 200k × 20%
  });

  it("returns line25 = min(line23, line24) when both would be equal", () => {
    const result = computeQdcg({
      taxableIncome: 50000,
      qualifiedDividends: 0,
      netLongTermGain: 0,
      filingStatus: "single",
      taxYear: 2025,
    });
    expect(result.breakdown.line23).toBe(result.breakdown.line24);
    expect(result.tax).toBe(result.breakdown.line24);
  });

  it("Form 4952 line 4g election leaves the preferential total (tcb-us-004, MFJ)", () => {
    // Schedule D Tax Worksheet lines 3–13: 4,870 + 37,109 − 320 = 41,659 preferential.
    const result = computeQdcg({
      taxableIncome: 218413,
      qualifiedDividends: 4870,
      netLongTermGain: 37109,
      form4952Line4g: 320,
      filingStatus: "married_filing_jointly",
      taxYear: 2025,
    });

    expect(result.breakdown.form4952Line4g).toBe(320);
    expect(result.breakdown.line4).toBe(41659);
    expect(result.breakdown.line5).toBe(176754); // ordinary bucket
    expect(result.breakdown.line9).toBe(0);
    expect(result.breakdown.line17).toBe(41659);
    expect(result.breakdown.line18).toBe(6249); // 41,659 × 15% = 6,248.85 → $6,249
    expect(result.breakdown.line21).toBe(0);
    expect(result.breakdown.line22).toBe(28714); // 2025 MFJ rate schedule on $176,754
    expect(result.tax).toBe(34963);
  });

  it("no Form 4952 election → same tax as before the input existed", () => {
    const inputs = {
      taxableIncome: 218413,
      qualifiedDividends: 4870,
      netLongTermGain: 37109,
      filingStatus: "married_filing_jointly" as const,
      taxYear: 2025,
    };
    const without = computeQdcg(inputs);
    const zero = computeQdcg({ ...inputs, form4952Line4g: 0 });

    expect(without.breakdown.form4952Line4g).toBe(0);
    expect(without.breakdown.line4).toBe(41979);
    expect(without.tax).toBe(34940);
    expect(zero.tax).toBe(without.tax);
  });

  it("throws on a negative Form 4952 line 4g", () => {
    expect(() =>
      computeQdcg({
        taxableIncome: 50000,
        qualifiedDividends: 0,
        netLongTermGain: 0,
        form4952Line4g: -1,
        filingStatus: "single",
        taxYear: 2025,
      }),
    ).toThrow(/form4952Line4g must be ≥ 0/);
  });

  it("throws on negative taxable income", () => {
    expect(() =>
      computeQdcg({
        taxableIncome: -100,
        qualifiedDividends: 0,
        netLongTermGain: 0,
        filingStatus: "single",
        taxYear: 2025,
      }),
    ).toThrow(/taxableIncome must be ≥ 0/);
  });

  it("throws on negative preferential inputs", () => {
    expect(() =>
      computeQdcg({
        taxableIncome: 50000,
        qualifiedDividends: -50,
        netLongTermGain: 0,
        filingStatus: "single",
        taxYear: 2025,
      }),
    ).toThrow(/preferential inputs must be ≥ 0/);
  });
});
