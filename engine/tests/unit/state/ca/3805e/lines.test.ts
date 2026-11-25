/*
 * FTB 3805E, one sale at a time (state/ca/3805e/lines.ts and sale.ts). The
 * California instructions send the arithmetic to federal Form 6252 ("Generally,
 * California law is the same as federal law concerning installment sales",
 * ca-3805e-inst-2025::sec::purpose::b02), so the Pub. 537 examples with numbers
 * run here through the California path. Then line 19's printed examples, the
 * California amounts, and limit tests.
 */

import { describe, expect, it } from "vitest";
import type { InstallmentSaleFactValue } from "../../../../../src/facts/index.js";
import { printedPercentage } from "../../../../../src/federal/6252/lines.js";
import {
  californiaAmountsDiffer,
  californiaPartIAmounts,
  scheduleDGain,
  soldToRelatedParty,
} from "../../../../../src/state/ca/3805e/lines.js";
import { californiaSaleForm, filesThisYear } from "../../../../../src/state/ca/3805e/sale.js";

/* A 2025 sale of a capital asset; each test changes what it needs. */
const sale = (over: Partial<InstallmentSaleFactValue>): InstallmentSaleFactValue => ({
  description: "Land",
  propertyCode: 4,
  dateAcquired: "2015-01-10",
  dateSold: "2025-03-01",
  use: "capital_asset",
  sellingPriceDeterminable: true,
  sellingPrice: 100000,
  costOrOtherBasis: 40000,
  paymentsThisYear: 0,
  ...over,
});

const form = (value: InstallmentSaleFactValue, joint = false) =>
  californiaSaleForm("installment_sale.test", value, joint);

describe("line 19's printed examples (ca-3805e-inst-2025::sec::line-19::b01)", () => {
  it("25% = 0.2500, 35.25% = 0.3525, 100% = 1.0000", () => {
    expect([0.25, 0.3525, 1].map(printedPercentage)).toEqual(["0.2500", "0.3525", "1.0000"]);
  });

  it("a 2025 sale with gross profit 35,250 and contract price 100,000 prints 0.3525", () => {
    const run = form(sale({ costOrOtherBasis: 64750 }));
    expect(printedPercentage(run.line19!)).toBe("0.3525");
  });
});

describe("Pub. 537 (2025) examples through FTB 3805E", () => {
  it("Selling Price Reduced, the year of sale: 60% of 20,000 is 12,000 (selling-price-reduced::b01)", () => {
    const run = form(sale({ paymentsThisYear: 20000 }));
    expect([run.partI?.line16, run.partI?.line18, run.line19]).toEqual([60000, 100000, 0.6]);
    expect(run.partII?.line24).toBe(12000);
  });

  it("Mortgage not more than basis: contract price 10,000, 50% (buyer-assumes-mortgage::b01)", () => {
    const run = form(
      sale({
        sellingPrice: 25000,
        liabilitiesAssumed: 15000,
        costOrOtherBasis: 19000,
        expensesOfSale: 1000,
        paymentsThisYear: 2000,
      }),
    );
    expect([run.partI?.line13, run.partI?.line16, run.partI?.line18]).toEqual([20000, 5000, 10000]);
    expect([run.line19, run.partII?.line24]).toEqual([0.5, 1000]);
  });

  it("Mortgage more than basis: the 1,000 excess is a payment, 100% (mortgage-6-000::b01)", () => {
    const run = form(
      sale({
        sellingPrice: 9000,
        liabilitiesAssumed: 6000,
        costOrOtherBasis: 4400,
        expensesOfSale: 600,
      }),
    );
    expect([run.partI?.line17, run.partI?.line18, run.line19]).toEqual([1000, 4000, 1]);
    expect([run.partII?.line20, run.partII?.line24]).toEqual([1000, 1000]);
  });

  /* Example 1: farmland sold in 2024 to a child for 500,000, basis 250,000. */
  const farmland = (amountRealized: number) =>
    sale({
      sellingPrice: 500000,
      costOrOtherBasis: 250000,
      dateSold: "2024-03-01",
      paymentsThisYear: 100000,
      paymentsPriorYears: 100000,
      relatedParty: {
        name: "Adrian",
        address: "1 Farm Road",
        identifyingNumber: "000-00-0000",
        resoldThisYear: true,
        secondDisposition: { date: "2025-09-01", amountRealized },
      },
    });

  it("Sale and Later Disposition, Example 1: 2025 income 200,000 (b04–b05)", () => {
    const run = form(farmland(600000));
    expect(run.partIII?.completeLines30To37).toBe(true);
    expect([run.partIIILines?.line32, run.partIIILines?.line33]).toEqual([500000, 200000]);
    expect(run.partII!.line26 + run.partIIILines!.line37).toBe(200000);
  });

  it("Example 2: resale for 400,000 gives 150,000 (b05–b06)", () => {
    const run = form(farmland(400000));
    expect(run.partIIILines?.line35).toBe(100000);
    expect(run.partII!.line26 + run.partIIILines!.line37).toBe(150000);
  });
});

describe("California's amounts (lines 8, 9, 12, 15)", () => {
  it("a stated California basis replaces the federal one on line 8", () => {
    const run = form(sale({ california: { costOrOtherBasis: 30000 }, paymentsThisYear: 10000 }));
    expect([run.partI?.line8, run.partI?.line16, run.line19]).toEqual([30000, 70000, 0.7]);
    expect(run.partII?.line24).toBe(7000);
  });

  it("California depreciation in the year of sale: line 12 on is a gap (Schedule D-1)", () => {
    const run = form(
      sale({ depreciationAllowed: 10000, california: { depreciationAllowed: 8000 } }),
    );
    expect(run.partI?.line9).toBe(8000);
    expect(run.gap?.from).toBe(12);
  });

  it("a later year: federal recapture applies when basis and depreciation are the same", () => {
    const amounts = californiaPartIAmounts(
      sale({ dateSold: "2023-01-01", depreciationAllowed: 5000, recaptureIncome: 5000 }),
    );
    expect(amounts.recaptureIncome).toBe(5000);
  });

  it("a later year: California depreciation stated and no California recapture: line 12 waits", () => {
    const value = sale({
      dateSold: "2023-01-01",
      depreciationAllowed: 5000,
      recaptureIncome: 5000,
      paymentsPriorYears: 10000,
      california: { depreciationAllowed: 4000 },
    });
    expect(californiaPartIAmounts(value).recaptureIncome).toBeUndefined();
    expect(form(value).waits?.from).toBe(12);
  });

  it("no depreciation at all: line 12 is 0, even with a California basis", () => {
    expect(
      californiaPartIAmounts(sale({ california: { costOrOtherBasis: 1 } })).recaptureIncome,
    ).toBe(0);
  });

  it("line 15 takes the California excluded gain, never more than line 14", () => {
    const run = form(
      sale({
        sellingPrice: 600000,
        costOrOtherBasis: 100000,
        excludedGain: 250000,
        california: { excludedGain: 200000 },
      }),
    );
    expect([run.partI?.line14, run.partI?.line15, run.partI?.line16]).toEqual([
      500000, 200000, 300000,
    ]);
    const small = form(sale({ excludedGain: 250000 }));
    expect(small.partI?.line15).toBe(small.partI?.line14);
  });

  it("an excluded gain over $250,000 (single) is a gap from line 15; $500,000 joint is not", () => {
    const value = sale({ sellingPrice: 900000, excludedGain: 300000 });
    expect(form(value).gap?.from).toBe(15);
    expect(form(value, true).gap).toBeUndefined();
  });

  it("amounts differ only when a stated California amount is not the federal one", () => {
    expect(californiaAmountsDiffer(sale({}))).toBe(false);
    expect(californiaAmountsDiffer(sale({ california: { costOrOtherBasis: 40000 } }))).toBe(false);
    expect(californiaAmountsDiffer(sale({ california: { costOrOtherBasis: 39999 } }))).toBe(true);
    expect(californiaAmountsDiffer(sale({ california: { depreciationAllowed: 0 } }))).toBe(false);
    expect(californiaAmountsDiffer(sale({ california: { excludedGain: 1 } }))).toBe(true);
  });
});

describe("limits and edges", () => {
  it("line 14 zero or less: lines 15 on are a gap", () => {
    expect(form(sale({ costOrOtherBasis: 100000 })).gap?.from).toBe(15);
  });

  it("a sale date after 2025 or no selling price: every money line is a gap", () => {
    expect(form(sale({ dateSold: "2026-01-02" })).gap?.from).toBe(5);
    expect(form(sale({ sellingPrice: undefined, sellingPriceDeterminable: false })).gap?.from).toBe(
      5,
    );
  });

  it("the year of sale with section 1252 recapture: line 25 on is a gap (Schedule D-1 Part IV)", () => {
    expect(form(sale({ remainingRecapture: 1000, paymentsThisYear: 5000 })).gap?.from).toBe(25);
  });

  it("a later year: line 25 never more than line 24; line 26 is line 24 less line 25", () => {
    const run = form(
      sale({
        dateSold: "2022-05-01",
        paymentsThisYear: 1000,
        paymentsPriorYears: 20000,
        remainingRecapture: 5000,
      }),
    );
    expect([run.partII?.line24, run.partII?.line25, run.partII?.line26]).toEqual([600, 600, 0]);
  });

  it("line 24 is never more than line 22 (the percentage is at most 1)", () => {
    const run = form(sale({ costOrOtherBasis: 0, paymentsThisYear: 12345 }));
    expect(run.partII?.line24).toBe(run.partII?.line22);
  });

  it("a later year with no payment and no Part III has no form; the year of sale always does", () => {
    expect(filesThisYear(form(sale({ dateSold: "2023-05-01", paymentsPriorYears: 1 })))).toBe(
      false,
    );
    expect(filesThisYear(form(sale({})))).toBe(true);
  });

  it("line 3: a related party in a sale after December 31, 1980", () => {
    const party = { name: "A", address: "B", identifyingNumber: "C", resoldThisYear: false };
    expect(soldToRelatedParty(sale({ relatedParty: party }))).toBe(true);
    expect(soldToRelatedParty(sale({ relatedParty: party, dateSold: "1980-12-31" }))).toBe(false);
    expect(soldToRelatedParty(sale({}))).toBe(false);
  });

  it("Schedule D (540) takes line 26 plus line 37", () => {
    expect(scheduleDGain(40800, 163200)).toBe(204000);
    expect(scheduleDGain(24000, undefined)).toBe(24000);
  });
});
