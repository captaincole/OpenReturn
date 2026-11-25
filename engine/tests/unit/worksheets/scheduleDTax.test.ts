/*
 * The Schedule D Tax Worksheet (irs-1040sd-inst-2025::sec::schedule-d-tax-worksheet)
 * and the Unrecaptured Section 1250 Gain Worksheet. No published example has
 * numbers; these are limit tests against the QDCG worksheet, which taxes the
 * same gains at 15% where the Schedule D worksheet taxes some at 25% or 28%.
 */

import { describe, expect, it } from "vitest";
import { computeQdcg, taxByAmount } from "../../../src/worksheets/qdcg.js";
import {
  computeScheduleDTax,
  type ScheduleDTaxInputs,
} from "../../../src/worksheets/scheduleDTax.js";
import {
  line3Total,
  unrecapturedSection1250Gain,
  type Unrecaptured1250Inputs,
} from "../../../src/worksheets/unrecapturedSection1250.js";

const inputs = (overrides: Partial<ScheduleDTaxInputs>): ScheduleDTaxInputs => ({
  taxableIncome: 0,
  qualifiedDividends: 0,
  form4952Line4g: 0,
  form4952Line4e: 0,
  scheduleDLine15: 0,
  scheduleDLine16: 0,
  scheduleDLine18: 0,
  scheduleDLine19: 0,
  filingStatus: "single",
  ...overrides,
});

const qdcgTax = (taxableIncome: number, gain: number, qualifiedDividends = 0) =>
  computeQdcg({
    taxableIncome,
    qualifiedDividends,
    netLongTermGain: gain,
    filingStatus: "single",
    taxYear: 2025,
  }).tax;

describe("Schedule D Tax Worksheet", () => {
  it("unrecaptured gain taxed at 25%: $60,000 of a $100,000 gain costs 10% more than the QDCG worksheet", () => {
    const result = computeScheduleDTax(
      inputs({
        taxableIncome: 400000,
        scheduleDLine15: 100000,
        scheduleDLine16: 100000,
        scheduleDLine19: 60000,
      }),
    );
    expect(result.breakdown).toMatchObject({
      line13: 40000,
      line21: 300000,
      line30: 40000,
      line31: 6000,
      line39: 60000,
      line40: 15000,
    });
    expect(result.breakdown.line44).toBe(taxByAmount(300000, "single", 2025));
    expect(result.tax - qdcgTax(400000, 100000)).toBe(6000);
  });

  it("28% rate gain: $10,000 on line 18 costs 13% more than the QDCG worksheet", () => {
    const result = computeScheduleDTax(
      inputs({
        taxableIncome: 400000,
        scheduleDLine15: 100000,
        scheduleDLine16: 100000,
        scheduleDLine18: 10000,
      }),
    );
    expect(result.breakdown).toMatchObject({ line41: 390000, line42: 10000, line43: 2800 });
    expect(result.breakdown.line40).toBeUndefined();
    expect(result.tax - qdcgTax(400000, 100000)).toBe(1300);
  });

  it("lines 1 and 16 the same: skip to line 44, the tax on line 21 only", () => {
    const result = computeScheduleDTax(
      inputs({
        taxableIncome: 40000,
        scheduleDLine15: 30000,
        scheduleDLine16: 30000,
        scheduleDLine19: 10000,
      }),
    );
    expect(result.breakdown.line21).toBe(20000);
    expect(result.breakdown.line23).toBeUndefined();
    expect(result.tax).toBe(taxByAmount(20000, "single", 2025));
  });

  it("unrecaptured gain in a bracket under 25% is taxed at the ordinary rate (berelain)", () => {
    const result = computeScheduleDTax(
      inputs({
        taxableIncome: 163853,
        qualifiedDividends: 2800,
        scheduleDLine15: 81460,
        scheduleDLine16: 81460,
        scheduleDLine19: 38460,
      }),
    );
    expect(result.breakdown).toMatchObject({
      line10: 84260,
      line13: 45800,
      line21: 118053,
      line39: 0,
      line40: 0,
    });
    expect(result.tax).toBe(28050);
    expect(result.tax).toBeGreaterThan(qdcgTax(163853, 81460, 2800));
  });

  it("the tax is never more than the regular tax on line 1 (line 47 = the smaller of 45 and 46)", () => {
    for (const taxableIncome of [10000, 60000, 200000, 700000]) {
      const result = computeScheduleDTax(
        inputs({
          taxableIncome,
          scheduleDLine15: 5000,
          scheduleDLine16: 5000,
          scheduleDLine19: 5000,
        }),
      );
      expect(result.tax).toBeLessThanOrEqual(taxByAmount(taxableIncome, "single", 2025));
    }
  });

  it("a Form 4952 election takes the elected gain out of the preferential total (lines 3–9)", () => {
    const result = computeScheduleDTax(
      inputs({
        taxableIncome: 300000,
        scheduleDLine15: 50000,
        scheduleDLine16: 50000,
        scheduleDLine19: 10000,
        form4952Line4g: 20000,
        form4952Line4e: 20000,
      }),
    );
    expect(result.breakdown).toMatchObject({
      line5: 0,
      line8: 20000,
      line9: 30000,
      line10: 30000,
      line12: 10000,
    });
  });
});

const worksheet = (overrides: Partial<Unrecaptured1250Inputs>) =>
  unrecapturedSection1250Gain({
    section1250Properties: [],
    installmentSales: 0,
    partnershipOrSCorporation: 0,
    partnershipInterestSale: 0,
    reportedOnStatements: 0,
    notInPartI: 0,
    rate28Gain: 0,
    scheduleDLine7Loss: 0,
    longTermLossCarryover: 0,
    ...overrides,
  });

describe("Unrecaptured Section 1250 Gain Worksheet", () => {
  const properties = [
    { line22: 48460, line24: 82860, line26g: 0 },
    { line22: 24000, line24: 18800, line26g: 14400 },
  ];

  it("lines 1–3 per property: the smaller of line 22 or 24, less line 26g", () => {
    expect(line3Total(properties)).toBe(52860);
  });

  it("line 7 is at most the Form 4797 line 7 gain, line 9 takes off line 8 (berelain)", () => {
    const result = worksheet({
      form4797Line7Gain: 94960,
      form4797Line8: 15000,
      section1250Properties: properties,
      reportedOnStatements: 600,
    });
    expect(result).toMatchObject({
      line3: 52860,
      line7: 52860,
      line9: 37860,
      line13: 38460,
      line18: 38460,
    });
    expect(worksheet({ form4797Line7Gain: 20000, section1250Properties: properties }).line7).toBe(
      20000,
    );
  });

  it("no gain on Form 4797 line 7: lines 1–9 are skipped", () => {
    const result = worksheet({
      form4797Line7Gain: -500,
      section1250Properties: properties,
      reportedOnStatements: 300,
    });
    expect([result.line3, result.line9, result.line18]).toEqual([0, 0, 300]);
  });

  it("a short-term loss and a long-term carryover reduce it, never below 0", () => {
    const result = worksheet({
      form4797Line7Gain: 30000,
      section1250Properties: [{ line22: 10000, line24: 30000, line26g: 0 }],
      scheduleDLine7Loss: 4000,
      longTermLossCarryover: 3000,
      rate28Gain: 2000,
    });
    expect([result.line17, result.line18]).toEqual([5000, 5000]);
    expect(
      worksheet({
        form4797Line7Gain: 1000,
        section1250Properties: [{ line22: 1000, line24: 1000, line26g: 0 }],
        scheduleDLine7Loss: 5000,
      }).line18,
    ).toBe(0);
  });
});
