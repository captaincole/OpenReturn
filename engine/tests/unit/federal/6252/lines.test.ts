/*
 * Form 6252 arithmetic (federal/6252/lines.ts) against the published examples
 * with numbers: Pub. 537 (2025) and the two filled forms of Pub. 537 (1998),
 * whose logic does not depend on yearly amounts. Then limit tests.
 */

import { describe, expect, it } from "vitest";
import {
  grossProfitPercentage,
  partI,
  partII,
  partIII,
  printedPercentage,
  receivedFinalPayment,
  unrecapturedSection1250,
} from "../../../../src/federal/6252/lines.js";
import { moreThanTwoYearsAfter } from "../../../../src/federal/6252/relatedParty.js";

/* Part I and line 19 of a sale, for the examples. */
function yearOfSale(inputs: Parameters<typeof partI>[0], payments: number) {
  const lines = partI(inputs);
  const line19 = grossProfitPercentage(lines.line16!, lines.line18!);
  const lines2 = partII({
    yearOfSale: true,
    line17: lines.line17!,
    line19,
    paymentsThisYear: payments,
  });
  return { ...lines, line19, ...lines2 };
}

describe("Pub. 537 (2025) examples", () => {
  it("gross profit percentage: 1,500 ÷ 6,000 is 25%, printed 0.2500 (keep-for-your-records::b04)", () => {
    expect(grossProfitPercentage(1500, 6000)).toBe(0.25);
    expect(printedPercentage(0.25)).toBe("0.2500");
  });

  it("Selling Price Reduced, the year of sale: 60% of a 20,000 payment is 12,000 (selling-price-reduced::b01)", () => {
    const run = yearOfSale({ sellingPrice: 100000, costOrOtherBasis: 40000 }, 20000);
    expect([run.line16, run.line18, run.line19, run.line24]).toEqual([60000, 100000, 0.6, 12000]);
  });

  it("Mortgage not more than basis: contract price 10,000, 50%, 1,000 of each 2,000 (buyer-assumes-mortgage::b01)", () => {
    const run = yearOfSale(
      {
        sellingPrice: 25000,
        liabilitiesAssumed: 15000,
        costOrOtherBasis: 19000,
        expensesOfSale: 1000,
      },
      2000,
    );
    expect([run.line13, run.line16, run.line17, run.line18]).toEqual([20000, 5000, 0, 10000]);
    expect([run.line19, run.line24]).toEqual([0.5, 1000]);
  });

  it("Mortgage more than basis: the 1,000 excess is a payment, 100% (buyer-assumes-mortgage::b03–b04, mortgage-6-000::b01)", () => {
    const run = yearOfSale(
      { sellingPrice: 9000, liabilitiesAssumed: 6000, costOrOtherBasis: 4400, expensesOfSale: 600 },
      0,
    );
    expect([run.line7, run.line13, run.line14, run.line17, run.line18]).toEqual([
      3000, 5000, 4000, 1000, 4000,
    ]);
    expect([run.line19, run.line20, run.line22, run.line24]).toEqual([1, 1000, 1000, 1000]);
    expect(printedPercentage(run.line19)).toBe("1.0000");
  });

  const farmland = partI({ sellingPrice: 500000, costOrOtherBasis: 250000 });
  const firstSale = { line18: farmland.line18!, line19: 0.5 };
  const year2025 = partII({
    yearOfSale: false,
    line17: 0,
    line19: 0.5,
    paymentsThisYear: 100000,
    paymentsPriorYears: 100000,
  });

  it("Sale and Later Disposition, Example 1: resale for 600,000 (sale-and-later-disposition::b04–b05)", () => {
    expect(grossProfitPercentage(farmland.line16!, farmland.line18!)).toBe(0.5);
    expect(year2025.line24).toBe(50000);
    const lines = partIII({
      amountRealized: 600000,
      ...firstSale,
      line22: year2025.line22,
      line23: year2025.line23,
      recaptureLeft: 0,
    });
    expect(lines).toEqual({
      line30: 600000,
      line31: 500000,
      line32: 500000,
      line33: 200000,
      line34: 300000,
      line35: 150000,
      line36: 0,
      line37: 150000,
    });
    // "Installment sale income for 2025 ... $200,000"
    expect(year2025.line26 + lines.line37).toBe(200000);
  });

  it("Example 2: resale for 400,000 gives 150,000 for 2025 (b05–b06)", () => {
    const lines = partIII({
      amountRealized: 400000,
      ...firstSale,
      line22: year2025.line22,
      line23: year2025.line23,
      recaptureLeft: 0,
    });
    expect([lines.line32, lines.line34, lines.line35]).toEqual([400000, 200000, 100000]);
    expect(year2025.line26 + lines.line37).toBe(150000);
  });

  it("Example 2 later years: 2026 is not taxed, 2028 is 50,000 (payment-from-2024-100-000::b01)", () => {
    const year2026 = partII({
      yearOfSale: false,
      line17: 0,
      line19: 0.5,
      paymentsThisYear: 100000,
      paymentsTreatedAsReceivedEarlier: 100000,
      paymentsPriorYears: 400000,
    });
    expect([year2026.line21, year2026.line24]).toEqual([0, 0]);
    const year2028 = partII({
      yearOfSale: false,
      line17: 0,
      line19: 0.5,
      paymentsThisYear: 100000,
      paymentsPriorYears: 400000,
    });
    expect(year2028.line24).toBe(50000);
  });

  it("Sale of a Business, the building: gain 9,600, no recapture, 9,000 unrecaptured section 1250 gain (example-sale-of-a-business::b01–b03)", () => {
    const building = partI({
      sellingPrice: 48000,
      costOrOtherBasis: 45000,
      depreciationAllowed: 9000,
      expensesOfSale: 2400,
    });
    expect([building.line10, building.line13, building.line14]).toEqual([36000, 38400, 9600]);
    // Schedule D instructions, line-4::b01: the smaller of 9,000 and 9,600, less no recapture.
    expect(
      unrecapturedSection1250({
        line9: 9000,
        line12: 0,
        line14: 9600,
        line19: 0.2,
        gainThisYear: 9600,
      }),
    ).toBe(9000);
  });
});

describe("Pub. 537 (1998) filled forms (logic only)", () => {
  it("Example 1, Mark Moore: land, year of sale (pages 12 and 14)", () => {
    const run = yearOfSale(
      {
        sellingPrice: 14700,
        liabilitiesAssumed: 6500,
        costOrOtherBasis: 2650,
        expensesOfSale: 150,
      },
      1200,
    );
    expect(run).toMatchObject({
      line5: 14700,
      line6: 6500,
      line7: 8200,
      line8: 2650,
      line9: 0,
      line10: 2650,
      line11: 150,
      line12: 0,
      line13: 2800,
      line14: 11900,
      line15: 0,
      line16: 11900,
      line17: 3700,
      line18: 11900,
      line19: 1,
      line20: 3700,
      line21: 1200,
      line22: 4900,
      line23: undefined,
      line24: 4900,
      line25: 0,
      line26: 4900,
    });
  });

  it("Example 2, Cora Blue: a later year at 22.7% (pages 13 and 15)", () => {
    const run = partII({
      yearOfSale: false,
      line17: 0,
      line19: 0.227,
      paymentsThisYear: 1806.34,
      paymentsPriorYears: 700,
    });
    expect([run.line20, run.line21, run.line22, run.line23, run.line24, run.line26]).toEqual([
      0, 1806, 1806, 700, 410, 410,
    ]);
    expect(printedPercentage(0.227)).toBe("0.2270");
  });
});

describe("Form 6252 limits", () => {
  it("line 14 zero or less: lines 15–18 are blank (line-14::b01)", () => {
    const lines = partI({ sellingPrice: 50000, costOrOtherBasis: 48000, expensesOfSale: 2000 });
    expect(lines.line14).toBe(0);
    expect([lines.line15, lines.line16, lines.line17, lines.line18]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("line 15 is never more than line 14", () => {
    const lines = partI({ sellingPrice: 300000, costOrOtherBasis: 200000, excludedGain: 250000 });
    expect([lines.line14, lines.line15, lines.line16]).toEqual([100000, 100000, 0]);
  });

  it("the gross profit percentage is at most 1, and line 18 is at least line 14", () => {
    const lines = partI({
      sellingPrice: 100000,
      liabilitiesAssumed: 90000,
      costOrOtherBasis: 10000,
    });
    expect(lines.line18).toBeGreaterThanOrEqual(lines.line14);
    expect(grossProfitPercentage(lines.line16!, lines.line18!)).toBe(1);
  });

  it("line 25 is never more than line 24, and lines 25 + 26 = line 24 (line-25::b01)", () => {
    const run = partII({
      yearOfSale: false,
      line17: 0,
      line19: 0.5,
      paymentsThisYear: 10000,
      paymentsPriorYears: 0,
      remainingRecapture: 8000,
    });
    expect([run.line24, run.line25, run.line26]).toEqual([5000, 5000, 0]);
  });

  it("line 34 is at least 0, and line 36 is never more than line 35 (line-36::b01)", () => {
    const covered = partIII({
      amountRealized: 100000,
      line18: 200000,
      line19: 0.4,
      line22: 50000,
      line23: 80000,
      recaptureLeft: 0,
    });
    expect([covered.line34, covered.line35, covered.line37]).toEqual([0, 0, 0]);
    const recapture = partIII({
      amountRealized: 300000,
      line18: 200000,
      line19: 0.5,
      line22: 50000,
      line23: 50000,
      recaptureLeft: 80000,
    });
    expect([recapture.line35, recapture.line36, recapture.line37]).toEqual([50000, 50000, 0]);
  });

  it("line 21 leaves out a payment an earlier line 34 counted, never below 0 (line-21::b01)", () => {
    const run = partII({
      yearOfSale: false,
      line17: 0,
      line19: 0.5,
      paymentsThisYear: 30000,
      paymentsTreatedAsReceivedEarlier: 50000,
      paymentsPriorYears: 0,
    });
    expect(run.line21).toBe(0);
  });

  it("the final payment: lines 22 + 23 reach the contract price with a payment this year", () => {
    const last = partII({
      yearOfSale: false,
      line17: 0,
      line19: 0.5,
      paymentsThisYear: 20000,
      paymentsPriorYears: 80000,
    });
    expect(receivedFinalPayment(last, 100000)).toBe(true);
    expect(receivedFinalPayment(last, 100001)).toBe(false);
  });

  it("line 29a: the second anniversary itself is not more than 2 years", () => {
    expect(moreThanTwoYearsAfter("2023-05-10", "2025-05-10")).toBe(false);
    expect(moreThanTwoYearsAfter("2023-05-10", "2025-05-11")).toBe(true);
  });

  it("the unrecaptured section 1250 gain never passes this year's gain or what is left", () => {
    const inputs = { line9: 90000, line12: 0, line14: 241200, line19: 0.6347, line23: 80000 };
    expect(unrecapturedSection1250({ ...inputs, gainThisYear: 10000 })).toBe(10000);
    expect(unrecapturedSection1250({ ...inputs, gainThisYear: 190410 })).toBe(39224);
    expect(unrecapturedSection1250({ ...inputs, line23: 200000, gainThisYear: 50000 })).toBe(0);
  });

  it("line 19 prints 4 places: 0.66216 is 0.6622", () => {
    expect(grossProfitPercentage(490000, 740000)).toBe(0.6622);
    expect(printedPercentage(0.6622)).toBe("0.6622");
    expect(printedPercentage(0.05)).toBe("0.0500");
  });
});
