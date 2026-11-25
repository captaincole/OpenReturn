/*
 * Form 4797 with amounts from both Form 6252 (lines 4, 10 and 15) and Form 8824
 * (lines 5 and 16): line 7 adds lines 2, 4, 5 and 6, and line 17 adds lines 10
 * through 16. Made-up numbers.
 */

import { describe, expect, it } from "vitest";
import type { BusinessPropertySaleFactValue } from "../../../../src/facts/index.js";
import { form4797Activities } from "../../../../src/federal/4797/activities.js";
import { form4797Lines, type InstallmentAmounts } from "../../../../src/federal/4797/lines.js";
import { placeProperty, type PlacedProperty } from "../../../../src/federal/4797/properties.js";

/* A Part I land sale with the given gain (line 2). */
const landGain = (gain: number): PlacedProperty => {
  const value: BusinessPropertySaleFactValue = {
    description: "Land",
    kind: "land",
    dateAcquired: "2020-01-15",
    dateSold: "2025-06-30",
    grossSalesPrice: 10000 + gain,
    costOrOtherBasis: 10000,
  };
  return placeProperty(value, value.grossSalesPrice ?? 0);
};

const installment = (overrides: Partial<InstallmentAmounts> = {}): InstallmentAmounts => ({
  line4: [3000],
  line10: [500],
  line15: [1200],
  waits: false,
  ...overrides,
});

const lines = (
  properties: PlacedProperty[],
  amounts: InstallmentAmounts,
  likeKindExchanges: { line5?: number; line16?: number },
) =>
  form4797Lines({
    properties,
    reportedProceeds: [],
    nonrecapturedLosses: 0,
    recaptures: [],
    installment: amounts,
    likeKindExchanges,
  });

describe("Form 4797, Form 6252 and Form 8824 amounts together", () => {
  it("a net gain: line 7 = 2,000 + 3,000 − 1,000; line 17 = 500 + 1,200 + 4,000", () => {
    const figured = lines([landGain(2000)], installment(), { line5: -1000, line16: 4000 });
    expect([figured.line4, figured.line5, figured.line7]).toEqual([3000, -1000, 4000]);
    expect([figured.line15, figured.line16, figured.line17]).toEqual([1200, 4000, 5700]);
    expect(figured.line18b).toBe(5700);
    // No nonrecaptured section 1231 losses: line 7 goes to Schedule D, lines 8–12 are skipped.
    expect(figured.scheduleDGain).toBe(4000);
    expect(figured.line11).toBeUndefined();
  });

  it("a net loss: line 7 = 2,000 + 1,000 − 5,000 goes to line 11 and comes off line 17", () => {
    const figured = lines([landGain(2000)], installment({ line4: [1000] }), {
      line5: -5000,
      line16: 4000,
    });
    expect([figured.line4, figured.line5, figured.line7, figured.line11]).toEqual([
      1000, -5000, -2000, 2000,
    ]);
    // 500 (line 10) − 2,000 (line 11) + 1,200 (line 15) + 4,000 (line 16).
    expect([figured.line15, figured.line16, figured.line17]).toEqual([1200, 4000, 3700]);
    expect(figured.scheduleDGain).toBeUndefined();
  });

  it("a Form 6252 amount that waits blanks lines 4, 7, 15 and 17; lines 5 and 16 still print", () => {
    const figured = lines([landGain(2000)], installment({ waits: true }), {
      line5: -1000,
      line16: 4000,
    });
    expect([figured.line4, figured.line7, figured.line15, figured.line17]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect([figured.line5, figured.line16]).toEqual([-1000, 4000]);
    expect(figured.waitsForLine8).toBe(true);
  });

  it("line 11 splits among activities only when one nets on line 7: an exchange and a Form 6252 gain are two", () => {
    const exchange = { activity: "business.a", section1231: -5000, ordinary: 4000 };
    const both = lines([], installment({ line4: [1000] }), { line5: -5000, line16: 4000 });
    expect(form4797Activities([], both, [exchange]).ordinaryGap).toBeDefined();
    const exchangeOnly = lines([], installment({ line4: [] }), { line5: -5000, line16: 4000 });
    // Line 7 −5,000 is ordinary (line 11): the activity's 4,000 less 5,000.
    expect(form4797Activities([], exchangeOnly, [exchange])).toEqual({
      amounts: [{ key: "business.a", ordinary: -1000, total: -1000 }],
    });
  });
});
